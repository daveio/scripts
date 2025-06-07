# 2024-12-23 19:04:47 by RouterOS 7.17rc3
# software id = H918-81CY
#
# model = RB4011iGS+5HacQ2HnD
# serial number = A283095904E8

/ip dhcp lease
/ip dhcp lease remove [find where !dynamic]

add address=10.0.100.2 mac-address=D0:21:F9:6B:AD:27 server=dhcp-br-mgmt
add address=10.0.100.3 mac-address=80:2A:A8:C0:21:B4 server=dhcp-br-mgmt
add address=10.0.100.4 mac-address=80:2A:A8:C0:33:FC server=dhcp-br-mgmt
add address=10.0.100.5 mac-address=F0:9F:C2:0B:2B:7F server=dhcp-br-mgmt
add address=10.0.100.6 mac-address=F0:9F:C2:19:33:34 server=dhcp-br-mgmt
add address=10.0.100.7 mac-address=F0:9F:C2:0B:2D:53 server=dhcp-br-mgmt
add address=10.0.100.8 mac-address=DC:A6:32:46:E4:B5 server=dhcp-br-mgmt
add address=10.0.100.9 mac-address=78:8A:20:47:2A:1D server=dhcp-br-mgmt
add address=10.0.100.10 client-id=1:24:5e:be:80:2d:20 mac-address=24:5E:BE:80:2D:20 server=dhcp-br-mgmt
add address=10.0.100.11 mac-address=B8:BE:F4:EA:9B:B3 server=dhcp-br-mgmt
add address=10.0.100.12 mac-address=B8:BE:F4:EB:F3:09 server=dhcp-br-mgmt
add address=10.0.100.13 client-id=1:18:fd:74:b9:e5:e2 mac-address=18:FD:74:B9:E5:E2 server=dhcp-br-mgmt
add address=10.0.100.14 client-id=1:18:fd:74:b9:e6:0 mac-address=18:FD:74:B9:E6:00 server=dhcp-br-mgmt
add address=10.0.100.15 client-id=1:d8:b3:70:22:f0:ab mac-address=D8:B3:70:22:F0:AB server=dhcp-br-mgmt
add address=10.0.100.16 client-id=1:e4:38:83:87:27:fa mac-address=E4:38:83:87:27:FA server=dhcp-br-mgmt

add address=10.0.101.2 mac-address=DC:A6:32:46:E4:B5 server=dhcp-vlan-private
add address=10.0.101.3 comment=music-assistant mac-address=02:42:54:5C:1B:BB server=dhcp-vlan-private
add address=10.0.101.4 mac-address=02:42:00:FA:25:AC server=dhcp-vlan-private
add address=10.0.101.5 mac-address=02:42:FE:42:65:86 server=dhcp-vlan-private
add address=10.0.101.6 mac-address=44:65:0D:EE:DB:2F server=dhcp-vlan-private
add address=10.0.101.7 mac-address=00:1E:C0:3A:D7:85 server=dhcp-vlan-private
add address=10.0.101.8 mac-address=F6:1A:9A:84:1E:94 server=dhcp-vlan-private
add address=10.0.101.9 mac-address=22:03:20:B0:36:8B server=dhcp-vlan-private
add address=10.0.101.10 client-id=1:24:5e:be:80:2d:20 comment="nas 2.5GbE port 1 vSwitch-Private" mac-address=24:5E:BE:80:2D:20 server=dhcp-vlan-private
add address=10.0.101.11 client-id=1:26:5a:f3:80:2d:20 mac-address=26:5A:F3:80:2D:20 server=dhcp-vlan-private
add address=10.0.101.12 mac-address=18:B4:30:60:71:32 server=dhcp-vlan-private
add address=10.0.101.13 mac-address=18:B4:30:61:0A:CC server=dhcp-vlan-private
add address=10.0.101.14 mac-address=18:B4:30:3B:B3:B8 server=dhcp-vlan-private
add address=10.0.101.15 mac-address=54:60:09:DA:9D:FE server=dhcp-vlan-private
add address=10.0.101.16 mac-address=E4:7D:BD:5F:BB:25 server=dhcp-vlan-private
add address=10.0.101.17 mac-address=94:9A:A9:CA:E7:D6 server=dhcp-vlan-private
add address=10.0.101.18 mac-address=BA:B7:AB:4F:C2:4C server=dhcp-vlan-private
add address=10.0.101.19 client-id=1:90:cd:b6:4d:d8:9e comment="printer wifi" mac-address=90:CD:B6:4D:D8:9E server=dhcp-vlan-private
add address=10.0.101.20 mac-address=18:B4:30:3B:BE:E1 server=dhcp-vlan-private
add address=10.0.101.21 mac-address=90:72:40:02:56:25 server=dhcp-vlan-private
add address=10.0.101.22 comment="echo show wifi (\?)" mac-address=08:12:A5:98:A6:74 server=dhcp-vlan-private
add address=10.0.101.23 mac-address=F0:B3:EC:12:5D:D7 server=dhcp-vlan-private
add address=10.0.101.24 mac-address=A4:77:33:2F:B2:0A server=dhcp-vlan-private
add address=10.0.101.25 mac-address=CA:C1:70:11:8F:6C server=dhcp-vlan-private
add address=10.0.101.26 mac-address=00:17:88:25:EB:8C server=dhcp-vlan-private
add address=10.0.101.27 mac-address=D4:A3:3D:67:AD:81 server=dhcp-vlan-private
add address=10.0.101.28 mac-address=B8:27:EB:82:D8:32 server=dhcp-vlan-private
add address=10.0.101.29 mac-address=00:18:DD:23:13:01 server=dhcp-vlan-private
add address=10.0.101.30 mac-address=84:0D:8E:59:81:17 server=dhcp-vlan-private
add address=10.0.101.31 mac-address=08:12:A5:E1:54:51 server=dhcp-vlan-private
add address=10.0.101.32 mac-address=84:0D:8E:5D:D7:21 server=dhcp-vlan-private
add address=10.0.101.33 mac-address=7C:DD:90:B8:DA:33 server=dhcp-vlan-private
add address=10.0.101.34 mac-address=24:DF:A7:B1:E4:B3 server=dhcp-vlan-private
add address=10.0.101.35 mac-address=00:FC:8B:71:12:DB server=dhcp-vlan-private
add address=10.0.101.36 mac-address=00:55:DA:50:65:99 server=dhcp-vlan-private
add address=10.0.101.37 client-id=1:18:fd:74:b9:e5:e2 mac-address=18:FD:74:B9:E5:E2 server=dhcp-vlan-private
add address=10.0.101.38 client-id=1:18:fd:74:b9:e6:0 mac-address=18:FD:74:B9:E6:00 server=dhcp-vlan-private
add address=10.0.101.39 mac-address=B8:BE:F4:EB:F3:09 server=dhcp-vlan-private
add address=10.0.101.40 mac-address=B8:BE:F4:EA:9B:B3 server=dhcp-vlan-private
add address=10.0.101.41 client-id=1:1c:57:dc:2b:5c:97 mac-address=1C:57:DC:2B:5C:97 server=dhcp-vlan-private
add address=10.0.101.42 client-id=1:aa:70:81:7f:44:9b mac-address=AA:70:81:7F:44:9B server=dhcp-vlan-private
add address=10.0.101.43 client-id=1:60:38:e0:d4:5:27 mac-address=60:38:E0:D4:05:27 server=dhcp-vlan-private
add address=10.0.101.44 mac-address=00:55:DA:50:64:EB server=dhcp-vlan-private
add address=10.0.101.45 client-id=1:d2:38:f0:21:b0:4 mac-address=D2:38:F0:21:B0:04 server=dhcp-vlan-private
add address=10.0.101.46 mac-address=F4:F5:D8:AC:05:6A server=dhcp-vlan-private
add address=10.0.101.47 client-id=1:60:fb:0:a7:16:e mac-address=60:FB:00:A7:16:0E server=dhcp-vlan-private
add address=10.0.101.48 mac-address=1C:53:F9:7E:01:2E server=dhcp-vlan-private
add address=10.0.101.49 client-id=1:30:8c:fb:6a:f:f0 mac-address=30:8C:FB:6A:0F:F0 server=dhcp-vlan-private
add address=10.0.101.50 client-id=1:94:ea:32:a7:8:65 mac-address=94:EA:32:A7:08:65 server=dhcp-vlan-private
add address=10.0.101.51 comment="divoom pixoo-64" mac-address=E0:E2:E6:37:75:D4 server=dhcp-vlan-private
add address=10.0.101.52 client-id=1:b8:27:eb:75:2f:a3 comment="piframe ethernet" mac-address=B8:27:EB:75:2F:A3 server=dhcp-vlan-private
add address=10.0.101.53 client-id=1:b8:27:eb:20:7a:f6 comment="piframe wifi" mac-address=B8:27:EB:20:7A:F6 server=dhcp-vlan-private
add address=10.0.101.54 mac-address=30:05:5C:E8:EC:FF server=dhcp-vlan-private
add address=10.0.101.55 mac-address=40:CB:C0:D3:CB:CB server=dhcp-vlan-private
add address=10.0.101.56 client-id=1:a0:2c:36:83:13:c4 mac-address=A0:2C:36:83:13:C4 server=dhcp-vlan-private
add address=10.0.101.57 client-id=1:a8:8c:3e:ae:84:df comment="xbox one series x wired" mac-address=A8:8C:3E:AE:84:DF server=dhcp-vlan-private
add address=10.0.101.58 client-id=1:0:18:dd:26:9:37 comment="hdhomerun 2-tuner (old)" mac-address=00:18:DD:26:09:37 server=dhcp-vlan-private
add address=10.0.101.59 comment=unidentified mac-address=02:42:74:DA:98:6E server=dhcp-vlan-private
add address=10.0.101.60 client-id=1:d8:3a:dd:dc:61:c8 comment="pi5 ethernet" mac-address=D8:3A:DD:DC:61:C8 server=dhcp-vlan-private
add address=10.0.101.61 client-id=1:d8:3a:dd:dc:61:cb comment="pi5 wifi" mac-address=D8:3A:DD:DC:61:CB server=dhcp-vlan-private
add address=10.0.101.62 client-id=1:0:1c:42:dc:cc:12 comment=dave-mba-winvm mac-address=00:1C:42:DC:CC:12 server=dhcp-vlan-private
add address=10.0.101.63 client-id=1:90:ca:fa:c5:10:1a comment=office-chromecast mac-address=90:CA:FA:C5:10:1A server=dhcp-vlan-private
add address=10.0.101.64 client-id=1:a4:17:31:a4:e8:b5 comment="dave-cbp wifi" mac-address=A4:17:31:A4:E8:B5 server=dhcp-vlan-private
add address=10.0.101.65 comment="i5mbp wifi" mac-address=90:9C:4A:C6:8E:D1 server=dhcp-vlan-private
add address=10.0.101.66 client-id=1:48:65:ee:14:64:31 comment="i5mbp wired via satechi thunderbolt" mac-address=48:65:EE:14:64:31 server=dhcp-vlan-private
add address=10.0.101.67 client-id=1:38:f9:d3:d4:d2:84 comment="i9mbp wifi" mac-address=38:F9:D3:D4:D2:84 server=dhcp-vlan-private
add address=10.0.101.68 client-id=1:50:3e:aa:96:df:6e comment="i9mbp wired via tp-link usb3" mac-address=50:3E:AA:96:DF:6E server=dhcp-vlan-private
add address=10.0.101.69 client-id=1:f0:b3:ec:17:6c:6f comment="office apple tv wired" mac-address=F0:B3:EC:17:6C:6F server=dhcp-vlan-private
add address=10.0.101.70 client-id=1:60:e3:2b:37:da:98 comment="push 3 wifi" mac-address=60:E3:2B:37:DA:98 server=dhcp-vlan-private
add address=10.0.101.71 comment=unidentified mac-address=74:84:69:AB:69:DB server=dhcp-vlan-private
add address=10.0.101.72 client-id=1:ea:47:8a:f6:55:d8 comment=unidentified mac-address=EA:47:8A:F6:55:D8 server=dhcp-vlan-private
add address=10.0.101.73 client-id=1:f6:11:50:e1:d6:24 comment=unidentified mac-address=F6:11:50:E1:D6:24 server=dhcp-vlan-private
add address=10.0.101.74 client-id=1:38:c9:86:4c:12:fc comment="i9mbp wired via apple thunderbolt ethernet" mac-address=38:C9:86:4C:12:FC server=dhcp-vlan-private
add address=10.0.101.75 client-id=1:c6:50:a5:d4:12:f2 mac-address=C6:50:A5:D4:12:F2 server=dhcp-vlan-private
add address=10.0.101.76 client-id=ff:f8:3:89:63:0:2:0:0:ab:11:41:b9:cb:37:8a:3e:47:ef mac-address=A4:17:31:A4:E8:B5 server=dhcp-vlan-private
add address=10.0.101.77 client-id=1:be:63:f9:72:f7:d6 mac-address=BE:63:F9:72:F7:D6 server=dhcp-vlan-private
add address=10.0.101.78 client-id=1:a2:55:be:1a:76:5e mac-address=A2:55:BE:1A:76:5E server=dhcp-vlan-private
add address=10.0.101.79 client-id=1:2e:3e:69:7c:e2:a7 mac-address=2E:3E:69:7C:E2:A7 server=dhcp-vlan-private
add address=10.0.101.80 client-id=1:dc:a4:ca:df:60:0 mac-address=DC:A4:CA:DF:60:00 server=dhcp-vlan-private
add address=10.0.101.81 client-id=ff:5d:e2:6c:15:0:2:0:0:ab:11:19:4:f3:3f:a3:28:dc:83 mac-address=00:01:C0:1A:CC:9C server=dhcp-vlan-private
add address=10.0.101.82 client-id=1:0:1:c0:1a:cc:9c mac-address=00:01:C0:1A:CC:9C server=dhcp-vlan-private
add address=10.0.101.83 client-id=1:ac:fd:ce:e4:c7:a8 mac-address=AC:FD:CE:E4:C7:A8 server=dhcp-vlan-private
add address=10.0.101.84 client-id=1:f6:61:60:a5:1f:71 mac-address=F6:61:60:A5:1F:71 server=dhcp-vlan-private
add address=10.0.101.85 client-id=1:7c:88:99:5:cf:44 mac-address=7C:88:99:05:CF:44 server=dhcp-vlan-private
add address=10.0.101.86 client-id=1:f4:9d:8a:48:5f:af mac-address=F4:9D:8A:48:5F:AF server=dhcp-vlan-private
add address=10.0.101.87 client-id=1:88:66:5a:88:4f:59 mac-address=88:66:5A:88:4F:59 server=dhcp-vlan-private

add address=81.187.62.66 client-id=1:60:38:e0:d4:5:27 mac-address=60:38:E0:D4:05:27 server=dhcp-vlan-public
