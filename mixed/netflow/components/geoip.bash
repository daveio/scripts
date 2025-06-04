#!/bin/bash
set -euo pipefail

# GeoIP Database Setup Script for ntopng Container
# This script helps set up MaxMind GeoLite2 databases for geographic IP lookups

declare -r GEOIP_DIR="/usr/share/GeoIP"
export SCRIPT_NAME="${0##*/}"
declare -r MAXMIND_URL="https://www.maxmind.com/en/geolite2/signup"

# Color codes for better output
declare -r RED='\033[0;31m'
declare -r GREEN='\033[0;32m'
declare -r YELLOW='\033[1;33m'
declare -r BLUE='\033[0;34m'
declare -r NC='\033[0m' # No Color

# Print colored output
print_status() {
	local color="${1}"
	shift
	printf "${color}%s${NC}\n" "${*}"
}

print_error() { print_status "${RED}" "❌ ERROR: ${*}"; }
print_success() { print_status "${GREEN}" "✅ ${*}"; }
print_warning() { print_status "${YELLOW}" "⚠️  ${*}"; }
print_info() { print_status "${BLUE}" "ℹ️  ${*}"; }

# Usage information
usage() {
	cat <<EOF
Usage: ${SCRIPT_NAME} [options]

Interactive MaxMind GeoLite2 database setup for ntopng container.

Options:
    -h, --help          Show this help message
    -c, --check         Check current GeoIP status
    -u, --update        Update existing databases
    -s, --silent        Silent mode (non-interactive)
    -a, --account ID    Account ID (for silent mode)
    -k, --key KEY       License key (for silent mode)

Examples:
    ${SCRIPT_NAME}                           # Interactive setup
    ${SCRIPT_NAME} --check                   # Check status
    ${SCRIPT_NAME} --update                  # Update databases
    ${SCRIPT_NAME} -s -a 123456 -k ABC123... # Silent setup

EOF
}

# Check if running inside the container
check_environment() {
	if [[ ! -d ${GEOIP_DIR} ]]; then
		print_error "GeoIP directory not found. Are you running this inside the ntopng container?"
		exit 1
	fi

	if ! command -v geoipupdate &>/dev/null; then
		print_error "geoipupdate command not found. Container may be misconfigured."
		exit 1
	fi
}

# Validate license key format (MaxMind keys are 16 characters)
validate_license_key() {
	local key="${1}"
	if [[ ! ${key} =~ ^[A-Za-z0-9_]{16}$ ]]; then
		print_error "License key must be exactly 16 alphanumeric characters (including underscores)"
		return 1
	fi
	return 0
}

# Validate account ID (numeric)
validate_account_id() {
	local id="${1}"
	if [[ ! ${id} =~ ^[0-9]+$ ]] || [[ ${id} == "0" ]]; then
		print_error "Account ID must be a positive number"
		return 1
	fi
	return 0
}

# Check current GeoIP status
check_geoip_status() {
	print_info "Checking GeoIP configuration status..."
	echo

	# Check environment variables
	local account_id="${GEOIPUPDATE_ACCOUNT_ID:-0}"
	local license_key="${GEOIPUPDATE_LICENSE_KEY:-000000000000}"

	printf "%-25s: %s\n" "Account ID" "${account_id}"
	printf "%-25s: %s\n" "License Key" "${license_key:0:4}***"
	printf "%-25s: %s\n" "Database Directory" "${GEOIPUPDATE_DB_DIR:-${GEOIP_DIR}}"
	echo

	# Check database files
	print_info "Database files:"
	local -a databases=("GeoLite2-Country.mmdb" "GeoLite2-City.mmdb" "GeoLite2-ASN.mmdb")
	local found_valid=false

	for db in "${databases[@]}"; do
		local db_path="${GEOIP_DIR}/${db}"
		if [[ -f ${db_path} ]]; then
			local size
			if ! size=$(stat -f%z "${db_path}" 2>/dev/null); then
				if ! size=$(stat -c%s "${db_path}" 2>/dev/null); then
					size="0"
				fi
			fi
			if [[ ${size} -gt 1024 ]]; then
				local mod_time
				if ! mod_time=$(stat -f%Sm -t%Y-%m-%d "${db_path}" 2>/dev/null); then
					if ! mod_time=$(stat -c%y "${db_path}" 2>/dev/null); then
						mod_time="unknown"
					else
						mod_time=$(echo "${mod_time}" | cut -d' ' -f1)
					fi
				fi
				printf "  ✅ %-20s (%s bytes, modified: %s)\n" "${db}" "${size}" "${mod_time}"
				found_valid=true
			else
				printf "  ⚠️  %-20s (placeholder file)\n" "${db}"
			fi
		else
			printf "  ❌ %-20s (missing)\n" "${db}"
		fi
	done

	echo
	if [[ ${found_valid} == true ]]; then
		print_success "GeoIP databases are available and appear to be valid"
	else
		print_warning "No valid GeoIP databases found - only placeholder files"
	fi
}

# Update existing databases
update_databases() {
	print_info "Updating GeoIP databases..."

	local account_id="${GEOIPUPDATE_ACCOUNT_ID:-0}"
	local license_key="${GEOIPUPDATE_LICENSE_KEY:-000000000000}"

	if [[ ${account_id} == "0" ]] || [[ ${license_key} == "000000000000" ]]; then
		print_error "Valid credentials not found in environment variables"
		print_info "Set GEOIPUPDATE_ACCOUNT_ID and GEOIPUPDATE_LICENSE_KEY, or run interactive setup"
		exit 1
	fi

	if geoipupdate -v; then
		print_success "GeoIP databases updated successfully"
		echo
		check_geoip_status
	else
		print_error "Failed to update GeoIP databases"
		print_info "Check your network connection and credentials"
		exit 1
	fi
}

# Interactive credential input with validation
get_credentials() {
	local -n account_ref=${1}
	local -n key_ref=${2}

	print_info "MaxMind GeoLite2 Setup Instructions:"
	echo "1. Visit: ${MAXMIND_URL}"
	echo "2. Create a free account"
	echo "3. Generate a license key in your account dashboard"
	echo "4. Note your Account ID and License Key"
	echo

	# Get Account ID with validation
	while true; do
		read -rp "Enter your MaxMind Account ID: " account_ref
		validate_account_id "${account_ref}"
		local account_valid=${?}
		if [[ ${account_valid} -eq 0 ]]; then
			break
		fi
		print_warning "Please enter a valid Account ID"
	done

	# Get License Key with validation
	while true; do
		read -rp "Enter your MaxMind License Key: " key_ref
		validate_license_key "${key_ref}"
		local key_valid=${?}
		if [[ ${key_valid} -eq 0 ]]; then
			break
		fi
		print_warning "Please enter a valid License Key (16 characters)"
	done
}

# Set up GeoIP with provided credentials
setup_geoip() {
	local account_id="${1}"
	local license_key="${2}"

	print_info "Configuring GeoIP environment variables..."

	# Export environment variables for this session
	export GEOIPUPDATE_ACCOUNT_ID="${account_id}"
	export GEOIPUPDATE_LICENSE_KEY="${license_key}"
	export GEOIPUPDATE_EDITION_IDS="GeoLite2-Country GeoLite2-City GeoLite2-ASN"
	export GEOIPUPDATE_DB_DIR="${GEOIP_DIR}"
	export GEOIPUPDATE_VERBOSE="1"

	print_success "Environment variables configured for this session"
	echo

	# Download databases
	print_info "Downloading GeoLite2 databases..."
	if geoipupdate -v; then
		print_success "GeoLite2 databases downloaded successfully"
		echo

		# Display downloaded files
		print_info "Downloaded databases:"
		local -a found_files=()
		mapfile -t found_files < <(find "${GEOIP_DIR}" -name "*.mmdb" -type f 2>/dev/null || true)

		if [[ ${#found_files[@]} -gt 0 ]]; then
			for file in "${found_files[@]}"; do
				local size
				size=$(stat -f%z "${file}" 2>/dev/null) || size=$(stat -c%s "${file}" 2>/dev/null) || size="0"
				printf "  • %s (%s bytes)\n" "${file##*/}" "${size}"
			done
		else
			print_warning "No .mmdb files found"
		fi

		echo
		print_success "Setup Complete!"
		print_info "GeoIP is now configured for ntopng."
		print_info "Geographic IP location features are enabled."
		echo

		print_info "To make these credentials persistent across container restarts:"
		echo "Set these environment variables when running the container:"
		echo "  GEOIPUPDATE_ACCOUNT_ID=${account_id}"
		echo "  GEOIPUPDATE_LICENSE_KEY=${license_key}"
		echo
		print_info "To update databases in the future, run: geoipupdate -v"

	else
		print_error "Failed to download GeoLite2 databases"
		print_info "Please verify your account ID and license key are correct"
		print_info "Check network connectivity and try again"
		exit 1
	fi
}

# Main function
main() {
	local check_only=false
	local update_only=false
	local silent_mode=false
	local account_id=""
	local license_key=""

	# Parse command line arguments
	while [[ ${#} -gt 0 ]]; do
		case ${1} in
		-h | --help)
			usage
			exit 0
			;;
		-c | --check)
			check_only=true
			shift
			;;
		-u | --update)
			update_only=true
			shift
			;;
		-s | --silent)
			silent_mode=true
			shift
			;;
		-a | --account)
			account_id="${2}"
			shift 2
			;;
		-k | --key)
			license_key="${2}"
			shift 2
			;;
		*)
			print_error "Unknown option: ${1}"
			usage
			exit 1
			;;
		esac
	done

	# Check environment first
	check_environment

	print_status "${BLUE}" "=== MaxMind GeoLite2 Database Setup ==="
	echo

	# Handle different modes
	if [[ ${check_only} == true ]]; then
		check_geoip_status
		exit 0
	fi

	if [[ ${update_only} == true ]]; then
		update_databases
		exit 0
	fi

	if [[ ${silent_mode} == true ]]; then
		if [[ -z ${account_id} ]] || [[ -z ${license_key} ]]; then
			print_error "Silent mode requires both --account and --key options"
			usage
			exit 1
		fi

		validate_account_id "${account_id}"
		local account_valid=$?
		validate_license_key "${license_key}"
		local key_valid=$?

		if [[ ${account_valid} -ne 0 ]] || [[ ${key_valid} -ne 0 ]]; then
			exit 1
		fi

		setup_geoip "${account_id}" "${license_key}"
	else
		# Interactive mode
		get_credentials account_id license_key
		echo
		setup_geoip "${account_id}" "${license_key}"
	fi
}

# Run main function with all arguments
main "$@"
