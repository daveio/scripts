/interface 6to4 add comment="Hurricane Electric IPv6 Tunnel Broker" disabled=no local-address=81.106.100.86 mtu=1280 name=sit1 remote-address=216.66.80.26
/ipv6 route add comment="" disabled=no distance=1 dst-address=2000::/3 gateway=2001:470:1f08:cc::1 scope=30 target-scope=10
/ipv6 address add address=2001:470:1f08:cc::2/64 advertise=no disabled=no eui-64=no interface=sit1
