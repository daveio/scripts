# 2024-12-22 12:31:32 by RouterOS 7.17rc3
# software id = H918-81CY
#
# model = RB4011iGS+5HacQ2HnD
# serial number = A283095904E8

# ipv4

/ip firewall address-list
/ip firewall address-list remove [find where !dynamic]

add address=0.0.0.0/8       list=list-v4-bogons  comment="this-network"
add address=100.64.0.0/10   list=list-v4-bogons  comment="cgn"
add address=127.0.0.0/8     list=list-v4-bogons  comment="loopback"
add address=127.0.53.53/32  list=list-v4-bogons  comment="name-collision-occurrence"
add address=169.254.0.0/16  list=list-v4-bogons  comment="link-local"
add address=192.0.0.0/24    list=list-v4-bogons  comment="ietf-proto"
add address=192.0.2.0/24    list=list-v4-bogons  comment="test-net-1"
add address=198.18.0.0/15   list=list-v4-bogons  comment="interconnect-benchmarking"
add address=198.51.100.0/24 list=list-v4-bogons  comment="test-net-2"
add address=203.0.113.0/24  list=list-v4-bogons  comment="test-net-3"
add address=224.0.0.0/4     list=list-v4-bogons  comment="multicast"
add address=240.0.0.0/4     list=list-v4-bogons  comment="reserved"
add address=255.255.255.255 list=list-v4-bogons  comment="broadcast"

add address=10.0.0.0/8      list=list-v4-private comment="private:10.0.0.0/8"
add address=172.16.0.0/12   list=list-v4-private comment="private:172.16.0.0/12"
add address=192.168.0.0/16  list=list-v4-private comment="private:192.168.0.0/16"

/ip firewall connection tracking

set enabled=auto generic-timeout=10m icmp-timeout=10s loose-tcp-tracking=yes tcp-close-timeout=10s tcp-close-wait-timeout=10s tcp-established-timeout=1d tcp-fin-wait-timeout=10s tcp-last-ack-timeout=10s tcp-max-retrans-timeout=5m tcp-syn-received-timeout=5s tcp-syn-sent-timeout=5s tcp-time-wait-timeout=10s tcp-unacked-timeout=5m udp-stream-timeout=3m udp-timeout=10s

/ip firewall filter
/ip firewall filter remove [find where !dynamic]

add action=accept chain=input   disabled=yes                                         comment="input:accept"
add action=accept chain=forward disabled=yes                                         comment="forward:accept"
add action=accept chain=output  disabled=yes                                         comment="output:accept"

add action=jump   chain=input   jump-target=bogons                                   comment="input:jump:bogons"
add action=jump   chain=input   jump-target=accepts                                  comment="input:jump:accepts"
add action=jump   chain=input   jump-target=conntracked                              comment="input:jump:conntracked"
add action=accept chain=input   dst-port=53 protocol=udp                             comment="input:accept:dns"
add action=accept chain=input   dst-port=123 protocol=udp                            comment="input:accept:ntp"
add action=accept chain=input   dst-port=212 protocol=tcp                            comment="input:accept:ssh-alt"
add action=accept chain=input   dst-port=8291 protocol=tcp                           comment="input:accept:winbox"
add action=accept chain=input   in-interface-list=iflist-cpe                         comment="input:accept:iflist-cpe"
add action=accept chain=input   in-interface-list=iflist-vpn                         comment="input:accept:iflist-vpn"
add action=accept chain=input   in-interface-list=iflist-lan                         comment="input:accept:iflist-lan"
add action=drop   chain=input                                                        comment="input:drop:policy"

add action=jump   chain=forward jump-target=bogons                                   comment="forward:jump:bogons"
add action=jump   chain=forward jump-target=accepts                                  comment="forward:jump:accepts"
add action=jump   chain=forward jump-target=conntracked                              comment="forward:jump:conntracked"
add action=accept chain=forward ipsec-policy=in,ipsec                                comment="forward:accept:ipsec:in,ipsec"
add action=accept chain=forward ipsec-policy=out,ipsec                               comment="forward:accept:ipsec:out,ipsec"
add action=accept chain=forward dst-port=32400 in-interface=pppoe-aaisp protocol=tcp comment="forward:accept:plex"
add action=accept chain=forward dst-port=55000 in-interface=pppoe-aaisp protocol=tcp comment="forward:accept:roon-arc"
add action=accept chain=forward in-interface-list=iflist-cpe                         comment="forward:accept:iflist-cpe"
add action=accept chain=forward in-interface-list=iflist-vpn                         comment="forward:accept:iflist-vpn"
add action=accept chain=forward in-interface-list=iflist-lan                         comment="forward:accept:iflist-lan"
add action=drop   chain=forward                                                      comment="forward:drop:policy"

add action=jump   chain=output  jump-target=bogons                                   comment="output:jump:bogons"
add action=jump   chain=output  jump-target=accepts                                  comment="output:jump:accepts"
add action=jump   chain=output  jump-target=conntracked                              comment="output:jump:conntracked"
add action=accept chain=output                                                       comment="output:accept:policy"

add action=drop   chain=bogons  connection-state=invalid                             comment="bogons:drop:connection-state:invalid"
add action=drop   chain=bogons  src-address-list=list-v4-bogons                      comment="bogons:drop:src-address"
add action=drop   chain=bogons  dst-address-list=list-v4-bogons                      comment="bogons:drop:dst-address"
add action=return chain=bogons                                                       comment="bogons:return"

add action=accept chain=accepts protocol=icmp                                        comment="accepts:accept:icmp"
add action=accept chain=accepts protocol=igmp                                        comment="accepts:accept:igmp"
add action=return chain=accepts                                                      comment="accepts:return"

add action=fasttrack-connection chain=conntracked connection-state=established,related,untracked hw-offload=yes comment="conntracked:ft:eru,offload"
add action=accept               chain=conntracked connection-state=established,related,untracked                comment="conntracked:accept:eru"
add action=return               chain=conntracked                                                               comment="conntracked:return"

/ip firewall mangle
/ip firewall mangle remove [find where !dynamic]

/ip firewall nat
/ip firewall nat remove [find where !dynamic]

add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.100.0/24    comment="nat:msq:mgmt"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.101.0/24    comment="nat:msq:private"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.102.0/24    comment="nat:msq:guest"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.103.0/24    comment="nat:msq:iot"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.104.0/24    comment="nat:msq:fstln"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.252.0/24    comment="nat:msq:three"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.253.0/24    comment="nat:msq:ee"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=10.0.254.0/24    comment="nat:msq:aaisp"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=192.168.201.0/24 comment="nat:msq:zt-16c"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=192.168.204.0/24 comment="nat:msq:zt-mgmt"
add action=masquerade chain=srcnat ipsec-policy=out,none out-interface-list=iflist-masquerade src-address=192.168.205.0/24 comment="nat:msq:zt-33b"

add action=dst-nat chain=dstnat dst-address=90.155.88.111 dst-port=32400 in-interface=pppoe-aaisp protocol=tcp to-addresses=10.0.101.10 to-ports=32400 comment="nat:portfw:nas:plex"
add action=dst-nat chain=dstnat dst-address=90.155.88.111 dst-port=55000 in-interface=pppoe-aaisp protocol=tcp to-addresses=10.0.101.10 to-ports=55000 comment="nat:portfw:nas:roon-arc"

/ip firewall service-port

set ftp     disabled=no ports=21
set tftp    disabled=no ports=69
set irc     disabled=no ports=6667
set h323    disabled=no
set sip     disabled=no ports=5060,5061 sip-direct-media=yes sip-timeout=1h
set pptp    disabled=no
set rtsp    disabled=no ports=554
set udplite disabled=no
set dccp    disabled=no
set sctp    disabled=no

# ipv6

/ipv6 firewall address-list
/ipv6 firewall address-list remove [find where !dynamic]

add address=::/128                                list=list-v6-bogons     comment="unicast:unspecified:node-scope"
add address=::1/128                               list=list-v6-bogons     comment="unicast:loopback:node-scope"
add address=::ffff:0.0.0.0/96                     list=list-v6-bogons     comment="ipv4:mapped"
add address=::/96                                 list=list-v6-bogons     comment="ipv4:compat"
add address=100::/64                              list=list-v6-bogons     comment="blackhole"
add address=2001:10::/28                          list=list-v6-bogons     comment="orchid"
add address=2001:db8::/32                         list=list-v6-bogons     comment="documentation"

add address=2002::/24                             list=list-v6-v4-bogons  comment="6to4:0.0.0.0/8"
add address=2002:7f00::/24                        list=list-v6-v4-bogons  comment="6to4:127.0.0.0/8"
add address=2002:a9fe::/32                        list=list-v6-v4-bogons  comment="6to4:169.254.0.0/16"
add address=2002:c000::/40                        list=list-v6-v4-bogons  comment="6to4:192.0.0.0/24"
add address=2002:c000:200::/40                    list=list-v6-v4-bogons  comment="6to4:192.0.2.0/24"
add address=2002:c612::/31                        list=list-v6-v4-bogons  comment="6to4:198.18.0.0/15"
add address=2002:c633:6400::/40                   list=list-v6-v4-bogons  comment="6to4:198.51.100.0/24"
add address=2002:cb00:7100::/40                   list=list-v6-v4-bogons  comment="6to4:203.0.113.0/24"
add address=2002:e000::/20                        list=list-v6-v4-bogons  comment="6to4:224.0.0.0/4"
add address=2002:f000::/20                        list=list-v6-v4-bogons  comment="6to4:240.0.0.0/4"
add address=2002:ffff:ffff::/48                   list=list-v6-v4-bogons  comment="6to4:255.255.255.255/32"
add address=2001::/40                             list=list-v6-v4-bogons  comment="teredo:0.0.0.0/8"
add address=2001:0:7f00::/40                      list=list-v6-v4-bogons  comment="teredo:127.0.0.0/8"
add address=2001:0:a9fe::/48                      list=list-v6-v4-bogons  comment="teredo:169.254.0.0/16"
add address=2001:0:c000::/56                      list=list-v6-v4-bogons  comment="teredo:192.0.0.0/24"
add address=2001:0:c000:200::/56                  list=list-v6-v4-bogons  comment="teredo:192.0.2.0/24"
add address=2001:0:c612::/47                      list=list-v6-v4-bogons  comment="teredo:198.18.0.0/15"
add address=2001:0:c633:6400::/56                 list=list-v6-v4-bogons  comment="teredo:198.51.100.0/24"
add address=2001:0:cb00:7100::/56                 list=list-v6-v4-bogons  comment="teredo:203.0.113.0/24"
add address=2001:0:e000::/36                      list=list-v6-v4-bogons  comment="teredo:224.0.0.0/4"
add address=2001:0:f000::/36                      list=list-v6-v4-bogons  comment="teredo:240.0.0.0/4"
add address=2001:0:ffff:ffff::/64                 list=list-v6-v4-bogons  comment="teredo:255.255.255.255/32"

add address=fc00::/7                              list=list-v6-v4-private comment="ula"
add address=fe80::/10                             list=list-v6-v4-private comment="unicast:link-local"
add address=fec0::/10                             list=list-v6-v4-private comment="unicast:site-local(deprecated)"
add address=ff00::/16                             list=list-v6-v4-private comment="multicast(ff0e:/16:global)"
add address=2002:a00::/24                         list=list-v6-v4-private comment="6to4:10.0.0.0/8"
add address=2002:ac10::/28                        list=list-v6-v4-private comment="6to4:172.16.0.0/12"
add address=2002:c0a8::/32                        list=list-v6-v4-private comment="6to4:192.168.0.0/16"
add address=2001:0:a00::/40                       list=list-v6-v4-private comment="teredo:10.0.0.0/8"
add address=2001:0:ac10::/44                      list=list-v6-v4-private comment="teredo:172.16.0.0/12"
add address=2001:0:c0a8::/48                      list=list-v6-v4-private comment="teredo:192.168.0.0/16"

/ipv6 firewall filter
/ipv6 firewall filter remove [find where !dynamic]

add action=accept chain=input       disabled=yes                                    comment="input:accept"
add action=accept chain=output      disabled=yes                                    comment="forward:accept"
add action=accept chain=forward     disabled=yes                                    comment="output:accept"

add action=jump   chain=input       jump-target=bogons                              comment="input:jump:bogons"
add action=jump   chain=input       jump-target=accepts                             comment="input:jump:accepts"
add action=jump   chain=input       jump-target=conntracked                         comment="input:jump:conntracked"
add action=accept chain=input       dst-port=546 protocol=udp src-address=fe80::/10 comment="input:accept:dhcpv6-pd"
add action=accept chain=input       dst-port=53 protocol=udp                        comment="input:accept:dns"
add action=accept chain=input       dst-port=123 protocol=udp                       comment="input:accept:ntp"
add action=accept chain=input       dst-port=212 protocol=tcp                       comment="input:accept:ssh-alt"
add action=accept chain=input       dst-port=8291 protocol=tcp                      comment="input:accept:winbox"
add action=drop   chain=input                                                       comment="input:drop:policy"

add action=jump   chain=forward     jump-target=bogons                              comment="forward:jump:bogons"
add action=jump   chain=forward     jump-target=accepts                             comment="forward:jump:accepts"
add action=jump   chain=forward     jump-target=conntracked                         comment="forward:jump:conntracked"
add action=accept chain=forward     ipsec-policy=in,ipsec                           comment="forward:accept:ipsec:in,ipsec"
add action=accept chain=forward     ipsec-policy=out,ipsec                          comment="forward:accept:ipsec:in,ipsec"
add action=accept chain=forward     hop-limit=not-equal:1 protocol=icmpv6           comment="forward:accept:icmpv6:hop-limit!=1(rfc4890)"
add action=accept chain=forward     protocol=139                                    comment="forward:accept:hip"
add action=accept chain=forward     dst-port=500,4500 protocol=udp                  comment="forward:accept:ike"
add action=accept chain=forward     protocol=ipsec-ah                               comment="forward:accept:ipsec-ah"
add action=accept chain=forward     protocol=ipsec-esp                              comment="forward:accept:ipsec-esp"
add action=accept chain=forward     in-interface-list=iflist-cpe                    comment="forward:accept:iflist-cpe"
add action=accept chain=forward     in-interface-list=iflist-vpn                    comment="forward:accept:iflist-vpn"
add action=accept chain=forward     in-interface-list=iflist-lan                    comment="forward:accept:iflist-lan"
add action=drop   chain=forward     log-prefix=ipv6-forward-drop                    comment="forward:drop:policy"

add action=jump   chain=output      jump-target=bogons                              comment="output:jump:bogons"
add action=jump   chain=output      jump-target=accepts                             comment="output:jump:accepts"
add action=jump   chain=output      jump-target=conntracked                         comment="output:jump:conntracked"
add action=accept chain=output                                                      comment="output:accept:policy"

add action=drop   chain=bogons      connection-state=invalid                        comment="bogons:drop:connection-state:invalid"
add action=drop   chain=bogons      src-address-list=list-v6-bogons                 comment="bogons:drop:v6:src-address"
add action=drop   chain=bogons      dst-address-list=list-v6-bogons                 comment="bogons:drop:v6:dst-address"
add action=drop   chain=bogons      src-address-list=list-v6-v4-bogons              comment="bogons:drop:v6-v4:src-address"
add action=drop   chain=bogons      dst-address-list=list-v6-v4-bogons              comment="bogons:drop:v6-v4:dst-address"
add action=return chain=bogons                                                      comment="bogons:return"

add action=accept chain=accepts     protocol=icmpv6                                 comment="accepts:accept:icmpv6"
add action=accept chain=accepts     dst-port=500,4500 protocol=udp                  comment="accepts:accept:ike"
add action=accept chain=accepts     protocol=ipsec-ah                               comment="accepts:accept:ipsec-ah"
add action=accept chain=accepts     protocol=ipsec-esp                              comment="accepts:accept:ipsec-esp"
add action=accept chain=accepts     port=33434-33534 protocol=udp                   comment="accepts:accept:traceroute"
add action=return chain=accepts                                                     comment="accepts:return"

add action=accept chain=conntracked connection-state=invalid,established,untracked  comment="conntracked:accept:ieu"
add action=return chain=conntracked                                                 comment="conntracked:return"
