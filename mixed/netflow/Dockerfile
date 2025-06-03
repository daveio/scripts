FROM jdxcode/mise:2025.6.0 AS stage1

# Install runtime prerequisites
# trunk-ignore(hadolint/DL3008)
RUN sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      curl \
      geoip-bin \
      geoipupdate \
      gir1.2-freedesktop \
      gir1.2-glib-2.0 \
      gir1.2-harfbuzz-0.0 \
      gir1.2-pango-1.0 \
      guile-3.0-libs \
      libcairo-gobject2 \
      libcairo-script-interpreter2 \
      libcurl4 \
      libexpat1 \
      libfl2 \
      libgc1 \
      libgirepository-1.0-1 \
      libglib2.0-bin \
      libgssrpc4 \
      libharfbuzz-gobject0 \
      libharfbuzz-icu0 \
      libhiredis0.14 \
      libice6 \
      libjson-c5 \
      libkadm5clnt-mit12 \
      libkadm5srv-mit12 \
      libkdb5-10 \
      libltdl7 \
      liblzo2-2 \
      libmariadb3 \
      libmaxminddb0 \
      libncurses6 \
      libnetfilter-conntrack3 \
      libnetfilter-queue1 \
      libnetsnmptrapd40 \
      libnfnetlink0 \
      libopts25 \
      libpangoxft-1.0-0 \
      libpcap0.8 \
      libpcre2-16-0 \
      libpcre2-32-0 \
      libpcre2-posix3 \
      libradcli4 \
      librrd8 \
      libsensors-config \
      libsensors5 \
      libsm6 \
      libsnmp-base \
      libsnmp40 \
      libsqlite3-0 \
      libssl3 \
      libxft2 \
      libzmq5 \
      nginx \
      procps \
      redis-server \
      rrdtool \
      wget \
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
# trunk-ignore(hadolint/DL3008)
RUN sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      autoconf \
      autogen \
      automake \
      bison \
      build-essential \
      cmake \
      flex \
      git \
      golang \
      jq \
      libcairo2-dev \
      libcap-dev \
      libcurl4-openssl-dev \
      libexpat1-dev \
      libgcrypt20-dev \
      libhiredis-dev \
      libjson-c-dev \
      libldap2-dev \
      libmariadb-dev \
      libmaxminddb-dev \
      libnetfilter-conntrack-dev \
      libnetfilter-queue-dev \
      libnl-genl-3-dev \
      libpango1.0-dev \
      libpcap-dev \
      libradcli-dev \
      libreadline-dev \
      librrd-dev \
      libsnmp-dev \
      libsqlite3-dev \
      libssl-dev \
      libtool-bin \
      libtool \
      libxml2-dev \
      libzmq3-dev \
      patch \
      pkg-config \
      rename \
      vim \
      wget \
      zlib1g-dev

WORKDIR /mise

# Download source code with version pinning
RUN git clone --depth 1 --branch ${NDPI_VERSION} https://github.com/ntop/nDPI.git nDPI \
    && git clone --depth 1 --branch ${NTOP_VERSION} https://github.com/ntop/ntopng.git ntopng \
    && git clone --depth 1 --branch v${NETFLOW2NG_VERSION} https://github.com/synfinatic/netflow2ng.git netflow2ng

COPY allow-flows-from-netflow2ng.patch ntopng/

# Install Go for netflow2ng build
# RUN mise use go@1.24.3 \
#     && mise install \
#     && mise which go

WORKDIR /mise/netflow2ng

# Build netflow2ng
RUN /usr/local/bin/mise exec go@latest -- go build -ldflags="-s -w" -o /usr/local/bin/netflow2ng ./cmd/...

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

# Create required directories
RUN mkdir -p /etc/ntopng /var/lib/ntopng /var/log/ntopng /usr/share/GeoIP /etc/GeoIP

# Set up GeoIP environment variables (can be overridden at runtime)
ENV GEOIPUPDATE_EDITION_IDS="GeoLite2-Country GeoLite2-City GeoLite2-ASN" \
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
