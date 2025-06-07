# RouterOS Policy-Based Routing Monitor and Management Script
# Version: 1.0
# Description: Monitor, test, and manage policy-based routing configurations
# Dependencies: Requires pbr.rsc to be deployed first

# ============================================================================
# CONFIGURATION SECTION
# ============================================================================

:local scriptName "PBR-Monitor"
:local scriptVersion "1.0"
:local debugMode true

# Configuration matching the main PBR script
:local pbrAddressList "putio"
:local pbrRoutingTable "putio-route"
:local pbrConnectionMark "putio-conn"
:local pbrConnectionMarkV6 "putio-conn-v6"

# Test parameters
:local testTimeout 5
:local healthCheckInterval 300  # 5 minutes

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Enhanced logging function
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

# Status checking function
:local checkPBRStatus do={
    :local status "OK"
    :local issues {}

    $logMessage "INFO" "Checking PBR configuration status..."

    # Check address list
    :local addressCount [:len [/ip firewall address-list find list=$pbrAddressList]]
    :local addressCountV6 [:len [/ipv6 firewall address-list find list=$pbrAddressList]]

    :if ($addressCount = 0 && $addressCountV6 = 0) do={
        :set status "ERROR"
        :set issues ($issues, "No address list entries found")
    } else={
        $logMessage "INFO" "Address list entries: IPv4=$addressCount, IPv6=$addressCountV6"
    }

    # Check routing table
    :if ([:len [/routing table find name=$pbrRoutingTable]] = 0) do={
        :set status "ERROR"
        :set issues ($issues, "Routing table '$pbrRoutingTable' not found")
    } else={
        $logMessage "INFO" "Routing table '$pbrRoutingTable' exists"
    }

    # Check routes in PBR table
    :local routeCount [:len [/ip route find routing-table=$pbrRoutingTable]]
    :local routeCountV6 [:len [/ipv6 route find routing-table=$pbrRoutingTable]]

    :if ($routeCount = 0 && $routeCountV6 = 0) do={
        :set status "ERROR"
        :set issues ($issues, "No routes in PBR table")
    } else={
        $logMessage "INFO" "PBR routes: IPv4=$routeCount, IPv6=$routeCountV6"
    }

    # Check mangle rules
    :local mangleCount [:len [/ip firewall mangle find comment~"Put\\\\.io.*traffic"]
    :local mangleCountV6 [:len [/ipv6 firewall mangle find comment~"Put\\\\.io.*traffic"]

    :if ($mangleCount = 0 && $mangleCountV6 = 0) do={
        :set status "ERROR"
        :set issues ($issues, "No mangle rules found")
    } else={
        $logMessage "INFO" "Mangle rules: IPv4=$mangleCount, IPv6=$mangleCountV6"
    }

    # Report status
    :if ($status = "OK") do={
        $logMessage "INFO" "PBR configuration status: HEALTHY"
    } else={
        $logMessage "ERROR" "PBR configuration status: UNHEALTHY"
        :foreach issue in=$issues do={
            $logMessage "ERROR" "Issue: $issue"
        }
    }

    :return $status
}

# Traffic statistics function
:local showTrafficStats do={
    $logMessage "INFO" "=== PBR Traffic Statistics ==="

    # Connection statistics
    :local connStats [/ip firewall connection print count-only where connection-mark=$pbrConnectionMark]
    :local connStatsV6 [/ipv6 firewall connection print count-only where connection-mark=$pbrConnectionMarkV6]

    $logMessage "INFO" "Active connections: IPv4=$connStats, IPv6=$connStatsV6"

    # Mangle rule statistics
    $logMessage "INFO" "Mangle rule statistics:"
    :foreach rule in=[/ip firewall mangle find comment~"Put\\\\.io.*traffic"] do={
        :local ruleComment [/ip firewall mangle get $rule comment]
        :local packets [/ip firewall mangle get $rule packets]
        :local bytes [/ip firewall mangle get $rule bytes]
        $logMessage "INFO" "  $ruleComment: $packets packets, $bytes bytes"
    }

    :foreach rule in=[/ipv6 firewall mangle find comment~"Put\\\\.io.*traffic"] do={
        :local ruleComment [/ipv6 firewall mangle get $rule comment]
        :local packets [/ipv6 firewall mangle get $rule packets]
        :local bytes [/ipv6 firewall mangle get $rule bytes]
        $logMessage "INFO" "  $ruleComment: $packets packets, $bytes bytes"
    }
}

# Route testing function
:local testRoutes do={
    $logMessage "INFO" "Testing PBR routes..."

    # Get route information
    :local routes [/ip route find routing-table=$pbrRoutingTable dst-address="0.0.0.0/0"]
    :local routesV6 [/ipv6 route find routing-table=$pbrRoutingTable dst-address="::/0"]

    :if ([:len $routes] > 0) do={
        :local gateway [/ip route get [:pick $routes 0] gateway]
        $logMessage "INFO" "Testing IPv4 alternative gateway: $gateway"

        :do {
            /tool ping $gateway count=3 timeout=($testTimeout . "s")
            $logMessage "INFO" "IPv4 alternative gateway is reachable"
        } on-error={
            $logMessage "ERROR" "IPv4 alternative gateway is unreachable"
        }
    }

    :if ([:len $routesV6] > 0) do={
        :local gatewayV6 [/ipv6 route get [:pick $routesV6 0] gateway]
        $logMessage "INFO" "Testing IPv6 alternative gateway: $gatewayV6"

        :do {
            /tool ping $gatewayV6 count=3 timeout=($testTimeout . "s")
            $logMessage "INFO" "IPv6 alternative gateway is reachable"
        } on-error={
            $logMessage "ERROR" "IPv6 alternative gateway is unreachable"
        }
    }
}

# Configuration display function
:local showConfig do={
    $logMessage "INFO" "=== Current PBR Configuration ==="

    # Show address list entries
    $logMessage "INFO" "Address List Entries:"
    :foreach entry in=[/ip firewall address-list find list=$pbrAddressList] do={
        :local address [/ip firewall address-list get $entry address]
        :local comment [/ip firewall address-list get $entry comment]
        $logMessage "INFO" "  IPv4: $address ($comment)"
    }

    :foreach entry in=[/ipv6 firewall address-list find list=$pbrAddressList] do={
        :local address [/ipv6 firewall address-list get $entry address]
        :local comment [/ipv6 firewall address-list get $entry comment]
        $logMessage "INFO" "  IPv6: $address ($comment)"
    }

    # Show routing table
    $logMessage "INFO" "Routing Table: $pbrRoutingTable"
    :foreach route in=[/ip route find routing-table=$pbrRoutingTable] do={
        :local dst [/ip route get $route dst-address]
        :local gateway [/ip route get $route gateway]
        :local distance [/ip route get $route distance]
        $logMessage "INFO" "  IPv4 Route: $dst via $gateway (distance: $distance)"
    }

    :foreach route in=[/ipv6 route find routing-table=$pbrRoutingTable] do={
        :local dst [/ipv6 route get $route dst-address]
        :local gateway [/ipv6 route get $route gateway]
        :local distance [/ipv6 route get $route distance]
        $logMessage "INFO" "  IPv6 Route: $dst via $gateway (distance: $distance)"
    }
}

# Cleanup function
:local cleanupPBR do={
    $logMessage "WARNING" "Starting PBR configuration cleanup..."

    :do {
        # Remove mangle rules
        :local mangleRules [/ip firewall mangle find comment~"Put\\\\.io.*PBR-Putio"]
        :if ([:len $mangleRules] > 0) do={
            $logMessage "INFO" "Removing IPv4 mangle rules..."
            /ip firewall mangle remove $mangleRules
        }

        :local mangleRulesV6 [/ipv6 firewall mangle find comment~"Put\\\\.io.*PBR-Putio"]
        :if ([:len $mangleRulesV6] > 0) do={
            $logMessage "INFO" "Removing IPv6 mangle rules..."
            /ipv6 firewall mangle remove $mangleRulesV6
        }

        # Remove raw rules
        :local rawRules [/ip firewall raw find comment~"Put\\\\.io.*PBR-Putio"]
        :if ([:len $rawRules] > 0) do={
            $logMessage "INFO" "Removing IPv4 raw rules..."
            /ip firewall raw remove $rawRules
        }

        :local rawRulesV6 [/ipv6 firewall raw find comment~"Put\\\\.io.*PBR-Putio"]
        :if ([:len $rawRulesV6] > 0) do={
            $logMessage "INFO" "Removing IPv6 raw rules..."
            /ipv6 firewall raw remove $rawRulesV6
        }

        # Remove NAT rules
        :local natRules [/ip firewall nat find comment~"Put\\\\.io.*PBR-Putio"]
        :if ([:len $natRules] > 0) do={
            $logMessage "INFO" "Removing NAT rules..."
            /ip firewall nat remove $natRules
        }

        # Remove routes
        :local routes [/ip route find routing-table=$pbrRoutingTable]
        :if ([:len $routes] > 0) do={
            $logMessage "INFO" "Removing IPv4 routes..."
            /ip route remove $routes
        }

        :local routesV6 [/ipv6 route find routing-table=$pbrRoutingTable]
        :if ([:len $routesV6] > 0) do={
            $logMessage "INFO" "Removing IPv6 routes..."
            /ipv6 route remove $routesV6
        }

        # Remove routing table
        :local routingTable [/routing table find name=$pbrRoutingTable]
        :if ([:len $routingTable] > 0) do={
            $logMessage "INFO" "Removing routing table..."
            /routing table remove $routingTable
        }

        # Remove address lists
        :local addrList [/ip firewall address-list find list=$pbrAddressList]
        :if ([:len $addrList] > 0) do={
            $logMessage "INFO" "Removing IPv4 address list..."
            /ip firewall address-list remove $addrList
        }

        :local addrListV6 [/ipv6 firewall address-list find list=$pbrAddressList]
        :if ([:len $addrListV6] > 0) do={
            $logMessage "INFO" "Removing IPv6 address list..."
            /ipv6 firewall address-list remove $addrListV6
        }

        $logMessage "INFO" "PBR configuration cleanup completed successfully"

    } on-error={
        $logMessage "ERROR" "Error during cleanup process"
    }
}

# ============================================================================
# MAIN SCRIPT FUNCTIONS
# ============================================================================

# Main function dispatcher
:local action $1

:if ($action = "status" || $action = "") do={
    [$checkPBRStatus]
} else={
    :if ($action = "stats") do={
        [$showTrafficStats]
    } else={
        :if ($action = "test") do={
            [$testRoutes]
        } else={
            :if ($action = "show") do={
                [$showConfig]
            } else={
                :if ($action = "cleanup") do={
                    [$cleanupPBR]
                } else={
                    :if ($action = "monitor") do={
                        # Continuous monitoring mode
                        $logMessage "INFO" "Starting continuous monitoring mode (interval: $healthCheckInterval seconds)"
                        :while (true) do={
                            [$checkPBRStatus]
                            [$testRoutes]
                            :delay ($healthCheckInterval . "s")
                        }
                    } else={
                        # Display help
                        $logMessage "INFO" "PBR Monitor Script Usage:"
                        $logMessage "INFO" "  status  - Check PBR configuration status (default)"
                        $logMessage "INFO" "  stats   - Show traffic statistics"
                        $logMessage "INFO" "  test    - Test gateway reachability"
                        $logMessage "INFO" "  show    - Display current configuration"
                        $logMessage "INFO" "  cleanup - Remove all PBR configuration"
                        $logMessage "INFO" "  monitor - Start continuous monitoring"
                        $logMessage "INFO" ""
                        $logMessage "INFO" "Examples:"
                        $logMessage "INFO" "  /system script run pbr-monitor"
                        $logMessage "INFO" "  /system script run pbr-monitor parameter=stats"
                        $logMessage "INFO" "  /system script run pbr-monitor parameter=test"
                    }
                }
            }
        }
    }
}

$logMessage "INFO" "Monitor script execution completed"
