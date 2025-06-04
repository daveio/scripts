# 2025-05-04 21:45:50 by RouterOS 7.19rc1
# software id = KH3M-8RQA
#
# model = RB5009UPr+S+
# serial number = HE108J2C6WG
/interface bridge add add-dhcp-option82=yes admin-mac=48:A9:8A:34:3C:D6 auto-mac=no dhcp-snooping=yes igmp-snooping=yes name=br-private port-cost-mode=short
/interface ethernet set [ find default-name=ether1 ] name=ether1-virgin
/interface ethernet set [ find default-name=ether2 ] name=ether2-vodafone
/interface ethernet set [ find default-name=ether3 ] name=ether3-raspi
/interface ethernet set [ find default-name=ether4 ] name=ether4-private
/interface ethernet set [ find default-name=ether5 ] disabled=yes
/interface ethernet set [ find default-name=ether6 ] disabled=yes
/interface ethernet set [ find default-name=ether7 ] disabled=yes
/interface ethernet set [ find default-name=ether8 ] disabled=yes
/interface ethernet set [ find default-name=sfp-sfpplus1 ] disabled=yes name=sfp
/interface wireguard add comment=back-to-home-vpn listen-port=22092 mtu=1420 name=back-to-home-vpn
/interface vlan add interface=br-private name=vlan-dave vlan-id=1000
/interface list add name=iflist-wan
/interface list add name=iflist-lan
/interface list add name=iflist-cpe
/interface list add name=iflist-vpn
/interface list add name=iflist-auto-lan
/interface list add name=iflist-auto-wan
/interface list add name=iflist-auto-internet
/interface list add include=iflist-lan,iflist-vpn name=iflist-admin
/interface list add include=iflist-cpe,iflist-wan name=iflist-masquerade
/iot lora servers add address=eu.mikrotik.thethings.industries name=TTN-EU protocol=UDP
/iot lora servers add address=us.mikrotik.thethings.industries name=TTN-US protocol=UDP
/iot lora servers add address=eu1.cloud.thethings.industries name="TTS Cloud (eu1)" protocol=UDP
/iot lora servers add address=nam1.cloud.thethings.industries name="TTS Cloud (nam1)" protocol=UDP
/iot lora servers add address=au1.cloud.thethings.industries name="TTS Cloud (au1)" protocol=UDP
/iot lora servers add address=eu1.cloud.thethings.network name="TTN V3 (eu1)" protocol=UDP
/iot lora servers add address=nam1.cloud.thethings.network name="TTN V3 (nam1)" protocol=UDP
/iot lora servers add address=au1.cloud.thethings.network name="TTN V3 (au1)" protocol=UDP
/ip pool add name=poolv4-br-private-dhcp ranges=10.0.99.100-10.0.99.199
/ip pool add name=poolv4-vlan-dave-dhcp ranges=10.0.98.100-10.0.98.199
/ip dhcp-server add address-pool=poolv4-br-private-dhcp interface=br-private lease-time=10m name=dhcp-br-private
/ip dhcp-server add address-pool=poolv4-vlan-dave-dhcp interface=vlan-dave lease-time=10m name=dhcp-vlan-dave
/ip smb users set [ find default=yes ] disabled=yes
/interface l2tp-client add add-default-route=yes connect-to=194.4.172.12 default-route-distance=30 disabled=no name=l2tp-aaisp profile=default user=dw121@a.2
/routing table add disabled=no fib name=dave
/zerotier set zt-central disabled=no disabled=no name=zt-central
/zerotier interface add allow-default=no allow-global=no allow-managed=yes disabled=no instance=zt-central name=zt-backplane network=8bd5124fd63a0d47
/interface bridge port add bridge=br-private interface=ether4-private internal-path-cost=10 path-cost=10
/interface bridge settings set use-ip-firewall=yes use-ip-firewall-for-pppoe=yes use-ip-firewall-for-vlan=yes
/ip firewall connection tracking set udp-timeout=10s
/ip neighbor discovery-settings set discover-interface-list=all
/ip settings set tcp-syncookies=yes
/interface detect-internet set detect-interface-list=all internet-interface-list=iflist-auto-internet lan-interface-list=iflist-auto-lan wan-interface-list=iflist-auto-wan
/interface list member add interface=br-private list=iflist-lan
/interface list member add interface=ether3-raspi list=iflist-lan
/interface list member add interface=ether1-virgin list=iflist-wan
/interface list member add interface=ether2-vodafone list=iflist-wan
/interface list member add interface=ether1-virgin list=iflist-cpe
/interface list member add interface=ether2-vodafone list=iflist-cpe
/interface list member add interface=zt-backplane list=iflist-vpn
/interface list member add interface=*C list=iflist-vpn
/interface list member add interface=vlan-dave list=iflist-lan
/interface list member add interface=l2tp-aaisp list=iflist-masquerade
/interface list member add interface=ether1-virgin list=iflist-masquerade
/interface list member add interface=ether2-vodafone list=iflist-masquerade
/interface list member add interface=l2tp-aaisp list=iflist-wan
/interface ovpn-server server add mac-address=FE:33:98:AA:F1:63 name=ovpn-server1
/ip address add address=10.0.99.1/24 interface=br-private network=10.0.99.0
/ip address add address=192.168.100.2/24 interface=ether1-virgin network=192.168.100.0
/ip address add address=10.0.98.1/24 interface=vlan-dave network=10.0.98.0
/ip cloud set back-to-home-vpn=enabled ddns-enabled=yes ddns-update-interval=1h
/ip dhcp-client add default-route-distance=10 interface=ether1-virgin use-peer-dns=no use-peer-ntp=no
/ip dhcp-client add default-route-distance=20 interface=ether2-vodafone use-peer-dns=no use-peer-ntp=no
/ip dhcp-server lease add address=10.0.99.10 client-id=1:0:11:32:c9:fd:24 mac-address=00:11:32:C9:FD:24 server=dhcp-br-private
/ip dhcp-server lease add address=10.0.98.11 client-id=1:24:5e:be:80:2d:21 mac-address=24:5E:BE:80:2D:21 server=dhcp-vlan-dave
/ip dhcp-server lease add address=10.0.99.11 client-id=1:26:5e:bf:80:2d:21 mac-address=26:5E:BF:80:2D:21 server=dhcp-br-private
/ip dhcp-server network add address=10.0.98.0/24 dns-server=10.0.98.1 gateway=10.0.98.1 netmask=24 ntp-server=10.0.98.1
/ip dhcp-server network add address=10.0.99.0/24 dns-server=10.0.99.1 gateway=10.0.99.1 ntp-server=10.0.99.1
/ip dns set allow-remote-requests=yes cache-max-ttl=5m cache-size=16384KiB doh-max-concurrent-queries=5000 doh-max-server-connections=100 max-concurrent-queries=100000 max-concurrent-tcp-sessions=100000 query-server-timeout=5s query-total-timeout=20s use-doh-server=https://dns.nextdns.io/f5377a verify-doh-cert=yes
/ip dns static add address=10.0.99.1 name=fw.parents.sl1p.net type=A
/ip dns static add address=45.90.28.0 name=dns.nextdns.io type=A
/ip dns static add address=45.90.30.0 name=dns.nextdns.io type=A
/ip dns static add address=2a07:a8c0:: name=dns.nextdns.io type=AAAA
/ip dns static add address=2a07:a8c1:: name=dns.nextdns.io type=AAAA
/ip firewall address-list add address=90.155.88.111 comment="754t aaisp nat" list=list-v4-trusted
/ip firewall address-list add address=81.187.62.64/27 comment="754t aaisp public" list=list-v4-trusted
/ip firewall address-list add address=81.187.192.60 comment="754t aaisp l2tp" list=list-v4-trusted
/ip firewall address-list add address=81.187.148.148 comment="754t aaisp mobile" list=list-v4-trusted
/ip firewall address-list add address=10.0.101.0/24 comment="754t internal private" list=list-v4-trusted
/ip firewall address-list add address=10.0.99.0/24 comment="internal rvnet" list=list-v4-internal
/ip firewall address-list add address=10.0.98.0/24 comment="internal sl1p" list=list-v4-internal
/ip firewall filter add action=accept chain=input
/ip firewall filter add action=accept chain=output
/ip firewall filter add action=accept chain=forward
/ip firewall filter add action=accept chain=input comment="accept internal to self" src-address-list=list-v4-internal
/ip firewall filter add action=drop chain=input port=1080 protocol=tcp
/ip firewall filter add action=accept chain=input comment="accept ssh altport to self" dst-port=212 protocol=tcp
/ip firewall filter add action=accept chain=input comment="accept winbox to self" dst-port=8291 protocol=tcp
/ip firewall filter add action=accept chain=input comment="accept from trusted" src-address-list=list-v4-trusted
/ip firewall filter add action=accept chain=input comment="accept established,related,untracked" connection-state=established,related,untracked
/ip firewall filter add action=drop chain=input comment="drop invalid" connection-state=invalid
/ip firewall filter add action=accept chain=input comment="accept ICMP" protocol=icmp
/ip firewall filter add action=accept chain=input comment="accept to local loopback (for CAPsMAN)" dst-address=127.0.0.1
/ip firewall filter add action=drop chain=input comment="drop all not coming from admin ifs" in-interface-list=!iflist-admin
/ip firewall filter add action=accept chain=forward comment="forward from trusted" src-address-list=list-v4-trusted
/ip firewall filter add action=accept chain=forward comment="forward to trusted" dst-address-list=list-v4-trusted
/ip firewall filter add action=accept chain=forward comment="accept in ipsec policy" ipsec-policy=in,ipsec
/ip firewall filter add action=accept chain=forward comment="accept out ipsec policy" ipsec-policy=out,ipsec
/ip firewall filter add action=fasttrack-connection chain=forward comment=fasttrack connection-state=established,related disabled=yes hw-offload=yes
/ip firewall filter add action=accept chain=forward comment="accept established,related,untracked" connection-state=established,related,untracked
/ip firewall filter add action=drop chain=forward comment="drop invalid" connection-state=invalid
/ip firewall filter add action=drop chain=forward comment="drop all from WAN not DSTNATed" connection-nat-state=!dstnat connection-state=new in-interface-list=iflist-wan
/ip firewall filter add action=accept chain=output comment="accept to trusted" dst-address-list=list-v4-trusted
/ip firewall nat add action=dst-nat chain=dstnat comment=plex@nas dst-port=32400 in-interface-list=iflist-wan protocol=tcp to-addresses=10.0.98.11 to-ports=32400
/ip firewall nat add action=dst-nat chain=dstnat comment=roon@nas dst-port=55000 in-interface-list=iflist-wan protocol=tcp to-addresses=10.0.98.11 to-ports=55000
/ip firewall nat add action=masquerade chain=srcnat comment=masquerade ipsec-policy=out,none out-interface-list=iflist-wan
/ip firewall service-port set irc disabled=no
/ip firewall service-port set rtsp disabled=no
/ip ipsec profile set [ find default=yes ] dpd-interval=2m dpd-maximum-failures=5
/ip proxy set port=3128
/ip service set ftp disabled=yes
/ip service set telnet disabled=yes
/ip service set www disabled=yes
/ip service set ssh port=212
/ip service set api disabled=yes
/ip smb shares set [ find default=yes ] directory=/pub
/ip socks set enabled=yes version=5
/ip ssh set always-allow-password-login=yes forwarding-enabled=local host-key-size=4096 strong-crypto=yes
/ip traffic-flow set enabled=yes
/ip traffic-flow ipfix set nat-events=yes
/ip traffic-flow target add dst-address=162.159.65.1
/ip upnp set enabled=yes
/ip upnp interfaces add interface=ether1-virgin type=external
/ip upnp interfaces add interface=br-private type=internal
/ip upnp interfaces add interface=vlan-dave type=internal
/ipv6 address add from-pool=aaisp-dhcpv6 interface=l2tp-aaisp
/ipv6 address add from-pool=aaisp-dhcpv6 interface=vlan-dave
/ipv6 dhcp-client add add-default-route=yes interface=l2tp-aaisp pool-name=aaisp-dhcpv6 request=address,prefix use-peer-dns=no
/ipv6 firewall address-list add address=::/128 comment="unspecified address" list=list-v6-bogons
/ipv6 firewall address-list add address=::1/128 comment=lo list=list-v6-bogons
/ipv6 firewall address-list add address=fec0::/10 comment=site-local list=list-v6-bogons
/ipv6 firewall address-list add address=::ffff:0.0.0.0/96 comment=ipv4-mapped list=list-v6-bogons
/ipv6 firewall address-list add address=::/96 comment="ipv4 compat" list=list-v6-bogons
/ipv6 firewall address-list add address=100::/64 comment="discard only " list=list-v6-bogons
/ipv6 firewall address-list add address=2001:db8::/32 comment=documentation list=list-v6-bogons
/ipv6 firewall address-list add address=2001:10::/28 comment=ORCHID list=list-v6-bogons
/ipv6 firewall address-list add address=3ffe::/16 comment=6bone list=list-v6-bogons
/ipv6 firewall address-list add address=2001:8b0:65d3::/48 comment="754t aaisp full v6 allocation" list=list-v6-trusted
/ipv6 firewall filter add action=accept chain=input comment="accept from list-v6-trusted" src-address-list=list-v6-trusted
/ipv6 firewall filter add action=accept chain=input comment="accept established,related,untracked" connection-state=established,related,untracked
/ipv6 firewall filter add action=drop chain=input comment="drop invalid" connection-state=invalid
/ipv6 firewall filter add action=accept chain=input comment="accept ICMPv6" protocol=icmpv6
/ipv6 firewall filter add action=accept chain=input comment="accept UDP traceroute" port=33434-33534 protocol=udp
/ipv6 firewall filter add action=accept chain=input comment="accept DHCPv6-Client prefix delegation." dst-port=546 protocol=udp src-address=fe80::/10
/ipv6 firewall filter add action=accept chain=input comment="accept IKE" dst-port=500,4500 protocol=udp
/ipv6 firewall filter add action=accept chain=input comment="accept ipsec AH" protocol=ipsec-ah
/ipv6 firewall filter add action=accept chain=input comment="accept ipsec ESP" protocol=ipsec-esp
/ipv6 firewall filter add action=accept chain=input comment="accept all that matches ipsec policy" ipsec-policy=in,ipsec
/ipv6 firewall filter add action=drop chain=input comment="drop everything else not coming from LAN" in-interface-list=!iflist-lan
/ipv6 firewall filter add action=accept chain=forward comment="forward from list-v6-trusted" src-address-list=list-v6-trusted
/ipv6 firewall filter add action=accept chain=forward comment="forward to list-v6-trusted" dst-address-list=list-v6-trusted
/ipv6 firewall filter add action=accept chain=forward comment="accept established,related,untracked" connection-state=established,related,untracked
/ipv6 firewall filter add action=drop chain=forward comment="drop invalid" connection-state=invalid
/ipv6 firewall filter add action=drop chain=forward comment="drop src ipv6 bogons" src-address-list=list-v6-bogons
/ipv6 firewall filter add action=drop chain=forward comment="drop dst ipv6 bogons" dst-address-list=list-v6-bogons
/ipv6 firewall filter add action=drop chain=forward comment="rfc4890 drop hop-limit=1" hop-limit=equal:1 protocol=icmpv6
/ipv6 firewall filter add action=accept chain=forward comment="accept ICMPv6" protocol=icmpv6
/ipv6 firewall filter add action=accept chain=forward comment="accept HIP" protocol=139
/ipv6 firewall filter add action=accept chain=forward comment="accept IKE" dst-port=500,4500 protocol=udp
/ipv6 firewall filter add action=accept chain=forward comment="accept ipsec AH" protocol=ipsec-ah
/ipv6 firewall filter add action=accept chain=forward comment="accept ipsec ESP" protocol=ipsec-esp
/ipv6 firewall filter add action=accept chain=forward comment="accept all that matches ipsec policy" ipsec-policy=in,ipsec
/ipv6 firewall filter add action=drop chain=forward comment="drop everything else not coming from LAN" in-interface-list=!iflist-lan
/ipv6 firewall filter add action=accept chain=output comment="accept to list-v6-trusted" dst-address-list=list-v6-trusted
/routing rule add action=lookup-only-in-table disabled=yes interface=vlan-dave table=dave
/system clock set time-zone-autodetect=no time-zone-name=Europe/London
/system identity set name=fw-16c
/system logging add disabled=yes topics=dns
/system ntp client set enabled=yes
/system ntp server set enabled=yes
/system ntp client servers add address=uk.pool.ntp.org
/system ntp client servers add address=162.159.200.1
/system ntp client servers add address=188.114.116.1
/system ntp client servers add address=162.159.200.123
/system ntp client servers add address=139.162.219.252
/system package update set channel=testing
/system routerboard settings set auto-upgrade=yes
/system scheduler add name=b0rt on-event="/system reboot" policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon start-date=2023-11-04 start-time=14:20:00
/system script add dont-require-permissions=no name=cacerts owner=dave policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon source="{\r\
    \n  :do {\r\
    \n      /tool fetch url=https://mkcert.org/generate/ check-certificate=yes dst-path=cacert.pem;\r\
    \n      /certificate remove [find];\r\
    \n      /certificate import file-name=cacert.pem passphrase=\"\";\r\
    \n      /file remove cacert.pem;\r\
    \n      :log info (\"Updated certificate trust store\");\r\
    \n  } on-error={\r\
    \n      :log error (\"Failed to update certificate trust store\");\r\
    \n  };\r\
    \n}"
/system watchdog set watch-address=8.8.8.8
/tool graphing interface add
/tool graphing queue add
/tool graphing resource add
/tool mac-server set allowed-interface-list=iflist-admin
/tool mac-server mac-winbox set allowed-interface-list=iflist-admin
