#!/bin/bash
set -euo pipefail

# Log configuration
LOG_FILE="/var/log/ntopng/ntopng-startup.log"
REDIS_LOG="/var/log/ntopng/redis.log"
NETFLOW2NG_LOG="/var/log/ntopng/netflow2ng.log"

# Ensure log directory exists
mkdir -p "$(dirname "${LOG_FILE}")"

# Function to log messages with timestamps
log() {
	local timestamp
	timestamp=$(date '+%Y-%m-%d %H:%M:%S')
	echo "[${timestamp}] $*" | tee -a "${LOG_FILE}"
}

# Function to check if a service is running
check_service() {
	local service_name="$1"
	local port="$2"
	local timeout="${3:-30}"

	log "Checking if ${service_name} is available on port ${port}..."
	for _ in $(seq 1 "${timeout}"); do
		if nc -z localhost "${port}" 2>/dev/null; then
			log "${service_name} is ready on port ${port}"
			return 0
		fi
		sleep 1
	done
	log "ERROR: ${service_name} failed to start on port ${port} after ${timeout}s"
	return 1
}

# Signal handlers for graceful shutdown
cleanup() {
	log "Received shutdown signal, cleaning up..."

	# Stop ntopng
	if [[ -n ${NTOPNG_PID-} ]]; then
		log "Stopping ntopng (PID: ${NTOPNG_PID})..."
		kill -TERM "${NTOPNG_PID}" 2>/dev/null || true
		wait "${NTOPNG_PID}" 2>/dev/null || true
	fi

	# Stop netflow2ng
	if [[ -n ${NETFLOW2NG_PID-} ]]; then
		log "Stopping netflow2ng (PID: ${NETFLOW2NG_PID})..."
		kill -TERM "${NETFLOW2NG_PID}" 2>/dev/null || true
		wait "${NETFLOW2NG_PID}" 2>/dev/null || true
	fi

	# Stop Redis
	if [[ -n ${REDIS_PID-} ]]; then
		log "Stopping Redis (PID: ${REDIS_PID})..."
		/mise/shims/redis-cli shutdown || true
	fi

	log "Cleanup complete"
	exit 0
}

trap cleanup SIGTERM SIGINT

# Function to attempt GeoIP database update
update_geoip_databases() {
	log "Checking GeoIP configuration..."

	# Check if we have valid credentials
	if [[ ${GEOIPUPDATE_ACCOUNT_ID:-0} != "0" ]] && [[ -n ${GEOIPUPDATE_LICENSE_KEY-} ]] && [[ ${GEOIPUPDATE_LICENSE_KEY-} != "000000000000" ]]; then
		log "Valid GeoIP credentials detected, attempting database update..."
		if geoipupdate -v 2>&1 | tee -a "${LOG_FILE}"; then
			log "✓ GeoIP databases updated successfully"
			log "Geographic IP location features enabled"
		else
			log "⚠ Failed to update GeoIP databases, but continuing without geolocation"
			log "ntopng will work normally without geographic IP information"
		fi
	else
		log "ℹ No GeoIP credentials provided - running without geolocation features"
		log "To enable: set GEOIPUPDATE_ACCOUNT_ID and GEOIPUPDATE_LICENSE_KEY environment variables"
	fi
}

# Main startup sequence
main() {
	log "Starting ntopng container services..."

	# Update GeoIP databases if credentials provided
	update_geoip_databases

	# Start Redis in background
	log "Starting Redis server..."
	/mise/shims/redis-server \
		--daemonize yes \
		--logfile "${REDIS_LOG}" \
		--loglevel notice \
		--pidfile /var/run/ntop/redis.pid

	REDIS_PID=$(cat /var/run/ntop/redis.pid 2>/dev/null || echo "")
	# trunk-ignore(shellcheck/SC2310)
	check_service "Redis" 6379 || exit 1

	# Start netflow2ng in background
	log "Starting netflow2ng..."
	/usr/local/bin/netflow2ng \
		-metrics :9101 \
		-listen :2055 \
		-log-level info \
		-target tcp://127.0.0.1:5556 \
		2>&1 | tee -a "${NETFLOW2NG_LOG}" &

	NETFLOW2NG_PID=$!
	log "netflow2ng started with PID: ${NETFLOW2NG_PID}"

	# Give netflow2ng time to start
	sleep 5

	# Start ntopng in foreground
	log "Starting ntopng..."
	/usr/local/bin/ntopng /etc/ntopng.conf &
	NTOPNG_PID=$!

	log "ntopng started with PID: ${NTOPNG_PID}"

	# Wait for ntopng to be ready
	# trunk-ignore(shellcheck/SC2310)
	check_service "ntopng" 3000 60 || exit 1

	log "All services started successfully"
	log "ntopng web interface available at http://localhost:3000"
	log "netflow2ng listening on UDP port 2055"

	# Wait for ntopng to finish
	wait "${NTOPNG_PID}"
}

# Check for required files
if [[ ! -f /etc/ntopng.conf ]]; then
	log "ERROR: ntopng configuration file not found at /etc/ntopng.conf"
	exit 1
fi

if [[ ! -x /usr/local/bin/ntopng ]]; then
	log "ERROR: ntopng binary not found or not executable"
	exit 1
fi

if [[ ! -x /usr/local/bin/netflow2ng ]]; then
	log "ERROR: netflow2ng binary not found or not executable"
	exit 1
fi

# Start main function
main "$@"
