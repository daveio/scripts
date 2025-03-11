#!/usr/bin/env python3
import argparse
import email
import email.utils
import getpass
import imaplib
import json
import os
import sys
import time
from email.header import decode_header

from rich import print as rprint
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    TaskProgressColumn,
    TextColumn,
    TimeRemainingColumn,
)
from rich.text import Text


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
                charset = part.get_content_charset()
                if charset:
                    try:
                        decoded_payload = payload.decode(charset)
                    except UnicodeDecodeError:
                        decoded_payload = payload.decode("utf-8", errors="replace")
                else:
                    decoded_payload = payload.decode("utf-8", errors="replace")

                if content_type == "text/plain":
                    content["text"] += decoded_payload
                elif content_type == "text/html":
                    content["html"] += decoded_payload
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset()
            if charset:
                try:
                    decoded_payload = payload.decode(charset)
                except UnicodeDecodeError:
                    decoded_payload = payload.decode("utf-8", errors="replace")
            else:
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
    date_tuple = None
    if date_str:
        try:
            date_tuple = email.utils.parsedate_to_datetime(date_str)
            if date_tuple:
                headers["Date"] = date_tuple.isoformat()
        except UnicodeDecodeError:
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
    if " " in folder_name and not (
        folder_name.startswith('"') and folder_name.endswith('"')
    ):
        # Enclose in double quotes if it has spaces
        return f'"{folder_name}"'
    return folder_name


def main():
    """
    Main function for downloading Gmail emails and saving them as JSON
    documents.

    Parses command line arguments, authenticates with Google Workspace IMAP,
    and downloads emails to the specified directory.
    """
    parser = argparse.ArgumentParser(
        description="Download Google Workspace emails and save them as JSON"
    )
    parser.add_argument(
        "-o", "--output", default="emails", help="Output directory (default: emails)"
    )
    parser.add_argument(
        "-l", "--limit", type=int, help="Limit number of emails to download"
    )
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
    args = parser.parse_args()

    console = Console()

    # Show title
    title = Text("Google Workspace Email Downloader", style="bold cyan")
    console.print(Panel(title, border_style="cyan"))

    # Hardcode the email address for Google Apps
    email_address = "dave@dave.io"

    # Get password from environment variable or prompt
    password = os.environ.get("GMAIL_PASSWORD")
    if not password:
        console.print(
            "[yellow]GMAIL_PASSWORD environment variable not set, "
            "prompting for password[/yellow]"
        )
        password = getpass.getpass("Enter app password: ")

    # Create output directory if not just estimating size
    output_dir = args.output
    if not args.size_estimate:
        os.makedirs(output_dir, exist_ok=True)

    try:
        # Connect to Google Workspace IMAP server
        with console.status(
            "[bold green]Connecting to Google Workspace...[/bold green]"
        ):
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(email_address, password)

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
                        folder_name = (
                            folder_parts[3]
                            if len(folder_parts) > 3
                            else folder_parts[1]
                        )
                        available_folders.append(folder_name)
                        if "all mail" in folder_name.lower():
                            console.print(
                                f"[bold green]Found All Mail folder:[/bold green] "
                                f"[yellow]{folder_name}[/yellow]"
                            )
                            all_mail_folder = folder_name

            # Print all available folders
            for folder_name in sorted(available_folders):
                console.print(f"[blue]- {folder_name}[/blue]")

        # Select folder
        folder = args.folder
        console.print(
            f"[bold green]Opening folder:[/bold green] " f"[yellow]{folder}[/yellow]"
        )

        # Try different folder name variations
        folder_variations = [
            folder,  # Original name
            encode_imap_folder(folder),  # Properly encoded
            f'"{folder}"',  # Quoted
            folder.replace("[Gmail]", "[Google Mail]"),  # Alternative prefix
            f'"{folder.replace("[Gmail]", "[Google Mail]")}"',  # Alternative quoted
        ]

        status = "BAD"
        messages = None

        # Try each variation until one works
        for try_folder in folder_variations:
            console.print(
                f"[bold yellow]Trying folder format:[/bold yellow] "
                f"[yellow]{try_folder}[/yellow]"
            )
            try:
                status, messages = mail.select(try_folder)
                if status == "OK":
                    folder = try_folder
                    console.print(
                        f"[bold green]Successfully opened:[/bold green] "
                        f"[yellow]{folder}[/yellow]"
                    )
                    break
            except imaplib.IMAP4.error as e:
                console.print(f"[yellow]Failed with: {e}[/yellow]")
                continue

        # If the folder doesn't exist, try the detected All Mail folder
        if status != "OK" and all_mail_folder:
            console.print(
                f"[bold yellow]Folder not found, trying detected All Mail folder: "
                f"[yellow]{all_mail_folder}[/yellow]"
            )
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
                console.print(
                    f"[bold yellow]Trying alternate folder:[/bold yellow] "
                    f"[yellow]{alt_folder}[/yellow]"
                )
                status, messages = mail.select(alt_folder)
                if status == "OK":
                    folder = alt_folder
                    break

        if status != "OK":
            console.print(f"[bold red]Error opening folder: {folder}[/bold red]")
            sys.exit(1)

        # Get total email count
        messages = int(messages[0])
        console.print(
            f"[bold green]Found[/bold green] "
            f"[yellow]{messages}[/yellow] "
            f"[bold green]emails[/bold green]"
        )

        if args.limit and args.limit < messages:
            total_emails = args.limit
            console.print(
                f"[bold yellow]Limiting to {total_emails} emails[/bold yellow]"
            )
        else:
            total_emails = messages

        processed = 0

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
                for i in range(messages, messages - total_emails, -1):
                    if i <= 0:
                        break

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
                                        # If we can't parse the size, just skip
                                        pass
                        except Exception:
                            # Skip if response format is not as expected
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
                        f"Total size: [yellow]{format_size(total_size)}[/yellow]\n"
                        f"Average size: [yellow]{format_size(avg_size)}[/yellow]",
                        border_style="green",
                    )
                )
            else:
                console.print(
                    Panel(
                        "[bold red]No email size information available[/bold red]",
                        border_style="red",
                    )
                )

            # Log out and exit
            mail.close()
            mail.logout()
            return

        # Regular download mode (not size estimation)
        with Progress(
            TextColumn("[bold blue]{task.description}[/bold blue]"),
            BarColumn(bar_width=40),
            TaskProgressColumn(),
            TimeRemainingColumn(),
            console=console,
        ) as progress:
            download_task = progress.add_task("Downloading emails", total=total_emails)

            # Process emails from newest to oldest
            for i in range(messages, messages - total_emails, -1):
                if i <= 0:
                    break

                # Fetch email
                _, msg_data = mail.fetch(str(i).encode(), "(RFC822)")

                for response_part in msg_data:
                    try:
                        # Check if response_part is a tuple and has at least 2 elements
                        if isinstance(response_part, tuple) and len(response_part) > 1:
                            # Extract the email data
                            email_data = response_part[1]
                            msg = email.message_from_bytes(email_data)

                            # Get email ID (use Message-ID or create a unique ID)
                            email_id = msg.get("Message-ID", f"email_{i}").encode()
                            if not email_id:
                                email_id = f"email_{i}".encode()

                            # Create safe filename
                            safe_id = "".join(
                                c if c.isalnum() else "_" for c in email_id.decode()
                            )
                            filename = os.path.join(output_dir, f"{safe_id}.json")

                            # Convert email to JSON
                            email_json = email_to_json(msg, str(i).encode())

                            # Save JSON to file
                            with open(filename, "w", encoding="utf-8") as f:
                                json.dump(email_json, f, indent=2, ensure_ascii=False)

                            processed += 1

                            # Update progress bar
                            progress.update(download_task, advance=1)

                            # Add a small delay to avoid rate limiting
                            time.sleep(0.1)
                    except (IndexError, TypeError):
                        # Skip if response format is not as expected
                        continue

        # Logout
        mail.close()
        mail.logout()

        console.print(
            Panel(
                "[bold green]Successfully downloaded "
                f"{processed} emails to '{output_dir}' directory"
                "[/bold green]",
                border_style="green",
            )
        )

    except imaplib.IMAP4.error as e:
        console.print(f"[bold red]IMAP Error: {e}[/bold red]")
    except Exception as e:
        console.print(f"[bold red]Error: {e}[/bold red]")


if __name__ == "__main__":
    main()
