def generate_deletion_script(files_to_delete, script_type="bash"):
    """
    Generate a script to delete the flagged files.

    Args:
        files_to_delete: List of file dictionaries with path information
        script_type: Either 'bash' (Linux/Mac) or 'batch' (Windows)

    Returns:
        A string with the script content
    """
    if script_type == "bash":
        return generate_bash_script(files_to_delete)
    elif script_type == "batch":
        return generate_batch_script(files_to_delete)
    else:
        raise ValueError(f"Unsupported script type: {script_type}")


def generate_bash_script(files_to_delete):
    """Generate a bash script for Linux/Mac."""
    script_lines = [
        "#!/bin/bash",
        "# Auto-generated deletion script",
        "# WARNING: This script will permanently delete files",
        "# Review carefully before running",
        "",
        "# Deletion commands",
    ]

    for file_info in files_to_delete:
        path = file_info.get("path", "")
        # Escape special characters in the file path
        escaped_path = path.replace('"', '\\"')
        script_lines.append(f'rm -f "{escaped_path}"')

    script_lines.extend(
        ["", 'echo "Deletion complete. Removed ${#files[@]} files."', ""]
    )

    return "\n".join(script_lines)


def generate_batch_script(files_to_delete):
    """Generate a batch script for Windows."""
    script_lines = [
        "@echo off",
        "REM Auto-generated deletion script",
        "REM WARNING: This script will permanently delete files",
        "REM Review carefully before running",
        "",
        "REM Deletion commands",
    ]

    for file_info in files_to_delete:
        path = file_info.get("path", "")
        # Escape special characters in the file path
        escaped_path = path.replace('"', "")
        script_lines.append(f'del /f "{escaped_path}"')

    script_lines.extend(["", "echo Deletion complete.", "pause"])

    return "\n".join(script_lines)
