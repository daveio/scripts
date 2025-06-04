# RouterOS Enhanced Policy-Based Routing Script
# Version: 2.0
# Description: Advanced routing script for put.io traffic with comprehensive error handling,
#              logging, validation, and backup functionality
# Author: Generated for MikroTik network infrastructure
# Dependencies: RouterOS v7.0+ recommended

# ============================================================================
# CONFIGURATION SECTION
# ============================================================================

# Script configuration - modify these variables as needed
:local scriptName "PBR-Putio"
:local scriptVersion "2.0"
:local debugMode true
:local createBackup true
:local validateGateways true
:local maxRetries 3
:local retryDelay 2

# Network configuration - replace with your actual values
:local mainGatewayIPv4 "YOUR_MAIN_GATEWAY_IPv4"
:local mainGatewayIPv6 "YOUR_MAIN_GATEWAY_IPv6"
:local altGatewayIPv4 "YOUR_ALT_GATEWAY_IPv4"
:local altGatewayIPv6 "YOUR_ALT_GATEWAY_IPv6"
:local altGatewayInterface "YOUR_ALT_INTERFACE"  # e.g., ether2, pppoe-out1

# Put.io address configuration
:local pbrAddressList "putio"
:local pbrRoutingTable "putio-route"
:local pbrConnectionMark "putio-conn"
:local pbrConnectionMarkV6 "putio-conn-v6"

# Put.io addresses - replace with actual addresses
:local putioAddressesIPv4 {
    "IPv4_ADDRESS_1";
    "IPv4_ADDRESS_2";
    "IPv4_SUBNET/24"
}

:local putioAddressesIPv6 {
    "IPv6_ADDRESS_1";
    "IPv6_ADDRESS_2";
    "IPv6_PREFIX::/64"
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Enhanced logging function with timestamps and levels
:local logMessage do={
    :local level $1
    :local message $2
    :local timestamp [/system clock get time]
    :local date [/system clock get date]
    :local logEntry "[$date $timestamp] [$level] $scriptName v$scriptVersion: $message"

    :if ($level = "ERROR") do={
        :log error $logEntry
    } else={
        :if ($level = "WARNING") do={
            :log warning $logEntry
        } else={
            :log info $logEntry
        }
    }

    :if ($debugMode) do={
        :put $logEntry
    }
}

# Configuration validation function
:local validateConfig do={
    :local errors 0

    $logMessage "INFO" "Validating configuration parameters..."

    # Check if required variables are set
    :if ($mainGatewayIPv4 = "YOUR_MAIN_GATEWAY_IPv4") do={
        $logMessage "ERROR" "Main IPv4 gateway not configured"
        :set errors ($errors + 1)
    }

    :if ($altGatewayIPv4 = "YOUR_ALT_GATEWAY_IPv4") do={
        $logMessage "ERROR" "Alternative IPv4 gateway not configured"
        :set errors ($errors + 1)
    }

    :if ($altGatewayInterface = "YOUR_ALT_INTERFACE") do={
        $logMessage "ERROR" "Alternative interface not configured"
        :set errors ($errors + 1)
    }

    # Validate IP addresses format (basic check)
    :do {
        :toip $mainGatewayIPv4
        :toip $altGatewayIPv4
    } on-error={
        $logMessage "ERROR" "Invalid IPv4 gateway address format"
        :set errors ($errors + 1)
    }

    # Check if interface exists
    :if ([:len [/interface find name=$altGatewayInterface]] = 0) do={
        $logMessage "ERROR" "Alternative interface '$altGatewayInterface' not found"
        :set errors ($errors + 1)
    }

    :return $errors
}

# Gateway reachability test
:local testGateway do={
    :local gateway $1
    :local description $2
    :local reachable false

    $logMessage "INFO" "Testing reachability of $description ($gateway)..."

    :for i from=1 to=$maxRetries do={
        :do {
            /tool ping $gateway count=1 timeout=3s
            :set reachable true
            $logMessage "INFO" "$description is reachable"
            :return true
        } on-error={
            $logMessage "WARNING" "Ping attempt $i to $description failed"
            :if ($i < $maxRetries) do={
                :delay ($retryDelay . "s")
            }
        }
    }

    :if (!$reachable) do={
        $logMessage "ERROR" "$description is not reachable after $maxRetries attempts"
    }

    :return $reachable
}

# Backup creation function
:local createConfigBackup do={
    :if (!$createBackup) do={
        :return true
    }

    :local backupName ("pbr-backup-" . [/system clock get date] . "-" . [/system clock get time])
    # Remove colons from time for valid filename
    :set backupName [:tostr [:pick $backupName 0 [:find $backupName ":"]]]

    $logMessage "INFO" "Creating configuration backup: $backupName"

    :do {
        /system backup save name=$backupName
        $logMessage "INFO" "Backup created successfully"
        :return true
    } on-error={
        $logMessage "ERROR" "Failed to create backup"
        :return false
    }
}

# Cleanup function for failed operations
:local cleanupOnError do={
    $logMessage "WARNING" "Cleaning up after error..."

    # Remove any partially created rules
    :do {
        /ip firewall mangle remove [find comment~"Put\\.io.*traffic"]
        /ipv6 firewall mangle remove [find comment~"Put\\.io.*traffic"]
        /ip firewall address-list remove [find list=$pbrAddressList]
        /ipv6 firewall address-list remove [find list=$pbrAddressList]
        /routing table remove [find name=$pbrRoutingTable]
    } on-error={
        # Ignore cleanup errors
    }

    $logMessage "INFO" "Cleanup completed"
}

# ============================================================================
# MAIN SCRIPT EXECUTION
# ============================================================================

$logMessage "INFO" "Starting policy-based routing configuration..."

# Validate configuration
:if ([$validateConfig] > 0) do={
    $logMessage "ERROR" "Configuration validation failed. Aborting."
    :error "Configuration validation failed"
}

# Test gateway reachability if enabled
:if ($validateGateways) do={
    :if (![$testGateway $mainGatewayIPv4 "Main IPv4 Gateway"]) do={
        $logMessage "WARNING" "Main gateway not reachable, continuing anyway..."
    }

    :if (![$testGateway $altGatewayIPv4 "Alternative IPv4 Gateway"]) do={
        $logMessage "WARNING" "Alternative gateway not reachable, continuing anyway..."
    }
}

# Create configuration backup
:if (![$createConfigBackup]) do={
    $logMessage "ERROR" "Backup creation failed. Aborting for safety."
    :error "Backup creation failed"
}

# ============================================================================
# CONFIGURATION IMPLEMENTATION
# ============================================================================

:do {
    $logMessage "INFO" "Creating address lists..."

    # Remove existing address lists to avoid conflicts
    /ip firewall address-list remove [find list=$pbrAddressList]
    /ipv6 firewall address-list remove [find list=$pbrAddressList]

    # Create IPv4 address list
    :foreach address in=$putioAddressesIPv4 do={
        :if ($address != "IPv4_ADDRESS_1" && $address != "IPv4_ADDRESS_2" && $address != "IPv4_SUBNET/24") do={
            $logMessage "INFO" "Adding IPv4 address: $address"
            /ip firewall address-list add list=$pbrAddressList address=$address comment="Put.io IPv4 - $scriptName"
        }
    }

    # Create IPv6 address list
    :foreach address in=$putioAddressesIPv6 do={
        :if ($address != "IPv6_ADDRESS_1" && $address != "IPv6_ADDRESS_2" && $address != "IPv6_PREFIX::/64") do={
            $logMessage "INFO" "Adding IPv6 address: $address"
            /ipv6 firewall address-list add list=$pbrAddressList address=$address comment="Put.io IPv6 - $scriptName"
        }
    }

    $logMessage "INFO" "Creating routing table..."

    # Remove existing routing table
    /routing table remove [find name=$pbrRoutingTable]

    # Create routing table
    /routing table add name=$pbrRoutingTable fib comment="PBR table for Put.io traffic - $scriptName"

    $logMessage "INFO" "Configuring routes..."

    # IPv4 Routes
    :local mainRouteExists false
    :if ([:len [/ip route find dst-address="0.0.0.0/0" gateway=$mainGatewayIPv4]] > 0) do={
        :set mainRouteExists true
    }

    :if (!$mainRouteExists) do={
        $logMessage "INFO" "Adding main IPv4 default route"
        /ip route add dst-address=0.0.0.0/0 gateway=$mainGatewayIPv4 distance=1 comment="Main IPv4 default route - $scriptName"
    }

    # Remove existing alternative route
    /ip route remove [find dst-address="0.0.0.0/0" routing-table=$pbrRoutingTable]

    $logMessage "INFO" "Adding alternative IPv4 route"
    /ip route add dst-address=0.0.0.0/0 gateway=$altGatewayIPv4 distance=1 routing-table=$pbrRoutingTable comment="Put.io IPv4 route - $scriptName"

    # IPv6 Routes (if configured)
    :if ($mainGatewayIPv6 != "YOUR_MAIN_GATEWAY_IPv6" && $altGatewayIPv6 != "YOUR_ALT_GATEWAY_IPv6") do={
        :local mainRouteV6Exists false
        :if ([:len [/ipv6 route find dst-address="::/0" gateway=$mainGatewayIPv6]] > 0) do={
            :set mainRouteV6Exists true
        }

        :if (!$mainRouteV6Exists) do={
            $logMessage "INFO" "Adding main IPv6 default route"
            /ipv6 route add dst-address=::/0 gateway=$mainGatewayIPv6 distance=1 comment="Main IPv6 default route - $scriptName"
        }

        # Remove existing alternative IPv6 route
        /ipv6 route remove [find dst-address="::/0" routing-table=$pbrRoutingTable]

        $logMessage "INFO" "Adding alternative IPv6 route"
        /ipv6 route add dst-address=::/0 gateway=$altGatewayIPv6 distance=1 routing-table=$pbrRoutingTable comment="Put.io IPv6 route - $scriptName"
    }

    $logMessage "INFO" "Configuring mangle rules..."

    # Remove existing mangle rules
    /ip firewall mangle remove [find comment~"Put\\.io.*traffic.*$scriptName"]
    /ipv6 firewall mangle remove [find comment~"Put\\.io.*traffic.*$scriptName"]

    # IPv4 Mangle Rules
    /ip firewall mangle add chain=prerouting dst-address-list=$pbrAddressList action=mark-connection \
        new-connection-mark=$pbrConnectionMark passthrough=yes comment="Mark connections TO Put.io IPv4 - $scriptName"

    /ip firewall mangle add chain=prerouting src-address-list=$pbrAddressList action=mark-connection \
        new-connection-mark=$pbrConnectionMark passthrough=yes comment="Mark connections FROM Put.io IPv4 - $scriptName"

    /ip firewall mangle add chain=prerouting connection-mark=$pbrConnectionMark action=mark-routing \
        new-routing-mark=$pbrRoutingTable passthrough=no comment="Route Put.io IPv4 traffic - $scriptName"

    # IPv6 Mangle Rules (if IPv6 configured)
    :if ($mainGatewayIPv6 != "YOUR_MAIN_GATEWAY_IPv6") do={
        /ipv6 firewall mangle add chain=prerouting dst-address-list=$pbrAddressList action=mark-connection \
            new-connection-mark=$pbrConnectionMarkV6 passthrough=yes comment="Mark connections TO Put.io IPv6 - $scriptName"

        /ipv6 firewall mangle add chain=prerouting src-address-list=$pbrAddressList action=mark-connection \
            new-connection-mark=$pbrConnectionMarkV6 passthrough=yes comment="Mark connections FROM Put.io IPv6 - $scriptName"

        /ipv6 firewall mangle add chain=prerouting connection-mark=$pbrConnectionMarkV6 action=mark-routing \
            new-routing-mark=$pbrRoutingTable passthrough=no comment="Route Put.io IPv6 traffic - $scriptName"
    }

    $logMessage "INFO" "Configuring NAT rules..."

    # Remove existing NAT rule
    /ip firewall nat remove [find comment~"Put\\.io.*$scriptName"]

    # NAT rule for alternative gateway
    /ip firewall nat add chain=srcnat out-interface=$altGatewayInterface action=masquerade \
        comment="NAT for Put.io traffic through alternative gateway - $scriptName"

    $logMessage "INFO" "Configuring connection tracking bypass for performance..."

    # Remove existing raw rules
    /ip firewall raw remove [find comment~"Put\\.io.*$scriptName"]
    /ipv6 firewall raw remove [find comment~"Put\\.io.*$scriptName"]

    # IPv4 connection tracking bypass
    /ip firewall raw add chain=prerouting dst-address-list=$pbrAddressList action=notrack \
        comment="Bypass conntrack for Put.io IPv4 - $scriptName"
    /ip firewall raw add chain=prerouting src-address-list=$pbrAddressList action=notrack \
        comment="Bypass conntrack from Put.io IPv4 - $scriptName"

    # IPv6 connection tracking bypass (if configured)
    :if ($mainGatewayIPv6 != "YOUR_MAIN_GATEWAY_IPv6") do={
        /ipv6 firewall raw add chain=prerouting dst-address-list=$pbrAddressList action=notrack \
            comment="Bypass conntrack for Put.io IPv6 - $scriptName"
        /ipv6 firewall raw add chain=prerouting src-address-list=$pbrAddressList action=notrack \
            comment="Bypass conntrack from Put.io IPv6 - $scriptName"
    }

    $logMessage "INFO" "Policy-based routing configuration completed successfully!"

    # Display configuration summary
    $logMessage "INFO" "Configuration Summary:"
    $logMessage "INFO" "- Address list: $pbrAddressList"
    $logMessage "INFO" "- Routing table: $pbrRoutingTable"
    $logMessage "INFO" "- Main IPv4 Gateway: $mainGatewayIPv4"
    $logMessage "INFO" "- Alternative IPv4 Gateway: $altGatewayIPv4"
    $logMessage "INFO" "- Alternative Interface: $altGatewayInterface"
    :if ($mainGatewayIPv6 != "YOUR_MAIN_GATEWAY_IPv6") do={
        $logMessage "INFO" "- Main IPv6 Gateway: $mainGatewayIPv6"
        $logMessage "INFO" "- Alternative IPv6 Gateway: $altGatewayIPv6"
    }

} on-error={
    $logMessage "ERROR" "Configuration failed! Rolling back changes..."
    $cleanupOnError
    :error "Policy-based routing configuration failed"
}

$logMessage "INFO" "Script execution completed successfully"