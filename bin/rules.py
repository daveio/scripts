#!/usr/bin/env python3
"""
Script to concatenate MDC files from _cursor/rules directory,
reformat any front matter as plain Markdown,
and write an organized Markdown document to cursor-rules-merged.md
"""

# We're using subprocess module with trusted inputs only - no security concerns
# nosec B404 - we use subprocess with constrained inputs
import argparse
import os
import re
import shutil
import subprocess  # nosec B404
import sys
from datetime import datetime
from pathlib import Path

# Will be set when yaml is successfully imported
YAML_MODULE = None


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Merge MDC files into a single Markdown document."
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Print commands being executed"
    )
    return parser.parse_args()


def check_types_pyyaml_installed(verbose=False):
    """Check if types-PyYAML is installed"""
    cmd = [sys.executable, "-m", "pip", "show", "types-PyYAML"]
    if verbose:
        print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(  # nosec B603
            cmd, capture_output=True, text=True, check=False
        )
        return result.returncode == 0
    # pylint: disable=broad-exception-caught
    except Exception:
        return False


def install_dependencies(verbose=False):
    """Install required dependencies."""
    print("Installing PyYAML and types-PyYAML...")
    cmd = [sys.executable, "-m", "pip", "install", "pyyaml", "types-PyYAML"]
    if verbose:
        print(f"Running: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)  # nosec B603
        print("Successfully installed dependencies.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        print(f"Error output: {e.stderr}")
        return False


def format_with_prettier(file_path, verbose=False):
    """Format a file using Prettier if available."""
    if not shutil.which("prettier"):
        print("Prettier not found. Skipping formatting.")
        return False

    cmd = ["prettier", "--write", file_path]
    if verbose:
        print(f"Running: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)  # nosec B603
        print(f"Formatted {file_path} with Prettier.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error formatting with Prettier: {e}")
        print(f"Prettier error output: {e.stderr}")
        return False


def is_prettier_available():
    """Check if Prettier is available on the system."""
    return shutil.which("prettier") is not None


def extract_title_from_content(content):
    """Extract the first heading as a title from content."""
    title_match = re.search(r"^#\s+(.+?)$", content, re.MULTILINE)
    return title_match[1].strip() if title_match else "Untitled Section"


def process_front_matter(front_matter_match, content):
    """Process front matter and convert it to Markdown format."""
    front_matter_str = front_matter_match[1]
    content = content[front_matter_match.end() :]

    front_matter_md = []
    front_matter = {}
    try:
        # Parse YAML front matter
        front_matter = YAML_MODULE.safe_load(front_matter_str)

        # Convert front matter to Markdown
        if "title" in front_matter:
            # Use H2 instead of H1 to avoid multiple top-level headings (MD025)
            front_matter_md.append(f"## {front_matter['title']}")

        front_matter_md.extend(
            f"**{key}**: {value}"
            for key, value in front_matter.items()
            if key != "title"
        )
        # Replace front matter with Markdown
        if front_matter_md:
            content = "\n".join(front_matter_md) + "\n\n" + content
    except YAML_MODULE.YAMLError as yaml_error:
        print(f"YAML parsing error: {yaml_error}")
        # Continue with empty front matter but keep the content
        front_matter = {}

    return content, front_matter


def fix_code_blocks(content):
    """Fix code blocks by adding plaintext to opening fences without a language."""
    lines = content.splitlines()
    in_code_block = False
    for i, line in enumerate(lines):
        if line.strip().startswith("```"):
            if in_code_block:
                # This is a closing fence - ensure it's just ```
                if line.strip() != "```":
                    lines[i] = "```"
                in_code_block = False

            else:
                # This is an opening fence
                if not re.search(r"```\w", line):  # No language specified
                    lines[i] = "```plaintext"
                in_code_block = True
    return "\n".join(lines)


def process_mdc_file(file_path):
    """Process an MDC file to extract front matter and content."""
    # No need for global declaration as we're using a module-level variable
    if YAML_MODULE is None:
        raise ImportError("PyYAML is required but not available")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if file has YAML front matter (between --- markers)
    # Modified regex to handle cases without a trailing newline after closing ---
    front_matter_match = re.match(r"^---\s*\n(.*?)\n---\s*(\n|$)", content, re.DOTALL)

    front_matter = {}
    # Front matter extraction and processing
    if front_matter_match:
        content, front_matter = process_front_matter(front_matter_match, content)

    # Title extraction
    has_title_in_matter = front_matter_match and "title" in front_matter
    if has_title_in_matter:
        title = front_matter.get("title", "Untitled Section")
    else:
        title = extract_title_from_content(content)

    # Fix any H1 headings in content to H2 to avoid multiple top-level headings
    content = re.sub(r"^# (.+?)$", r"## \1", content, flags=re.MULTILINE)

    # Fix fenced code blocks without language specification (MD040)
    content = fix_code_blocks(content)

    return {
        "title": title,
        "content": content,
        "file_name": os.path.basename(file_path),
    }


def create_valid_slug(text):
    """Create a valid slug for Markdown headings.

    - Convert to lowercase
    - Replace spaces with hyphens
    - Remove characters that aren't alphanumerics, underscores, or hyphens
    - Remove multiple consecutive hyphens
    """
    # Convert to lowercase and replace spaces with hyphens
    slug = text.lower().replace(" ", "-")
    # Remove characters that aren't alphanumerics, underscores, or hyphens
    slug = re.sub(r"[^\w\-]", "", slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r"-+", "-", slug)
    return slug


def read_user_rules(user_rules_file, verbose=False):
    """Read user rules from the specified file."""
    if not os.path.exists(user_rules_file):
        if verbose:
            print(f"User rules file {user_rules_file} not found. Skipping.")
        return ""

    if verbose:
        print(f"Reading user rules from {user_rules_file}")
    try:
        with open(user_rules_file, "r", encoding="utf-8") as f:
            content = f.read()
        return content
    except (FileNotFoundError, PermissionError, IOError, UnicodeDecodeError) as e:
        print(f"Error reading user rules file: {e}")
        return ""


def merge_mdc_files(directory, output_file, verbose=False, user_rules_file="rules.md"):
    """Merge all MDC files in the directory into a single Markdown file."""
    mdc_files = list(Path(directory).glob("*.mdc"))

    if not mdc_files:
        print(f"No MDC files found in {directory}")
        return

    processed_files = []
    for file_path in mdc_files:
        if verbose:
            print(f"Processing file: {file_path}")
        processed_file = process_mdc_file(file_path)
        processed_files.append(processed_file)

    # Sort files by title, case-insensitively
    processed_files.sort(key=lambda x: x["title"].lower())

    # Get user rules content
    user_rules_content = read_user_rules(user_rules_file, verbose)

    # Build the merged content
    merged_content = ""

    # Start with user rules if they exist
    if user_rules_content:
        merged_content = user_rules_content + "\n\n---\n\n"

    # Add standard rules header
    merged_content += (
        "# Standard Rules\n\n"
        + "These rules are secondary to the **High Priority Rules**.\n\n"
    )

    # Use proper heading instead of emphasis for generated date (MD036)
    merged_content += (
        f"## Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    )

    # Skip table of contents to avoid link fragment issues
    # and just add sections directly with their headings

    # Add the content of each file with proper headings
    for processed_file in processed_files:
        # Add the content with its original headings
        merged_content += processed_file["content"].strip() + "\n\n---\n\n"

    # Write the merged content to the output file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(merged_content)

    print(f"Successfully merged {len(processed_files)} MDC files into {output_file}")
    if user_rules_content:
        print(f"Included user rules from {user_rules_file}")

    # Format the output file with Prettier if available
    format_with_prettier(output_file, verbose)


if __name__ == "__main__":
    args = parse_args()

    # Import or install yaml if not available
    try:
        import yaml

        YAML_MODULE = yaml
    except ImportError:
        if not install_dependencies(args.verbose):
            print("Failed to install required dependencies. Exiting.")
            sys.exit(1)
        try:
            import yaml

            YAML_MODULE = yaml
        except ImportError:
            print("Failed to import yaml even after installation. Exiting.")
            sys.exit(1)

    # Check for type stubs
    if not check_types_pyyaml_installed(args.verbose):
        print("PyYAML installed but types-PyYAML is missing. Installing type stubs...")
        install_dependencies(args.verbose)

    merge_mdc_files("_cursor/rules", "rules-merged.md", args.verbose)
