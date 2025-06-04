import logging
import os
import re
from collections import defaultdict

# No synthetic delay - using real processing time


def get_file_size(file_path):
    """Get the size of a file in bytes."""
    try:
        return os.path.getsize(file_path)
    except Exception as e:
        logging.error(f"Error getting file size for {file_path}: {str(e)}")
        return 0


def pre_scan_directory(
    directory, extensions=None, include_pattern=None, exclude_pattern=None
):
    """
    Pre-scan a directory to count total files for accurate progress reporting.

    Args:
        directory: The root directory to scan
        extensions: List of file extensions to include (default: ['.mp4', '.avi', '.mkv'])
        include_pattern: Regex pattern for files to include
        exclude_pattern: Regex pattern for files to exclude

    Returns:
        total_files: Number of video files that match criteria
    """
    if extensions is None:
        extensions = [".mp4", ".avi", ".mkv"]

    # Compile regex patterns if provided
    include_regex = re.compile(include_pattern) if include_pattern else None
    exclude_regex = re.compile(exclude_pattern) if exclude_pattern else None

    # Always exclude trailer files
    trailer_regex = re.compile(r"-trailer", re.IGNORECASE)

    total_files = 0

    logging.debug(f"Pre-scanning directory: {directory}")
    # Walk through the directory
    for _root, _, files in os.walk(directory):
        for filename in files:
            # Check file extension
            if not any(filename.lower().endswith(ext) for ext in extensions):
                continue

            # Apply include/exclude patterns
            if include_regex and not include_regex.search(filename):
                continue

            if exclude_regex and exclude_regex.search(filename):
                continue

            # Skip trailer files
            if trailer_regex.search(filename):
                continue

            total_files += 1

    logging.debug(f"Pre-scan complete. Found {total_files} video files to process.")
    return total_files


def scan_directory(
    directory,
    extensions=None,
    include_pattern=None,
    exclude_pattern=None,
    progress_callback=None,
):
    """
    Scan a directory for video files, identifying duplicates based on their parent directory.

    Args:
        directory: The root directory to scan
        extensions: List of file extensions to include (default: ['.mp4', '.avi', '.mkv'])
        include_pattern: Regex pattern for files to include
        exclude_pattern: Regex pattern for files to exclude
        progress_callback: Optional callback function to report progress (receives filename)

    Returns:
        A dictionary with scan results and statistics
    """
    if extensions is None:
        extensions = [".mp4", ".avi", ".mkv"]

    logging.debug(f"Scanning directory: {directory}")
    logging.debug(f"Extensions: {extensions}")
    logging.debug(f"Include pattern: {include_pattern}")
    logging.debug(f"Exclude pattern: {exclude_pattern}")

    # Compile regex patterns if provided
    include_regex = re.compile(include_pattern) if include_pattern else None
    exclude_regex = re.compile(exclude_pattern) if exclude_pattern else None

    # Always exclude trailer files
    trailer_regex = re.compile(r"-trailer", re.IGNORECASE)

    # Dictionary to store files by directory
    files_by_dir = defaultdict(list)

    # Total count of files
    total_files = 0
    total_size = 0

    # Count of processed files (for progress tracking)
    processed_files = 0

    # Get total files first for progress calculation
    total_video_files = pre_scan_directory(
        directory, extensions, include_pattern, exclude_pattern
    )

    # Walk through the directory
    for root, _, files in os.walk(directory):
        for filename in files:
            file_path = os.path.join(root, filename)

            # Check file extension
            if not any(filename.lower().endswith(ext) for ext in extensions):
                continue

            # Apply include/exclude patterns
            if include_regex and not include_regex.search(filename):
                continue

            if exclude_regex and exclude_regex.search(filename):
                continue

            # Skip trailer files
            if trailer_regex.search(filename):
                logging.debug(f"Skipping trailer file: {filename}")
                continue

            # Log real progress
            processed_files += 1
            progress_percent = (
                int((processed_files / total_video_files) * 100)
                if total_video_files > 0
                else 0
            )
            logging.debug(
                f"Processing file {processed_files}/{total_video_files} ({progress_percent}%): {filename}"
            )

            # Call progress callback if provided
            if progress_callback:
                progress_callback(file_path)

            # Synthetic delay removed - using real processing time only

            # Get file size
            file_size = get_file_size(file_path)
            total_size += file_size

            # Add file to its directory group
            parent_dir = os.path.dirname(file_path)
            files_by_dir[parent_dir].append(
                {
                    "path": file_path,
                    "name": filename,
                    "size": file_size,
                    "size_readable": format_size(file_size),
                }
            )

            total_files += 1

    # Process results to identify which files to keep vs. delete
    result_dirs = []
    flagged_files = []
    total_flagged = 0
    total_flagged_size = 0

    for dir_path, files in files_by_dir.items():
        # Skip directories with only one video file
        if len(files) <= 1:
            result_dirs.append(
                {
                    "path": dir_path,
                    "name": os.path.basename(dir_path),
                    "files": files,
                    "has_duplicates": False,
                }
            )
            continue

        # Sort files by size (largest first)
        sorted_files = sorted(files, key=lambda x: x["size"], reverse=True)

        # Mark all but the largest as flagged for deletion
        keep_file = sorted_files[0]
        keep_file["flagged"] = False

        for file in sorted_files[1:]:
            file["flagged"] = True
            flagged_files.append(file)
            total_flagged += 1
            total_flagged_size += file["size"]

        result_dirs.append(
            {
                "path": dir_path,
                "name": os.path.basename(dir_path),
                "files": sorted_files,
                "has_duplicates": True,
            }
        )

    return {
        "directories": result_dirs,
        "stats": {
            "total_dirs": len(files_by_dir),
            "total_files": total_files,
            "total_size": total_size,
            "total_size_readable": format_size(total_size),
            "dirs_with_duplicates": sum(1 for d in result_dirs if d["has_duplicates"]),
            "flagged_files": total_flagged,
            "flagged_size": total_flagged_size,
            "flagged_size_readable": format_size(total_flagged_size),
        },
        "flagged_files": flagged_files,
    }


def format_size(size_bytes):
    """Format file size in a human-readable format."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"
