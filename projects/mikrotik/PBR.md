# Policy-Based Routing Scripts for MikroTik RouterOS

This directory contains an improved set of scripts for implementing and managing policy-based routing (PBR) for Put.io traffic on MikroTik routers.

## Scripts Overview

### 1. `pbr.rsc`

The main configuration script that sets up comprehensive policy-based routing with:

- ✅ Robust error handling and validation
- ✅ Automatic configuration backup
- ✅ Gateway reachability testing
- ✅ IPv4 and IPv6 support
- ✅ Performance optimization (connection tracking bypass)
- ✅ Comprehensive logging
- ✅ Cleanup on errors
- ✅ Configuration summary

### 2. `pbr-monitor.rsc`

A companion monitoring and management script that provides:

- ✅ Configuration health checking
- ✅ Traffic statistics
- ✅ Gateway connectivity testing
- ✅ Configuration display
- ✅ Complete cleanup functionality
- ✅ Continuous monitoring mode

## Key Improvements Over Original Script

### Error Handling & Reliability

- **Validation**: Pre-flight checks for all configuration parameters
- **Backup Creation**: Automatic backup before making changes
- **Rollback**: Cleanup function removes partial configurations on failure
- **Gateway Testing**: Optional reachability testing before deployment
- **Retry Logic**: Built-in retry mechanisms for network operations

### Logging & Monitoring

- **Structured Logging**: Timestamped logs with severity levels
- **Debug Mode**: Optional verbose output for troubleshooting
- **Status Monitoring**: Health checks for all configuration components
- **Traffic Statistics**: Real-time statistics on PBR rule usage

### Configuration Management

- **Parameterized**: Easy-to-modify configuration variables
- **Modular Design**: Separate functions for each configuration aspect
- **Conflict Prevention**: Removes existing rules before adding new ones
- **Version Tracking**: Script version embedded in rule comments

### Performance & Safety

- **Connection Tracking Bypass**: Improved performance for streaming traffic
- **Interface Validation**: Ensures specified interfaces exist
- **Address Format Validation**: Validates IP address formats
- **Safe Cleanup**: Comprehensive removal of all PBR components

## Prerequisites

- RouterOS v7.0+ (recommended)
- Administrative access to the router
- Alternative gateway/interface configured and accessible
- Put.io IP addresses/ranges identified

## Installation & Configuration

### Step 1: Configure Variables

Edit the configuration section in `pbr.rsc`:

```routeros
# Network configuration - replace with your actual values
:local mainGatewayIPv4 "192.168.1.1"          # Your main router gateway
:local mainGatewayIPv6 "2001:db8::1"          # Your main IPv6 gateway
:local altGatewayIPv4 "10.0.0.1"              # Alternative gateway IP
:local altGatewayIPv6 "2001:db8:1::1"         # Alternative IPv6 gateway
:local altGatewayInterface "ether2"            # Alternative interface name

# Put.io addresses - replace with actual addresses
:local putioAddressesIPv4 {
    "1.2.3.4";
    "5.6.7.8";
    "10.20.30.0/24"
}

:local putioAddressesIPv6 {
    "2001:db8:a::1";
    "2001:db8:b::1";
    "2001:db8:c::/64"
}
```

### Step 2: Upload Scripts to Router

Upload both script files to your MikroTik router:

```bash
# Using scp (replace with your router IP)
scp pbr.rsc admin@192.168.1.1:/
scp pbr-monitor.rsc admin@192.168.1.1:/
```

### Step 3: Create System Scripts

Connect to RouterOS terminal and create system scripts:

```routeros
# Create the main PBR script
/system script add name=pbr-setup source=[/file get pbr.rsc contents]

# Create the monitor script
/system script add name=pbr-monitor source=[/file get pbr-monitor.rsc contents]
```

### Step 4: Test Configuration

Test the configuration before deployment:

```routeros
# Run with dry-run mode (modify script to set createBackup=false for testing)
/system script run pbr-setup

# Check the configuration
/system script run pbr-monitor
```

### Step 5: Deploy Configuration

Deploy the full configuration:

```routeros
# Run the main configuration script
/system script run pbr-setup

# Verify deployment
/system script run pbr-monitor parameter=status
```

## Usage Examples

### Basic Operations

```routeros
# Check PBR status (default action)
/system script run pbr-monitor

# Show traffic statistics
/system script run pbr-monitor parameter=stats

# Test gateway connectivity
/system script run pbr-monitor parameter=test

# Display current configuration
/system script run pbr-monitor parameter=show

# Clean up all PBR configuration
/system script run pbr-monitor parameter=cleanup
```

### Advanced Monitoring

```routeros
# Start continuous monitoring (runs until stopped)
/system script run pbr-monitor parameter=monitor

# Schedule regular health checks
/system scheduler add name=pbr-health-check interval=1h \
    on-event="/system script run pbr-monitor"

# Schedule daily statistics logging
/system scheduler add name=pbr-stats interval=1d \
    on-event="/system script run pbr-monitor parameter=stats"
```

## Configuration Options

### Main Script Options

| Variable           | Description                     | Default |
| ------------------ | ------------------------------- | ------- |
| `debugMode`        | Enable verbose logging          | `true`  |
| `createBackup`     | Create backup before changes    | `true`  |
| `validateGateways` | Test gateway reachability       | `true`  |
| `maxRetries`       | Maximum retry attempts          | `3`     |
| `retryDelay`       | Delay between retries (seconds) | `2`     |

### Monitor Script Options

| Parameter | Description                          |
| --------- | ------------------------------------ |
| `status`  | Check configuration health (default) |
| `stats`   | Show traffic statistics              |
| `test`    | Test gateway connectivity            |
| `show`    | Display configuration details        |
| `cleanup` | Remove all PBR configuration         |
| `monitor` | Start continuous monitoring          |

## Troubleshooting

### Common Issues

1. **"Gateway not reachable"**

   - Check alternative gateway IP and interface
   - Verify network connectivity
   - Disable gateway validation temporarily: `validateGateways = false`

2. **"Interface not found"**

   - Verify interface name: `/interface print`
   - Check interface status: `/interface monitor`

3. **"Configuration validation failed"**

   - Check all placeholder values are replaced
   - Verify IP address formats
   - Ensure interface exists

4. **"Backup creation failed"**

   - Check available storage: `/system resource print`
   - Verify write permissions
   - Disable backup creation temporarily: `createBackup = false`

### Debug Mode

Enable debug mode for detailed logging:

```routeros
# Edit script to set debugMode = true
# All operations will be logged to system log and console
```

### Log Analysis

Check system logs for script execution details:

```routeros
# View recent PBR-related logs
/log print where topics~"script"

# Filter by script name
/log print where message~"PBR-Putio"
```

## Advanced Features

### Automatic Recovery

The scripts include automatic recovery mechanisms:

- Failed configurations trigger cleanup
- Partial deployments are automatically rolled back
- Gateway failures are logged but don't stop deployment

### Performance Optimization

- **Connection Tracking Bypass**: Reduces CPU load for high-bandwidth streaming
- **Efficient Rule Matching**: Optimized mangle rule order
- **Minimal Resource Usage**: Uses existing routing infrastructure

### Security Considerations

- **Configuration Backup**: Automatic backup before changes
- **Validation**: Pre-deployment validation prevents misconfigurations
- **Logging**: Comprehensive audit trail of all changes
- **Isolation**: PBR rules are clearly marked and isolated

## Integration with Existing Scripts

### Put.io IP Fetching

If you have an existing `putio.rsc` script that fetches current Put.io IP ranges:

```routeros
# Modify the main script to read from a file or variable
# populated by your existing putio.rsc script

# Example integration:
:global putioAddresses
:if ([:typeof $putioAddresses] != "nil") do={
    :local putioAddressesIPv4 $putioAddresses
}
```

### Scheduler Integration

Schedule regular PBR maintenance:

```routeros
# Daily configuration check
/system scheduler add name=pbr-daily-check interval=1d \
    on-event="/system script run pbr-monitor parameter=status"

# Weekly gateway testing
/system scheduler add name=pbr-weekly-test interval=7d \
    on-event="/system script run pbr-monitor parameter=test"

# Monthly cleanup and reconfiguration
/system scheduler add name=pbr-monthly-refresh interval=30d \
    on-event="{
        /system script run pbr-monitor parameter=cleanup;
        :delay 5s;
        /system script run pbr-setup
    }"
```

## Support & Maintenance

### Version History

- **v2.0**: Complete rewrite with error handling, validation, and monitoring
- **v1.0**: Original basic policy-based routing script

### Best Practices

1. **Test First**: Always test in a non-production environment
2. **Backup Configuration**: Keep regular router configuration backups
3. **Monitor Performance**: Watch for any impact on router performance
4. **Update Addresses**: Keep Put.io address lists current
5. **Review Logs**: Regular log review for issues or optimizations

### Contributing

To improve these scripts:

1. Test thoroughly in lab environment
2. Follow RouterOS scripting best practices
3. Maintain backward compatibility
4. Document all changes
5. Update version numbers

---

_These scripts are part of the MikroTik router configuration repository and follow the established coding standards and practices for RouterOS scripting._
