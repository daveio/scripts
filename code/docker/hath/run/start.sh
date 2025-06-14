#!/bin/sh

if [ "${UMASK:-UNSET}" != "UNSET" ]; then
  umask "${UMASK}"
fi

if [ ! -f /hath/data/client_login ]; then
  printf "%s-%s" "${HATH_CLIENT_ID}" "${HATH_CLIENT_KEY}" >>/hath/data/client_login
fi

exec java -jar /opt/hath/HentaiAtHome.jar \
  --cache-dir=/hath/cache \
  --data-dir=/hath/data \
  --download-dir=/hath/download \
  --log-dir=/hath/log \
  --temp-dir=/hath/tmp
