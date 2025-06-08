# ntopng NetFlow Monitoring Stack

A comprehensive containerized network traffic monitoring solution that combines ntopng with netflow2ng to receive and analyze NetFlow data from Mikrotik routers and other network devices. The project includes complete Docker configuration, interactive guides, and automation scripts for production deployment.

## Overview

This monitoring stack includes:
- **ntopng 6.4**: Web-based network traffic monitoring and analysis
- **netflow2ng 0.0.5**: NetFlow v5/v9/IPFIX to ZeroMQ bridge
- **nDPI 4.14**: Deep packet inspection library
- **Redis**: Data storage backend for flows and metrics
- **GeoIP**: Optional geographic IP location with MaxMind GeoLite2

## Quick Start

### Basic Usage (No GeoIP)

```bash
# Pull the image
docker pull ghcr.io/daveio/netflow:latest

# Run the container
docker run -d \
  --name netflow \
  -p 8849:8849 \
  -p 2055:2055/udp \
  ghcr.io/daveio/netflow:latest
```

Access the web interface at `http://localhost:8849`

### Using Docker Compose

```bash
# Create .env file from example
cp .env.example .env

# Edit .env and add your MaxMind credentials (optional)
# nano .env

# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configuration

### Network Settings

Edit `ntopng.conf` to customize:
- **Local networks**: Update the `-m` parameter with your network ranges
- **Packet filtering**: Modify `--packet-filter` to exclude unwanted traffic
- **Performance**: Adjust `--max-num-flows` and `--max-num-hosts` based on your needs

Example for different networks:
```bash
# For 192.168.x.x networks
-m="192.168.0.0/16"

# For multiple networks
-m="10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
```

### GeoIP Configuration (Optional)

Geographic IP location adds country/city information to the traffic analysis.

#### Step 1: Get MaxMind Credentials
1. Register at <https://www.maxmind.com/en/geolite2/signup>
2. Create a license key in your account dashboard
3. Note your Account ID and License Key

#### Step 2: Configure Container

##### Option A: Environment Variables
```bash
docker run -d \
  --name netflow \
  -e GEOIPUPDATE_ACCOUNT_ID=123456 \
  -e GEOIPUPDATE_LICENSE_KEY=your_license_key_here \
  -p 8849:8849 \
  -p 2055:2055/udp \
  ghcr.io/daveio/netflow:latest
```

##### Option B: Docker Compose
Edit `docker-compose.yml` and uncomment the GeoIP lines:
```yaml
environment:
  GEOIPUPDATE_ACCOUNT_ID: "123456"
  GEOIPUPDATE_LICENSE_KEY: "your_license_key_here"
```

##### Option C: Interactive Setup
```bash
# Run setup script inside container
docker exec -it netflow /opt/geoip.bash

# Check GeoIP status
docker exec netflow /opt/geoip.bash --check

# Update databases only
docker exec netflow /opt/geoip.bash --update
```

#### GeoIP Status
- ✅ **With credentials**: Automatic database download, geographic features enabled
- ⚠️ **Without credentials**: Container works normally, no geographic data
- 🔄 **Failed download**: Graceful fallback, ntopng continues without GeoIP

## Router Configuration

### Mikrotik RouterOS 7+

```bash
# Enable Traffic Flow
/ip traffic-flow
set enabled=yes

# Add ntopng target (replace with your Docker host IP)
/ip traffic-flow target
add dst-address=192.168.1.100 port=2055 version=9
```

### Other Routers
Configure NetFlow/sFlow/IPFIX export to:
- **IP**: Your Docker host IP address
- **Port**: 2055 (UDP)
- **Version**: 5, 9, or IPFIX

## Monitoring & Logs

### View Container Logs
```bash
# All logs
docker logs netflow

# Follow logs
docker logs -f netflow

# Service-specific logs (inside container)
docker exec netflow tail -f /var/log/ntopng/ntopng-startup.log
docker exec netflow tail -f /var/log/ntopng/ntopng.log
docker exec netflow tail -f /var/log/ntopng/redis.log
```

### Health Check
```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:8849/lua/rest/v2/get/system/stats.lua
```

### Update GeoIP Databases
```bash
# Manual update (inside container)
docker exec netflow geoipupdate -v
```

## Data Persistence

The container uses volumes for persistent data:

```yaml
volumes:
  - netflow-data:/var/lib/ntopng    # Database and configuration
  - netflow-logs:/var/log/ntopng    # Log files
```

### Backup Data
```bash
# Create backup
docker run --rm -v netflow-data:/data -v $(pwd):/backup alpine tar czf /backup/netflow-backup.tar.gz -C /data .

# Restore backup
docker run --rm -v netflow-data:/data -v $(pwd):/backup alpine tar xzf /backup/netflow-backup.tar.gz -C /data
```

## Troubleshooting

### No Traffic Visible
1. **Check router configuration**: Ensure NetFlow is enabled and pointing to correct IP:port
2. **Verify network connectivity**: Test UDP port 2055 is reachable
3. **Check logs**: `docker logs netflow` for netflow2ng messages
4. **Firewall**: Ensure Docker host firewall allows UDP 2055

### ntopng Web Interface Issues
1. **Port binding**: Verify port 8849 is not in use: `netstat -ln | grep 8849`
2. **Container status**: Check if container is running: `docker ps`
3. **Health check**: `curl http://localhost:8849`

### GeoIP Not Working
1. **Check credentials**: Verify Account ID and License Key are correct
2. **Network access**: Container needs internet access to download databases
3. **Logs**: Check startup logs for GeoIP download status
4. **Manual test**: `docker exec netflow geoipupdate -v`

### Performance Issues
1. **Increase limits** in `ntopng.conf`:
   ```conf
   --max-num-flows=500000
   --max-num-hosts=250000
   --max-num-hash-entries=262144
   ```
2. **Add more memory** to container:
   ```bash
   docker run --memory=2g ghcr.io/daveio/netflow:latest
   ```
3. **Filter traffic** to reduce load:
   ```conf
   --packet-filter="not (src net 192.168.1.0/24 and dst net 192.168.1.0/24)"
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEOIPUPDATE_ACCOUNT_ID` | `0` | MaxMind account ID |
| `GEOIPUPDATE_LICENSE_KEY` | `000000000000` | MaxMind license key |
| `GEOIPUPDATE_EDITION_IDS` | `GeoLite2-Country GeoLite2-City GeoLite2-ASN` | Database editions |
| `GEOIPUPDATE_DB_DIR` | `/usr/share/GeoIP` | Database directory |
| `GEOIPUPDATE_VERBOSE` | `1` | Verbose logging |
| `REMOTE_REDIS` | _not set_ | Remote Redis server (format: `HOSTNAME:PORT` or just `HOSTNAME`, defaults to port 6379) |

### Redis Configuration

By default, the container runs a local Redis server. To use an external Redis server instead:

```bash
# Using hostname and port
docker run -d \
  --name netflow \
  -e REMOTE_REDIS="redis.example.com:6379" \
  -p 8849:8849 \
  -p 2055:2055/udp \
  ghcr.io/daveio/netflow:latest

# Using hostname only (defaults to port 6379)
docker run -d \
  --name netflow \
  -e REMOTE_REDIS="redis.example.com" \
  -p 8849:8849 \
  -p 2055:2055/udp \
  ghcr.io/daveio/netflow:latest
```

When `REMOTE_REDIS` is set:
- Local Redis server is **not** started
- ntopng connects to the specified remote Redis server
- Container startup will fail if the remote Redis is not accessible

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 8849 | TCP | ntopng web interface |
| 2055 | UDP | NetFlow/sFlow/IPFIX input |

## Project Structure

```text
/mixed/netflow/
├── Dockerfile                              # Multi-stage container build
├── docker-compose.yml                      # Orchestration configuration
├── ntopng.conf                            # ntopng runtime configuration
├── ntopng.bash                            # Container startup and service management
├── geoip.bash                             # Interactive GeoIP database setup
├── allow-flows-from-netflow2ng.patch      # ntopng patch for ZeroMQ flow support
├── LOCAL-LOCAL.html                       # Interactive traffic filtering guide
├── LOCAL-LOCAL.md                         # Comprehensive filtering documentation
└── README.md                              # This documentation
```

### Key Files Explained

- **Dockerfile**: Multi-stage build using mise for Go compilation, includes all necessary dependencies
- **ntopng.bash**: Comprehensive startup script with health checks, logging, and graceful shutdown
- **geoip.bash**: Interactive script for MaxMind GeoLite2 database configuration and updates
- **allow-flows-from-netflow2ng.patch**: Enables JSON flow processing in community edition
- **LOCAL-LOCAL.html**: Interactive web-based guide for configuring BPF filters to hide local traffic
- **LOCAL-LOCAL.md**: Detailed technical documentation on local traffic filtering strategies

## Security Considerations

⚠️ **Important**: The default configuration disables authentication for ease of setup.

### For Production Use
1. **Enable authentication** in `ntopng.conf`:
   ```conf
   --disable-login=0
   ```
2. **Use HTTPS** by configuring:
   ```conf
   --https-port=3001
   --ssl-cert=/path/to/cert.pem
   --ssl-key=/path/to/key.pem
   ```
3. **Restrict network access** using firewall rules
4. **Use secrets management** for GeoIP credentials

## Advanced Usage

### Custom Build Arguments
```bash
# Build with specific versions (current defaults shown)
docker build \
  --build-arg NTOP_VERSION=6.4 \
  --build-arg NDPI_VERSION=4.14 \
  --build-arg NETFLOW2NG_VERSION=0.0.5 \
  -t ghcr.io/daveio/netflow:custom .
```

### Development Mode
```bash
# Mount configuration for development
docker run -d \
  -v $(pwd)/ntopng.conf:/etc/ntopng.conf \
  -v $(pwd)/ntopng.bash:/opt/ntopng.bash \
  -p 8849:8849 -p 2055:2055/udp \
  ghcr.io/daveio/netflow:latest
```

### Integration with Other Tools
- **Grafana**: Use ntopng's InfluxDB export for dashboards
- **Elastic Stack**: Export data to Elasticsearch
- **Prometheus**: Enable metrics export for monitoring

## Traffic Filtering Guide

For detailed information on filtering local network traffic, refer to:
- **LOCAL-LOCAL.html**: Interactive web-based guide for building BPF filters
- **LOCAL-LOCAL.md**: Comprehensive technical documentation on traffic filtering

These guides help configure ntopng to focus on external traffic by hiding local-to-local communications.

## InfluxDB Integration

InfluxDB needs to be configured to provide v1 endpoints to `ntopng`.

First, create a bucket (example name: `ntopng`) and note the bucket ID.

Run this on the InfluxDB server (can use `bash` shell inside Docker):

```bash
export BUCKET_ID="16_hex_chars"
export USERNAME="netflow"
export PASSWORD="some_password"
export ORG="home"
export TOKEN="your_operator_token_or_other_token"
influx v1 auth create --read-bucket $BUCKET_ID --write-bucket $BUCKET_ID --username $USERNAME --password $PASSWORD --org $ORG --token $TOKEN
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review container logs: `docker logs netflow`
3. Verify router NetFlow configuration
4. Check network connectivity and firewall settings

## Features

### Built-in Components
- **Multi-stage Docker build** optimized for production
- **Automated service orchestration** with health checks and graceful shutdown
- **Interactive GeoIP setup** with credential validation and database management
- **Comprehensive logging** with structured output and log rotation
- **Security hardening** with non-root users and minimal attack surface

### Traffic Analysis Capabilities
- **Real-time NetFlow/sFlow/IPFIX processing** from Mikrotik and other vendors
- **Geographic IP mapping** with MaxMind GeoLite2 databases
- **Advanced packet filtering** with Berkeley Packet Filter (BPF) support
- **Local traffic isolation** with interactive filter configuration guides
- **Flow export** to InfluxDB, Elasticsearch, and other time-series databases

### Monitoring Features
- **Web-based interface** on port 8849 with customizable dashboards
- **REST API** for programmatic access to flow data and statistics
- **Health check endpoints** for container orchestration platforms
- **Metrics export** for Prometheus integration

## License

This configuration is provided as-is for network monitoring purposes. Please ensure compliance with your organization's security policies and local regulations when monitoring network traffic.

The included software components are subject to their respective licenses:
- ntopng: GPLv3
- netflow2ng: Apache 2.0
- nDPI: LGPLv3
