#!/usr/bin/env python3

import argparse
import os
import re
import subprocess
import sys
import time
from typing import Dict, List, Set, Tuple

from rich.box import ROUNDED
from rich.columns import Columns
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.style import Style
from rich.table import Table
from rich.text import Text
from rich.traceback import install


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Find orphaned XMP sidecar files without corresponding media files."
    )
    parser.add_argument(
        "directory",
        help="Directory to search for orphaned XMP files",
        nargs="?",
        default=".",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without actually deleting files",
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Delete orphaned XMP files (USE WITH CAUTION)",
    )
    return parser.parse_args()


console = Console()


def print_colored(message, color="white", emoji=None, end="\n"):
    """Print colored text using rich instead of termcolor"""
    text = message
    if emoji:
        text = f"{emoji} {message}"
    console.print(text, style=color, end=end)


def print_separator():
    """Print a fancy separator line"""
    console.print(
        Panel("", expand=False, width=70, border_style="blue"), justify="center"
    )


def print_progress_dot():
    """Legacy function, kept for compatibility but not used with rich progress bars"""
    console.print(".", end="")
    console.flush()


def find_all_files(directory: str) -> Tuple[List[str], List[str]]:
    """
    Use find command to gather all XMP files and potential media files with visual progress
    """
    with console.status(
        "[cyan]🔍 Finding all files in the directory...", spinner="dots"
    ) as status:
        # Find all XMP files
        xmp_cmd = [
            "find",
            directory,
            "-type",
            "f",
            "-name",
            "*.xmp",
            "-not",
            "-path",
            "*/\\.*",
        ]
        status.update("[cyan]🔍 Running find for XMP files...")
        xmp_result = subprocess.run(xmp_cmd, capture_output=True, text=True)
        xmp_files = xmp_result.stdout.splitlines()

        # Find all potential media files (non-XMP files)
        # This command excludes hidden files and XMP files
        status.update("[cyan]🔍 Running find for media files...")
        media_cmd = [
            "find",
            directory,
            "-type",
            "f",
            "-not",
            "-name",
            "*.xmp",
            "-not",
            "-path",
            "*/\\.*",
        ]
        media_result = subprocess.run(media_cmd, capture_output=True, text=True)
        media_files = media_result.stdout.splitlines()

    console.print("[cyan]🔍 File discovery complete![/cyan]")
    return xmp_files, media_files


def get_base_filename(path: str) -> str:
    """Extract base filename without extension from a full path"""
    base_name = os.path.basename(path)
    # For XMP files, remove the .xmp extension
    if base_name.lower().endswith(".xmp"):
        # Remove .xmp extension
        base_name = os.path.splitext(base_name)[0]
    else:
        # For media files, remove any extension
        base_name = os.path.splitext(base_name)[0]

    return base_name


def process_files(xmp_files: List[str], media_files: List[str]) -> List[str]:
    """Process files in memory to find orphaned XMP files"""
    console.print("[cyan]📊 Processing files...[/cyan]")

    # Create a set of base filenames (without extension) for media files
    total_media = len(media_files)
    media_base_names = set()

    with Progress(
        SpinnerColumn(),
        TextColumn("[yellow]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        TextColumn("({task.completed}/{task.total})"),
        TimeElapsedColumn(),
    ) as progress:
        # Process media files with progress bar
        media_task = progress.add_task(
            "[yellow]Indexing media files...", total=total_media
        )

        for media_path in media_files:
            base_name = get_base_filename(media_path)
            media_base_names.add(base_name)
            progress.update(media_task, advance=1)

        # Process XMP files and find orphans with progress bar
        total_xmp = len(xmp_files)
        orphaned_xmp_files = []

        xmp_task = progress.add_task(
            "[yellow]Checking XMP files for orphans...", total=total_xmp
        )

        for xmp_path in xmp_files:
            xmp_base_name = get_base_filename(xmp_path)

            # If the XMP base name doesn't match any media file base name, it's orphaned
            if xmp_base_name not in media_base_names:
                orphaned_xmp_files.append(xmp_path)

            progress.update(xmp_task, advance=1)

    return orphaned_xmp_files


def handle_orphaned_files(orphaned_files: List[str], dry_run: bool, delete: bool):
    """Handle orphaned XMP files based on command-line options"""
    total_orphaned = len(orphaned_files)

    if total_orphaned == 0:
        console.print(
            Panel(
                "[green]✅ No orphaned XMP files found![/green]", border_style="green"
            )
        )
        return

    # Create a table for displaying orphaned files
    table = Table(
        show_header=True,
        header_style="bold magenta",
        border_style="magenta",
        box=ROUNDED,
    )
    table.add_column("Status", style="bold")
    table.add_column("File Path", style="dim")

    # Display mode information
    mode_text = "[yellow]Showing orphaned files[/yellow]"
    if dry_run:
        mode_text = "[yellow]DRY RUN - Would delete these files[/yellow]"
    elif delete:
        mode_text = "[red]DELETE MODE - Deleting these files[/red]"

    # Display the header with count
    console.print(
        Panel(
            f"[magenta]📄 Found {total_orphaned} orphaned XMP files[/magenta]",
            subtitle=mode_text,
            border_style="magenta",
        )
    )

    # Process files with a progress bar for deletion
    if delete:
        with Progress(
            SpinnerColumn(),
            TextColumn("[red]Deleting files..."),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
        ) as progress:

            delete_task = progress.add_task(
                "[red]Deleting orphaned XMP files...", total=total_orphaned
            )

            for xmp_file in orphaned_files:
                try:
                    os.remove(xmp_file)
                    table.add_row("🗑️ Deleted", xmp_file)
                except Exception as e:
                    table.add_row("❌ Error", f"{xmp_file} ({e})")
                progress.update(delete_task, advance=1)
    else:
        # Just list the files for dry-run or viewing
        for xmp_file in orphaned_files:
            if dry_run:
                table.add_row("🗑️ Would Delete", xmp_file)
            else:
                table.add_row("📄 Orphaned", xmp_file)

    # Display the table
    console.print(table)

    # Display summary panel
    if not delete and not dry_run:
        console.print(
            Panel(
                "[yellow]Use --delete to remove these files or --dry-run to simulate deletion[/yellow]",
                border_style="yellow",
            )
        )
    elif dry_run:
        console.print(
            Panel(
                f"[yellow]🗑️ Would have deleted {total_orphaned} orphaned XMP files[/yellow]",
                border_style="yellow",
            )
        )
    else:
        console.print(
            Panel(
                f"[green]✅ Deleted {total_orphaned} orphaned XMP files[/green]",
                border_style="green",
            )
        )


def main():
    # Install rich traceback handler for better error display
    install()

    start_time = time.time()
    args = parse_arguments()
    directory = os.path.abspath(args.directory)

    try:
        # Display a panel with the target directory information
        console.print(
            Panel(
                f"[bold cyan]Target Directory:[/bold cyan] [yellow]{directory}[/yellow]",
                title="🔍 XMP Orphan Finder",
                border_style="blue",
            )
        )

        print_separator()

        # Find all files in the directory
        xmp_files, media_files = find_all_files(directory)

        # Display stats about found files
        console.print(
            Panel(
                f"[bold cyan]Found:[/bold cyan]\n"
                f"[yellow]XMP Files:[/yellow] {len(xmp_files)}\n"
                f"[yellow]Media Files:[/yellow] {len(media_files)}",
                title="📊 File Statistics",
                border_style="blue",
            )
        )

        print_separator()

        # Process files to find orphaned XMP files
        orphaned_files = process_files(xmp_files, media_files)

        print_separator()

        # Handle orphaned files based on command-line options
        handle_orphaned_files(orphaned_files, args.dry_run, args.delete)

        # Calculate execution time
        end_time = time.time()
        execution_time = end_time - start_time

        # Display execution summary
        console.print(
            Panel(
                f"[bold cyan]Operation Summary:[/bold cyan]\n"
                f"[yellow]Directory Scanned:[/yellow] {directory}\n"
                f"[yellow]Total XMP Files:[/yellow] {len(xmp_files)}\n"
                f"[yellow]Total Media Files:[/yellow] {len(media_files)}\n"
                f"[yellow]Orphaned XMP Files:[/yellow] {len(orphaned_files)}\n"
                f"[yellow]Delete Mode:[/yellow] {'[red]Enabled[/red]' if args.delete else '[green]Disabled[/green]'}\n"
                f"[yellow]Dry Run Mode:[/yellow] {'[green]Enabled[/green]' if args.dry_run else '[red]Disabled[/red]'}\n"
                f"[yellow]Execution Time:[/yellow] {execution_time:.2f} seconds",
                title="✅ Execution Complete",
                border_style="green",
            )
        )

    except KeyboardInterrupt:
        console.print(
            Panel(
                "[bold red]Operation cancelled by user[/bold red]", border_style="red"
            )
        )
        sys.exit(1)
    except Exception as e:
        console.print(
            Panel(
                f"[bold red]Error:[/bold red] {str(e)}",
                title="❌ Execution Failed",
                border_style="red",
            )
        )
        console.print_exception()
        sys.exit(1)


if __name__ == "__main__":
    main()
