#!/usr/bin/env python3

import argparse
import os

# trunk-ignore(bandit/B404)
import subprocess
import sys
import time
from typing import List, Tuple

from rich.box import ROUNDED
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.table import Table
from rich.traceback import install


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Find orphaned sidecar files without corresponding media files."
    )
    parser.add_argument(
        "directory",
        help="Directory to search for orphaned sidecar files",
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
        help="Delete orphaned sidecar files (USE WITH CAUTION)",
    )
    parser.add_argument(
        "--extension",
        "-e",
        default="xmp",
        help="Specify the sidecar file extension (default: xmp)",
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
    """Legacy function kept for backward compatibility - no longer used with rich progress bars"""
    console.print(".", end="")
    console.flush()


def find_all_files(directory: str, extension: str) -> Tuple[List[str], List[str]]:
    """
    Use find command to gather all sidecar files and potential media files with visual progress
    """
    with console.status(
        "[cyan]🔍 Finding all files in the directory...", spinner="dots"
    ) as status:
        # Find all sidecar files
        sidecar_pattern = f"*.{extension}"
        sidecar_cmd = [
            "find",
            directory,
            "-type",
            "f",
            "-name",
            sidecar_pattern,
            "-not",
            "-path",
            "*/.*",
        ]
        status.update(f"[cyan]🔍 Running find for .{extension} sidecar files...")
        # trunk-ignore(bandit/B603)
        sidecar_result = subprocess.run(sidecar_cmd, capture_output=True, text=True)
        sidecar_files = sidecar_result.stdout.splitlines()

        # Find all potential media files (non-sidecar files)
        # This command excludes hidden files and sidecar files
        status.update("[cyan]🔍 Running find for media files...")
        media_cmd = [
            "find",
            directory,
            "-type",
            "f",
            "-not",
            "-name",
            sidecar_pattern,
            "-not",
            "-path",
            "*/.*",
        ]
        # trunk-ignore(bandit/B603)
        media_result = subprocess.run(media_cmd, capture_output=True, text=True)
        media_files = media_result.stdout.splitlines()

    console.print("[cyan]🔍 File discovery complete![/cyan]")
    return sidecar_files, media_files


def get_base_filename(path: str, extension: str = "xmp") -> str:
    """Extract base filename without extension from a full path"""
    base_name = os.path.basename(path)
    # For sidecar files, remove the extension
    if base_name.lower().endswith(f".{extension}"):
        # Remove extension
        base_name = os.path.splitext(base_name)[0]
    else:
        # For media files, remove any extension
        base_name = os.path.splitext(base_name)[0]

    return base_name


def process_files(
    sidecar_files: List[str], media_files: List[str], extension: str = "xmp"
) -> List[str]:
    """Process files in memory to find orphaned sidecar files"""
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
        # Process sidecar files and find orphans with progress bar
        total_sidecar = len(sidecar_files)
        orphaned_sidecar_files = []

        sidecar_task = progress.add_task(
            f"[yellow]Checking .{extension} files for orphans...", total=total_sidecar
        )

        for sidecar_path in sidecar_files:
            sidecar_base_name = get_base_filename(sidecar_path, extension)
            # If the sidecar base name doesn't match any media file base name, it's orphaned
            if sidecar_base_name not in media_base_names:
                orphaned_sidecar_files.append(sidecar_path)

            progress.update(sidecar_task, advance=1)

    return orphaned_sidecar_files


def handle_orphaned_files(
    orphaned_files: List[str], dry_run: bool, delete: bool, extension: str = "xmp"
):
    """Handle orphaned sidecar files based on command-line options"""
    total_orphaned = len(orphaned_files)

    if total_orphaned == 0:
        console.print(
            Panel(
                f"[green]✅ No orphaned .{extension} files found![/green]",
                border_style="green",
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
            f"[magenta]\U0001f4c4 Found {total_orphaned} orphaned .{extension} files[/magenta]",
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
                f"[red]Deleting orphaned .{extension} files...", total=total_orphaned
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
                f"[yellow]🗑️ Would have deleted {total_orphaned} orphaned .{extension} files[/yellow]",
                border_style="yellow",
            )
        )
    else:
        console.print(
            Panel(
                f"[green]✅ Deleted {total_orphaned} orphaned .{extension} files[/green]",
                border_style="green",
            )
        )


def main():
    # Install rich traceback handler for better error display
    install()

    try:
        start_time = time.time()
        args = parse_arguments()
        directory = os.path.abspath(args.directory)
        extension = args.extension

        # Display a panel with the target directory information
        console.print(
            Panel(
                f"[bold cyan]Target Directory:[/bold cyan] [yellow]{directory}[/yellow]\n"
                f"[bold cyan]Sidecar Extension:[/bold cyan] [yellow].{extension}[/yellow]",
                title="\U0001f50d Sidecar Orphan Finder",
                border_style="blue",
            )
        )

        print_separator()

        # Find all files in the directory
        sidecar_files, media_files = find_all_files(directory, extension)
        # Display stats about found files
        console.print(
            Panel(
                f"[bold cyan]Found:[/bold cyan]\n"
                f"[yellow]Sidecar Files (.{extension}):[/yellow] {len(sidecar_files)}\n"
                f"[yellow]Media Files:[/yellow] {len(media_files)}",
                title="📊 File Statistics",
                border_style="blue",
            )
        )

        print_separator()

        # Process files to find orphaned sidecar files
        orphaned_files = process_files(sidecar_files, media_files, extension)
        print_separator()

        # Handle orphaned files based on command-line options
        handle_orphaned_files(orphaned_files, args.dry_run, args.delete, extension)

        # Calculate execution time
        end_time = time.time()
        execution_time = end_time - start_time

        # Display execution summary
        console.print(
            Panel(
                "\n".join(
                    [
                        "[bold cyan]Operation Summary:[/bold cyan]",
                        f"[yellow]Directory Scanned:[/yellow] {directory}",
                        f"[yellow]Sidecar Extension:[/yellow] .{extension}",
                        f"[yellow]Total Sidecar Files:[/yellow] {len(sidecar_files)}",
                        f"[yellow]Total Media Files:[/yellow] {len(media_files)}",
                        f"[yellow]Orphaned Sidecar Files:[/yellow] {len(orphaned_files)}",
                        f"[yellow]Delete Mode:[/yellow] {'[red]Enabled[/red]' if args.delete else '[green]Disabled[/green]'}",
                        f"[yellow]Dry Run Mode:[/yellow] {'[green]Enabled[/green]' if args.dry_run else '[red]Disabled[/red]'}",
                        (
                            f"[yellow]Execution Time:[/yellow] {int(execution_time // 60)} minutes {execution_time % 60:.2f} seconds"
                            if execution_time >= 60
                            else f"[yellow]Execution Time:[/yellow] {execution_time:.2f} seconds"
                        ),
                    ]
                ),
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
