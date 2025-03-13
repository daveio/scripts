# Gmail Downloader

A Python tool to download all emails from a Gmail account using IMAP and save them as JSON files.

## Package manager

You should ideally use `uv` with this project. Other tools may work.

This project uses `mise` for language and tool management.

## Editor considerations

This project uses the VS Code `mise` extension.

If you have any trouble, try removing the `.vscode` directory.

## Features

- Downloads emails from Gmail via IMAP
- Saves emails as JSON files including headers, content, and attachment information
- Handles connection drops and allows resuming interrupted downloads
- Supports multithreaded downloading for improved performance
- Displays detailed progress information and statistics
- Provides robust error handling and fallbacks for charset encoding issues

## Installation

```bash
mise install
```

```bash
uv sync
```

## Usage

```bash
GMAIL_PASSWORD="your-app-specific-password" uv run gmail-downloader
```

### Command-line Options

- `-o, --output DIR`: Output directory for JSON files (default: emails)
- `-l, --limit NUM`: Limit number of emails to download
- `-f, --folder FOLDER`: IMAP folder to download (default: [Gmail]/All Mail)
- `-s, --size-estimate`: Estimate total size without downloading emails
- `-r, --resume`: Resume from the last downloaded email
- `-v, --verbose`: Show more detailed progress information
- `-t, --threads`: Number of threads to use for downloading (default: 8)

## Requirements

- Python 3.13 or later
- A Gmail account with IMAP enabled
- An app-specific password for Gmail (regular password won't work if you have 2FA enabled)

## License

MIT
