# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The aaisp-exporter is a Prometheus exporter for Andrews & Arnold (AAISP) line data via their CHAOS API. It fetches broadband line information like sync rates and quota usage, then exposes these metrics for Prometheus to scrape.

## Commands

### Build Commands

```bash
# Build the application
go build

# Run the application locally (requires env vars set - see Configuration section)
go run main.go

# Build for multiple platforms
goreleaser build --snapshot --rm-dist

# Run tests (if/when added)
go test ./...
```

### Linting and Code Quality

The project uses Trunk for linting and code quality checks:

```bash
# Run all linters
trunk check

# Format code
trunk fmt

# Check for vulnerabilities
trunk scan
```

### Docker

```bash
# Build Docker image
docker build -t aaisp-exporter .

# Run Docker container
docker run -e AAISP_CONTROL_USERNAME=your_username -e AAISP_CONTROL_PASSWORD=your_password -p 9902:9902 aaisp-exporter
```

## Configuration

The application is configured via environment variables:

- `AAISP_CONTROL_USERNAME` (REQUIRED): AAISP control pages username (format: `ab123@a`)
- `AAISP_CONTROL_PASSWORD` (REQUIRED): AAISP control pages password
- `AAISP_EXPORTER_PORT` (optional, default: `9902`): Port for the Prometheus metrics endpoint

## Architecture

This is a simple Go application with a straightforward architecture:

1. **Main app structure**: Main function sets up Prometheus metrics, starts an HTTP server on the configured port, and schedules regular data updates.

2. **Data collection**: `GetUpdatedValues()` fetches data from the AAISP CHAOS API using credentials from environment variables.

3. **Metrics exposition**: The following metrics are exposed:
   - `upstream_sync_rate`: Upload sync rate in bits/sec
   - `downstream_sync_rate`: Download sync rate in bits/sec
   - `downstream_rate_adjusted`: Adjusted downstream rate after rate limiting in bits/sec
   - `monthly_allowance`: Monthly data quota in bytes
   - `monthly_allowance_remaining`: Remaining data quota in bytes

4. **Scheduling**: Data is refreshed from the AAISP API every 60 seconds.

5. **Error handling**: Errors are logged using Logrus with JSON formatting.

## Development Notes

- Go version: The project is designed for Go 1.24+
- The application uses a polling interval of 60 seconds to update metrics from the AAISP API
- Metrics are exposed at the `/metrics` endpoint
- The project follows semantic versioning and maintains a changelog