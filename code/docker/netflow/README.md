# ntopng with netflow2ng - Build-time GeoIP Edition

A Docker container for ntopng traffic analysis with netflow2ng support and build-time GeoIP database integration.

## Features

- **ntopng** 6.4 with zeromq patch for flow processing
- **netflow2ng** for NetFlow v5/v9, sFlow, and IPFIX support
- **nDPI** 4.14 for deep packet inspection
- **Build-time GeoIP databases** - No runtime configuration needed
- Optimized multi-stage build with extensive caching
- Multi-architecture support (linux/amd64, linux/arm64)

## Quick Start

### Using Pre-built Images

```bash
# Copy the template
cp docker-compose.template.yml docker-compose.yml

# Start the stack
docker compose up -d

# Access the web interface
open http://localhost:8849
```

### Building from Source

If you want to build with fresh GeoIP data, you'll need MaxMind credentials:

```bash
# Set your MaxMind credentials
export GEOIPUPDATE_ACCOUNT_ID="your_account_id"
export GEOIPUPDATE_LICENSE_KEY="your_license_key"

# Build the image
docker build \
  --build-arg GEOIPUPDATE_ACCOUNT_ID="${GEOIPUPDATE_ACCOUNT_ID}" \
  --build-arg GEOIPUPDATE_LICENSE_KEY="${GEOIPUPDATE_LICENSE_KEY}" \
  -t netflow:custom \
  ./components
```

## GeoIP Database Handling

### Build-time Approach (Current)

The container now fetches GeoIP databases during the build process:

- **At build time**: Downloads latest GeoLite2 databases using MaxMind API
- **Runtime**: Uses pre-downloaded databases, no internet access required
- **Fallback**: Creates placeholder databases if credentials aren't provided
- **Caching**: Build cache ensures databases are only downloaded when needed

### Available Databases

The following databases are included:

- `GeoLite2-City.mmdb` - City-level geolocation
- `GeoLite2-Country.mmdb` - Country-level geolocation
- `GeoLite2-ASN.mmdb` - Autonomous System Number data

## GitHub Actions Integration

The project includes automated builds with GeoIP integration:

1. **Repository Secrets**: Set `GEOIPUPDATE_ACCOUNT_ID` and `GEOIPUPDATE_LICENSE_KEY` in your GitHub repository
2. **Automated Builds**: GitHub Actions automatically includes fresh GeoIP data
3. **Multi-arch Images**: Builds for both AMD64 and ARM64 architectures
4. **Registry Push**: Images are pushed to GitHub Container Registry

## MaxMind Account Setup

To get MaxMind credentials for fresh GeoIP data:

1. Create a free account at [MaxMind](https://www.maxmind.com/en/geolite2/signup)
2. Generate a license key in your account dashboard
3. Note your Account ID and License Key
4. For GitHub builds, add these as repository secrets:
   - `GEOIPUPDATE_ACCOUNT_ID`
   - `GEOIPUPDATE_LICENSE_KEY`

## Container Configuration

### Ports

- `8849/tcp` - ntopng web interface
- `2055/udp` - NetFlow/sFlow/IPFIX collector

### Volumes

- `/var/lib/ntopng` - Database and persistent data
- `/var/log/ntopng` - Application logs

### Optional Environment Variables

- `REMOTE_REDIS` - Use external Redis server (format: `host:port`)

## Performance & Optimization

- **Multi-stage builds** minimize final image size
- **Build caching** reduces build times for incremental changes
- **Dependency prefetching** parallelizes source downloads
- **Layer optimization** maximizes Docker cache effectiveness
- **Non-root execution** for security

## Security Features

- Runs as non-root user (`ntopng`)
- Minimal runtime dependencies
- No secrets embedded in final image
- Build-time credential handling only
- Regular base image updates

## Troubleshooting

### No GeoIP Data

If the container starts but shows no geographical information:

1. Check if the image was built with proper credentials
2. Verify MaxMind account is active and has API access
3. Check build logs for GeoIP download errors

### Build Failures

Common build issues:

- **Invalid credentials**: Verify MaxMind account ID and license key
- **Network connectivity**: Ensure build environment can reach MaxMind APIs
- **Cache issues**: Try building with `--no-cache` flag

### Runtime Issues

- **Permission denied**: Check file ownership in mounted volumes
- **Port conflicts**: Ensure ports 8849 and 2055 are available
- **Memory limits**: ntopng requires adequate memory for traffic analysis

## Version Information

- **Base Image**: mise (Debian-based with development tools)
- **ntopng**: 6.4 with custom zeromq patches
- **netflow2ng**: 0.0.5
- **nDPI**: 4.14
- **Go**: 1.24.3

## License

This project builds upon open-source components:

- ntopng: GPL-3.0
- nDPI: GPL-3.0
- netflow2ng: Apache-2.0

See individual component repositories for detailed licensing information.
