# `ntopng` with `netflow2ng` and `influxdb`

## InfluxDB

InfluxDB needs to be configured to give v1 endpoints to `ntopng`.

First, create a bucket, I called it `ntopng` but we just need the ID here.

Run this on the InfluxDB server, you can drop into a `bash` shell inside Docker.

```bash
export BUCKET_ID="16_hex_chars"
export USERNAME="ntopng"
export PASSWORD="some_password"
export ORG="home"
export TOKEN="your_operator_token_or_other_token"
influx v1 auth create --read-bucket $BUCKET_ID --write-bucket $BUCKET_ID --username $USERNAME --password $PASSWORD --org $ORG --token $TOKEN
```
