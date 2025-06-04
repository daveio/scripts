# 2025-05-04 21:46:19 by RouterOS 7.19rc1
# software id = KH3M-8RQA
#
# model = RB5009UPr+S+
# serial number = HE108J2C6WG
/interface bridge
add add-dhcp-option82=yes admin-mac=48:A9:8A:34:3C:D6 ageing-time=5m arp=\
    enabled arp-timeout=auto auto-mac=no dhcp-snooping=yes disabled=no \
    fast-forward=yes forward-delay=15s igmp-snooping=yes igmp-version=2 \
    last-member-interval=1s last-member-query-count=2 max-learned-entries=\
    auto max-message-age=20s membership-interval=4m20s mld-version=1 mtu=auto \
    multicast-querier=no multicast-router=temporary-query mvrp=no name=\
    br-private port-cost-mode=short priority=0x8000 protocol-mode=rstp \
    querier-interval=4m15s query-interval=2m5s query-response-interval=10s \
    startup-query-count=2 startup-query-interval=31s250ms \
    transmit-hold-count=6 vlan-filtering=no
/interface ethernet
set [ find default-name=ether1 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full,2.5G-baseT" arp=\
    enabled arp-timeout=auto auto-negotiation=yes bandwidth=\
    unlimited/unlimited disabled=no l2mtu=1514 loop-protect=default \
    loop-protect-disable-time=5m loop-protect-send-interval=5s mac-address=\
    48:A9:8A:34:3C:D5 mtu=1500 name=ether1-virgin orig-mac-address=\
    48:A9:8A:34:3C:D5 poe-out=auto-on poe-priority=10 power-cycle-interval=\
    none !power-cycle-ping-address power-cycle-ping-enabled=no \
    !power-cycle-ping-timeout rx-flow-control=off tx-flow-control=off
set [ find default-name=ether2 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=no l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:D6 mtu=1500 \
    name=ether2-vodafone orig-mac-address=48:A9:8A:34:3C:D6 poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=ether3 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=no l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:D7 mtu=1500 \
    name=ether3-raspi orig-mac-address=48:A9:8A:34:3C:D7 poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=ether4 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=no l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:D8 mtu=1500 \
    name=ether4-private orig-mac-address=48:A9:8A:34:3C:D8 poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=ether5 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=yes l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:D9 mtu=1500 \
    name=ether5 orig-mac-address=48:A9:8A:34:3C:D9 poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=ether6 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=yes l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:DA mtu=1500 \
    name=ether6 orig-mac-address=48:A9:8A:34:3C:DA poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=ether7 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=yes l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:DB mtu=1500 \
    name=ether7 orig-mac-address=48:A9:8A:34:3C:DB poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=ether8 ] advertise="10M-baseT-half,10M-baseT-full,100M\
    -baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full" arp=enabled \
    arp-timeout=auto auto-negotiation=yes bandwidth=unlimited/unlimited \
    disabled=yes l2mtu=1514 loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mac-address=48:A9:8A:34:3C:DC mtu=1500 \
    name=ether8 orig-mac-address=48:A9:8A:34:3C:DC poe-out=auto-on \
    poe-priority=10 power-cycle-interval=none !power-cycle-ping-address \
    power-cycle-ping-enabled=no !power-cycle-ping-timeout rx-flow-control=off \
    tx-flow-control=off
set [ find default-name=sfp-sfpplus1 ] advertise="10M-baseT-half,10M-baseT-ful\
    l,100M-baseT-half,100M-baseT-full,1G-baseT-half,1G-baseT-full,1G-baseX,2.5\
    G-baseT,2.5G-baseX,5G-baseT,10G-baseT,10G-baseSR-LR,10G-baseCR" arp=\
    enabled arp-timeout=auto auto-negotiation=yes bandwidth=\
    unlimited/unlimited disabled=yes l2mtu=1514 loop-protect=default \
    loop-protect-disable-time=5m loop-protect-send-interval=5s mac-address=\
    48:A9:8A:34:3C:DD mtu=1500 name=sfp orig-mac-address=48:A9:8A:34:3C:DD \
    rx-flow-control=off sfp-ignore-rx-los=no sfp-rate-select=high \
    sfp-shutdown-temperature=95C tx-flow-control=off
/queue interface
set br-private queue=no-queue
/interface wireguard
add comment=back-to-home-vpn disabled=no listen-port=22092 mtu=1420 name=\
    back-to-home-vpn
/interface vlan
add arp=enabled arp-timeout=auto disabled=no interface=br-private \
    loop-protect=default loop-protect-disable-time=5m \
    loop-protect-send-interval=5s mtu=1500 mvrp=no name=vlan-dave \
    use-service-tag=no vlan-id=1000
/queue interface
set back-to-home-vpn queue=no-queue
set vlan-dave queue=no-queue
/interface ethernet switch
set 0 cpu-flow-control=yes mirror-egress-target=none name=switch1
/interface ethernet switch port
set 0 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 1 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 2 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 3 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 4 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 5 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 6 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 7 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 8 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
set 9 !egress-rate !ingress-rate mirror-egress=no mirror-ingress=no \
    mirror-ingress-target=none
/interface ethernet switch port-isolation
set 0 !forwarding-override
set 1 !forwarding-override
set 2 !forwarding-override
set 3 !forwarding-override
set 4 !forwarding-override
set 5 !forwarding-override
set 6 !forwarding-override
set 7 !forwarding-override
set 8 !forwarding-override
set 9 !forwarding-override
/interface list
set [ find name=all ] comment="contains all interfaces" exclude="" include="" \
    name=all
set [ find name=none ] comment="contains no interfaces" exclude="" include="" \
    name=none
set [ find name=dynamic ] comment="contains dynamic interfaces" exclude="" \
    include="" name=dynamic
set [ find name=static ] comment="contains static interfaces" exclude="" \
    include="" name=static
add exclude="" include="" name=iflist-wan
add exclude="" include="" name=iflist-lan
add exclude="" include="" name=iflist-cpe
add exclude="" include="" name=iflist-vpn
add exclude="" include="" name=iflist-auto-lan
add exclude="" include="" name=iflist-auto-wan
add exclude="" include="" name=iflist-auto-internet
add exclude="" include=iflist-lan,iflist-vpn name=iflist-admin
add exclude="" include=iflist-cpe,iflist-wan name=iflist-masquerade
/interface lte apn
set [ find default=yes ] add-default-route=yes apn=internet authentication=\
    none default-route-distance=2 ip-type=auto name=default use-network-apn=\
    yes use-peer-dns=yes
/interface macsec profile
set [ find default-name=default ] name=default server-priority=10
/iot lora servers
add address=eu.mikrotik.thethings.industries down-port=1700 joineui="" name=\
    TTN-EU netid="" protocol=UDP up-port=1700
add address=us.mikrotik.thethings.industries down-port=1700 joineui="" name=\
    TTN-US netid="" protocol=UDP up-port=1700
add address=eu1.cloud.thethings.industries down-port=1700 joineui="" name=\
    "TTS Cloud (eu1)" netid="" protocol=UDP up-port=1700
add address=nam1.cloud.thethings.industries down-port=1700 joineui="" name=\
    "TTS Cloud (nam1)" netid="" protocol=UDP up-port=1700
add address=au1.cloud.thethings.industries down-port=1700 joineui="" name=\
    "TTS Cloud (au1)" netid="" protocol=UDP up-port=1700
add address=eu1.cloud.thethings.network down-port=1700 joineui="" name=\
    "TTN V3 (eu1)" netid="" protocol=UDP up-port=1700
add address=nam1.cloud.thethings.network down-port=1700 joineui="" name=\
    "TTN V3 (nam1)" netid="" protocol=UDP up-port=1700
add address=au1.cloud.thethings.network down-port=1700 joineui="" name=\
    "TTN V3 (au1)" netid="" protocol=UDP up-port=1700
/ip dhcp-client option
set clientid_duid code=61 name=clientid_duid value="0xff\$(CLIENT_DUID)"
set clientid code=61 name=clientid value="0x01\$(CLIENT_MAC)"
set hostname code=12 name=hostname value="\$(HOSTNAME)"
/ip hotspot profile
set [ find default=yes ] dns-name="" hotspot-address=0.0.0.0 html-directory=\
    hotspot html-directory-override="" http-cookie-lifetime=3d http-proxy=\
    0.0.0.0:0 install-hotspot-queue=no login-by=cookie,http-chap name=default \
    smtp-server=0.0.0.0 split-user-domain=no use-radius=no
/ip hotspot user profile
set [ find default=yes ] add-mac-cookie=yes address-list="" idle-timeout=none \
    !insert-queue-before keepalive-timeout=2m mac-cookie-timeout=3d name=\
    default !parent-queue !queue-type shared-users=1 status-autorefresh=1m \
    transparent-proxy=no
/ip ipsec mode-config
set [ find default=yes ] name=request-only responder=no use-responder-dns=\
    exclusively
/ip ipsec policy group
set [ find default=yes ] name=default
/ip ipsec profile
set [ find default=yes ] dh-group=modp2048,modp1024 dpd-interval=2m \
    dpd-maximum-failures=5 enc-algorithm=aes-128,3des hash-algorithm=sha1 \
    lifetime=1d name=default nat-traversal=yes proposal-check=obey
/ip ipsec proposal
set [ find default=yes ] auth-algorithms=sha1 disabled=no enc-algorithms=\
    aes-256-cbc,aes-192-cbc,aes-128-cbc lifetime=30m name=default pfs-group=\
    modp1024
/ip pool
add name=poolv4-br-private-dhcp ranges=10.0.99.100-10.0.99.199
add name=poolv4-vlan-dave-dhcp ranges=10.0.98.100-10.0.98.199
/ip dhcp-server
add address-lists="" address-pool=poolv4-br-private-dhcp disabled=no \
    interface=br-private lease-script="" lease-time=10m name=dhcp-br-private \
    use-radius=no use-reconfigure=no
add address-lists="" address-pool=poolv4-vlan-dave-dhcp disabled=no \
    interface=vlan-dave lease-script="" lease-time=10m name=dhcp-vlan-dave \
    use-radius=no use-reconfigure=no
/ip smb users
set [ find default=yes ] disabled=yes name=guest read-only=yes
/ppp profile
set *0 address-list="" !bridge !bridge-horizon bridge-learning=default \
    !bridge-path-cost !bridge-port-priority !bridge-port-trusted \
    !bridge-port-vid change-tcp-mss=yes !dns-server !idle-timeout \
    !incoming-filter !insert-queue-before !interface-list !local-address \
    name=default on-down="" on-up="" only-one=default !outgoing-filter \
    !parent-queue !queue-type !rate-limit !remote-address !session-timeout \
    use-compression=default use-encryption=default use-ipv6=yes use-mpls=\
    default use-upnp=default !wins-server
set *FFFFFFFE address-list="" !bridge !bridge-horizon bridge-learning=default \
    !bridge-path-cost !bridge-port-priority !bridge-port-trusted \
    !bridge-port-vid change-tcp-mss=yes !dns-server !idle-timeout \
    !incoming-filter !insert-queue-before !interface-list !local-address \
    name=default-encryption on-down="" on-up="" only-one=default \
    !outgoing-filter !parent-queue !queue-type !rate-limit !remote-address \
    !session-timeout use-compression=default use-encryption=yes use-ipv6=yes \
    use-mpls=default use-upnp=default !wins-server
/interface l2tp-client
add add-default-route=yes allow=pap,chap,mschap1,mschap2 allow-fast-path=no \
    connect-to=194.4.172.12 default-route-distance=30 dial-on-demand=no \
    disabled=no keepalive-timeout=60 l2tp-proto-version=l2tpv2 \
    l2tpv3-digest-hash=md5 max-mru=1450 max-mtu=1450 mrru=disabled name=\
    l2tp-aaisp profile=default random-source-port=no use-ipsec=no \
    use-peer-dns=no user=dw121@a.2
/queue interface
set l2tp-aaisp queue=no-queue
/queue type
set 0 kind=pfifo name=default pfifo-limit=50
set 1 kind=pfifo name=ethernet-default pfifo-limit=50
set 2 kind=sfq name=wireless-default sfq-allot=1514 sfq-perturb=5
set 3 kind=red name=synchronous-default red-avg-packet=1000 red-burst=20 \
    red-limit=60 red-max-threshold=50 red-min-threshold=10
set 4 kind=sfq name=hotspot-default sfq-allot=1514 sfq-perturb=5
set 5 kind=pcq name=pcq-upload-default pcq-burst-rate=0 pcq-burst-threshold=0 \
    pcq-burst-time=10s pcq-classifier=src-address pcq-dst-address-mask=32 \
    pcq-dst-address6-mask=128 pcq-limit=50KiB pcq-rate=0 \
    pcq-src-address-mask=32 pcq-src-address6-mask=128 pcq-total-limit=2000KiB
set 6 kind=pcq name=pcq-download-default pcq-burst-rate=0 \
    pcq-burst-threshold=0 pcq-burst-time=10s pcq-classifier=dst-address \
    pcq-dst-address-mask=32 pcq-dst-address6-mask=128 pcq-limit=50KiB \
    pcq-rate=0 pcq-src-address-mask=32 pcq-src-address6-mask=128 \
    pcq-total-limit=2000KiB
set 7 kind=none name=only-hardware-queue
set 8 kind=mq-pfifo mq-pfifo-limit=50 name=multi-queue-ethernet-default
set 9 kind=pfifo name=default-small pfifo-limit=10
/queue interface
set ether1-virgin queue=only-hardware-queue
set ether2-vodafone queue=only-hardware-queue
set ether3-raspi queue=only-hardware-queue
set ether4-private queue=only-hardware-queue
set ether5 queue=only-hardware-queue
set ether6 queue=only-hardware-queue
set ether7 queue=only-hardware-queue
set ether8 queue=only-hardware-queue
set sfp queue=only-hardware-queue
/routing bgp template
set default as=65530 name=default
/routing table
add disabled=no fib name=dave
/snmp community
set [ find default=yes ] addresses=::/0 authentication-protocol=MD5 disabled=\
    no encryption-protocol=DES name=public read-access=yes security=none \
    write-access=no
/system logging action
set 0 memory-lines=1000 memory-stop-on-full=no name=memory target=memory
set 1 disk-file-count=2 disk-file-name=log disk-lines-per-file=1000 \
    disk-stop-on-full=no name=disk target=disk
set 2 name=echo remember=yes target=echo
set 3 name=remote remote=0.0.0.0 remote-log-format=default remote-port=514 \
    remote-protocol=udp src-address=0.0.0.0 syslog-facility=daemon \
    syslog-severity=auto syslog-time-format=bsd-syslog target=remote
/user group
set read name=read policy="local,telnet,ssh,reboot,read,test,winbox,password,w\
    eb,sniff,sensitive,api,romon,rest-api,!ftp,!write,!policy" skin=default
set write name=write policy="local,telnet,ssh,reboot,read,write,test,winbox,pa\
    ssword,web,sniff,sensitive,api,romon,rest-api,!ftp,!policy" skin=default
set full name=full policy="local,telnet,ssh,ftp,reboot,read,write,policy,test,\
    winbox,password,web,sniff,sensitive,api,romon,rest-api" skin=default
/zerotier
set zt-central comment=\
    "ZeroTier Central controller - https://my.zerotier.com/" disabled=no \
    disabled=no interfaces=all name=zt-central port=9993 route-distance=1
/zerotier interface
add allow-default=no allow-global=no allow-managed=yes arp-timeout=auto \
    disabled=no instance=zt-central name=zt-backplane network=\
    8bd5124fd63a0d47
/queue interface
set zt-backplane queue=wireless-default
/certificate settings
set builtin-trust-anchors=not-trusted crl-download=no crl-store=ram crl-use=\
    no
/console settings
set log-script-errors=yes sanitize-names=no
/container config
set layer-dir="" ram-high=0 !registry-url tmpdir="" username=""
/disk settings
set auto-media-interface=none auto-media-sharing=no auto-smb-sharing=no \
    auto-smb-user=guest default-mount-point-template="[slot]"
/ip smb
set comment=MikrotikSMB domain=MSHOME enabled=auto interfaces=all
/file rsync-daemon
set enabled=no
/interface bridge port
add auto-isolate=no bpdu-guard=no bridge=br-private broadcast-flood=yes \
    disabled=no edge=auto fast-leave=no frame-types=admit-all horizon=none \
    hw=yes ingress-filtering=yes interface=ether4-private internal-path-cost=\
    10 learn=auto multicast-router=temporary-query mvrp-applicant-state=\
    normal-participant mvrp-registrar-state=normal path-cost=10 \
    point-to-point=auto priority=0x80 pvid=1 restricted-role=no \
    restricted-tcn=no tag-stacking=no trusted=no unknown-multicast-flood=yes \
    unknown-unicast-flood=yes
/interface bridge settings
set allow-fast-path=yes use-ip-firewall=yes use-ip-firewall-for-pppoe=yes \
    use-ip-firewall-for-vlan=yes
/ip firewall connection tracking
set enabled=auto generic-timeout=10m icmp-timeout=10s loose-tcp-tracking=yes \
    tcp-close-timeout=10s tcp-close-wait-timeout=10s tcp-established-timeout=\
    1d tcp-fin-wait-timeout=10s tcp-last-ack-timeout=10s \
    tcp-max-retrans-timeout=5m tcp-syn-received-timeout=5s \
    tcp-syn-sent-timeout=5s tcp-time-wait-timeout=10s tcp-unacked-timeout=5m \
    udp-stream-timeout=3m udp-timeout=10s
/ip neighbor discovery-settings
set discover-interface-list=all discover-interval=30s lldp-mac-phy-config=no \
    lldp-max-frame-size=no lldp-med-net-policy-vlan=disabled lldp-poe-power=\
    yes lldp-vlan-info=no mode=tx-and-rx protocol=cdp,lldp,mndp
/ip settings
set accept-redirects=no accept-source-route=no allow-fast-path=yes \
    arp-timeout=30s icmp-errors-use-inbound-interface-address=no \
    icmp-rate-limit=10 icmp-rate-mask=0x1818 ip-forward=yes \
    ipv4-multipath-hash-policy=l3 max-neighbor-entries=16384 rp-filter=no \
    secure-redirects=yes send-redirects=yes tcp-syncookies=yes \
    tcp-timestamps=random-offset
/ipv6 settings
set accept-redirects=yes-if-forwarding-disabled accept-router-advertisements=\
    yes-if-forwarding-disabled allow-fast-path=yes disable-ipv6=no \
    disable-link-local-address=no forward=yes max-neighbor-entries=16384 \
    min-neighbor-entries=4096 multipath-hash-policy=l3 \
    soft-max-neighbor-entries=8192 stale-neighbor-detect-interval=30 \
    stale-neighbor-timeout=60
/interface detect-internet
set detect-interface-list=all internet-interface-list=iflist-auto-internet \
    lan-interface-list=iflist-auto-lan wan-interface-list=iflist-auto-wan
/interface ethernet poe settings
set psu1-max-power=96W psu2-max-power=150W
/interface l2tp-server server
set accept-proto-version=all accept-pseudowire-type=all allow-fast-path=no \
    authentication=pap,chap,mschap1,mschap2 caller-id-type=ip-address \
    default-profile=default-encryption enabled=no keepalive-timeout=30 \
    l2tpv3-circuit-id="" l2tpv3-cookie-length=0 l2tpv3-digest-hash=md5 \
    !l2tpv3-ether-interface-list max-mru=1450 max-mtu=1450 max-sessions=\
    unlimited mrru=disabled one-session-per-host=no use-ipsec=no
/interface list member
add disabled=no interface=br-private list=iflist-lan
add disabled=no interface=ether3-raspi list=iflist-lan
add disabled=no interface=ether1-virgin list=iflist-wan
add disabled=no interface=ether2-vodafone list=iflist-wan
add disabled=no interface=ether1-virgin list=iflist-cpe
add disabled=no interface=ether2-vodafone list=iflist-cpe
add disabled=no interface=zt-backplane list=iflist-vpn
add disabled=no interface=*C list=iflist-vpn
add disabled=no interface=vlan-dave list=iflist-lan
add disabled=no interface=l2tp-aaisp list=iflist-masquerade
add disabled=no interface=ether1-virgin list=iflist-masquerade
add disabled=no interface=ether2-vodafone list=iflist-masquerade
add disabled=no interface=l2tp-aaisp list=iflist-wan
/interface lte settings
set esim-channel=auto firmware-path=firmware link-recovery-timer=120 mode=\
    auto
/interface ovpn-server server
add auth=sha1,md5,sha256,sha512 certificate=*0 cipher=blowfish128,aes128-cbc \
    default-profile=default disabled=yes enable-tun-ipv6=no ipv6-prefix-len=\
    64 keepalive-timeout=60 mac-address=FE:33:98:AA:F1:63 max-mtu=1500 mode=\
    ip name=ovpn-server1 netmask=24 port=1194 protocol=tcp push-routes="" \
    redirect-gateway=disabled reneg-sec=3600 require-client-certificate=no \
    tls-version=any tun-server-ipv6=:: user-auth-method=pap vrf=main
/interface pptp-server server
# PPTP connections are considered unsafe, it is suggested to use a more modern VPN protocol instead
set authentication=mschap1,mschap2 default-profile=default-encryption \
    enabled=no keepalive-timeout=30 max-mru=1450 max-mtu=1450 mrru=disabled
/interface sstp-server server
set authentication=pap,chap,mschap1,mschap2 certificate=none ciphers=\
    aes256-sha,aes256-gcm-sha384 default-profile=default enabled=no \
    keepalive-timeout=60 max-mru=1500 max-mtu=1500 mrru=disabled pfs=no port=\
    443 tls-version=any verify-client-certificate=no
/interface wifi cap
set enabled=no
/interface wifi capsman
set enabled=no
/iot lora traffic options
set crc-errors=no
set crc-errors=no
/iot modbus
set disable-security-rules=yes disabled=yes hardware-port=*1 tcp-port=502 \
    timeout=1000ms
/ip address
add address=10.0.99.1/24 disabled=no interface=br-private network=10.0.99.0
add address=192.168.100.2/24 disabled=no interface=ether1-virgin network=\
    192.168.100.0
add address=10.0.98.1/24 disabled=no interface=vlan-dave network=10.0.98.0
/ip cloud
set back-to-home-vpn=enabled ddns-enabled=yes ddns-update-interval=1h \
    update-time=yes
/ip cloud advanced
set use-local-address=no
/ip dhcp-client
add add-default-route=yes allow-reconfigure=no check-gateway=none \
    default-route-distance=10 default-route-tables=default dhcp-options=\
    hostname,clientid disabled=no interface=ether1-virgin use-peer-dns=no \
    use-peer-ntp=no
add add-default-route=yes allow-reconfigure=no check-gateway=none \
    default-route-distance=20 default-route-tables=default dhcp-options=\
    hostname,clientid disabled=no interface=ether2-vodafone use-peer-dns=no \
    use-peer-ntp=no
/ip dhcp-server config
set accounting=yes interim-update=0s radius-password=empty store-leases-disk=\
    5m
/ip dhcp-server lease
add address=10.0.99.10 address-lists="" !allow-dual-stack-queue client-id=\
    1:0:11:32:c9:fd:24 dhcp-option="" disabled=no !insert-queue-before \
    mac-address=00:11:32:C9:FD:24 !parent-queue !queue-type server=\
    dhcp-br-private
add address=10.0.98.11 address-lists="" !allow-dual-stack-queue client-id=\
    1:24:5e:be:80:2d:21 dhcp-option="" disabled=no !insert-queue-before \
    mac-address=24:5E:BE:80:2D:21 !parent-queue !queue-type server=\
    dhcp-vlan-dave
add address=10.0.99.11 address-lists="" !allow-dual-stack-queue client-id=\
    1:26:5e:bf:80:2d:21 dhcp-option="" disabled=no !insert-queue-before \
    mac-address=26:5E:BF:80:2D:21 !parent-queue !queue-type server=\
    dhcp-br-private
/ip dhcp-server network
add address=10.0.98.0/24 caps-manager="" dhcp-option="" dns-server=10.0.98.1 \
    gateway=10.0.98.1 netmask=24 !next-server ntp-server=10.0.98.1 \
    wins-server=""
add address=10.0.99.0/24 caps-manager="" dhcp-option="" dns-server=10.0.99.1 \
    gateway=10.0.99.1 !next-server ntp-server=10.0.99.1 wins-server=""
/ip dns
set address-list-extra-time=0s allow-remote-requests=yes cache-max-ttl=5m \
    cache-size=16384KiB doh-max-concurrent-queries=5000 \
    doh-max-server-connections=100 doh-timeout=5s max-concurrent-queries=\
    100000 max-concurrent-tcp-sessions=100000 max-udp-packet-size=4096 \
    mdns-repeat-ifaces="" query-server-timeout=5s query-total-timeout=20s \
    servers="" use-doh-server=https://dns.nextdns.io/f5377a verify-doh-cert=\
    yes vrf=main
/ip dns static
add address=10.0.99.1 disabled=no name=fw.parents.sl1p.net ttl=1d type=A
add address=45.90.28.0 disabled=no name=dns.nextdns.io ttl=1d type=A
add address=45.90.30.0 disabled=no name=dns.nextdns.io ttl=1d type=A
add address=2a07:a8c0:: disabled=no name=dns.nextdns.io ttl=1d type=AAAA
add address=2a07:a8c1:: disabled=no name=dns.nextdns.io ttl=1d type=AAAA
/ip firewall address-list
add address=90.155.88.111 comment="754t aaisp nat" disabled=no dynamic=no \
    list=list-v4-trusted
add address=81.187.62.64/27 comment="754t aaisp public" disabled=no dynamic=\
    no list=list-v4-trusted
add address=81.187.192.60 comment="754t aaisp l2tp" disabled=no dynamic=no \
    list=list-v4-trusted
add address=81.187.148.148 comment="754t aaisp mobile" disabled=no dynamic=no \
    list=list-v4-trusted
add address=10.0.101.0/24 comment="754t internal private" disabled=no \
    dynamic=no list=list-v4-trusted
add address=10.0.99.0/24 comment="internal rvnet" disabled=no dynamic=no \
    list=list-v4-internal
add address=10.0.98.0/24 comment="internal sl1p" disabled=no dynamic=no list=\
    list-v4-internal
/ip firewall filter
add action=accept chain=input !connection-bytes !connection-limit \
    !connection-mark !connection-nat-state !connection-rate !connection-state \
    !connection-type !content disabled=no !dscp !dst-address \
    !dst-address-list !dst-address-type !dst-limit !dst-port !fragment \
    !hotspot !icmp-options !in-bridge-port !in-bridge-port-list !in-interface \
    !in-interface-list !ingress-priority !ipsec-policy !ipv4-options \
    !layer7-protocol !limit log=no log-prefix="" !nth !out-bridge-port \
    !out-bridge-port-list !out-interface !out-interface-list !packet-mark \
    !packet-size !per-connection-classifier !port !priority !protocol !psd \
    !random !routing-mark !src-address !src-address-list !src-address-type \
    !src-mac-address !src-port !tcp-flags !tcp-mss !time !tls-host !ttl
add action=accept chain=output !connection-bytes !connection-limit \
    !connection-mark !connection-nat-state !connection-rate !connection-state \
    !connection-type !content disabled=no !dscp !dst-address \
    !dst-address-list !dst-address-type !dst-limit !dst-port !fragment \
    !hotspot !icmp-options !in-bridge-port !in-bridge-port-list !in-interface \
    !in-interface-list !ingress-priority !ipsec-policy !ipv4-options \
    !layer7-protocol !limit log=no log-prefix="" !nth !out-bridge-port \
    !out-bridge-port-list !out-interface !out-interface-list !packet-mark \
    !packet-size !per-connection-classifier !port !priority !protocol !psd \
    !random !routing-mark !src-address !src-address-list !src-address-type \
    !src-mac-address !src-port !tcp-flags !tcp-mss !time !tls-host !ttl
add action=accept chain=forward !connection-bytes !connection-limit \
    !connection-mark !connection-nat-state !connection-rate !connection-state \
    !connection-type !content disabled=no !dscp !dst-address \
    !dst-address-list !dst-address-type !dst-limit !dst-port !fragment \
    !hotspot !icmp-options !in-bridge-port !in-bridge-port-list !in-interface \
    !in-interface-list !ingress-priority !ipsec-policy !ipv4-options \
    !layer7-protocol !limit log=no log-prefix="" !nth !out-bridge-port \
    !out-bridge-port-list !out-interface !out-interface-list !packet-mark \
    !packet-size !per-connection-classifier !port !priority !protocol !psd \
    !random !routing-mark !src-address !src-address-list !src-address-type \
    !src-mac-address !src-port !tcp-flags !tcp-mss !time !tls-host !ttl
add action=accept chain=input comment="accept internal to self" \
    !connection-bytes !connection-limit !connection-mark \
    !connection-nat-state !connection-rate !connection-state !connection-type \
    !content disabled=no !dscp !dst-address !dst-address-list \
    !dst-address-type !dst-limit !dst-port !fragment !hotspot !icmp-options \
    !in-bridge-port !in-bridge-port-list !in-interface !in-interface-list \
    !ingress-priority !ipsec-policy !ipv4-options !layer7-protocol !limit \
    log=no log-prefix="" !nth !out-bridge-port !out-bridge-port-list \
    !out-interface !out-interface-list !packet-mark !packet-size \
    !per-connection-classifier !port !priority !protocol !psd !random \
    !routing-mark !src-address src-address-list=list-v4-internal \
    !src-address-type !src-mac-address !src-port !tcp-flags !tcp-mss !time \
    !tls-host !ttl
add action=drop chain=input disabled=no port=1080 protocol=tcp
add action=accept chain=input comment="accept ssh altport to self" dst-port=\
    212 protocol=tcp
add action=accept chain=input comment="accept winbox to self" dst-port=8291 \
    protocol=tcp
add action=accept chain=input comment="accept from trusted" src-address-list=\
    list-v4-trusted
add action=accept chain=input comment="accept established,related,untracked" \
    connection-state=established,related,untracked
add action=drop chain=input comment="drop invalid" connection-state=invalid
add action=accept chain=input comment="accept ICMP" protocol=icmp
add action=accept chain=input comment=\
    "accept to local loopback (for CAPsMAN)" dst-address=127.0.0.1
add action=drop chain=input comment="drop all not coming from admin ifs" \
    in-interface-list=!iflist-admin
add action=accept chain=forward comment="forward from trusted" \
    src-address-list=list-v4-trusted
add action=accept chain=forward comment="forward to trusted" \
    dst-address-list=list-v4-trusted
add action=accept chain=forward comment="accept in ipsec policy" \
    ipsec-policy=in,ipsec
add action=accept chain=forward comment="accept out ipsec policy" \
    ipsec-policy=out,ipsec
add action=fasttrack-connection chain=forward comment=fasttrack \
    connection-state=established,related disabled=yes hw-offload=yes
add action=accept chain=forward comment=\
    "accept established,related,untracked" connection-state=\
    established,related,untracked
add action=drop chain=forward comment="drop invalid" connection-state=invalid
add action=drop chain=forward comment="drop all from WAN not DSTNATed" \
    connection-nat-state=!dstnat connection-state=new in-interface-list=\
    iflist-wan
add action=accept chain=output comment="accept to trusted" dst-address-list=\
    list-v4-trusted
/ip firewall nat
add action=dst-nat chain=dstnat comment=plex@nas !connection-bytes \
    !connection-limit !connection-mark !connection-rate !connection-type \
    !content disabled=no !dscp !dst-address !dst-address-list \
    !dst-address-type !dst-limit dst-port=32400 !fragment !hotspot \
    !icmp-options !in-bridge-port !in-bridge-port-list !in-interface \
    in-interface-list=iflist-wan !ingress-priority !ipsec-policy \
    !ipv4-options !layer7-protocol !limit log=no log-prefix="" !nth \
    !out-bridge-port !out-bridge-port-list !out-interface !out-interface-list \
    !packet-mark !packet-size !per-connection-classifier !port !priority \
    protocol=tcp !psd !random !routing-mark !src-address !src-address-list \
    !src-address-type !src-mac-address !src-port !tcp-mss !time to-addresses=\
    10.0.98.11 to-ports=32400 !ttl
add action=dst-nat chain=dstnat comment=roon@nas !connection-bytes \
    !connection-limit !connection-mark !connection-rate !connection-type \
    !content disabled=no !dscp !dst-address !dst-address-list \
    !dst-address-type !dst-limit dst-port=55000 !fragment !hotspot \
    !icmp-options !in-bridge-port !in-bridge-port-list !in-interface \
    in-interface-list=iflist-wan !ingress-priority !ipsec-policy \
    !ipv4-options !layer7-protocol !limit log=no log-prefix="" !nth \
    !out-bridge-port !out-bridge-port-list !out-interface !out-interface-list \
    !packet-mark !packet-size !per-connection-classifier !port !priority \
    protocol=tcp !psd !random !routing-mark !src-address !src-address-list \
    !src-address-type !src-mac-address !src-port !tcp-mss !time to-addresses=\
    10.0.98.11 to-ports=55000 !ttl
add action=masquerade chain=srcnat comment=masquerade !connection-bytes \
    !connection-limit !connection-mark !connection-rate !connection-type \
    !content disabled=no !dscp !dst-address !dst-address-list \
    !dst-address-type !dst-limit !dst-port !fragment !hotspot !icmp-options \
    !in-bridge-port !in-bridge-port-list !in-interface !in-interface-list \
    !ingress-priority ipsec-policy=out,none !ipv4-options !layer7-protocol \
    !limit log=no log-prefix="" !nth !out-bridge-port !out-bridge-port-list \
    !out-interface out-interface-list=iflist-wan !packet-mark !packet-size \
    !per-connection-classifier !port !priority !protocol !psd !random \
    !routing-mark !src-address !src-address-list !src-address-type \
    !src-mac-address !src-port !tcp-mss !time !to-addresses !to-ports !ttl
/ip firewall service-port
set ftp disabled=no ports=21
set tftp disabled=no ports=69
set irc disabled=no ports=6667
set h323 disabled=no
set sip disabled=no ports=5060,5061 sip-direct-media=yes sip-timeout=1h
set pptp disabled=no
set rtsp disabled=no ports=554
set udplite disabled=no
set dccp disabled=no
set sctp disabled=no
/ip hotspot service-port
set ftp disabled=no ports=21
/ip hotspot user
set [ find default=yes ] comment="counters and limits for trial users" \
    disabled=no name=default-trial
/ip ipsec policy
set 0 disabled=no dst-address=::/0 group=default proposal=default protocol=\
    all src-address=::/0 template=yes
/ip ipsec settings
set accounting=yes interim-update=0s xauth-use-radius=no
/ip media settings
set thumbnails=""
/ip nat-pmp
set enabled=no
/ip proxy
set always-from-cache=no anonymous=no cache-administrator=webmaster \
    cache-hit-dscp=4 cache-on-disk=no cache-path=web-proxy enabled=no \
    max-cache-object-size=2048KiB max-cache-size=unlimited \
    max-client-connections=600 max-fresh-time=3d max-server-connections=600 \
    parent-proxy=:: parent-proxy-port=0 port=3128 serialize-connections=no \
    src-address=::
/ip service
set ftp address="" disabled=yes max-sessions=20 port=21 vrf=main
set telnet address="" disabled=yes max-sessions=20 port=23 vrf=main
set www address="" disabled=yes max-sessions=20 port=80 vrf=main
set ssh address="" disabled=no max-sessions=20 port=212 vrf=main
set www-ssl address="" certificate=none disabled=yes max-sessions=20 port=443 \
    tls-version=any vrf=main
set winbox address="" disabled=no max-sessions=20 port=8291 vrf=main
set api address="" disabled=yes max-sessions=20 port=8728 vrf=main
set api-ssl address="" certificate=none disabled=no max-sessions=20 port=8729 \
    tls-version=any vrf=main
/ip smb shares
set [ find default=yes ] comment="default share" directory=/pub disabled=yes \
    invalid-users="" name=pub read-only=no require-encryption=no valid-users=\
    ""
/ip socks
set auth-method=none connection-idle-timeout=2m enabled=yes max-connections=\
    200 port=1080 version=5 vrf=main
/ip ssh
set always-allow-password-login=yes ciphers=auto forwarding-enabled=local \
    host-key-size=4096 host-key-type=rsa strong-crypto=yes
/ip tftp settings
set max-block-size=4096
/ip traffic-flow
set active-flow-timeout=30m cache-entries=256k enabled=yes \
    inactive-flow-timeout=15s interfaces=all packet-sampling=no \
    sampling-interval=0 sampling-space=0
/ip traffic-flow ipfix
set bytes=yes dst-address=yes dst-address-mask=yes dst-mac-address=yes \
    dst-port=yes first-forwarded=yes gateway=yes icmp-code=yes icmp-type=yes \
    igmp-type=yes in-interface=yes ip-header-length=yes ip-total-length=yes \
    ipv6-flow-label=yes is-multicast=yes last-forwarded=yes nat-dst-address=\
    yes nat-dst-port=yes nat-events=yes nat-src-address=yes nat-src-port=yes \
    out-interface=yes packets=yes protocol=yes src-address=yes \
    src-address-mask=yes src-mac-address=yes src-port=yes sys-init-time=yes \
    tcp-ack-num=yes tcp-flags=yes tcp-seq-num=yes tcp-window-size=yes tos=yes \
    ttl=yes udp-length=yes
/ip traffic-flow target
add disabled=no dst-address=162.159.65.1 port=2055 src-address=0.0.0.0 \
    v9-template-refresh=20 v9-template-timeout=30m version=9
/ip upnp
set allow-disable-external-interface=no enabled=yes show-dummy-rule=yes
/ip upnp interfaces
add disabled=no !forced-ip interface=ether1-virgin type=external
add disabled=no !forced-ip interface=br-private type=internal
add disabled=no !forced-ip interface=vlan-dave type=internal
/ipv6 address
add address=::/64 advertise=yes auto-link-local=yes disabled=no eui-64=no \
    from-pool=aaisp-dhcpv6 interface=l2tp-aaisp no-dad=no
add address=::/64 advertise=yes auto-link-local=yes disabled=no eui-64=no \
    from-pool=aaisp-dhcpv6 interface=vlan-dave no-dad=no
/ipv6 dhcp-client
add add-default-route=yes allow-reconfigure=no check-gateway=none \
    default-route-distance=1 default-route-tables=default dhcp-options="" \
    dhcp-options="" disabled=no interface=l2tp-aaisp pool-name=aaisp-dhcpv6 \
    pool-prefix-length=64 prefix-address-lists="" prefix-hint=::/0 request=\
    address,prefix use-peer-dns=no validate-server-duid=yes
/ipv6 firewall address-list
add address=::/128 comment="unspecified address" disabled=no dynamic=no list=\
    list-v6-bogons
add address=::1/128 comment=lo disabled=no dynamic=no list=list-v6-bogons
add address=fec0::/10 comment=site-local disabled=no dynamic=no list=\
    list-v6-bogons
add address=::ffff:0.0.0.0/96 comment=ipv4-mapped disabled=no dynamic=no \
    list=list-v6-bogons
add address=::/96 comment="ipv4 compat" disabled=no dynamic=no list=\
    list-v6-bogons
add address=100::/64 comment="discard only " disabled=no dynamic=no list=\
    list-v6-bogons
add address=2001:db8::/32 comment=documentation disabled=no dynamic=no list=\
    list-v6-bogons
add address=2001:10::/28 comment=ORCHID disabled=no dynamic=no list=\
    list-v6-bogons
add address=3ffe::/16 comment=6bone disabled=no dynamic=no list=\
    list-v6-bogons
add address=2001:8b0:65d3::/48 comment="754t aaisp full v6 allocation" \
    disabled=no dynamic=no list=list-v6-trusted
/ipv6 firewall filter
add action=accept chain=input comment="accept from list-v6-trusted" \
    src-address-list=list-v6-trusted
add action=accept chain=input comment="accept established,related,untracked" \
    connection-state=established,related,untracked
add action=drop chain=input comment="drop invalid" connection-state=invalid
add action=accept chain=input comment="accept ICMPv6" protocol=icmpv6
add action=accept chain=input comment="accept UDP traceroute" port=\
    33434-33534 protocol=udp
add action=accept chain=input comment=\
    "accept DHCPv6-Client prefix delegation." dst-port=546 protocol=udp \
    src-address=fe80::/10
add action=accept chain=input comment="accept IKE" dst-port=500,4500 \
    protocol=udp
add action=accept chain=input comment="accept ipsec AH" protocol=ipsec-ah
add action=accept chain=input comment="accept ipsec ESP" protocol=ipsec-esp
add action=accept chain=input comment="accept all that matches ipsec policy" \
    ipsec-policy=in,ipsec
add action=drop chain=input comment=\
    "drop everything else not coming from LAN" !connection-bytes \
    !connection-limit !connection-mark !connection-rate !connection-state \
    !connection-type !content disabled=no !dscp !dst-address \
    !dst-address-list !dst-address-type !dst-limit !dst-port !headers \
    !hop-limit !icmp-options !in-bridge-port !in-bridge-port-list \
    !in-interface in-interface-list=!iflist-lan !ingress-priority \
    !ipsec-policy !limit log=no log-prefix="" !out-bridge-port \
    !out-bridge-port-list !out-interface !out-interface-list !packet-mark \
    !packet-size !per-connection-classifier !port !priority !protocol !random \
    !routing-mark !src-address !src-address-list !src-address-type \
    !src-mac-address !src-port !tcp-flags !tcp-mss !time !tls-host
add action=accept chain=forward comment="forward from list-v6-trusted" \
    src-address-list=list-v6-trusted
add action=accept chain=forward comment="forward to list-v6-trusted" \
    dst-address-list=list-v6-trusted
add action=accept chain=forward comment=\
    "accept established,related,untracked" connection-state=\
    established,related,untracked
add action=drop chain=forward comment="drop invalid" connection-state=invalid
add action=drop chain=forward comment="drop src ipv6 bogons" \
    src-address-list=list-v6-bogons
add action=drop chain=forward comment="drop dst ipv6 bogons" \
    dst-address-list=list-v6-bogons
add action=drop chain=forward comment="rfc4890 drop hop-limit=1" hop-limit=\
    equal:1 protocol=icmpv6
add action=accept chain=forward comment="accept ICMPv6" protocol=icmpv6
add action=accept chain=forward comment="accept HIP" protocol=139
add action=accept chain=forward comment="accept IKE" dst-port=500,4500 \
    protocol=udp
add action=accept chain=forward comment="accept ipsec AH" protocol=ipsec-ah
add action=accept chain=forward comment="accept ipsec ESP" protocol=ipsec-esp
add action=accept chain=forward comment=\
    "accept all that matches ipsec policy" ipsec-policy=in,ipsec
add action=drop chain=forward comment=\
    "drop everything else not coming from LAN" !connection-bytes \
    !connection-limit !connection-mark !connection-rate !connection-state \
    !connection-type !content disabled=no !dscp !dst-address \
    !dst-address-list !dst-address-type !dst-limit !dst-port !headers \
    !hop-limit !icmp-options !in-bridge-port !in-bridge-port-list \
    !in-interface in-interface-list=!iflist-lan !ingress-priority \
    !ipsec-policy !limit log=no log-prefix="" !out-bridge-port \
    !out-bridge-port-list !out-interface !out-interface-list !packet-mark \
    !packet-size !per-connection-classifier !port !priority !protocol !random \
    !routing-mark !src-address !src-address-list !src-address-type \
    !src-mac-address !src-port !tcp-flags !tcp-mss !time !tls-host
add action=accept chain=output comment="accept to list-v6-trusted" \
    dst-address-list=list-v6-trusted
/ipv6 nd
set [ find default=yes ] advertise-dns=yes advertise-mac-address=yes \
    disabled=no hop-limit=unspecified interface=all \
    managed-address-configuration=no mtu=unspecified other-configuration=no \
    ra-delay=3s ra-interval=3m20s-10m ra-lifetime=30m ra-preference=medium \
    reachable-time=unspecified retransmit-interval=unspecified
/ipv6 nd prefix default
set autonomous=yes preferred-lifetime=1w valid-lifetime=4w2d
/mpls settings
set allow-fast-path=yes dynamic-label-range=16-1048575 propagate-ttl=yes
/ppp aaa
set accounting=yes enable-ipv6-accounting=no interim-update=0s \
    use-circuit-id-in-nas-port-id=no use-radius=no
/radius incoming
set accept=no port=3799 vrf=main
/routing igmp-proxy
set query-interval=2m5s query-response-interval=10s quick-leave=no
/routing rule
add action=lookup-only-in-table disabled=yes interface=vlan-dave table=dave
/routing settings
set single-process=no
/snmp
set contact="" enabled=no engine-id-suffix="" location="" src-address=:: \
    trap-community=public trap-generators=temp-exception trap-target="" \
    trap-version=1 vrf=main
/system clock
set time-zone-autodetect=no time-zone-name=Europe/London
/system clock manual
set dst-delta=+00:00 dst-end="1970-01-01 00:00:00" dst-start=\
    "1970-01-01 00:00:00" time-zone=+00:00
/system health settings
set cpu-overtemp-check=no cpu-overtemp-startup-delay=1m \
    cpu-overtemp-threshold=105C
/system identity
set name=fw-16c
/system leds
set 0 disabled=no interface=sfp leds=sfp-sfpplus1-led type=interface-activity
/system leds settings
set all-leds-off=never
/system logging
set 0 action=memory disabled=no prefix="" regex="" topics=info
set 1 action=memory disabled=no prefix="" regex="" topics=error
set 2 action=memory disabled=no prefix="" regex="" topics=warning
set 3 action=echo disabled=no prefix="" regex="" topics=critical
add action=memory disabled=yes prefix="" regex="" topics=dns
/system note
set note="" show-at-cli-login=no show-at-login=yes
/system ntp client
set enabled=yes mode=unicast servers="uk.pool.ntp.org,162.159.200.1,188.114.11\
    6.1,162.159.200.123,139.162.219.252" vrf=main
/system ntp server
set auth-key=none broadcast=no broadcast-addresses="" enabled=yes \
    local-clock-stratum=5 manycast=no multicast=no use-local-clock=no vrf=\
    main
/system ntp client servers
add address=uk.pool.ntp.org auth-key=none disabled=no iburst=yes max-poll=10 \
    min-poll=6
add address=162.159.200.1 auth-key=none disabled=no iburst=yes max-poll=10 \
    min-poll=6
add address=188.114.116.1 auth-key=none disabled=no iburst=yes max-poll=10 \
    min-poll=6
add address=162.159.200.123 auth-key=none disabled=no iburst=yes max-poll=10 \
    min-poll=6
add address=139.162.219.252 auth-key=none disabled=no iburst=yes max-poll=10 \
    min-poll=6
/system package local-update mirror
set check-interval=1d enabled=no primary-server=0.0.0.0 secondary-server=\
    0.0.0.0 user=""
/system package update
set channel=testing
/system resource irq
set 0 cpu=auto
set 1 cpu=auto
set 2 cpu=auto
set 3 cpu=auto
set 4 cpu=auto
set 5 cpu=auto
set 6 cpu=auto
set 7 cpu=auto
set 8 cpu=auto
set 9 cpu=auto
set 10 cpu=auto
set 11 cpu=auto
set 12 cpu=auto
set 13 cpu=auto
set 14 cpu=auto
set 15 cpu=auto
/system resource irq rps
set ether1-virgin disabled=yes
set ether2-vodafone disabled=yes
set ether3-raspi disabled=yes
set ether4-private disabled=yes
set ether5 disabled=yes
set ether6 disabled=yes
set ether7 disabled=yes
set ether8 disabled=yes
set sfp disabled=yes
/system resource usb settings
set authorization=no
/system routerboard reset-button
set enabled=no hold-time=0s..1m on-event=""
/system routerboard settings
set auto-upgrade=yes boot-device=nand-if-fail-then-ethernet boot-protocol=\
    bootp force-backup-booter=no preboot-etherboot=disabled \
    preboot-etherboot-server=any protected-routerboot=disabled \
    reformat-hold-button=20s reformat-hold-button-max=10m silent-boot=no
/system scheduler
add disabled=no interval=0s name=b0rt on-event="/system reboot" policy=\
    ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon \
    start-date=2023-11-04 start-time=14:20:00
/system script
add dont-require-permissions=no name=cacerts owner=dave policy=\
    ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon source="{\
    \r\
    \n  :do {\r\
    \n      /tool fetch url=https://mkcert.org/generate/ check-certificate=yes\
    \_dst-path=cacert.pem;\r\
    \n      /certificate remove [find];\r\
    \n      /certificate import file-name=cacert.pem passphrase=\"\";\r\
    \n      /file remove cacert.pem;\r\
    \n      :log info (\"Updated certificate trust store\");\r\
    \n  } on-error={\r\
    \n      :log error (\"Failed to update certificate trust store\");\r\
    \n  };\r\
    \n}"
/system watchdog
set auto-send-supout=no automatic-supout=yes ping-start-after-boot=5m \
    ping-timeout=1m watch-address=8.8.8.8 watchdog-timer=yes
/tool bandwidth-server
set allocate-udp-ports-from=2000 allowed-addresses4="" allowed-addresses6="" \
    authenticate=yes enabled=yes max-sessions=100
/tool e-mail
set from=<> port=25 server=0.0.0.0 tls=no user="" vrf=main
/tool graphing
set page-refresh=300 store-every=5min
/tool graphing interface
add allow-address=0.0.0.0/0 disabled=no interface=all store-on-disk=yes
/tool graphing queue
add allow-address=0.0.0.0/0 allow-target=yes disabled=no simple-queue=all \
    store-on-disk=yes
/tool graphing resource
add allow-address=0.0.0.0/0 disabled=no store-on-disk=yes
/tool mac-server
set allowed-interface-list=iflist-admin
/tool mac-server mac-winbox
set allowed-interface-list=iflist-admin
/tool mac-server ping
set enabled=yes
/tool romon
set enabled=no id=00:00:00:00:00:00
/tool romon port
set [ find default=yes ] cost=100 disabled=no forbid=no interface=all
/tool sms
set allowed-number="" channel=0 polling=no port=none receive-enabled=no \
    sms-storage=sim
/tool sniffer
set file-limit=1000KiB file-name="" filter-cpu="" filter-direction=any \
    filter-dst-ip-address="" filter-dst-ipv6-address="" \
    filter-dst-mac-address="" filter-dst-port="" filter-interface="" \
    filter-ip-address="" filter-ip-protocol="" filter-ipv6-address="" \
    filter-mac-address="" filter-mac-protocol="" \
    filter-operator-between-entries=or filter-port="" filter-size="" \
    filter-src-ip-address="" filter-src-ipv6-address="" \
    filter-src-mac-address="" filter-src-port="" filter-stream=no \
    filter-vlan="" max-packet-size=2048 memory-limit=100KiB memory-scroll=yes \
    only-headers=no quick-rows=20 quick-show-frame=no streaming-enabled=no \
    streaming-server=0.0.0.0:37008
/tool traffic-generator
set latency-distribution-max=100us measure-out-of-order=no \
    stats-samples-to-keep=100 test-id=0
/tr069-client
set acs-url="" check-certificate=yes client-certificate=none \
    connection-request-port=7547 connection-request-username="" enabled=no \
    periodic-inform-enabled=yes periodic-inform-interval=1d \
    provisioning-code="" username=""
/user aaa
set accounting=yes default-group=read exclude-groups="" interim-update=0s \
    use-radius=no
/user settings
set minimum-categories=0 minimum-password-length=0
