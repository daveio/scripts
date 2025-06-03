FROM jdxcode/mise:2025.6.0 AS stage1

# Install runtime prerequisites
RUN sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      curl=7.88.1-10+deb12u12 \
      geoip-bin=1.6.12-11.1 \
      geoipupdate=4.9.0-1+deb12u1 \
      gir1.2-freedesktop=1.74.0-3 \
      gir1.2-glib-2.0=1.74.0-3 \
      gir1.2-harfbuzz-0.0=6.0.0+dfsg-3 \
      gir1.2-pango-1.0=1.50.12+ds-1 \
      guile-3.0-libs=3.0.8-2 \
      libcairo-gobject2=1.16.0-7 \
      libcairo-script-interpreter2=1.16.0-7 \
      libcurl4=7.88.1-10+deb12u12 \
      libexpat1=2.5.0-1+deb12u1 \
      libfl2=2.6.4-8.2 \
      libgc1=1:8.2.2-3 \
      libgirepository-1.0-1=1.74.0-3 \
      libglib2.0-bin=2.74.6-2+deb12u6 \
      libgssrpc4=1.20.1-2+deb12u3 \
      libharfbuzz-gobject0=6.0.0+dfsg-3 \
      libharfbuzz-icu0=6.0.0+dfsg-3 \
      libhiredis0.14=0.14.1-3 \
      libice6=2:1.0.10-1 \
      libjson-c5=0.16-2 \
      libkadm5clnt-mit12=1.20.1-2+deb12u2 \
      libkadm5srv-mit12=1.20.1-2+deb12u2 \
      libkdb5-10=1.20.1-2+deb12u2 \
      libltdl7=2.4.7-5 \
      liblzo2-2=2.10-2 \
      libmariadb3=1:10.11.6-0+deb12u1 \
      libmaxminddb0=1.7.1-1 \
      libncurses6=6.4-4 \
      libnetfilter-conntrack3=1.0.9-1 \
      libnetfilter-queue1=1.0.5-3 \
      libnetsnmptrapd40=5.9.3+dfsg-2 \
      libnfnetlink0=1.0.2-2 \
      libopts25=1:5.18.16-3 \
      libpangoxft-1.0-0=1.50.12+ds-1 \
      libpcap0.8=1.10.3-1 \
      libpcre2-16-0=10.42-1+deb12u1 \
      libpcre2-32-0=10.42-1+deb12u1 \
      libpcre2-posix3=10.42-1+deb12u1 \
      libradcli4=1.3.0-1+b1 \
      librrd8=1.7.2-4+b8 \
      libsensors-config=1:3.6.0-7.1 \
      libsensors5=1:3.6.0-7.1 \
      libsm6=2:1.2.3-1 \
      libsnmp-base=5.9.3+dfsg-2 \
      libsnmp40=5.9.3+dfsg-2 \
      libsqlite3-0=3.40.1-2+deb12u1 \
      libssl3=3.0.16-1~deb12u1 \
      libxft2=2.3.6-1 \
      libzmq5=4.3.4-6 \
      nginx=1.22.1-9+deb12u2 \
      procps=2:4.0.2-3 \
      redis-server=5:7.0.15-1~deb12u4 \
      rrdtool=1.7.2-4+b8 \
      wget=1.21.3-1+b1 \
    && apt-get clean \
    && rm -rf \
      /tmp/* \
      /var/cache/* \
      /var/log/* \
      /var/lib/apt/lists/*

FROM stage1 AS stage2

ARG NDPI_VERSION="4.14"
ARG NTOP_VERSION="6.4"
ARG NETFLOW2NG_VERSION="0.0.5"

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /tmp

# Install build prerequisites
RUN sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      autoconf=2.71-3 \
      autogen=1:5.18.16-3 \
      automake=1:1.16.5-1.3 \
      bison=2:3.8.2+dfsg-1+b1 \
      build-essential=12.9 \
      cmake=3.25.1-1 \
      flex=2.6.4-8.2 \
      git=1:2.39.5-0+deb12u2 \
      golang=2:1.19~1 \
      jq=1.6-2.1 \
      libcairo2-dev=1.16.0-7 \
      libcap-dev=1:2.66-4 \
      libcurl4-openssl-dev=7.88.1-10+deb12u12 \
      libexpat1-dev=2.5.0-1+deb12u1 \
      libgcrypt20-dev=1.10.1-3 \
      libhiredis-dev=0.14.1-3 \
      libjson-c-dev=0.16-2 \
      libldap2-dev=2.5.13+dfsg-5 \
      libmariadb-dev=1:10.11.6-0+deb12u1 \
      libmaxminddb-dev=1.7.1-1 \
      libnetfilter-conntrack-dev=1.0.9-1 \
      libnetfilter-queue-dev=1.0.5-3 \
      libnl-genl-3-dev=3.7.0-0.2+b1 \
      libpango1.0-dev=1.50.12+ds-1 \
      libpcap-dev=1.10.3-1 \
      libradcli-dev=1.3.0-1+b1 \
      libreadline-dev=8.2-1.3 \
      librrd-dev=1.7.2-4+b8 \
      libsnmp-dev=5.9.3+dfsg-2 \
      libsqlite3-dev=3.40.1-2+deb12u1 \
      libssl-dev=3.0.16-1~deb12u1 \
      libtool-bin=2.4.7-5 \
      libtool=2.4.7-5 \
      libxml2-dev=2.9.14+dfsg-1.3~deb12u1 \
      libzmq3-dev=4.3.4-6 \
      patch=2.7.6-7 \
      pkg-config=1.8.1-1 \
      rename=2.02-1 \
      vim=2:9.0.1378-2 \
      wget=1.21.3-1+b1 \
      zlib1g-dev=1:1.2.13.dfsg-1

WORKDIR /mise

# Download source code with version pinning
RUN git clone --depth 1 --branch v${NDPI_VERSION} https://github.com/ntop/nDPI.git nDPI \
    && git clone --depth 1 --branch ${NTOP_VERSION} https://github.com/ntop/ntopng.git ntopng \
    && git clone --depth 1 --branch v${NETFLOW2NG_VERSION} https://github.com/synfinatic/netflow2ng.git netflow2ng

COPY allow-flows-from-netflow2ng.patch ntopng/

# Install Go for netflow2ng build
RUN mise use go@1.24.3 \
    && mise install \
    && mise which go

WORKDIR /mise/netflow2ng

# Build netflow2ng
RUN make && install -m 755 dist/netflow2ng-* /usr/local/bin/netflow2ng

WORKDIR /mise/nDPI

# Build nDPI library
RUN ./autogen.sh "--with-only-libndpi" \
    && ./configure --enable-static --disable-debug \
    && make -j"$(nproc)"

WORKDIR /mise/ntopng

# Build ntopng with patches and optimizations
RUN patch -p1 -i "allow-flows-from-netflow2ng.patch" \
    && ./autogen.sh \
    && ./configure --enable-static --disable-debug \
    && make -j"$(nproc)" \
    && make install

FROM stage1

COPY --from=stage2 /usr/local/bin/netflow2ng /usr/local/bin/netflow2ng
COPY --from=stage2 /usr/local/bin/ntopng /usr/local/bin/ntopng
COPY --from=stage2 /usr/local/share/ntopng /usr/local/share/ntopng

# Create non-root users for security
RUN useradd -r -m -d /var/run/netflow -s /bin/false netflow \
    && useradd -r -m -d /var/run/ntop -s /bin/false ntopng

# Install Redis for ntopng
RUN mise use redis@8.0.2 \
    && mise install \
    && mise which redis-server

# Create required directories
RUN mkdir -p /etc/ntopng /var/lib/ntopng /var/log/ntopng /usr/share/GeoIP /etc/GeoIP

# Set up GeoIP environment variables (can be overridden at runtime)
ENV GEOIPUPDATE_ACCOUNT_ID="0" \
    GEOIPUPDATE_LICENSE_KEY="000000000000" \
    GEOIPUPDATE_EDITION_IDS="GeoLite2-Country GeoLite2-City GeoLite2-ASN" \
    GEOIPUPDATE_DB_DIR="/usr/share/GeoIP" \
    GEOIPUPDATE_HOST="updates.maxmind.com" \
    GEOIPUPDATE_VERBOSE="1" \
    GEOIPUPDATE_PRESERVE_FILE_TIMES="0" \
    GEOIPUPDATE_LOCK_FILE="/var/lock/geoipupdate.lock" \
    GEOIPUPDATE_RETRY_FOR="5m"

# Create placeholder GeoIP databases
RUN touch /usr/share/GeoIP/GeoLite2-Country.mmdb \
    && touch /usr/share/GeoIP/GeoLite2-City.mmdb \
    && touch /usr/share/GeoIP/GeoLite2-ASN.mmdb

COPY ntopng.conf /etc/ntopng.conf
COPY ntopng.bash /opt/ntopng.bash
COPY geoip.bash /opt/geoip.bash

# Set proper permissions
RUN chmod +x /opt/ntopng.bash /opt/geoip.bash \
    && chown -R ntopng:ntopng \
      /etc/ntopng \
      /opt/ntopng.bash \
      /var/run/netflow \
      /var/run/ntop \
      /var/lib/ntopng \
      /var/log/ntopng \
      /usr/local/share/ntopng \
      /usr/share/GeoIP \
      /etc/GeoIP

USER ntopng

WORKDIR /var/run/ntop

EXPOSE 3000/tcp 2055/udp

# Improved healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/lua/rest/v2/get/system/stats.lua || exit 1

# Use exec form for better signal handling
ENTRYPOINT ["/opt/ntopng.bash"]

LABEL \
    org.opencontainers.image.title="ntopng" \
    org.opencontainers.image.description="ntopng with zeromq patch" \
    org.opencontainers.image.authors="Dave Williams <dave@dave.io>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/daveio/ntopng" \
    org.opencontainers.image.source="https://github.com/daveio/ntopng" \
    org.opencontainers.image.version="6.4-001"
