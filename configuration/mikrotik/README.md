# MikroTik Router Configurations

This repository contains RouterOS configuration files for MikroTik network devices. These configurations are organized by device hostname and serve as both backup and documentation for the network infrastructure.

## Repository Structure

- `fw-16c/` - Configuration for the MikroTik RB5009UPr+S+ router

  - Full configuration files in various formats:

    | Format  | Description                   | Use Case               |
    | ------- | ----------------------------- | ---------------------- |
    | Default | Standard export format        | General use            |
    | Compact | Minimal whitespace            | Storage optimization   |
    | Terse   | Removes comments              | Debugging              |
    | Verbose | Includes all possible details | Complete documentation |

  - `ipv6.rsc` - Dedicated IPv6 tunnel configuration
  - `sensitive/` - Encrypted configuration files

- `fw-7t54/` - Configuration for the MikroTik RB4011iGS+5HacQ2HnD router

  - `dhcp.rsc` - DHCP server configuration
  - `firewall.rsc` - Firewall ruleset
  - `sensitive/` - Encrypted configuration files

- `scripts/` - Automated RouterOS scripts:
  - `putio.rsc` - Fetches put.io IP prefixes
  - `policy-based-routing.rsc` - Basic PBR setup with validation and logging
  - `pbr.rsc` - Advanced PBR with comprehensive error handling
  - `pbr-monitor.rsc` - PBR monitoring and management script
  - `backup-config.rsc` - Automated configuration backups
  - `update-dns.rsc` - Dynamic DNS updates
  - `monitor-traffic.rsc` - Bandwidth monitoring

## Configuration Files

The `.rsc` files are RouterOS script files that can be imported directly into a MikroTik device. These files follow the RouterOS command syntax and can be used to:

- Restore device configuration
- Review network settings
- Document network infrastructure
- Track configuration changes over time

## RouterOS Scripts

The scripts in the `scripts/` directory follow RouterOS scripting best practices:

- Robust error handling with `:do`/`:on-error` blocks
- Retry logic for network operations
- Content validation before applying changes
- Automatic backup creation before making changes
- Proper cleanup of temporary resources
- Comprehensive logging for troubleshooting

These scripts can be scheduled to run periodically on MikroTik devices to perform automated maintenance tasks.

## Sensitive Information

Sensitive information (passwords, keys, etc.) has been encrypted using the `age` tool and stored in the `/sensitive` subdirectories with `.age` extension. These files require the appropriate private key to decrypt.

## Usage

### Backing Up New Configurations

To back up a new configuration from a MikroTik device:

1. Export the configuration from the device using the appropriate export format
2. Save sensitive parts separately and encrypt them using age
3. Commit the changes to maintain a history of configuration versions

### Restoring Configurations

To restore a configuration to a MikroTik device:

1. Upload the appropriate .rsc file to the device
2. Import the configuration file using the RouterOS terminal:
   ```routeros
   /import file-name=configuration.rsc
   ```
3. Verify the configuration by reviewing logs and testing functionality

### Deploying Scripts

To deploy an automated script to a MikroTik device:

1. Upload the script file to the device
2. Test the script manually by running it in the RouterOS terminal:
   ```routeros
   /system script run script-name
   ```
3. Schedule the script to run periodically if needed:
   ```routeros
   /system scheduler add name=script-name interval=1d on-event="/system script run script-name"
   ```
4. Monitor script execution and logs for errors

## License

Private repository - all rights reserved.
