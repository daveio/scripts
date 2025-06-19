#!/usr/bin/env python3
"""
Swipe - A multithreaded utility to delete all objects from S3-compatible storage.

This tool provides a safe and efficient way to empty any S3-compatible bucket with:
- Support for AWS S3, Cloudflare R2, MinIO, and other S3-compatible providers
- Configuration validation and confirmation prompts
- Multithreaded deletion for performance
- Real-time progress tracking
- Comprehensive error handling
"""

import os
import shutil
import signal
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional, Tuple

import boto3
import click
import colorama
import pyfiglet
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.table import Table
from termcolor import colored

# Load environment variables
load_dotenv()

# Initialize colorama for cross-platform color support
colorama.init()

# Initialize Rich console
console = Console()

# Global flag for graceful shutdown
shutdown_requested = False


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    global shutdown_requested
    shutdown_requested = True
    console.print("\n[yellow]⚠️  Shutdown requested. Cleaning up...[/yellow]")


# Register signal handler
signal.signal(signal.SIGINT, signal_handler)


def get_rainbow_colors():
    """Get a list of rainbow colors for cycling through."""
    return ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta']


def apply_rainbow_effect(text: str, start_color_index: int = 0) -> str:
    """Apply rainbow colors to text character by character."""
    colors = get_rainbow_colors()
    colored_chars = []
    
    color_index = start_color_index
    for char in text:
        if char.strip():  # Only color non-whitespace characters
            colored_chars.append(colored(char, colors[color_index % len(colors)]))
            color_index += 1
        else:
            colored_chars.append(char)
    
    return ''.join(colored_chars)


def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')


def hide_cursor():
    """Hide the terminal cursor."""
    print('\033[?25l', end='')


def show_cursor():
    """Show the terminal cursor."""
    print('\033[?25h', end='')


def get_terminal_size():
    """Get terminal size (width, height)."""
    try:
        return shutil.get_terminal_size()
    except (OSError, ValueError):
        return os.terminal_size([80, 24])  # fallback


def center_text(text: str, width: int) -> str:
    """Center text horizontally in the given width."""
    lines = text.split('\n')
    centered_lines = []
    
    for line in lines:
        # Remove ANSI escape codes for length calculation
        import re
        clean_line = re.sub(r'\x1b\[[0-9;]*m', '', line)
        padding = max(0, (width - len(clean_line)) // 2)
        centered_lines.append(' ' * padding + line)
    
    return '\n'.join(centered_lines)


class S3Deleter:
    """Manages S3-compatible storage operations and object deletion."""

    def __init__(
        self,
        bucket_name: str,
        endpoint_url: Optional[str] = None,
        region: Optional[str] = None,
    ):
        """Initialize S3-compatible client and bucket configuration."""
        self.bucket_name = bucket_name
        self.endpoint_url = endpoint_url
        self.region = region

        # Configure boto3 client for S3-compatible providers
        client_config = {}
        if endpoint_url:
            client_config["endpoint_url"] = endpoint_url
        if region:
            client_config["region_name"] = region

        self.s3_client = boto3.client("s3", **client_config)
        self.total_size = 0
        self.objects: List[dict] = []

    def test_connection(self) -> bool:
        """Test S3 connection and bucket access."""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            return True
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                console.print(f"[red]❌ Bucket '{self.bucket_name}' not found[/red]")
            elif error_code == "403":
                console.print(
                    f"[red]❌ Access denied to bucket '{self.bucket_name}'[/red]"
                )
            else:
                console.print(f"[red]❌ Error accessing bucket: {error_code}[/red]")
            return False
        except Exception as e:
            console.print(f"[red]❌ Connection error: {str(e)}[/red]")
            return False

    def list_objects(self, progress: Optional[Progress] = None) -> List[dict]:
        """List all objects in the bucket with pagination support."""
        objects = []
        total_size = 0

        paginator = self.s3_client.get_paginator("list_objects_v2")
        page_iterator = paginator.paginate(Bucket=self.bucket_name)

        try:
            for page in page_iterator:
                if shutdown_requested:
                    break

                if "Contents" in page:
                    for obj in page["Contents"]:
                        objects.append(
                            {
                                "Key": obj["Key"],
                                "Size": obj.get("Size", 0),
                                "LastModified": obj.get("LastModified"),
                            }
                        )
                        total_size += obj.get("Size", 0)

                        if progress:
                            progress.console.print(
                                f"[dim]Found: {len(objects)} objects ({self._format_size(total_size)})[/dim]",
                                end="\r",
                            )

        except ClientError as e:
            console.print(f"[red]❌ Error listing objects: {e}[/red]")
            return []

        self.objects = objects
        self.total_size = total_size
        return objects

    def delete_object(self, key: str) -> Tuple[bool, str, Optional[str]]:
        """Delete a single object from the bucket."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True, key, None
        except Exception as e:
            return False, key, str(e)

    def delete_objects_batch(
        self, keys: List[str]
    ) -> List[Tuple[bool, str, Optional[str]]]:
        """Delete a batch of objects (up to 1000 at a time)."""
        if not keys:
            return []

        # S3 delete_objects API limit is 1000 objects per request
        batch_size = 1000
        results = []

        for i in range(0, len(keys), batch_size):
            if shutdown_requested:
                break

            batch = keys[i : i + batch_size]
            delete_request = {"Objects": [{"Key": key} for key in batch]}

            try:
                response = self.s3_client.delete_objects(
                    Bucket=self.bucket_name, Delete=delete_request
                )

                # Process successful deletions
                if "Deleted" in response:
                    for obj in response["Deleted"]:
                        results.append((True, obj["Key"], None))

                # Process errors
                if "Errors" in response:
                    for error in response["Errors"]:
                        results.append((False, error["Key"], error["Message"]))

            except Exception as e:
                # If batch delete fails, mark all as failed
                for key in batch:
                    results.append((False, key, str(e)))

        return results

    def verify_empty(self) -> bool:
        """Verify that the bucket is empty."""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name, MaxKeys=1
            )
            return "Contents" not in response
        except Exception:
            return False

    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """Format bytes to human-readable size."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} PB"


def create_config_table() -> Table:
    """Create a configuration summary table."""
    table = Table(
        title="[bold]Swipe Configuration[/bold]",
        box=box.ROUNDED,
        title_style="bold white",
        header_style="bold cyan",
        style="cyan",
    )

    table.add_column("Setting", style="white", no_wrap=True)
    table.add_column("Value", style="yellow")

    # Build endpoint URL from hostname and protocol
    hostname = os.getenv("S3_HOSTNAME")
    protocol = os.getenv("S3_PROTOCOL", "https")
    endpoint_url = f"{protocol}://{hostname}" if hostname else "AWS S3 (default)"

    table.add_row("Endpoint", endpoint_url)
    table.add_row("Bucket", os.getenv("S3_BUCKET_NAME", "Not set"))
    table.add_row(
        "Access Key",
        (
            f"{os.getenv('S3_ACCESS_KEY_ID', 'Not set')[:8]}..."
            if os.getenv("S3_ACCESS_KEY_ID")
            else "Not set"
        ),
    )

    return table


def big_countdown_with_cancel(seconds: int) -> bool:
    """Display a spectacular full-screen countdown with figlet and rainbow colors."""
    terminal_size = get_terminal_size()
    term_width = terminal_size.columns
    term_height = terminal_size.lines
    
    # Store original terminal state
    clear_screen()
    hide_cursor()
    
    try:
        for remaining in range(seconds, 0, -1):
            if shutdown_requested:
                return False
            
            # Clear screen and move to top
            clear_screen()
            
            # Create figlet text for the number
            figlet_text = pyfiglet.figlet_format(str(remaining), font='big')
            
            # Apply rainbow colors to the figlet text
            # Use remaining as color offset for animation effect
            colored_figlet = apply_rainbow_effect(figlet_text, start_color_index=remaining)
            
            # Center the figlet text horizontally
            centered_figlet = center_text(colored_figlet, term_width)
            
            # Calculate vertical positioning
            figlet_lines = len(figlet_text.split('\n'))
            vertical_padding = max(0, (term_height - figlet_lines - 6) // 2)
            
            # Print vertical padding
            print('\n' * vertical_padding)
            
            # Print the centered, colored figlet text
            print(centered_figlet)
            
            # Add some spacing
            print('\n' * 2)
            
            # Create and center the cancellation message
            cancel_msg = "⏱️  Press Ctrl+C to cancel deletion  ⏱️"
            cancel_msg_colored = apply_rainbow_effect(cancel_msg, start_color_index=remaining + 10)
            centered_cancel = center_text(cancel_msg_colored, term_width)
            print(centered_cancel)
            
            # Create and center the description
            desc_msg = f"Starting S3 bucket deletion in {remaining} second{'s' if remaining != 1 else ''}..."
            desc_msg_colored = colored(desc_msg, 'white', attrs=['bold'])
            centered_desc = center_text(desc_msg_colored, term_width)
            print('\n' + centered_desc)
            
            time.sleep(1)
        
        # Final flash effect
        clear_screen()
        go_text = pyfiglet.figlet_format("GO!", font='big')
        colored_go = apply_rainbow_effect(go_text, start_color_index=0)
        centered_go = center_text(colored_go, term_width)
        
        vertical_padding = max(0, (term_height - len(go_text.split('\n')) - 4) // 2)
        print('\n' * vertical_padding)
        print(centered_go)
        
        launch_msg = "🚀 LAUNCHING DELETION SEQUENCE! 🚀"
        launch_colored = apply_rainbow_effect(launch_msg, start_color_index=5)
        centered_launch = center_text(launch_colored, term_width)
        print('\n' + centered_launch)
        
        time.sleep(1.5)
        
    finally:
        # Restore terminal state
        clear_screen()
        show_cursor()
    
    return True


def countdown_with_cancel(seconds: int) -> bool:
    """Display a countdown that can be cancelled with Ctrl+C."""
    for remaining in range(seconds, 0, -1):
        if shutdown_requested:
            return False

        console.print(
            f"[bold yellow]⏱️  Starting deletion in {remaining} seconds... Press Ctrl+C to cancel[/bold yellow]",
            end="\r",
        )
        time.sleep(1)

    console.print(" " * 80, end="\r")  # Clear the line
    return True


def delete_objects_parallel(deleter: S3Deleter, max_workers: int = 16) -> dict:
    """Delete objects in parallel using multiple threads."""
    objects = deleter.objects
    if not objects:
        return {"deleted": 0, "failed": 0, "errors": []}

    results = {"deleted": 0, "failed": 0, "errors": []}
    start_time = time.time()

    # Prepare batches for bulk delete operations
    batch_size = 100  # Process in batches for efficiency
    object_batches = []

    for i in range(0, len(objects), batch_size):
        if shutdown_requested:
            break
        batch = objects[i : i + batch_size]
        object_batches.append([obj["Key"] for obj in batch])

    # Create progress display
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    ) as progress:

        task = progress.add_task(
            f"[cyan]Deleting {len(objects)} objects...[/cyan]", total=len(objects)
        )

        # Process batches in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_batch = {}

            # Submit all batches
            for batch in object_batches:
                if shutdown_requested:
                    break
                future = executor.submit(deleter.delete_objects_batch, batch)
                future_to_batch[future] = batch

            # Process completed batches
            for future in as_completed(future_to_batch):
                if shutdown_requested:
                    executor.shutdown(wait=False)
                    break

                batch_results = future.result()

                for success, key, error in batch_results:
                    if success:
                        results["deleted"] += 1
                    else:
                        results["failed"] += 1
                        if error:
                            results["errors"].append(f"{key}: {error}")

                    progress.update(task, advance=1)

                    # Update progress description with current stats
                    progress.update(
                        task,
                        description=f"[cyan]Deleted: {results['deleted']} | Failed: {results['failed']}[/cyan]",
                    )

    results["duration"] = time.time() - start_time
    results["rate"] = (
        results["deleted"] / results["duration"] if results["duration"] > 0 else 0
    )

    return results


def create_results_table(results: dict, total_size: int) -> Table:
    """Create a results summary table."""
    table = Table(
        title="[bold]Deletion Results[/bold]",
        box=box.ROUNDED,
        title_style="bold white",
        header_style="bold cyan",
    )

    table.add_column("Metric", style="white", no_wrap=True)
    table.add_column("Value", style="green")

    table.add_row("Objects Deleted", f"{results['deleted']:,}")
    table.add_row("Objects Failed", f"{results['failed']:,}")
    table.add_row("Total Size Freed", S3Deleter._format_size(total_size))
    table.add_row("Duration", f"{results['duration']:.2f} seconds")
    table.add_row("Deletion Rate", f"{results['rate']:.0f} objects/second")

    return table


@click.command()
@click.option("--yes", "-y", is_flag=True, help="Skip confirmation prompt")
def main(yes: bool):
    """Swipe - Empty an S3-compatible bucket with multithreaded deletion."""

    # Display header
    console.print(
        Panel.fit(
            "[bold red]Swipe - S3-Compatible Storage Deletion Tool[/bold red]\n"
            "[yellow]WARNING: This will permanently delete ALL objects![/yellow]",
            border_style="red",
            box=box.DOUBLE,
        )
    )

    # Load and validate configuration
    bucket_name = os.getenv("S3_BUCKET_NAME")
    hostname = os.getenv("S3_HOSTNAME")
    protocol = os.getenv("S3_PROTOCOL", "https")
    access_key = os.getenv("S3_ACCESS_KEY_ID")
    secret_key = os.getenv("S3_SECRET_KEY")

    # Build endpoint URL if hostname is provided (for S3-compatible providers)
    endpoint_url = None
    if hostname:
        endpoint_url = f"{protocol}://{hostname}"

    # Validate required configuration
    if not bucket_name:
        console.print("[red]❌ Error: S3_BUCKET_NAME not set in environment[/red]")
        console.print("[dim]Please set S3_BUCKET_NAME in your .env file[/dim]")
        sys.exit(1)

    if not access_key or not secret_key:
        console.print("[red]❌ Error: S3 credentials not found in environment[/red]")
        console.print(
            "[dim]Please set S3_ACCESS_KEY_ID and S3_SECRET_KEY in your .env file[/dim]"
        )
        sys.exit(1)

    # Set AWS environment variables for boto3
    os.environ["AWS_ACCESS_KEY_ID"] = access_key
    os.environ["AWS_SECRET_ACCESS_KEY"] = secret_key

    # Display configuration
    console.print("\n")
    console.print(create_config_table())
    console.print("\n")

    # Initialize S3-compatible client
    deleter = S3Deleter(bucket_name, endpoint_url=endpoint_url)

    # Test connection
    console.print("[cyan]🔍 Testing storage connection...[/cyan]")
    if not deleter.test_connection():
        sys.exit(1)
    console.print("[green]✅ Successfully connected to storage[/green]\n")

    # List objects
    with console.status("[cyan]📋 Listing objects in bucket...[/cyan]"):
        objects = deleter.list_objects()

    if not objects:
        console.print(f"[green]✨ Bucket '{bucket_name}' is already empty![/green]")
        sys.exit(0)

    # Display object summary
    summary_table = Table(box=box.ROUNDED, style="cyan")
    summary_table.add_column("Bucket Summary", style="white")
    summary_table.add_column("Value", style="yellow")
    summary_table.add_row("Total Objects", f"{len(objects):,}")
    summary_table.add_row("Total Size", S3Deleter._format_size(deleter.total_size))

    console.print(summary_table)
    console.print("\n")

    # Confirmation
    if not yes:
        if not click.confirm(
            f"Are you sure you want to delete ALL {len(objects):,} objects from '{bucket_name}'?",
            default=False,
        ):
            console.print("[yellow]❌ Operation cancelled[/yellow]")
            sys.exit(0)

    # Countdown
    console.print("\n")
    if not big_countdown_with_cancel(10):
        console.print("[yellow]❌ Operation cancelled by user[/yellow]")
        sys.exit(0)

    # Delete objects
    console.print("\n[bold cyan]🗑️  Starting deletion process...[/bold cyan]\n")
    results = delete_objects_parallel(deleter)

    # Handle shutdown during deletion
    if shutdown_requested:
        console.print("\n[yellow]⚠️  Deletion interrupted by user[/yellow]")

    # Display results
    console.print("\n")
    console.print(create_results_table(results, deleter.total_size))

    # Display errors if any
    if results["errors"]:
        console.print("\n[red]❌ Errors encountered:[/red]")
        for _i, error in enumerate(results["errors"][:10]):  # Show first 10 errors
            console.print(f"  • {error}")
        if len(results["errors"]) > 10:
            console.print(
                f"  [dim]... and {len(results['errors']) - 10} more errors[/dim]"
            )

    # Verify bucket is empty
    if results["failed"] == 0 and not shutdown_requested:
        console.print("\n[cyan]🔍 Verifying bucket is empty...[/cyan]")
        if deleter.verify_empty():
            console.print(f"[green]✅ Bucket '{bucket_name}' is now empty![/green]")
        else:
            console.print(
                "[yellow]⚠️  Bucket may still contain objects. Please verify manually.[/yellow]"
            )

    # Final status
    console.print("\n")
    if results["failed"] > 0:
        console.print(f"[yellow]⚠️  Completed with {results['failed']} errors[/yellow]")
        sys.exit(1)
    elif shutdown_requested:
        console.print(
            "[yellow]⚠️  Operation interrupted but partially completed[/yellow]"
        )
        sys.exit(1)
    else:
        console.print("[green]✨ Deletion completed successfully![/green]")


if __name__ == "__main__":
    main()
