#!/usr/bin/env python3

"""
Gmail Downloader

This script downloads all emails from a Gmail account using IMAP and saves them as JSON files.
It includes features for handling connection drops, resuming downloads, and robust error recovery.

The script can handle various charset encoding issues and maintains state between runs to allow
resuming after interruptions. It also logs problematic emails rather than failing on them.

It supports multithreaded downloading to significantly speed up the process.

Usage:
    python gmail_downloader.py [options]

Options:
    -o, --output DIR       Output directory for JSON files (default: emails)
    -l, --limit NUM        Limit number of emails to download
    -f, --folder FOLDER    IMAP folder to download (default: [Gmail]/All Mail)
    -s, --size-estimate    Estimate total size without downloading emails
    -r, --resume           Resume from the last downloaded email
    -v, --verbose          Show more detailed progress information
    -t, --threads          Number of threads to use for downloading (def: 8)
    -e, --email            Gmail email address (default: from GMAIL_EMAIL env var)
"""

# TO USE THIS:
#
# 1. Edit line 849 and change the email address.
# 2. Set your Gmail app-specific password in an environment
#    variable, GMAIL_PASSWORD.
# 3. Wait. This script takes a long time. I spun up a GCP
#    virtual machine to run it, estimate is about two days.

import argparse
import concurrent.futures
import datetime
import email
import email.utils
import getpass
import imaplib
import json
import os
import pickle  # trunk-ignore(bandit/B403)
import re
import socket
import sys
import threading
import time
from email.header import decode_header

import psutil  # For memory usage stats
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeRemainingColumn,
)
from rich.table import Table
from rich.text import Text

# import datetime


# from rich.live import Live

# from rich import print as rprint

# Shared locks for thread safety
stats_lock = threading.Lock()
processed_ids_lock = threading.Lock()
state_lock = threading.Lock()
console_lock = threading.Lock()

# Maximum number of reconnection attempts
MAX_RECONNECT_ATTEMPTS = 5
# Time to wait between reconnection attempts (in seconds)
RECONNECT_DELAY = 5
# Save state every N emails
SAVE_STATE_INTERVAL = 50
# Display stats summary every N emails
STATS_INTERVAL = 100
# Display stats summary every N seconds
STATS_TIME_INTERVAL = 300  # 5 minutes


def decode_str(s):
    """
    Decode encoded email headers to Unicode strings.

    Args:
        s: The encoded string to decode

    Returns:
        Decoded string in UTF-8 format
    """
    if s is None:
        return ""
    decoded = decode_header(s)
    result = ""
    for content, charset in decoded:
        if isinstance(content, bytes):
            try:
                if charset:
                    result += content.decode(charset)
                else:
                    result += content.decode("utf-8", errors="replace")
            except UnicodeDecodeError:
                result += content.decode("utf-8", errors="replace")
        else:
            result += content
    return result


def clean_charset(charset):
    """
    Clean and normalize charset strings that might have additional metadata.

    Args:
        charset: The charset string that might contain metadata

    Returns:
        A clean charset string
    """
    if not charset:
        return None

    # Check for common patterns and clean them
    if ";" in charset:
        # Handle cases like "text/html; charset=utf-8;"
        match = re.search(r"charset=([^;]+)", charset)
        if match:
            return match.group(1).strip()

    if "," in charset:
        # Handle cases like "utf-8,text/html"
        parts = charset.split(",")
        for part in parts:
            if "text/" not in part:
                return part.strip()

    # Handle unknown-8bit by using utf-8 with error handling
    if "unknown" in charset.lower():
        return "utf-8"

    return charset


def get_email_content(msg):
    """
    Extract email content (text and html) from an email message.

    Args:
        msg: An email.message.Message object

    Returns:
        Dictionary containing text and html content
    """
    content = {"text": "", "html": ""}

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))

            # Skip attachments
            if "attachment" in content_disposition:
                continue

            payload = part.get_payload(decode=True)
            if payload:
                charset = clean_charset(part.get_content_charset())
                try:
                    if charset:
                        try:
                            decoded_payload = payload.decode(charset)
                        except (UnicodeDecodeError, LookupError):
                            # Handle unknown encoding error
                            decoded_payload = payload.decode("utf-8", errors="replace")
                    else:
                        decoded_payload = payload.decode("utf-8", errors="replace")
                except (UnicodeDecodeError, LookupError, ValueError):
                    # Fallback for any other decoding issues
                    decoded_payload = payload.decode("utf-8", errors="replace")

                if content_type == "text/plain":
                    content["text"] += decoded_payload
                elif content_type == "text/html":
                    content["html"] += decoded_payload
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = clean_charset(msg.get_content_charset())
            try:
                if charset:
                    try:
                        decoded_payload = payload.decode(charset)
                    except (UnicodeDecodeError, LookupError):
                        # Handle unknown encoding error
                        decoded_payload = payload.decode("utf-8", errors="replace")
                else:
                    decoded_payload = payload.decode("utf-8", errors="replace")
            except (UnicodeDecodeError, LookupError, ValueError):
                # Fallback for any other decoding issues
                decoded_payload = payload.decode("utf-8", errors="replace")

            if msg.get_content_type() == "text/plain":
                content["text"] = decoded_payload
            elif msg.get_content_type() == "text/html":
                content["html"] = decoded_payload

    return content


def get_attachments_info(msg):
    """
    Get information about email attachments.

    Args:
        msg: An email.message.Message object

    Returns:
        List of dictionaries containing attachment information
    """
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            content_disposition = str(part.get("Content-Disposition"))

            if "attachment" in content_disposition:
                filename = part.get_filename()
                if filename:
                    filename = decode_str(filename)

                    attachments.append(
                        {
                            "filename": filename,
                            "content_type": part.get_content_type(),
                            "size": len(part.get_payload(decode=True) or b""),
                        }
                    )

    return attachments


def email_to_json(msg, email_id):
    """
    Convert email message to JSON format.

    Args:
        msg: An email.message.Message object
        email_id: Unique email identifier

    Returns:
        Dictionary containing email data in a format suitable for JSON
        serialization
    """
    headers = {}
    for header in [
        "From",
        "To",
        "Cc",
        "Bcc",
        "Subject",
        "Date",
        "Message-ID",
        "In-Reply-To",
        "References",
    ]:
        value = msg.get(header)
        if value:
            headers[header] = decode_str(value)

    # Parse date if available
    date_str = headers.get("Date")
    if date_str:
        try:
            # Parse the date from email headers
            date_tuple = email.utils.parsedate_to_datetime(date_str)
            if date_tuple:
                # Convert to string in a format safe for JSON
                headers["Date"] = date_tuple.strftime("%Y-%m-%d %H:%M:%S %z")
        except (UnicodeDecodeError, ValueError, TypeError):
            # Keep the original string if parsing fails
            pass

    # Get content
    content = get_email_content(msg)

    # Get attachments
    attachments = get_attachments_info(msg)

    email_data = {
        "id": email_id.decode(),
        "headers": headers,
        "content": content,
        "attachments": attachments,
    }

    return email_data


def format_size(size_bytes):
    """
    Format bytes to human-readable sizes.

    Args:
        size_bytes: Size in bytes

    Returns:
        String with formatted size (KB, MB, GB)
    """
    # Define unit prefixes
    units = ["B", "KB", "MB", "GB", "TB"]

    # Special case for 0 bytes
    if size_bytes == 0:
        return "0 B"

    # Calculate appropriate unit
    unit_index = 0
    size = float(size_bytes)
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1

    # Return formatted size with unit
    return f"{size:.2f} {units[unit_index]}"


def encode_imap_folder(folder_name):
    """
    Properly encode folder names for IMAP commands.

    Some IMAP servers (like Gmail) require specific encoding
    for folder names with special characters or spaces.

    Args:
        folder_name: The folder name to encode

    Returns:
        Properly encoded folder name for IMAP commands
    """
    # Replace spaces with %20 if not already enclosed in quotes
    if " " in folder_name and not (folder_name.startswith('"') and folder_name.endswith('"')):
        # Enclose in double quotes if it has spaces
        return f'"{folder_name}"'
    return folder_name


def connect_to_imap(email_address, password, console):
    """
    Connect to the Gmail IMAP server with retry logic.

    Args:
        email_address: The Gmail address to connect with
        password: The app password
        console: Rich console for output

    Returns:
        IMAP connection object or None if connection fails after retries
    """
    for attempt in range(MAX_RECONNECT_ATTEMPTS):
        try:
            console.print(f"[yellow]IMAP connection attempt {attempt + 1}/{MAX_RECONNECT_ATTEMPTS}[/yellow]")
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(email_address, password)
            console.print("[green]Successfully connected to Gmail IMAP server[/green]")
            return mail
        except imaplib.IMAP4.error as e:
            console.print(f"[bold red]IMAP Error: {e}[/bold red]")
            if attempt < MAX_RECONNECT_ATTEMPTS - 1:
                console.print(f"[yellow]Retrying in {RECONNECT_DELAY} seconds...[/yellow]")
                time.sleep(RECONNECT_DELAY)
            else:
                console.print("[bold red]Failed to connect after " f"{MAX_RECONNECT_ATTEMPTS} attempts[/bold red]")
                return None
        except (ConnectionError, TimeoutError, socket.error) as e:
            console.print(f"[bold red]Connection Error: {e}[/bold red]")
            if attempt < MAX_RECONNECT_ATTEMPTS - 1:
                console.print(f"[yellow]Retrying in {RECONNECT_DELAY} seconds...[/yellow]")
                time.sleep(RECONNECT_DELAY)
            else:
                console.print("[bold red]Failed to connect after " f"{MAX_RECONNECT_ATTEMPTS} attempts[/bold red]")
                return None
    return None


def load_state(output_dir):
    """
    Load the download state if it exists.

    Args:
        output_dir: Directory where the state file is stored

    Returns:
        A tuple of (processed_ids, last_processed_index)
    """
    state_file = os.path.join(output_dir, "download_state.pkl")
    if os.path.exists(state_file):
        try:
            with open(state_file, "rb") as f:
                # trunk-ignore(bandit/B301)
                state = pickle.load(f)
                return state.get("processed_ids", set()), state.get("last_index", 0)
        except (IOError, PermissionError) as file_err:
            print(f"File error loading state: {file_err}")
            return set(), 0
        except (pickle.UnpicklingError, ValueError, EOFError) as pickle_err:
            print(f"Error unpickling state file: {pickle_err}")
            return set(), 0
        except (AttributeError, KeyError, TypeError) as data_err:
            print(f"Unexpected error in state data format: {data_err}")
            return set(), 0
    return set(), 0


def save_state(output_dir, processed_ids, last_index):
    """
    Save the current download state.

    Args:
        output_dir: Directory to save the state file
        processed_ids: Set of already processed email IDs
        last_index: Last email index that was processed
    """
    state_file = os.path.join(output_dir, "download_state.pkl")
    state = {
        "processed_ids": processed_ids,
        "last_index": last_index,
        "timestamp": time.time(),
    }
    try:
        with open(state_file, "wb") as f:
            pickle.dump(state, f)
    except (IOError, PermissionError) as file_err:
        print(f"File error saving state: {file_err}")
    except (pickle.PickleError, TypeError) as pickle_err:
        print(f"Pickle serialization error: {pickle_err}")
    except AttributeError as e:
        print(f"System or attribute error saving state: {e}")


def format_time_delta(seconds):
    """
    Format a time delta in seconds to a human-readable string.

    Args:
        seconds: Number of seconds

    Returns:
        Formatted string like "2h 30m 45s"
    """
    if seconds < 0:
        return "unknown"

    hours, remainder = divmod(int(seconds), 3600)
    minutes, seconds = divmod(remainder, 60)

    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    if minutes > 0:
        return f"{minutes}m {seconds}s"
    return f"{seconds}s"


def worker_process_emails(
    email_ids,
    email_address,
    password,
    folder,
    output_dir,
    processed_ids,
    progress,
    download_task,
    console,
    args,
    shared_stats,
    display_stats_func,
):
    """
    Worker function for processing a batch of emails in a separate thread.

    Args:
        email_ids: List of email IDs to process
        email_address: Gmail account email address
        password: Gmail app password
        folder: IMAP folder name
        output_dir: Directory to save emails
        processed_ids: Set of already processed email IDs
        progress: Rich progress bar
        download_task: Task ID for the progress bar
        console: Rich console for output
        args: Command-line arguments
        shared_stats: Dictionary of shared statistics
        display_stats_func: Function to display statistics
    """
    # Thread-local variables
    thread_processed = 0
    thread_skipped = 0
    thread_failed = 0
    thread_bytes_downloaded = 0

    # Connect to IMAP server
    with console_lock:
        console.print("[blue]Thread connecting to IMAP server...[/blue]")

    mail = connect_to_imap(email_address, password, console)
    if not mail:
        with console_lock:
            console.print("[bold red]Thread failed to connect to IMAP server[/bold red]")
        return

    # Select folder
    status, _ = mail.select(folder)
    if status != "OK":
        with console_lock:
            console.print(f"[bold red]Thread error opening folder: {folder}[/bold red]")
        return

    # Process emails
    for i in email_ids:
        if i <= 0:
            break

        # Check if already processed
        with processed_ids_lock:
            already_processed = False
            # Check using a pseudo email ID since we don't have the real one yet
            pseudo_id = f"email_{i}"
            if pseudo_id in processed_ids:
                already_processed = True

        if already_processed:
            with stats_lock:
                shared_stats["skipped_emails"] += 1
                thread_skipped += 1
            progress.update(download_task, advance=1)
            continue

        # Track if this email should be skipped
        skip_email = False
        current_email_size = 0

        # Check connection
        try:
            mail.noop()
        except (imaplib.IMAP4.error, OSError, EOFError):
            with console_lock:
                console.print("[yellow]Thread lost connection. Reconnecting...[/yellow]")
            mail = connect_to_imap(email_address, password, console)
            if mail:
                mail.select(folder)
            else:
                with console_lock:
                    console.print("[bold red]Thread could not reconnect. Exiting.[/bold red]")
                break

        # Process email
        try:
            if args.verbose:
                with console_lock:
                    console.print(f"[dim]Thread processing email {i}...[/dim]")

            # Fetch email
            try:
                _, msg_data = mail.fetch(str(i).encode(), "(RFC822)")
            except imaplib.IMAP4.error as imap_err:
                # Handle specific IMAP errors
                with console_lock:
                    console.print(f"[bold red]Thread IMAP error fetching email {i}: {imap_err}[/bold red]")
                skip_email = True
                with stats_lock:
                    shared_stats["failed_emails"] += 1
                    thread_failed += 1
                continue
            except (ConnectionError, TimeoutError) as conn_err:
                # Handle connection-related errors
                with console_lock:
                    console.print(f"[bold red]Thread connection error fetching email {i}: {conn_err}[/bold red]")
                skip_email = True
                with stats_lock:
                    shared_stats["failed_emails"] += 1
                    thread_failed += 1
                continue
            except (ValueError, TypeError, RuntimeError) as e:
                # Fallback for unexpected errors
                with console_lock:
                    console.print(f"[bold red]Thread failed to fetch email {i}: {e}[/bold red]")
                skip_email = True
                with stats_lock:
                    shared_stats["failed_emails"] += 1
                    thread_failed += 1
                continue

            if skip_email or not msg_data:
                with console_lock:
                    console.print(f"[yellow]Thread skipping email {i} due to fetch issues[/yellow]")
                with stats_lock:
                    shared_stats["skipped_emails"] += 1
                    thread_skipped += 1
                progress.update(download_task, advance=1)
                continue

            # Track if we successfully processed this email
            processed_this_email = False

            for response_part in msg_data:
                try:
                    # Check if response_part is the type we expect
                    if not isinstance(response_part, tuple) or len(response_part) <= 1:
                        continue

                    # Convert response_part to a list for safer handling
                    resp_list = list(response_part)
                    if len(resp_list) <= 1:
                        continue

                    # Now we can safely access the email data
                    email_data = resp_list[1]

                    # Track size
                    current_email_size = len(email_data)
                    with stats_lock:
                        shared_stats["total_bytes_downloaded"] += current_email_size
                        thread_bytes_downloaded += current_email_size

                    msg = email.message_from_bytes(email_data)

                    # Get email ID
                    msg_id = msg.get("Message-ID")
                    email_id = (msg_id or f"email_{i}").encode()
                    id_str = email_id.decode()

                    # Check if already processed
                    with processed_ids_lock:
                        if id_str in processed_ids:
                            if args.verbose:
                                with console_lock:
                                    console.print(f"[blue]Thread skipping already processed email {i}[/blue]")
                            processed_this_email = True
                            with stats_lock:
                                shared_stats["skipped_emails"] += 1
                                thread_skipped += 1
                            break

                    # Get date for info
                    date_str = msg.get("Date", "Unknown date")
                    if args.verbose:
                        with console_lock:
                            console.print(f"[dim]Thread email {i} dated: {date_str}[/dim]")

                    # Create safe filename
                    safe_id = "".join(c if c.isalnum() else "_" for c in id_str)
                    filename = os.path.join(output_dir, f"{safe_id}.json")

                    # Convert and save
                    try:
                        # Convert email to JSON
                        email_json = email_to_json(msg, str(i).encode())

                        # Trim filename if too long
                        filename = filename[:240] if len(filename) > 240 else filename

                        # Save JSON
                        with open(filename, "w", encoding="utf-8") as f:
                            json.dump(email_json, f, indent=2, ensure_ascii=False)

                        # Mark as processed
                        with processed_ids_lock:
                            processed_ids.add(id_str)

                        with stats_lock:
                            shared_stats["processed"] += 1
                            thread_processed += 1
                            shared_stats["processed_since_last_stats"] += 1

                        processed_this_email = True

                        # Save state periodically
                        if (shared_stats["processed"] + shared_stats["skipped_emails"]) % SAVE_STATE_INTERVAL == 0:
                            with state_lock:
                                save_state(output_dir, processed_ids, i)
                            if args.verbose:
                                with console_lock:
                                    console.print(f"[green]Thread saved state at email {i}.[/green]")

                        # Show processing time if verbose
                        if args.verbose:
                            with console_lock:
                                console.print(
                                    f"[dim]Thread processed email {i} ({format_size(current_email_size)})[/dim]"
                                )

                    except (IOError, PermissionError) as file_err:
                        with console_lock:
                            console.print(f"[yellow]Thread file error processing {i}: {file_err}[/yellow]")
                        continue
                    except json.JSONDecodeError as json_err:
                        with console_lock:
                            console.print(f"[yellow]Thread JSON error processing {i}: {json_err}[/yellow]")
                        continue
                    except (UnicodeError, TypeError, ValueError) as data_err:
                        with console_lock:
                            console.print(f"[yellow]Thread data error processing {i}: {data_err}[/yellow]")
                        continue

                    # Update progress
                    progress.update(download_task, advance=1)

                    # Display stats if needed
                    if shared_stats["processed"] % STATS_INTERVAL == 0:
                        with stats_lock:
                            display_stats_func(False)

                except (IndexError, TypeError) as e:
                    with console_lock:
                        console.print(f"[yellow]Thread error with format {i}: {e}[/yellow]")
                    continue
                except (KeyError, AttributeError, ValueError) as e:
                    with console_lock:
                        console.print(f"[yellow]Thread unexpected error with email {i}: {e}[/yellow]")
                    continue

            # Handle unprocessed email
            if not processed_this_email:
                with console_lock:
                    console.print(f"[yellow]Thread email {i} could not be processed.[/yellow]")
                with stats_lock:
                    shared_stats["failed_emails"] += 1
                    thread_failed += 1

                try:
                    with open(
                        os.path.join(output_dir, "problematic_emails.txt"),
                        "a",
                        encoding="utf-8",
                    ) as f:
                        f.write(f"{i}\n")
                except IOError as io_err:
                    # Log specific IO errors when writing to problematic_emails.txt
                    with console_lock:
                        console.print(f"[red]Failed to log problematic email {i}: {io_err}[/red]")
                except UnicodeError:
                    # Fall back to minimal error handling as a last resort
                    pass

        except imaplib.IMAP4.error as e:
            with console_lock:
                console.print(f"[bold red]Thread IMAP Error at email {i}: {e}[/bold red]")
            # Try to reconnect
            mail = connect_to_imap(email_address, password, console)
            if mail:
                mail.select(folder)
                continue

            # If reconnect failed
            with console_lock:
                console.print("[bold red]Thread could not reconnect to IMAP.[/bold red]")
            break
        except (ConnectionError, TimeoutError, OSError) as e:
            with console_lock:
                console.print(f"[bold red]Thread connection error at email {i}: {e}[/bold red]")
            with stats_lock:
                shared_stats["failed_emails"] += 1
                thread_failed += 1
            try:
                with open(
                    os.path.join(output_dir, "problematic_emails.txt"),
                    "a",
                    encoding="utf-8",
                ) as f:
                    f.write(f"{i} - {str(e)}\n")
            except IOError as io_err:
                # Log specific IO errors when writing to problematic_emails.txt
                with console_lock:
                    console.print(f"[red]Failed to log error for email {i}: {io_err}[/red]")
            except UnicodeError:
                # Fall back to minimal error handling as a last resort
                pass
            continue

    # Cleanup
    try:
        mail.close()
        mail.logout()
    except (imaplib.IMAP4.error, ConnectionError, OSError) as e:
        with console_lock:
            console.print(f"[yellow]Error during IMAP cleanup: {e}[/yellow]")

    with console_lock:
        console.print(
            f"[green]Thread completed processing {thread_processed} emails "
            f"(skipped: {thread_skipped}, failed: {thread_failed})[/green]"
        )


def main() -> None:
    """
    Main function for downloading Gmail emails and saving them as JSON
    documents.

    Parses command line arguments, authenticates with Google Workspace IMAP,
    and downloads emails to the specified directory.
    """
    parser = argparse.ArgumentParser(description="Download Google Workspace emails and save them as JSON")
    parser.add_argument("-o", "--output", default="emails", help="Output directory (default: emails)")
    parser.add_argument("-l", "--limit", type=int, help="Limit number of emails to download")
    parser.add_argument(
        "-f",
        "--folder",
        default="[Gmail]/All Mail",
        help="IMAP folder to download (default: [Gmail]/All Mail)",
    )
    parser.add_argument(
        "-s",
        "--size-estimate",
        action="store_true",
        help="Estimate total size without downloading emails",
    )
    parser.add_argument(
        "-r",
        "--resume",
        action="store_true",
        help="Resume from the last downloaded email",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Show more detailed progress information",
    )
    parser.add_argument(
        "-t",
        "--threads",
        type=int,
        default=8,
        help="Number of threads to use for downloading (default: 8)",
    )
    parser.add_argument(
        "-e",
        "--email",
        default=os.environ.get("GMAIL_EMAIL", ""),
        help="Gmail email address (default: from GMAIL_EMAIL env var)",
    )
    args = parser.parse_args()

    console = Console()

    # Show title
    title = Text("Google Workspace Email Downloader", style="bold cyan")
    console.print(Panel(title, border_style="cyan"))

    # Get the email address from argument or prompt
    email_address = args.email
    if not email_address:
        console.print("[yellow]Email address not provided, prompting for input[/yellow]")
        email_address = input("Enter Gmail address: ")

    # Get password from environment variable or prompt
    password = os.environ.get("GMAIL_PASSWORD")
    if not password:
        console.print("[yellow]GMAIL_PASSWORD environment variable not set, prompting for password[/yellow]")
        password = getpass.getpass("Enter app password: ")

    # Create output directory if not just estimating size
    output_dir = args.output
    if not args.size_estimate:
        os.makedirs(output_dir, exist_ok=True)

    # Load state if resuming
    processed_ids = set()
    last_processed_index = 0
    if args.resume:
        processed_ids, last_processed_index = load_state(output_dir)
        if processed_ids:
            console.print(f"[green]Resuming download. {len(processed_ids)} emails " f"already processed.[/green]")
        else:
            console.print("[yellow]No saved state found. Starting from the beginning.[/yellow]")

    try:
        # Connect to Google Workspace IMAP server
        with console.status("[bold green]Connecting to Google Workspace...[/bold green]"):
            mail = connect_to_imap(email_address, password, console)
            if not mail:
                console.print("[bold red]Failed to connect to IMAP server[/bold red]")
                sys.exit(1)

        # List available folders
        console.print("[bold blue]Available folders:[/bold blue]")
        status, folder_list = mail.list()
        all_mail_folder = None
        if status == "OK":
            available_folders = []
            for folder_info in folder_list:
                if folder_info:
                    # Decode and extract folder name
                    decoded_info = folder_info.decode("utf-8")
                    folder_parts = decoded_info.split('"')
                    if len(folder_parts) >= 3:
                        folder_name = folder_parts[3] if len(folder_parts) > 3 else folder_parts[1]
                        available_folders.append(folder_name)
                        if "all mail" in folder_name.lower():
                            console.print(
                                f"[bold green]All Mail folder:[/bold green] " f"[yellow]{folder_name}[/yellow]"
                            )
                            all_mail_folder = folder_name

            # Print all available folders
            for folder_name in sorted(available_folders):
                console.print(f"[blue]- {folder_name}[/blue]")

        # Select folder
        folder = args.folder
        console.print(f"[bold green]Opening [/bold green]" f"[yellow]{folder}[/yellow]")

        # Try different folder name variations
        folder_variations = [
            folder,  # Original name
            encode_imap_folder(folder),  # Properly encoded
            f'"{folder}"',  # Quoted
            folder.replace("[Gmail]", "[Google Mail]"),  # Alternative prefix
            # Alternative quoted
            f'"{folder.replace("[Gmail]", "[Google Mail]")}"',
        ]

        status = "BAD"
        messages = None

        # Try each variation until one works
        for try_folder in folder_variations:
            console.print(f"[bold yellow]Trying folder format:[/bold yellow] " f"[yellow]{try_folder}[/yellow]")
            try:
                status, messages = mail.select(try_folder)
                if status == "OK":
                    folder = try_folder
                    console.print(f"[bold green]Successfully opened:[/bold green] " f"[yellow]{folder}[/yellow]")
                    break
            except imaplib.IMAP4.error as e:
                console.print(f"[yellow]Failed with: {e}[/yellow]")
                continue

        # If the folder doesn't exist, try the detected All Mail folder
        if status != "OK" and all_mail_folder:
            console.print(f"[bold yellow]Trying detected All Mail folder: " f"[yellow]{all_mail_folder}[/yellow]")
            try:
                encoded_folder = encode_imap_folder(all_mail_folder)
                status, messages = mail.select(encoded_folder)
                if status == "OK":
                    folder = encoded_folder
            except imaplib.IMAP4.error:
                # Try without encoding
                try:
                    status, messages = mail.select(all_mail_folder)
                    if status == "OK":
                        folder = all_mail_folder
                except imaplib.IMAP4.error:
                    pass

        # If still not successful, try alternate names for "All Mail"
        if status != "OK":
            alternate_folders = [
                "INBOX",  # Fallback to inbox if all else fails
                "[Gmail]/&AMMAPwA0ACM-",  # UTF-7 encoding for All Mail
                "&AAIAJgBF-all",  # Another common variant
                "INBOX/all",
                "All Mail",
                "AllMail",
            ]

            for alt_folder in alternate_folders:
                console.print(f"[bold yellow]Trying alternate folder:[/bold yellow] " f"[yellow]{alt_folder}[/yellow]")
                try:
                    status, messages = mail.select(alt_folder)
                    if status == "OK":
                        folder = alt_folder
                        break
                except imaplib.IMAP4.error:
                    continue

        if status != "OK":
            console.print(f"[bold red]Error opening folder: {folder}[/bold red]")
            sys.exit(1)

        # Get total email count
        if messages and len(messages) > 0:
            messages_count = int(messages[0])
        else:
            console.print("[bold red]Could not determine message count[/bold red]")
            sys.exit(1)

        console.print(
            f"[bold green]Found[/bold green] " f"[yellow]{messages_count}[/yellow] " f"[bold green]emails[/bold green]"
        )

        if args.limit and args.limit < messages_count:
            total_emails = args.limit
            console.print(f"[bold yellow]Limiting to {total_emails} emails[/bold yellow]")
        else:
            total_emails = messages_count

        # processed = 0

        # Size estimation mode
        if args.size_estimate:
            console.print("[bold blue]Estimating email sizes...[/bold blue]")

            total_size = 0
            email_count = 0

            with Progress(
                TextColumn("[bold blue]{task.description}[/bold blue]"),
                BarColumn(bar_width=40),
                TaskProgressColumn(),
                TimeRemainingColumn(),
                console=console,
            ) as progress:
                size_task = progress.add_task("Calculating size", total=total_emails)

                # Process emails to estimate size
                for i in range(messages_count, messages_count - total_emails, -1):
                    if i <= 0:
                        break

                    try:
                        # Fetch email size using FETCH with RFC822.SIZE
                        _, msg_data = mail.fetch(str(i).encode(), "(RFC822.SIZE)")

                        for response_part in msg_data:
                            try:
                                # Response format is typically like
                                # b'* 1 FETCH (RFC822.SIZE 2539)'
                                if isinstance(response_part, bytes):
                                    response_str = response_part.decode("utf-8")
                                    if "RFC822.SIZE" in response_str:
                                        # Extract the size value
                                        size_start = response_str.find("RFC822.SIZE") + 11
                                        size_end = response_str.find(")", size_start)
                                        if size_end == -1:
                                            size_end = len(response_str)
                                        size_str = response_str[size_start:size_end].strip()
                                        try:
                                            size = int(size_str)
                                            total_size += size
                                            email_count += 1
                                        except ValueError:
                                            # If we can't parse the size, skip
                                            pass
                            except UnicodeDecodeError:
                                # Skip if response can't be decoded
                                continue
                            except (IndexError, TypeError):
                                # Skip if response format is not as expected
                                continue
                    except imaplib.IMAP4.error as e:
                        console.print(f"[bold red]IMAP Error during size estimation: {e}[/bold red]")
                        # Try to reconnect
                        mail = connect_to_imap(email_address, password, console)
                        if mail:
                            # Reselect the folder
                            mail.select(folder)
                        else:
                            console.print("[bold red]Could not reconnect to IMAP server. Aborting.[/bold red]")
                            break
                    except (ConnectionError, TimeoutError) as conn_err:
                        console.print(f"[bold red]Connection error during size estimation: {conn_err}[/bold red]")
                        # Try to reconnect
                        mail = connect_to_imap(email_address, password, console)
                        if mail:
                            # Reselect the folder
                            mail.select(folder)
                        else:
                            console.print("[bold red]Could not reconnect after connection error. Aborting.[/bold red]")
                            break
                    except (ValueError, TypeError, IndexError) as e:
                        console.print(f"[bold red]Data error during size estimation: {e}[/bold red]")
                        continue

                    # Update progress bar
                    progress.update(size_task, advance=1)

                    # Add a small delay to avoid rate limiting
                    time.sleep(0.05)

            # Display size results
            if email_count > 0:
                avg_size = total_size / email_count
                console.print(
                    Panel(
                        f"[bold green]Size Estimation Results:[/bold green]\n"
                        f"Total emails: [yellow]{email_count}[/yellow]\n"
                        f"Total: [yellow]{format_size(total_size)}[/yellow]\n"
                        f"Average: [yellow]{format_size(avg_size)}[/yellow]",
                        border_style="green",
                    )
                )
            else:
                console.print(
                    Panel(
                        "[bold red]No email size info available[/bold red]",
                        border_style="red",
                    )
                )

            # Log out and exit
            mail.close()
            mail.logout()
            return

        # Regular download mode (not size estimation)
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}[/bold blue]"),
            BarColumn(bar_width=40),
            TaskProgressColumn(),
            TimeRemainingColumn(),
            console=console,
        ) as progress:
            # Adjust total for progress bar based on already processed emails
            remaining = total_emails - len(processed_ids)
            download_task = progress.add_task("Downloading emails", total=remaining)

            # Start from last processed index if resuming
            start_index = last_processed_index if args.resume and last_processed_index > 0 else messages_count
            end_index = max(1, messages_count - total_emails + 1)

            console.print(f"[green]Starting download from email index: {start_index}[/green]")

            # Track download statistics
            start_time = time.time()
            last_stats_time = start_time
            processed_since_last_stats = 0
            # total_bytes_downloaded = 0
            # failed_emails = 0
            # skipped_emails = 0

            # Create a function to display current stats
            def display_stats(force=False):
                nonlocal last_stats_time, processed_since_last_stats

                current_time = time.time()
                elapsed = current_time - start_time
                elapsed_since_last = current_time - last_stats_time

                # Only show stats if enough time has passed or forced
                if (
                    force
                    or shared_stats["processed"] % STATS_INTERVAL == 0
                    or elapsed_since_last >= STATS_TIME_INTERVAL
                ):

                    # Calculate download rate
                    emails_per_minute = shared_stats["processed"] / (elapsed / 60) if elapsed > 0 else 0
                    recent_emails_per_minute = (
                        shared_stats["processed_since_last_stats"] / (elapsed_since_last / 60)
                        if elapsed_since_last > 0
                        else 0
                    )

                    # Calculate estimated time remaining
                    if emails_per_minute > 0:
                        remaining_emails = total_emails - shared_stats["processed"] - shared_stats["skipped_emails"]
                        est_seconds_remaining = (remaining_emails / emails_per_minute) * 60
                        time_remaining = format_time_delta(est_seconds_remaining)
                    else:
                        time_remaining = "calculating..."

                    # Get memory usage
                    mem_usage = psutil.Process().memory_info().rss / (1024 * 1024)  # MB

                    # Calculate percentage complete
                    percent_complete = (
                        (shared_stats["processed"] + shared_stats["skipped_emails"]) / total_emails * 100
                        if total_emails > 0
                        else 0
                    )

                    # Create and display stats table
                    table = Table(
                        title="Download Progress Statistics",
                        caption=f"Last updated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    )

                    table.add_column("Stat", style="cyan")
                    table.add_column("Value", style="green")

                    table.add_row("Emails Downloaded", f"{shared_stats['processed']:,}")
                    table.add_row("Emails Skipped", f"{shared_stats['skipped_emails']:,}")
                    table.add_row("Failed Emails", f"{shared_stats['failed_emails']:,}")
                    table.add_row(
                        "Total Processed",
                        f"{(shared_stats['processed'] + shared_stats['skipped_emails']):,} of {total_emails:,}",
                    )
                    table.add_row("Completion", f"{percent_complete:.1f}%")
                    table.add_row("Download Rate", f"{emails_per_minute:.1f} emails/min")
                    table.add_row("Recent Rate", f"{recent_emails_per_minute:.1f} emails/min")
                    if shared_stats["total_bytes_downloaded"] > 0:
                        table.add_row(
                            "Data Downloaded",
                            format_size(shared_stats["total_bytes_downloaded"]),
                        )
                    table.add_row("Memory Usage", f"{mem_usage:.1f} MB")
                    table.add_row("Elapsed Time", format_time_delta(elapsed))
                    table.add_row("Est. Time Remaining", time_remaining)
                    table.add_row("Active Threads", f"{args.threads}")

                    console.print(table)

                    # Reset counters for next interval
                    last_stats_time = current_time
                    shared_stats["processed_since_last_stats"] = 0

            # Initialize shared stats dictionary used by all threads
            shared_stats = {
                "processed": 0,
                "processed_since_last_stats": 0,
                "skipped_emails": 0,
                "failed_emails": 0,
                "total_bytes_downloaded": 0,
            }

            # Determine the number of threads to use
            num_threads = args.threads
            if num_threads <= 0:
                num_threads = 1
            elif num_threads > 32:
                console.print("[yellow]Warning: Limiting threads to 32 to avoid rate limiting[/yellow]")
                num_threads = 32

            console.print(f"[bold green]Using {num_threads} threads for downloading[/bold green]")

            # Divide work among threads
            # start_index is already set above
            end_index = max(1, messages_count - total_emails + 1)

            # Create batches of email IDs for each thread
            email_batches = []
            total_emails_to_process = start_index - end_index + 1
            batch_size = max(1, total_emails_to_process // num_threads)

            console.print(f"[blue]Dividing {total_emails_to_process} emails into {num_threads} batches[/blue]")

            for thread_id in range(num_threads):
                batch_start = start_index - (thread_id * batch_size)
                if thread_id == num_threads - 1:  # Last thread gets remaining emails
                    batch_end = end_index
                else:
                    batch_end = max(end_index, batch_start - batch_size + 1)

                # Generate list of email IDs for this batch (in reverse order, newest to oldest)
                batch_ids = list(range(batch_start, batch_end - 1, -1))
                if batch_ids:
                    email_batches.append(batch_ids)
                    console.print(f"[dim]Thread {thread_id+1}: Processing emails {batch_start} to {batch_end}[/dim]")

            # Launch thread pool
            with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
                # Submit tasks to the executor
                futures = []
                for batch in email_batches:
                    if batch:  # Only process non-empty batches
                        future = executor.submit(
                            worker_process_emails,
                            batch,
                            email_address,
                            password,
                            folder,
                            output_dir,
                            processed_ids,
                            progress,
                            download_task,
                            console,
                            args,
                            shared_stats,
                            display_stats,
                        )
                        futures.append(future)

                # Wait for all futures to complete
                for future in concurrent.futures.as_completed(futures):
                    try:
                        # Get any results if the worker returns something
                        future.result()
                    except (ConnectionError, OSError) as e:
                        console.print(f"[bold red]Thread connection error: {e}[/bold red]")
                    except RuntimeError as e:
                        console.print(f"[bold red]Thread runtime error: {e}[/bold red]")
                    except ValueError as e:
                        console.print(f"[bold red]Thread value error: {e}[/bold red]")

            # Remove the second progress bar that was causing conflicts
            # Final display of stats
            display_stats(force=True)

            # Calculate overall performance
            total_time = time.time() - start_time
            emails_per_minute = shared_stats["processed"] / (total_time / 60) if total_time > 0 else 0

            # Show final download summary
            summary_table = Table(title="Download Summary")
            summary_table.add_column("Metric", style="cyan")
            summary_table.add_column("Value", style="green")

            summary_table.add_row("Total Emails Downloaded", f"{shared_stats['processed']:,}")
            summary_table.add_row("Total Emails Skipped", f"{shared_stats['skipped_emails']:,}")
            summary_table.add_row("Total Failed Emails", f"{shared_stats['failed_emails']:,}")
            summary_table.add_row(
                "Total Data Downloaded",
                format_size(shared_stats["total_bytes_downloaded"]),
            )
            summary_table.add_row("Average Download Rate", f"{emails_per_minute:.2f} emails/min")
            summary_table.add_row("Total Download Time", format_time_delta(total_time))
            summary_table.add_row("Threads Used", f"{num_threads}")

            console.print(summary_table)

        # Logout
        try:
            mail.close()
            mail.logout()
        except (imaplib.IMAP4.error, ConnectionError, OSError) as e:
            console.print(f"[yellow]Error during IMAP cleanup: {e}[/yellow]")

        console.print(
            Panel(
                "[bold green]Successfully downloaded "
                f"{shared_stats['processed']} emails to '{output_dir}' directory"
                "[/bold green]",
                border_style="green",
            )
        )

    except imaplib.IMAP4.error as e:
        console.print(f"[bold red]IMAP Error: {e}[/bold red]")
        # Save state before exiting
        if not args.size_estimate:
            save_state(output_dir, processed_ids, last_processed_index)
    except (ConnectionError, TimeoutError, OSError) as e:
        console.print(f"[bold red]Connection Error: {e}[/bold red]")
        # Save state before exiting
        if not args.size_estimate:
            save_state(output_dir, processed_ids, last_processed_index)


if __name__ == "__main__":
    main()
