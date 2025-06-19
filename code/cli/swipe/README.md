# Swipe 🗑️

A powerful, multithreaded Python tool for safely and efficiently deleting all objects from S3-compatible storage buckets. Built with `rich` for beautiful terminal output and `click` for an intuitive CLI experience.

Supports AWS S3, Cloudflare R2, MinIO, and any other S3-compatible storage provider.

![Python](https://img.shields.io/badge/python-v3.11+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ⚠️ Warning

**This tool will permanently delete ALL objects in the specified bucket. This action cannot be undone. Please use with extreme caution.**

## Features ✨

- 🚀 **Multithreaded Deletion**: Uses 16 threads for high-performance parallel deletion
- 📊 **Real-time Progress Tracking**: Beautiful progress bars and statistics
- 🛡️ **Safety Features**: Confirmation prompts and 10-second countdown
- 🎨 **Rich Terminal UI**: Colorful tables, progress bars, and formatted output
- ⚡ **Batch Operations**: Efficiently deletes objects in batches of up to 1000
- 📈 **Comprehensive Statistics**: Deletion rate, total size freed, and error reporting
- 🔄 **Graceful Shutdown**: Handles Ctrl+C interruptions cleanly
- 🌍 **S3-Compatible**: Works with AWS S3, Cloudflare R2, MinIO, and other providers
- 🔧 **Environment-based Configuration**: Uses `.env` file for credentials

## Supported Providers 🌐

- **AWS S3** - Amazon's Simple Storage Service
- **Cloudflare R2** - Cloudflare's S3-compatible object storage
- **MinIO** - High-performance object storage
- **DigitalOcean Spaces** - S3-compatible object storage
- **Wasabi** - Hot cloud storage
- **Any S3-compatible provider** - Just configure the endpoint

## Prerequisites 📋

- Python 3.11 or higher
- Access to an S3-compatible storage provider
- Credentials with permissions to:
  - List bucket contents
  - Delete objects
  - Access bucket metadata

## Installation 🔧

1. Clone the repository:

```bash
git clone https://github.com/yourusername/swipe.git
cd swipe
```

2. Install dependencies using `uv`:

```bash
uv sync
```

Or install manually:

```bash
pip install boto3 rich click python-dotenv
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Edit `.env` with your storage provider credentials:

### For Cloudflare R2:

```env
S3_HOSTNAME=your-account-id.r2.cloudflarestorage.com
S3_PROTOCOL=https
S3_ACCESS_KEY_ID=your_r2_access_key_here
S3_SECRET_KEY=your_r2_secret_key_here
S3_BUCKET_NAME=your-bucket-name-here
```

### For AWS S3:

```env
# Leave S3_HOSTNAME empty for AWS S3
S3_PROTOCOL=https
S3_ACCESS_KEY_ID=your_aws_access_key_here
S3_SECRET_KEY=your_aws_secret_key_here
S3_BUCKET_NAME=your-bucket-name-here
```

### For MinIO or other providers:

```env
S3_HOSTNAME=your-minio-server.com:9000
S3_PROTOCOL=https
S3_ACCESS_KEY_ID=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_BUCKET_NAME=your-bucket-name-here
```

## Usage 🚀

### Basic Usage

Run the tool with confirmation prompts:

```bash
uv run python -m swipe.main
```

### Skip Confirmation

To skip the confirmation prompt (useful for automation):

```bash
uv run python -m swipe.main --yes
```

Or use the short flag:

```bash
uv run python -m swipe.main -y
```

### Using the installed command (after installing):

```bash
uv run swipe
uv run swipe --yes
```

## What to Expect 📺

When you run the tool, you'll see:

1. **Configuration Display**: Shows your endpoint, bucket name, and masked credentials
2. **Connection Test**: Verifies access to your storage bucket
3. **Object Summary**: Displays total object count and size
4. **Confirmation Prompt**: Asks for explicit confirmation (unless `--yes` is used)
5. **Countdown Timer**: 10-second countdown before deletion starts (can be cancelled with Ctrl+C)
6. **Progress Bar**: Real-time progress with deletion rate and time remaining
7. **Results Summary**: Final statistics including:
   - Objects deleted/failed
   - Total size freed
   - Duration and deletion rate
   - Any errors encountered

## Safety Features 🛡️

- **Environment Variables**: Credentials are never hardcoded
- **Explicit Confirmation**: Must confirm deletion unless `--yes` flag is used
- **Countdown Timer**: 10-second delay allows cancellation before deletion starts
- **Graceful Interruption**: Ctrl+C cleanly stops the operation
- **Verification**: Confirms bucket is empty after deletion
- **Error Reporting**: Detailed error messages for failed deletions

## Architecture 🏗️

The tool is built with:

- **boto3**: AWS SDK for Python (works with all S3-compatible providers)
- **rich**: Beautiful terminal formatting and progress bars
- **click**: Command-line interface creation
- **python-dotenv**: Environment variable management
- **ThreadPoolExecutor**: Parallel deletion with 16 worker threads
- **Batch Delete API**: Uses S3's batch delete for efficiency (up to 1000 objects per request)

## Performance 🚀

- Utilizes 16 concurrent threads for maximum throughput
- Batch deletes up to 1000 objects per API call
- Efficiently handles pagination for large buckets
- Typical performance: 1000+ objects/second (varies by network and object size)

## Configuration Reference 📝

### Environment Variables

| Variable           | Description               | Required                   | Example                            |
| ------------------ | ------------------------- | -------------------------- | ---------------------------------- |
| `S3_HOSTNAME`      | Storage provider hostname | No (AWS S3) / Yes (others) | `account.r2.cloudflarestorage.com` |
| `S3_PROTOCOL`      | Protocol to use           | No (defaults to https)     | `https`                            |
| `S3_ACCESS_KEY_ID` | Access key ID             | Yes                        | `your_access_key`                  |
| `S3_SECRET_KEY`    | Secret access key         | Yes                        | `your_secret_key`                  |
| `S3_BUCKET_NAME`   | Target bucket name        | Yes                        | `my-bucket`                        |

**Note**: If `S3_HOSTNAME` is not provided, the tool will use AWS S3 as the default provider.

## Error Handling 🔧

The tool handles various error scenarios:

- Missing or invalid credentials
- Bucket not found or access denied
- Network connectivity issues
- Individual object deletion failures
- Interrupted operations (Ctrl+C)

## Development 💻

This project uses `uv` for dependency management. The project structure:

```
swipe/
├── pyproject.toml          # Project configuration and dependencies
├── README.md              # This file
├── .env.example           # Example environment configuration
├── .gitignore            # Git ignore rules
└── src/
    └── swipe/
        ├── __init__.py    # Package initialization
        └── main.py        # Main application code
```

### Running in Development

```bash
# Install development dependencies
uv sync

# Run the tool
uv run python -m swipe.main
```

## Security Notes 🔐

- Never commit your `.env` file (it's in `.gitignore`)
- Use access keys with minimal required permissions
- Consider using temporary credentials for enhanced security
- The tool masks sensitive information in its output

## Troubleshooting 🔍

### "Bucket not found" error

- Verify the bucket name in your `.env` file
- Ensure your credentials have access to the bucket
- Check that you're using the correct hostname for your provider

### "Access denied" error

- Verify your credentials have the necessary permissions:
  - List bucket contents
  - Delete objects
  - Access bucket metadata

### "Connection error" with custom endpoint

- Verify the `S3_HOSTNAME` is correct for your provider
- Check that `S3_PROTOCOL` matches your provider's requirements
- Ensure the hostname includes the port if required (e.g., `localhost:9000`)

### Slow deletion speed

- Check your network connection
- Consider running closer to your storage provider (same region/datacenter)
- Verify there are no rate limiting policies

## Provider-Specific Notes 📝

### Cloudflare R2

- No region required (doesn't use regions)
- Hostname format: `{account-id}.r2.cloudflarestorage.com`
- Supports all S3 API operations used by this tool

### MinIO

- Include port in hostname if not using standard ports
- Example: `localhost:9000` or `minio.example.com:9000`

### AWS S3

- Leave `S3_HOSTNAME` empty to use default AWS endpoints
- Regions are handled automatically by boto3

## License 📄

MIT License - feel free to use this tool in your projects!

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer ⚠️

This tool is provided as-is. Always verify you're targeting the correct bucket and have proper backups before running. The authors are not responsible for any data loss resulting from the use of this tool.
