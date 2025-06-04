# RouterOS script to fetch and import put.io IP prefixes
# Fetches the latest put.io prefixes from api.dave.io and imports them

:log info "Starting put.io prefix update"

# Fetch the script from the API endpoint
:do {
    /tool fetch url="https://api.dave.io/routeros/putio" dst-path="putio-temp.rsc"
    :log info "Successfully fetched put.io script from API"

    # Import the fetched script
    /import file-name=putio-temp.rsc
    :log info "Successfully imported put.io configuration"

    # Clean up temporary file
    /file remove putio-temp.rsc
    :log info "Cleaned up temporary file"

} on-error={
    :log error "Failed to fetch or import put.io configuration"
    # Attempt to clean up temp file if it exists
    :do {
        /file remove putio-temp.rsc
    } on-error={}
}

:log info "put.io prefix update completed"
