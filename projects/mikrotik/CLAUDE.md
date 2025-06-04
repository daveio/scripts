# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains RouterOS configuration files for MikroTik network devices. The configuration is organized by device hostname, with each device having its own directory containing one or more `.rsc` files that define the device's configuration.

The main devices are:

- `fw-16c`: A MikroTik RB5009UPr+S+ router (model info found in config comments)
- `fw-7t54`: A MikroTik RB4011iGS+5HacQ2HnD router (model info found in config comments)

Each device directory contains different types of RouterOS script files:

- Full configuration dumps in various formats (default, compact, terse, verbose)
- Specific configuration sections (dhcp, firewall, ipv6)
- Sensitive configurations are encrypted with `age` and stored in the `/sensitive` subdirectory

Additionally, the repository includes:

- `scripts/`: Automated RouterOS scripts for various network maintenance tasks
  - Scripts that fetch external data and update router configurations
  - Utility scripts for common RouterOS operations

## File Format

The `.rsc` files are RouterOS script files that contain configuration commands. The format is specific to MikroTik RouterOS and follows this general pattern:

- Commands are organized hierarchically
- Each command starts with a command path (e.g., `/ip firewall filter`)
- Add/set commands define configuration objects
- Comments are prefixed with `#`
- Variables are defined with `:local` or `:global`
- Control structures include `:if`, `:for`, `:while`, `:do`/`:on-error`

## Working with RouterOS Files

When editing configuration files:

1. Maintain the exact syntax and formatting of RouterOS commands
2. Preserve any model-specific configurations
3. Be aware that changes to these files represent network infrastructure configurations
4. Never modify the sensitive encrypted files (`.age` files)
5. Implement proper error handling in scripts:
   - Use `:do`/`:on-error` blocks for operations that might fail
   - Consider implementing retry logic for network operations
   - Validate fetched content before applying configuration changes
   - Create backups before making potentially destructive changes
   - Provide clear logging for troubleshooting

## RouterOS Scripting Best Practices

When writing or editing RouterOS scripts:

1. Always include descriptive comments and logging
2. Implement proper error handling with `:do`/`:on-error` blocks
3. For network operations:
   - Add timeout parameters to prevent indefinite hanging
   - Implement retry logic with appropriate delays
   - Verify content before applying changes
4. Create backups before making potentially destructive changes
5. Use local variables to avoid namespace conflicts
6. Clean up temporary files and resources
7. Test scripts in a non-production environment before deployment
8. Document script dependencies and prerequisites

## Security Considerations

- The repository contains network configuration for actual devices
- Sensitive information (passwords, keys, etc.) has been encrypted using the `age` tool and stored in the `/sensitive` subdirectory with `.age` extension
- IP addressing information and firewall rules should be treated as sensitive network layout information
- Do not commit unencrypted sensitive configuration
- Regularly audit and rotate encryption keys for sensitive files
