echo "funtiems"

/usr/local/bin/netflow2ng &

/mise/shims/redis-server --daemonize yes

/usr/local/bin/ntopng /etc/ntopng.conf
