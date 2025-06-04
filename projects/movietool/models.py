import json
from datetime import datetime

from app import db


class ScanResult(db.Model):
    """Model for storing scan results."""

    id = db.Column(db.Integer, primary_key=True)
    directory = db.Column(db.String(512), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    total_dirs = db.Column(db.Integer, default=0)
    total_files = db.Column(db.Integer, default=0)
    total_size = db.Column(db.BigInteger, default=0)
    dirs_with_duplicates = db.Column(db.Integer, default=0)
    flagged_files = db.Column(db.Integer, default=0)
    flagged_size = db.Column(db.BigInteger, default=0)
    results_data = db.Column(db.Text)  # JSON string of full results

    def __init__(self, **kwargs):
        """Initialize the model with keyword arguments."""
        super(ScanResult, self).__init__(**kwargs)

    def __repr__(self):
        return f"<ScanResult {self.directory} ({self.timestamp})>"

    @property
    def formatted_timestamp(self):
        """Return a formatted timestamp string."""
        return self.timestamp.strftime("%Y-%m-%d %H:%M:%S")

    @property
    def formatted_total_size(self):
        """Return human-readable total size."""
        from utils.file_scanner import format_size

        return format_size(self.total_size)

    @property
    def formatted_flagged_size(self):
        """Return human-readable flagged size."""
        from utils.file_scanner import format_size

        return format_size(self.flagged_size)

    def save_scan_results(self, results):
        """Save scan results to the database."""
        stats = results.get("stats", {})

        self.total_dirs = stats.get("total_dirs", 0)
        self.total_files = stats.get("total_files", 0)
        self.total_size = stats.get("total_size", 0)
        self.dirs_with_duplicates = stats.get("dirs_with_duplicates", 0)
        self.flagged_files = stats.get("flagged_files", 0)
        self.flagged_size = stats.get("flagged_size", 0)

        # Store the full results as JSON
        self.results_data = json.dumps(results)

        db.session.add(self)
        db.session.commit()

    @classmethod
    def get_recent_scans(cls, limit=10):
        """Get recent scan results."""
        return cls.query.order_by(cls.timestamp.desc()).limit(limit).all()

    @classmethod
    def get_by_id(cls, scan_id):
        """Get a scan result by ID."""
        return cls.query.get(scan_id)

    def get_full_results(self):
        """Get the full scan results."""
        if self.results_data:
            return json.loads(self.results_data)
        return None
