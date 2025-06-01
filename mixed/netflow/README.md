# The Complete Guide to Setting Up `ntopng` with `netflow2ng` in Docker and Mikrotik RouterOS 7

## Or: How I Learned to Stop Worrying and Love Free NetFlow Collection

## Introduction

So you want to monitor your network traffic like the big boys, but you don't want to shell out 300 EUR for nProbe? Welcome to the club of budget-conscious network nerds! This guide will walk you through setting up ntopng (the pretty face of network monitoring) with netflow2ng (the scrappy FOSS alternative to nProbe) in Docker, and then configuring your Mikrotik router to send it all the juicy NetFlow data it can handle.

## Prerequisites

Before we dive into the deep end, make sure you have:

- A server/VM/old laptop running Docker (because who doesn't have Docker in 2025?)
- A Mikrotik router running RouterOS 7 (RIP IP Accounting, we hardly knew ye)
- Basic understanding of networking (if you don't know what an IP address is, this might be a tough ride)
- Coffee, beer, or your beverage of choice (network monitoring is thirsty work)

## Part 1: Setting Up the Docker Environment

### Step 1: Create a docker-compose.yml file

First, let's create a nice, tidy `docker-compose.yml` file. Because clicking around in Docker Desktop is for people who don't appreciate the beauty of YAML:

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    volumes:
      - elasticsearch:/usr/share/elasticsearch/data
    networks:
      - ntopng
  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    ports:
      - 3001:3000
    volumes:
      - grafana:/var/lib/grafana
    networks:
      - ntopng
    depends_on:
      - influxdb
  influxdb:
    image: influxdb:2.7
    restart: unless-stopped
    volumes:
      - influxdb:/var/lib/influxdb
    environment:
      - INFLUXDB_DB=ntopng
    networks:
      - ntopng
  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.0
    ports:
      - 5601:5601
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - ntopng
    depends_on:
      - elasticsearch
  netflow2ng:
    image: synfinatic/netflow2ng:latest
    restart: unless-stopped
    command:
      [
        --zmq-output=tcp://ntopng:5556,
        --netflow-port=2055,
        --metrics-addr=:9100,
        --log-level=info,
      ]
    ports:
      # This will bind to both IPv4 and IPv6
      - 2055:2055/udp
      - 9100:9100
    networks:
      - ntopng
    depends_on:
      - ntopng
  ntopng:
    networks:
      - ntopng
    image: ntop/ntopng:stable
    restart: unless-stopped
    network_mode: host
    volumes:
      - ntopng:/var/lib/ntopng
      - ./ntopng.conf:/etc/ntopng/ntopng.conf:ro
    environment:
      - REDIS_SERVER=redis
    command: [
        --community,
        -i,
        tcp://127.0.0.1:5556,
        -r,
        redis,
        --http-port,
        "3000", # Binds to all interfaces including IPv6
      ]
    depends_on:
      - redis
      - influxdb
      - elasticsearch
  redis:
    image: redis:alpine
    restart: unless-stopped
    volumes:
      - redis:/data
    networks:
      - ntopng
volumes:
  elasticsearch:
  grafana:
  influxdb:
  ntopng:
  redis:
networks:
  ntopng:
    driver: bridge
    enable_ipv6: true # Enable IPv6 on the bridge network
    ipam:
      config:
        - subnet: 172.20.0.0/16
        - subnet: 2001:db8:1::/64 # IPv6 subnet
```

### Step 2: Create an ntopng configuration file

Create an `ntopng.conf` file in the same directory:

```bash
# ntopng configuration
# Because command-line arguments are so 2010

# Basic settings
-G=/var/lib/ntopng/ntopng.pid
--community
--disable-autologout
--disable-login=1  # Living dangerously! Add authentication in production

# Interface settings
-i=tcp://127.0.0.1:5556

# Redis settings
--redis=redis

# Web interface
--http-port=3000

# Data retention (adjust based on your disk space and paranoia level)
--max-num-flows=200000
--max-num-hosts=100000

# SNMP settings (optional, if you want to monitor devices via SNMP)
--snmp-community=public
--snmp-poll-interval=300

-F="influxdb;ntopng;30;http://influxdb:8086"

# Optional: Enable if you want to dump flows to ES/MySQL/etc
# -F=es;ntopng;ntopng-%Y.%m.%d;http://elasticsearch:9200/_bulk
```

### Step 3: Fire it up

Time to see if our house of cards holds together:

```bash
docker-compose up -d
```

Check if everything's running:

```bash
docker-compose ps
```

If you see all services "Up", congratulations! If not, well...

```bash
docker-compose logs -f
```

...and prepare for some quality debugging time.

### Step 4: Access ntopng

Open your browser and navigate to `http://your-server-ip:3000`. You should see the ntopng interface. If you don't, check if:

- Port 3000 is open in your firewall (classic mistake)
- Docker is actually running (happens to the best of us)
- You typed the URL correctly (no judgment)

## Part 2: Configuring Mikrotik RouterOS 7

Now for the fun part - convincing your Mikrotik router to spill its guts to your shiny new NetFlow collector.

### Option 1: Using the GUI (Winbox/WebFig)

Because not everyone speaks RouterOS CLI fluently:

1. **Open IP → Traffic Flow**

2. **Configure the Settings tab:**

   - ✅ Enabled
   - Interfaces: `all` (or select specific ones if you're picky)
   - Cache Entries: `4k` (or more if your router has the RAM)
   - Active Flow Timeout: `00:01:00`
   - Inactive Flow Timeout: `00:00:15`

3. **Add a Target:**
   - Click on "Targets" tab
   - Click the "+" button
   - Address: Your Docker host IP
   - Port: `2055`
   - Version: `9` (because we're modern)
   - v9 Template Refresh: `20`
   - v9 Template Timeout: `30`

### Option 2: Using the CLI

For those who prefer the terminal (there are dozens of us!):

```bash
# SSH into your Mikrotik
ssh admin@your-mikrotik-ip

# Configure Traffic Flow
/ip traffic-flow
set enabled=yes interfaces=all cache-entries=4k \
    active-flow-timeout=1m inactive-flow-timeout=15s

# Add the NetFlow target
/ip traffic-flow target
add dst-address=YOUR-DOCKER-HOST-IP port=2055 version=9 \
    v9-template-refresh=20 v9-template-timeout=30

# Verify your configuration
/ip traffic-flow print
/ip traffic-flow target print
```

### Troubleshooting Mikrotik

If flows aren't showing up:

- Check firewall rules (UDP 2055 needs to be open)
- Verify the target IP is reachable from the router: `/ping YOUR-DOCKER-HOST-IP`
- Make sure you have actual traffic flowing through the router (NetFlow can't report on nothing)
- Check if your license level supports Traffic Flow (it should, but RouterOS can be quirky)

## Part 3: Verifying Everything Works

1. **Generate some traffic** - Download a large file, stream a video, or just let your users do their thing

2. **Check netflow2ng logs:**

   ```bash
   docker logs netflow2ng
   ```

   You should see messages about receiving NetFlow packets

3. **Check ntopng:**
   - Go to the web interface
   - Select the `tcp://127.0.0.1:5556` interface from the dropdown
   - You should see flows appearing in real-time

## Part 4: Add Authentication

Because leaving ntopng open to the world is asking for trouble:

1. Remove `--disable-login` from the config
2. Mount a users file to `/var/lib/ntopng/users.ntopng`

## Part 5: Maintenance and Best Practices

### Regular Maintenance Tasks

1. **Monitor disk usage** - ntopng can be a data hoarder:

```bash
docker exec ntopng du -sh /var/lib/ntopng
```

2. **Rotate logs** - Add this to your crontab:

```bash
0 2 * * * docker exec ntopng logrotate /etc/logrotate.d/ntopng
```

3. **Backup your data** - Because Murphy's Law is real:

```bash
docker run --rm -v ntopng_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/ntopng-$(date +%Y%m%d).tar.gz /data
```

### Performance Tuning

- **Increase cache entries** on busy networks (but watch your RAM)
- **Adjust flow timeouts** based on your network patterns
- **Use sampling** on high-traffic interfaces:
  ```bash
  /ip traffic-flow set sampling-interval=100 sampling-space=99
  ```

### Security Considerations

1. **Use HTTPS** - Generate certificates and mount them
2. **Implement authentication** - Seriously, do this
3. **Firewall everything** - Only expose what's necessary
4. **Regular updates** - Pull new images monthly

## Troubleshooting Common Issues

### "No flows visible in ntopng"

- Check netflow2ng is receiving data: `docker logs netflow2ng`
- Verify ZMQ connection: `docker exec ntopng netstat -an | grep 5556`
- Ensure interfaces match in configs

### "High CPU usage"

- Enable sampling on the Mikrotik
- Reduce cache entries
- Consider upgrading your Docker host (or accepting your fate)

### "Data not persisting"

- Check volume mounts
- Verify Redis is running: `docker exec redis redis-cli ping`
- Look for disk space issues

## Conclusion

Congratulations! You now have a fully functional NetFlow monitoring setup that didn't cost you a kidney. You're collecting flows, visualizing traffic, and probably discovering just how much bandwidth Netflix actually uses.

Remember:

- This setup is perfect for home labs and small businesses
- For enterprise deployments, consider the paid ntopng version (they need to eat too)
- NetFlow data is addictive - you've been warned
- Your router might judge you for the traffic it's now reporting

Happy monitoring, and may your flows be forever in your favor!

## Bonus: Useful ntopng Tricks

1. **Top Talkers**: Navigate to Hosts → Top Hosts to find bandwidth hogs
2. **Application Detection**: ntopng uses nDPI for L7 protocol detection - prepare to be amazed/horrified
3. **Alerts**: Set up alerts for unusual traffic patterns (because paranoia is healthy)
4. **Custom Categories**: Create custom application categories to track specific services

## Final Thoughts

You've just built a professional-grade network monitoring solution using open-source tools and some Docker magic. Pat yourself on the back, grab your beverage of choice, and enjoy watching the packets flow by.

Remember: With great monitoring comes great responsibility. Use your newfound powers wisely, and try not to become that person who obsessively watches network graphs all day. (But we won't judge if you do.)
