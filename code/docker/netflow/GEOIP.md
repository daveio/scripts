# MaxMind GeoIP Update

## API Endpoints and Parameters

The geoipupdate tool uses two main endpoints:

### 1. Metadata Endpoint
```http
GET https://updates.maxmind.com/geoip/updates/metadata?edition_id={EDITION_ID}
```

### 2. Download Endpoint
```http
GET https://updates.maxmind.com/geoip/databases/{EDITION_ID}/download?date={DATE}&suffix=tar.gz
```

## Required Authentication

All requests require HTTP Basic Authentication:
- Username: Your MaxMind Account ID (as string)
- Password: Your License Key

## cURL Commands

### Step 1: Get Database Metadata
```bash
curl -u "YOUR_ACCOUNT_ID:YOUR_LICENSE_KEY" \
  -H "User-Agent: geoipupdate/7.1.0" \
  "https://updates.maxmind.com/geoip/updates/metadata?edition_id=GeoLite2-City"
```

This returns JSON with the database date and MD5 hash:
```json
{
  "databases": [
    {
      "date": "2024-06-04",
      "edition_id": "GeoLite2-City",
      "md5": "abcd1234..."
    }
  ]
}
```

### Step 2: Download the Database
Using the date from the metadata response (with dashes removed):
```bash
curl -u "YOUR_ACCOUNT_ID:YOUR_LICENSE_KEY" \
  -H "User-Agent: geoipupdate/7.1.0" \
  -o "GeoLite2-City.tar.gz" \
  "https://updates.maxmind.com/geoip/databases/GeoLite2-City/download?date=20240604&suffix=tar.gz"
```

## Important Notes

1. **Two-Step Process**: You must first get metadata to obtain the current date, then use that date in the download URL.

2. **Date Format**: The date in the download URL must have dashes removed (YYYYMMDD format).

3. **Available Editions**: Common edition IDs include:
  - `GeoLite2-City`
  - `GeoLite2-Country`
  - `GeoIP2-City`
  - `GeoIP2-Country`

4. **CDN Redirect**: The download endpoint redirects to R2 presigned URLs on CloudFlare, so your system needs to reach `mm-prod-geoip-databases.a2649acb697e2c09b632799562c076f2.r2.cloudflarestorage.com`.

5. **User-Agent**: Include a proper User-Agent header as shown above.

Replace `YOUR_ACCOUNT_ID` and `YOUR_LICENSE_KEY` with your actual MaxMind credentials from your account dashboard.
