# RouterOS Policy-Based Routing Script for putio traffic
# This script routes traffic matching address lists through alternative gateways

# === CONFIGURATION VARIABLES ===
# Replace these placeholders with your actual values
:local mainGatewayIPv4 "YOUR_MAIN_GATEWAY_IPv4"
:local mainGatewayIPv6 "YOUR_MAIN_GATEWAY_IPv6"
:local altGatewayIPv4 "YOUR_ALT_GATEWAY_IPv4"
:local altGatewayIPv6 "YOUR_ALT_GATEWAY_IPv6"
:local altGatewayInterface "YOUR_ALT_INTERFACE"  # e.g., ether2, pppoe-out1

# === CREATE ADDRESS LISTS ===
# IPv4 Address List
/ip firewall address-list
add list=putio address=IPv4_ADDRESS_1 comment="Put.io IPv4"
add list=putio address=IPv4_ADDRESS_2 comment="Put.io IPv4"
add list=putio address=IPv4_SUBNET/24 comment="Put.io IPv4 subnet"

# IPv6 Address List
/ipv6 firewall address-list
add list=putio address=IPv6_ADDRESS_1 comment="Put.io IPv6"
add list=putio address=IPv6_ADDRESS_2 comment="Put.io IPv6"
add list=putio address=IPv6_PREFIX::/64 comment="Put.io IPv6 prefix"

# === CREATE ROUTING TABLES ===
/routing table
add name=putio-route fib comment="Routing table for Put.io traffic"

# === CREATE ROUTING RULES ===
# IPv4 Routes
/ip route
# Main default route (if not already exists)
add dst-address=0.0.0.0/0 gateway=$mainGatewayIPv4 distance=1 comment="Main IPv4 default route"
# Alternative route for marked traffic
add dst-address=0.0.0.0/0 gateway=$altGatewayIPv4 distance=1 routing-table=putio-route comment="Put.io IPv4 route"

# IPv6 Routes
/ipv6 route
# Main default route (if not already exists)
add dst-address=::/0 gateway=$mainGatewayIPv6 distance=1 comment="Main IPv6 default route"
# Alternative route for marked traffic
add dst-address=::/0 gateway=$altGatewayIPv6 distance=1 routing-table=putio-route comment="Put.io IPv6 route"

# === CREATE MANGLE RULES ===
# IPv4 Mangle Rules
/ip firewall mangle
# Mark connections TO putio addresses
add chain=prerouting dst-address-list=putio action=mark-connection \
    new-connection-mark=putio-conn passthrough=yes comment="Mark connections TO Put.io IPv4"
# Mark connections FROM putio addresses
add chain=prerouting src-address-list=putio action=mark-connection \
    new-connection-mark=putio-conn passthrough=yes comment="Mark connections FROM Put.io IPv4"
# Mark routing for putio connections
add chain=prerouting connection-mark=putio-conn action=mark-routing \
    new-routing-mark=putio-route passthrough=no comment="Route Put.io IPv4 traffic"

# IPv6 Mangle Rules
/ipv6 firewall mangle
# Mark connections TO putio addresses
add chain=prerouting dst-address-list=putio action=mark-connection \
    new-connection-mark=putio-conn-v6 passthrough=yes comment="Mark connections TO Put.io IPv6"
# Mark connections FROM putio addresses
add chain=prerouting src-address-list=putio action=mark-connection \
    new-connection-mark=putio-conn-v6 passthrough=yes comment="Mark connections FROM Put.io IPv6"
# Mark routing for putio connections
add chain=prerouting connection-mark=putio-conn-v6 action=mark-routing \
    new-routing-mark=putio-route passthrough=no comment="Route Put.io IPv6 traffic"

# === NAT RULES (if needed) ===
# If your alternative gateway requires NAT
/ip firewall nat
add chain=srcnat out-interface=$altGatewayInterface action=masquerade \
    comment="NAT for Put.io traffic through alternative gateway"

# === OPTIONAL: CONNECTION TRACKING BYPASS ===
# For better performance with streaming traffic
/ip firewall raw
add chain=prerouting dst-address-list=putio action=notrack comment="Bypass conntrack for Put.io IPv4"
add chain=prerouting src-address-list=putio action=notrack comment="Bypass conntrack from Put.io IPv4"

/ipv6 firewall raw
add chain=prerouting dst-address-list=putio action=notrack comment="Bypass conntrack for Put.io IPv6"
add chain=prerouting src-address-list=putio action=notrack comment="Bypass conntrack from Put.io IPv6"