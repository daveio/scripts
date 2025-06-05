# syntax=docker/dockerfile:1.4
FROM jdxcode/mise@sha256:cff42e2bf1063ae6a8729c148a1003357d5befa2fe7656c5d0c99e62b68aab7d AS base

# Build arguments for versions - pinned for cache consistency
ARG NDPI_VERSION="4.14"
ARG NTOP_VERSION="6.4"
ARG NETFLOW2NG_VERSION="0.0.5"
ARG GO_VERSION="1.24.3"
ARG REDIS_VERSION="8.0.2"
ARG TARGETPLATFORM
ARG BUILDPLATFORM



# Enable BuildKit features
ARG BUILDKIT_INLINE_CACHE=1

# Dependency prefetch stage - downloads all sources first
FROM base AS dependency-prefetch

WORKDIR /prefetch

# Prefetch all source repositories with shallow clones and caching
RUN --mount=type=cache,target=/root/.cache/git,sharing=locked \
    git clone --depth 1 --branch ${NDPI_VERSION} https://github.com/ntop/nDPI.git nDPI \
    && git clone --depth 1 --branch ${NTOP_VERSION} https://github.com/ntop/ntopng.git ntopng \
    && git clone --depth 1 --branch v${NETFLOW2NG_VERSION} https://github.com/synfinatic/netflow2ng.git netflow2ng

# Runtime dependencies stage with ALL pinned versions
FROM base AS runtime-deps

# Install runtime prerequisites with mount cache and ALL pinned versions
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    case "${TARGETPLATFORM}" in \
      "linux/amd64") LIBRADCLI_VERSION="1.2.11-1+b2" ;; \
      "linux/arm64") LIBRADCLI_VERSION="1.2.11-1+b1" ;; \
      *) LIBRADCLI_VERSION="1.2.11-1+b1" ;; \
    esac \
    && sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      curl=7.88.1-10+deb12u12 \
      geoip-bin=1.6.12-10 \
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
      libkadm5clnt-mit12=1.20.1-2+deb12u3 \
      libkadm5srv-mit12=1.20.1-2+deb12u3 \
      libkdb5-10=1.20.1-2+deb12u3 \
      libltdl7=2.4.7-7~deb12u1 \
      liblzo2-2=2.10-2 \
      libmariadb3=1:10.11.11-0+deb12u1 \
      libmaxminddb0=1.7.1-1 \
      libncurses6=6.4-4 \
      libnetfilter-conntrack3=1.0.9-3 \
      libnetfilter-queue1=1.0.5-3 \
      libnetsnmptrapd40=5.9.3+dfsg-2 \
      libnfnetlink0=1.0.2-2 \
      libopts25=1:5.18.16-5 \
      libpangoxft-1.0-0=1.50.12+ds-1 \
      libpcap0.8=1.10.3-1 \
      libpcre2-16-0=10.42-1 \
      libpcre2-32-0=10.42-1 \
      libpcre2-posix3=10.42-1 \
      libradcli4=${LIBRADCLI_VERSION} \
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
      netcat-openbsd=1.219-1 \
      nginx=1.22.1-9+deb12u2 \
      procps=2:4.0.2-3 \
      redis-server=5:7.0.15-1~deb12u4 \
      rrdtool=1.7.2-4+b8 \
      wget=1.21.3-1+deb12u1 \
    && rm -rf \
      /tmp/* \
      /var/log/* \
      /var/lib/apt/lists/*

# Download and install geoipupdate manually since it's not in repos
RUN --mount=type=cache,target=/tmp/downloads,sharing=locked \
    ARCH=$(dpkg --print-architecture) \
    && GEOIP_VERSION="7.1.0" \
    && if [ ! -f "/tmp/downloads/geoipupdate_${GEOIP_VERSION}_linux_${ARCH}.deb" ]; then \
         wget -O "/tmp/downloads/geoipupdate_${GEOIP_VERSION}_linux_${ARCH}.deb" \
           "https://github.com/maxmind/geoipupdate/releases/download/v${GEOIP_VERSION}/geoipupdate_${GEOIP_VERSION}_linux_${ARCH}.deb"; \
       fi \
    && dpkg -i "/tmp/downloads/geoipupdate_${GEOIP_VERSION}_linux_${ARCH}.deb" || true \
    && apt-get update && apt-get install -f -y

# Build dependencies stage with ALL pinned versions
FROM runtime-deps AS build-deps

# Install build prerequisites with mount cache and ALL pinned versions
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    case "${TARGETPLATFORM}" in \
      "linux/amd64") LIBRADCLI_VERSION="1.2.11-1+b2" ;; \
      "linux/arm64") LIBRADCLI_VERSION="1.2.11-1+b1" ;; \
      *) LIBRADCLI_VERSION="1.2.11-1+b1" ;; \
    esac \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      autoconf=2.71-3 \
      autogen=1:5.18.16-5 \
      automake=1:1.16.5-1.3 \
      bison=2:3.8.2+dfsg-1+b1 \
      build-essential=12.9 \
      cmake=3.25.1-1 \
      flex=2.6.4-8.2 \
      git=1:2.39.5-0+deb12u2 \
      golang=2:1.19~1 \
      jq=1.6-2.1 \
      libcairo2-dev=1.16.0-7 \
      libcap-dev=1:2.66-4+deb12u1 \
      libcurl4-openssl-dev=7.88.1-10+deb12u12 \
      libexpat1-dev=2.5.0-1+deb12u1 \
      libgcrypt20-dev=1.10.1-3 \
      libhiredis-dev=0.14.1-3 \
      libjson-c-dev=0.16-2 \
      libldap2-dev=2.5.13+dfsg-5 \
      libmariadb-dev=1:10.11.11-0+deb12u1 \
      libmaxminddb-dev=1.7.1-1 \
      libnetfilter-conntrack-dev=1.0.9-3 \
      libnetfilter-queue-dev=1.0.5-3 \
      libnl-genl-3-dev=3.7.0-0.2+b1 \
      libpango1.0-dev=1.50.12+ds-1 \
      libpcap-dev=1.10.3-1 \
      libradcli-dev=${LIBRADCLI_VERSION} \
      libreadline-dev=8.2-1.3 \
      librrd-dev=1.7.2-4+b8 \
      libsnmp-dev=5.9.3+dfsg-2 \
      libsqlite3-dev=3.40.1-2+deb12u1 \
      libssl-dev=3.0.16-1~deb12u1 \
      libtool-bin=2.4.7-7~deb12u1 \
      libtool=2.4.7-7~deb12u1 \
      libxml2-dev=2.9.14+dfsg-1.3~deb12u1 \
      libzmq3-dev=4.3.4-6 \
      patch=2.7.6-7 \
      pkg-config=1.8.1-1 \
      rename=2.01-1 \
      vim=2:9.0.1378-2+deb12u2 \
      wget=1.21.3-1+deb12u1 \
      zlib1g-dev=1:1.2.13.dfsg-1

# Mise tools stage - install and cache Go and Redis with pinned versions
FROM build-deps AS mise-tools

# Install Go with mise and cache the installation
RUN --mount=type=cache,target=/root/.cache/mise,sharing=locked \
    mise use go@${GO_VERSION} \
    && mise install go@${GO_VERSION} \
    && mise which go

# Install Redis with mise and cache the installation process
RUN --mount=type=cache,target=/root/.cache/mise,sharing=locked \
    mise use redis@${REDIS_VERSION} \
    && mise install redis@${REDIS_VERSION} \
    && mise which redis-server \
    && test -f /root/.local/share/mise/installs/redis/${REDIS_VERSION}/bin/redis-server

# Set mise environment for subsequent stages
ENV PATH="/root/.local/share/mise/installs/go/${GO_VERSION}/bin:/root/.local/share/mise/installs/redis/${REDIS_VERSION}/bin:${PATH}"

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
COPY --from=ntopng-builder /tmp/ntopng-install/usr/local/ /usr/local/

# Copy Redis installation from mise-tools stage
COPY --from=mise-tools /root/.local/share/mise/installs/redis/ /usr/local/redis/
# Create symlinks for Redis binaries
RUN ln -sf /usr/local/redis/${REDIS_VERSION}/bin/* /usr/local/bin/

# Create non-root users for security
RUN useradd -r -m -d /var/run/netflow -s /bin/false netflow \
    && useradd -r -m -d /var/run/ntopng -s /bin/false ntopng

# Create required directories in a single layer
RUN mkdir -p \
      /etc/ntopng \
      /var/lib/ntopng \
      /var/log/ntopng \
      /usr/share/GeoIP \
      /etc/GeoIP \
      /var/lock

# Set up GeoIP environment variables
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

# Copy configuration files
COPY ntopng.conf /etc/ntopng.conf
COPY ntopng.bash /opt/ntopng.bash
COPY geoip.bash /opt/geoip.bash

# Set proper permissions in a single layer
RUN touch /etc/GeoIP.conf \
    && chmod +x /opt/ntopng.bash /opt/geoip.bash \
    && chown -R ntopng:ntopng \
      /etc/ntopng \
      /opt/ntopng.bash \
      /var/run/netflow \
      /var/lib/ntopng \
      /var/log/ntopng \
      /var/run/ntopng \
      /usr/local/share/ntopng \
      /usr/share/GeoIP \
      /etc/GeoIP \
      /etc/GeoIP.conf

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
    org.opencontainers.image.description="ntopng with zeromq patch - fully optimized build with pinned versions" \
    org.opencontainers.image.authors="Dave Williams <dave@dave.io>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/daveio/ntopng" \
    org.opencontainers.image.source="https://github.com/daveio/ntopng" \
    org.opencontainers.image.version="6.4-001-optimized-pinned" \
    org.opencontainers.image.base.digest="sha256:cff42e2bf1063ae6a8729c148a1003357d5befa2fe7656c5d0c99e62b68aab7d" \
    netflow.go.version="${GO_VERSION}" \
    netflow.redis.version="${REDIS_VERSION}" \
    netflow.ndpi.version="${NDPI_VERSION}" \
    netflow.ntop.version="${NTOP_VERSION}" \
    netflow.netflow2ng.version="${NETFLOW2NG_VERSION}"