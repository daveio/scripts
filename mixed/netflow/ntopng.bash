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
	local host="${4:-localhost}"

	log "Checking if ${service_name} is available on ${host}:${port}..."
	for _ in $(seq 1 "${timeout}"); do
		if nc -z "${host}" "${port}" 2>/dev/null; then
			log "${service_name} is ready on ${host}:${port}"
			return 0
		fi
		sleep 1
	done
	log "ERROR: ${service_name} failed to start on ${host}:${port} after ${timeout}s"
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

	# Stop Redis only if we started it locally
	if [[ -n ${REDIS_PID-} ]] && [[ ${USE_LOCAL_REDIS-} == true ]]; then
		log "Stopping Redis (PID: ${REDIS_PID})..."
		# Try graceful shutdown first
		/usr/local/bin/mise exec redis@latest -- redis-cli -p "${REDIS_PORT:-6379}" shutdown || true
		# If Redis is still running after 5 seconds, force kill it
		sleep 2
		if kill -0 "${REDIS_PID}" 2>/dev/null; then
			log "Redis still running, force stopping..."
			kill -TERM "${REDIS_PID}" 2>/dev/null || true
			sleep 3
			kill -KILL "${REDIS_PID}" 2>/dev/null || true
		fi
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

# Function to parse Redis configuration
parse_redis_config() {
	if [[ -n ${REMOTE_REDIS-} ]]; then
		# Parse REMOTE_REDIS in format HOSTNAME:PORT or just HOSTNAME
		if [[ ${REMOTE_REDIS} == *":"* ]]; then
			REDIS_HOST="${REMOTE_REDIS%:*}"
			REDIS_PORT="${REMOTE_REDIS#*:}"

			# Validate port is numeric and in valid range
			if ! [[ ${REDIS_PORT} =~ ^[0-9]+$ ]] || [[ ${REDIS_PORT} -lt 1 ]] || [[ ${REDIS_PORT} -gt 65535 ]]; then
				log "ERROR: Invalid Redis port '${REDIS_PORT}' in REMOTE_REDIS. Must be 1-65535"
				exit 1
			fi
		else
			REDIS_HOST="${REMOTE_REDIS}"
			REDIS_PORT="6379"
		fi

		# Validate hostname is not empty
		if [[ -z ${REDIS_HOST} ]] || [[ ${REDIS_HOST} == *" "* ]]; then
			log "ERROR: Invalid Redis hostname '${REDIS_HOST}' in REMOTE_REDIS"
			exit 1
		fi

		USE_LOCAL_REDIS=false
		log "Using remote Redis server: ${REDIS_HOST}:${REDIS_PORT}"
	else
		REDIS_HOST="localhost"
		REDIS_PORT="6379"
		USE_LOCAL_REDIS=true
		log "Using local Redis server: ${REDIS_HOST}:${REDIS_PORT}"
	fi
}

# Main startup sequence
main() {
	log "Starting ntopng container services..."

	# Parse Redis configuration
	parse_redis_config

	# Update GeoIP databases if credentials provided
	update_geoip_databases

	# Start Redis in background only if using local Redis
	if [[ ${USE_LOCAL_REDIS} == true ]]; then
		log "Starting local Redis server..."

		# Ensure PID directory exists
		mkdir -p /var/run/ntop

		/usr/local/bin/mise exec redis@latest -- redis-server \
			--daemonize yes \
			--logfile "${REDIS_LOG}" \
			--loglevel notice \
			--pidfile /var/run/ntop/redis.pid \
			--port "${REDIS_PORT}" \
			--bind 127.0.0.1 \
			--save "" \
			--appendonly no

		# Wait a moment for Redis to write PID file and bind to port
		sleep 2

		REDIS_PID=$(cat /var/run/ntop/redis.pid 2>/dev/null || echo "")
		if [[ -z ${REDIS_PID} ]]; then
			log "ERROR: Failed to read Redis PID file"
			exit 1
		fi

		# trunk-ignore(shellcheck/SC2310)
		check_service "Redis" "${REDIS_PORT}" 30 "localhost" || exit 1
	else
		REDIS_PID="" # No local Redis PID when using remote Redis
		log "Skipping local Redis startup, using remote Redis at ${REDIS_HOST}:${REDIS_PORT}"
		# Check if remote Redis is accessible with shorter timeout since it should already be running
		# trunk-ignore(shellcheck/SC2310)
		check_service "Remote Redis" "${REDIS_PORT}" 5 "${REDIS_HOST}" || {
			log "ERROR: Cannot connect to remote Redis at ${REDIS_HOST}:${REDIS_PORT}"
			log "Please ensure the remote Redis server is running and accessible"
			exit 1
		}
	fi

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
	/usr/local/bin/ntopng /etc/ntopng.conf \
		--redis "${REDIS_HOST}" \
		--redis-port "${REDIS_PORT}" &
	NTOPNG_PID=$!

	log "ntopng started with PID: ${NTOPNG_PID}"

	# Wait for ntopng to be ready
	# trunk-ignore(shellcheck/SC2310)
	check_service "ntopng" 3000 60 "localhost" || exit 1

	log "All services started successfully"
	log "ntopng web interface available at http://localhost:3000"
	log "netflow2ng listening on UDP port 2055"
	if [[ ${USE_LOCAL_REDIS} == true ]]; then
		log "Using local Redis server at localhost:6379"
	else
		log "Using remote Redis server at ${REDIS_HOST}:${REDIS_PORT}"
	fi

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
