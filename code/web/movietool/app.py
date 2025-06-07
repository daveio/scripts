import json
import logging
import os
import queue

from flask import (
    Flask,
    Response,
    jsonify,
    redirect,
    render_template,
    request,
    stream_with_context,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy
from utils.file_scanner import pre_scan_directory, scan_directory
from utils.script_generator import generate_deletion_script

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create and configure the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Configure SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///movie_analyzer.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Import models after db is defined
from models import ScanResult

# Global variables for tracking scan progress
progress_queue = queue.Queue()
scan_in_progress = False
last_scan_log = []
MAX_LOG_ENTRIES = 100


# Custom log handler to capture logs for progress reporting
class QueueHandler(logging.Handler):
    def __init__(self, queue):
        logging.Handler.__init__(self)
        self.queue = queue

    def emit(self, record):
        try:
            # Add log message to the queue
            log_entry = self.format(record)
            log_type = (
                "error"
                if record.levelno >= logging.ERROR
                else (
                    "warning"
                    if record.levelno >= logging.WARNING
                    else "success" if "success" in log_entry.lower() else "normal"
                )
            )

            # Store log in the global list
            global last_scan_log
            last_scan_log.append({"log": log_entry, "log_type": log_type})

            # Keep log list from growing too large
            if len(last_scan_log) > MAX_LOG_ENTRIES:
                last_scan_log.pop(0)

            # Add to queue for progress events
            self.queue.put({"log": log_entry, "log_type": log_type})
        except Exception:
            self.handleError(record)


# Add the queue handler to the root logger
queue_handler = QueueHandler(progress_queue)
queue_handler.setLevel(logging.DEBUG)
logging.getLogger().addHandler(queue_handler)


@app.route("/")
def index():
    """Render the main page."""
    recent_scans = ScanResult.get_recent_scans(limit=5)
    return render_template("index.html", recent_scans=recent_scans)


@app.route("/history")
def history():
    """View scan history."""
    scans = ScanResult.get_recent_scans(limit=50)
    return render_template("history.html", scans=scans)


@app.route("/scan/<int:scan_id>")
def view_scan(scan_id):
    """View a saved scan result."""
    scan = ScanResult.get_by_id(scan_id)
    if not scan:
        return redirect(url_for("index"))

    results = scan.get_full_results()
    return render_template("view_scan.html", scan=scan, results=results)


@app.route("/api/scan-progress")
def scan_progress():
    """Stream real-time scan progress as server-sent events."""
    global scan_in_progress

    def generate_events():
        try:
            yield "data: " + json.dumps(
                {"progress": 0, "status": "Starting scan..."}
            ) + "\n\n"

            # Send any existing logs to catch up
            for log_entry in last_scan_log:
                yield f"data: {json.dumps(log_entry)}" + "\n\n"

            while True:
                try:
                    # Get message from queue with timeout
                    event_data = progress_queue.get(timeout=1.0)
                    yield f"data: {json.dumps(event_data)}" + "\n\n"
                except queue.Empty:
                    # If no more messages and scan is complete, end stream
                    if not scan_in_progress:
                        yield "data: " + json.dumps(
                            {"progress": 100, "status": "Scan complete!"}
                        ) + "\n\n"
                        break
                    # Otherwise send a heartbeat to keep connection alive
                    yield "data: " + json.dumps({"heartbeat": True}) + "\n\n"
        except GeneratorExit:
            # Client disconnected
            pass

    response = Response(
        stream_with_context(generate_events()), mimetype="text/event-stream"
    )
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response


@app.route("/api/scan", methods=["POST"])
def scan():
    """Scan a directory for video files."""
    global scan_in_progress

    try:
        request_data = request.get_json()
        if not request_data:
            return jsonify({"error": "Invalid JSON data"}), 400

        directory = request_data.get("directory")
        if not directory:
            return jsonify({"error": "No directory specified"}), 400

        if not os.path.isdir(directory):
            return jsonify({"error": "Invalid directory path"}), 400

        # Get optional parameters
        extensions = request_data.get("extensions", [".mp4", ".avi", ".mkv"])
        include_pattern = request_data.get("include_pattern", None)
        exclude_pattern = request_data.get("exclude_pattern", None)

        # Clear previous logs and set scan in progress
        global last_scan_log
        last_scan_log = []
        scan_in_progress = True

        # Log the start of the scan
        logging.info(f"Starting scan of directory: {directory}")

        # Pre-scan to count files for progress calculation
        progress_queue.put(
            {"progress": 1, "status": "Pre-scanning directory to count files..."}
        )
        total_files = pre_scan_directory(
            directory, extensions, include_pattern, exclude_pattern
        )
        progress_queue.put(
            {
                "progress": 5,
                "status": f"Found {total_files} video files to process",
                "log": f"Pre-scan complete. Found {total_files} video files to analyze.",
                "log_type": "success",
            }
        )

        # Custom scan progress tracking function
        def update_progress(processed, total, current_file):
            """Update progress for the UI."""
            percentage = 100 if total == 0 else 5 + int((processed / total) * 90)
            # Extract just the filename for cleaner display
            os.path.basename(current_file)

            progress_queue.put(
                {
                    "progress": percentage,
                    "status": f"Processing file {processed}/{total} ({percentage}%)",
                }
            )

        # Track the scan progress
        processed_files = 0

        def process_file_hook(filename):
            nonlocal processed_files
            processed_files += 1
            update_progress(processed_files, total_files, filename)

        # Scan the directory with progress tracking
        results = scan_directory(
            directory,
            extensions=extensions,
            include_pattern=include_pattern,
            exclude_pattern=exclude_pattern,
            progress_callback=process_file_hook,  # Pass callback for progress updates
        )

        # Final processing phase
        progress_queue.put({"progress": 95, "status": "Finalizing results..."})

        # Save scan results to database
        scan_result = ScanResult(directory=directory)
        scan_result.save_scan_results(results)

        # Add scan_id to results
        results["scan_id"] = scan_result.id

        # Scan completed
        scan_in_progress = False
        progress_queue.put({"progress": 100, "status": "Scan complete!"})

        return jsonify(results)
    except Exception as e:
        # Log error and mark scan as complete
        logging.error(f"Error scanning directory: {str(e)}")
        scan_in_progress = False
        progress_queue.put({"progress": 100, "status": "Error during scan"})
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate-script", methods=["POST"])
def generate_script():
    """Generate a deletion script for flagged files."""
    try:
        request_data = request.get_json()
        if not request_data:
            return jsonify({"error": "Invalid JSON data"}), 400

        files_to_delete = request_data.get("files", [])
        if not files_to_delete:
            return jsonify({"error": "No files specified for deletion"}), 400

        script_type = request_data.get("script_type", "bash")  # 'bash' or 'batch'

        script_content = generate_deletion_script(files_to_delete, script_type)

        return jsonify(
            {
                "script": script_content,
                "file_count": len(files_to_delete),
                "total_size": sum(file.get("size", 0) for file in files_to_delete),
            }
        )
    except Exception as e:
        logging.error(f"Error generating deletion script: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Synthetic delay route removed

# Initialize database tables
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
