# syntax=docker/dockerfile:1.4
FROM jdxcode/mise@sha256:cff42e2bf1063ae6a8729c148a1003357d5befa2fe7656c5d0c99e62b68aab7d AS base

# Set shell options for better error handling
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Build arguments for versions - pinned for cache consistency
ARG NDPI_VERSION="4.14"
ARG NTOP_VERSION="6.4"
ARG NETFLOW2NG_VERSION="0.0.5"
ARG GO_VERSION="1.24.3"

# GeoIP credentials for build-time download
ARG GEOIPUPDATE_ACCOUNT_ID
ARG GEOIPUPDATE_LICENSE_KEY

# Enable BuildKit features
ARG BUILDKIT_INLINE_CACHE=1

# Dependency prefetch stage - downloads all sources first
FROM base AS dependency-prefetch

WORKDIR /prefetch

# Prefetch all source repositories with shallow clones and caching
RUN --mount=type=cache,target=/root/.cache/git,sharing=locked \
    git clone --depth 1 --branch "${NDPI_VERSION}" https://github.com/ntop/nDPI.git nDPI \
    && git clone --depth 1 --branch "${NTOP_VERSION}" https://github.com/ntop/ntopng.git ntopng \
    && git clone --depth 1 --branch "v${NETFLOW2NG_VERSION}" https://github.com/synfinatic/netflow2ng.git netflow2ng

# GeoIP data fetch stage
FROM base AS geoip-fetcher

# Set shell options for better error handling
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /geoip

# Install curl and jq for API calls
# trunk-ignore(hadolint/DL3008)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends curl jq \
    && rm -rf /var/lib/apt/lists/*

# Fetch GeoIP databases at build time
RUN --mount=type=cache,target=/tmp/geoip-cache,sharing=locked \
    if [ -n "${GEOIPUPDATE_ACCOUNT_ID}" ] && [ -n "${GEOIPUPDATE_LICENSE_KEY}" ] && [ "${GEOIPUPDATE_ACCOUNT_ID}" != "0" ]; then \
        echo "Fetching GeoIP databases..."; \
        mkdir -p /usr/share/GeoIP; \
        for edition in GeoLite2-City GeoLite2-Country GeoLite2-ASN; do \
            echo "Processing ${edition}..."; \
            # Get metadata to find current date
            if METADATA=$(curl -u "${GEOIPUPDATE_ACCOUNT_ID}:${GEOIPUPDATE_LICENSE_KEY}" \
                -H "User-Agent: geoipupdate/7.1.0" \
                -s "https://updates.maxmind.com/geoip/updates/metadata?edition_id=${edition}"); then \
                DATE=$(echo "$METADATA" | jq -r '.databases[0].date // empty'); \
                if [ -n "$DATE" ] && [ "$DATE" != "null" ]; then \
                    # Convert date format (remove dashes)
                    DATE_FORMATTED=$(echo "$DATE" | tr -d '-'); \
                    echo "Downloading ${edition} for date ${DATE}..."; \
                    # Check cache first
                    CACHE_FILE="/tmp/geoip-cache/${edition}-${DATE}.tar.gz"; \
                    if [ ! -f "$CACHE_FILE" ]; then \
                        curl -u "${GEOIPUPDATE_ACCOUNT_ID}:${GEOIPUPDATE_LICENSE_KEY}" \
                            -H "User-Agent: geoipupdate/7.1.0" \
                            -L -o "$CACHE_FILE" \
                            "https://updates.maxmind.com/geoip/databases/${edition}/download?date=${DATE_FORMATTED}&suffix=tar.gz"; \
                    fi; \
                    # Extract database
                    if [ -f "$CACHE_FILE" ]; then \
                        tar -xzf "$CACHE_FILE" -C /tmp/; \
                        find /tmp -name "${edition}.mmdb" -exec cp {} /usr/share/GeoIP/ \;; \
                        echo "Successfully downloaded ${edition}"; \
                    else \
                        echo "Failed to download ${edition}"; \
                        touch "/usr/share/GeoIP/${edition}.mmdb"; \
                    fi; \
                else \
                    echo "Failed to get date for ${edition}, creating placeholder"; \
                    touch "/usr/share/GeoIP/${edition}.mmdb"; \
                fi; \
            else \
                echo "Failed to get metadata for ${edition}, creating placeholder"; \
                touch "/usr/share/GeoIP/${edition}.mmdb"; \
            fi; \
        done; \
    else \
        echo "No GeoIP credentials provided, creating placeholder databases"; \
        mkdir -p /usr/share/GeoIP; \
        touch /usr/share/GeoIP/GeoLite2-Country.mmdb; \
        touch /usr/share/GeoIP/GeoLite2-City.mmdb; \
        touch /usr/share/GeoIP/GeoLite2-ASN.mmdb; \
    fi

# Runtime dependencies stage
FROM base AS runtime-deps

# Install runtime prerequisites with mount cache
# trunk-ignore(hadolint/DL3008)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      curl \
      geoip-bin \
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
      libprotobuf-c-dev \
      libprotobuf-c1 \
      libprotobuf-dev \
      libprotobuf32 \
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
      netcat-openbsd \
      nginx \
      procps \
      protobuf-c-compiler \
      protobuf-compiler \
      redis-server \
      rrdtool \
      wget \
    && rm -rf \
      /tmp/* \
      /var/log/* \
      /var/lib/apt/lists/*

# Build dependencies stage
FROM runtime-deps AS build-deps

# Install build prerequisites with mount cache
# trunk-ignore(hadolint/DL3008)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
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
      libprotobuf-dev \
      libprotobuf-c-dev \
      libprotobuf-c1 \
      libprotobuf-dev \
      libprotobuf32 \
      libradcli-dev \
      libreadline-dev \
      protobuf-compiler \
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
      protobuf-c-compiler \
      protobuf-compiler \
      rename \
      vim \
      wget \
      zlib1g-dev

# Mise tools stage - install and cache Go and Redis with pinned versions
FROM build-deps AS mise-tools

# Install Go with mise and cache the installation
# trunk-ignore(hadolint/SC2086): breaks if quoted
RUN --mount=type=cache,target=/root/.cache/mise,sharing=locked \
    mise use go@${GO_VERSION} \
    && mise install go@${GO_VERSION} \
    && mise which go

# Set mise environment for subsequent stages
ENV PATH="/root/.local/share/mise/installs/go/${GO_VERSION}/bin:${PATH}"

# Source code preparation stage
FROM mise-tools AS source-prepared

WORKDIR /src

# Copy prefetched sources
COPY --from=dependency-prefetch /prefetch/ ./

# Copy patch file
COPY allow-flows-from-netflow2ng.patch ntopng/

# netflow2ng build stage
FROM source-prepared AS netflow2ng-builder

WORKDIR /src/netflow2ng

# Build netflow2ng with Go module and build caches
# trunk-ignore(hadolint/SC2086): breaks if quoted
RUN --mount=type=cache,target=/root/.cache/go-build,sharing=locked \
    --mount=type=cache,target=/go/pkg/mod,sharing=locked \
    mise exec go@${GO_VERSION} -- go build -ldflags="-s -w" -o /usr/local/bin/netflow2ng ./cmd/...

# nDPI build stage
FROM source-prepared AS ndpi-builder

WORKDIR /src/nDPI

# Build nDPI library with autotools cache
RUN --mount=type=cache,target=/root/.cache/autotools,sharing=locked \
    --mount=type=cache,target=/tmp/ndpi-build,sharing=locked \
    ./autogen.sh "--with-only-libndpi" \
    && ./configure --enable-static --disable-debug --prefix=/usr/local \
    && make -j"$(nproc)" \
    && make install DESTDIR=/tmp/ndpi-install

# ntopng build stage
FROM ndpi-builder AS ntopng-builder

WORKDIR /src/ntopng

# Copy nDPI installation
COPY --from=ndpi-builder /tmp/ndpi-install/usr/local/ /usr/local/

# Build ntopng with patches, autotools cache, and nDPI
RUN --mount=type=cache,target=/root/.cache/autotools,sharing=locked \
    --mount=type=cache,target=/tmp/ntopng-build,sharing=locked \
    patch -p1 -i "allow-flows-from-netflow2ng.patch" \
    && ./autogen.sh \
    && PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:${PKG_CONFIG_PATH}" \
       ./configure --enable-static --disable-debug --prefix=/usr/local \
    && make -j"$(nproc)" \
    && make install DESTDIR=/tmp/ntopng-install

# Final runtime stage
FROM runtime-deps AS final

# Copy built binaries from build stages
COPY --from=netflow2ng-builder /usr/local/bin/netflow2ng /usr/local/bin/netflow2ng

# Copy ntopng installation using shell to handle missing directories
RUN --mount=from=ntopng-builder,source=/tmp/ntopng-install,target=/mnt/install \
    if [ -d /mnt/install/usr/local/bin ]; then cp -r /mnt/install/usr/local/bin/* /usr/local/bin/ 2>/dev/null || true; fi \
    && if [ -d /mnt/install/usr/local/lib ]; then cp -r /mnt/install/usr/local/lib/* /usr/local/lib/ 2>/dev/null || true; fi \
    && if [ -d /mnt/install/usr/local/share ]; then cp -r /mnt/install/usr/local/share/* /usr/local/share/ 2>/dev/null || true; fi \
    && if [ -d /mnt/install/usr/local/include ]; then cp -r /mnt/install/usr/local/include/* /usr/local/include/ 2>/dev/null || true; fi

# Copy GeoIP databases from build-time fetch
COPY --from=geoip-fetcher /usr/share/GeoIP /usr/share/GeoIP

# Create non-root users for security
RUN useradd -r -m -d /var/run/netflow -s /bin/false netflow \
    && useradd -r -m -d /var/run/ntopng -s /bin/false ntopng

# Create required directories in a single layer
RUN mkdir -p \
      /etc/ntopng \
      /var/lib/ntopng \
      /var/log/ntopng \
      /var/lib/redis \
      /var/log/redis \
      /var/run/redis \
      /var/lib/GeoIP \
      /etc/GeoIP \
      /var/lock

# Copy configuration files
COPY ntopng.conf /etc/ntopng.conf
COPY redis.conf /etc/redis/redis.conf
COPY ntopng.bash /opt/ntopng.bash

# Set proper permissions in a single layer
RUN chmod +x /opt/ntopng.bash \
    && chown -R ntopng:ntopng \
      /etc/ntopng \
      /opt/ntopng.bash \
      /var/run/netflow \
      /var/lib/ntopng \
      /var/log/ntopng \
      /var/run/ntopng \
      /usr/local/share/ntopng \
      /usr/share/GeoIP \
      /var/lib/GeoIP \
      /etc/GeoIP \
    && chown -R redis:redis \
      /var/lib/redis \
      /var/log/redis \
      /var/run/redis \
      /etc/redis/redis.conf \
    && chmod 644 /etc/redis/redis.conf

USER ntopng

WORKDIR /var/run/ntopng

EXPOSE 8849/tcp 2055/udp

# Improved healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8849/lua/rest/v2/get/system/stats.lua || exit 1

# Use exec form for better signal handling
ENTRYPOINT ["/opt/ntopng.bash"]

LABEL \
    org.opencontainers.image.title="ntopng" \
    org.opencontainers.image.description="ntopng with zeromq patch - fully optimized build with build-time GeoIP" \
    org.opencontainers.image.authors="Dave Williams <dave@dave.io>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/daveio/ntopng" \
    org.opencontainers.image.source="https://github.com/daveio/ntopng" \
    org.opencontainers.image.version="6.4-002-buildtime-geoip" \
    org.opencontainers.image.base.digest="sha256:cff42e2bf1063ae6a8729c148a1003357d5befa2fe7656c5d0c99e62b68aab7d" \
    netflow.go.version="${GO_VERSION}" \
    netflow.ndpi.version="${NDPI_VERSION}" \
    netflow.ntop.version="${NTOP_VERSION}" \
    netflow.netflow2ng.version="${NETFLOW2NG_VERSION}"
