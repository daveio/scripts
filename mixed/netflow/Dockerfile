FROM jdxcode/mise:2025.6.0 AS stage1

# Install runtime prerequisites
RUN sed -i -e's/ main/ main contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
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
      /var/{cache,log}/* \
      /var/lib/apt/lists/*

FROM stage1 AS stage2

ARG NDPI_VERSION "4.14"
ARG NTOP_VERSION "6.4"
ARG NETFLOW2NG_VERSION "0.0.5"

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /tmp

# Install build prerequisites
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
      libtool \
      libtool-bin \
      libxml2-dev \
      libzmq3-dev \
      patch \
      pkg-config \
      rename \
      vim \
      wget \
      zlib1g-dev

# download source code
# was --branch ${pkg_VERSION}-stable
RUN git clone --depth 1 https://github.com/ntop/nDPI.git nDPI \
    && git clone --depth 1 https://github.com/ntop/ntopng.git ntopng \
    && git clone --depth 1 https://github.com/synfinatic/netflow2ng.git netflow2ng

COPY allow-flows-from-netflow2ng.patch ntopng/

RUN mise use go@1.24.3 \
    && mise install

# Build all software
RUN cd netflow2ng \
    && make SHARED=0 CFLAGS='-static -std=gnu99 -static-libgcc -static-libstdc++ -fPIC' \
    && cp dist/netflow2ng-* /usr/local/bin/netflow2ng \
    && chmod +x /usr/local/bin/netflow2ng

RUN cd nDPI \
    && ./autogen.sh --with-only-libndpi \
    && ./configure --enable-static \
    && make

RUN cd ntopng \
    && patch -p1 -i allow-flows-from-netflow2ng.patch \
    && ./autogen.sh \
    && ./configure --enable-static \
    && make \
    && make install

FROM stage1

COPY --from=stage2 /usr/local/bin/netflow2ng /usr/local/bin/netflow2ng
COPY --from=stage2 /usr/local/bin/ntopng /usr/local/bin/ntopng
COPY --from=stage2 /usr/local/share/ntopng /usr/local/share/ntopng

RUN useradd -r -m -d /var/run/netflow -s /bin/false netflow \
    && useradd -r -m -d /var/run/ntop -s /bin/false ntopng

RUN mise use redis@8.0.2 \
    && mise install

RUN mkdir -p /etc/ntopng /var/lib/ntopng

COPY ntopng.conf /etc/ntopng.conf
COPY ntopng.bash /opt/ntopng.bash

RUN chmod +x /opt/ntopng.bash \
    && chown -R ntopng:ntopng \
      /etc/ntopng \
      /opt/ntopng.bash \
      /var/run/netflow \
      /var/run/ntop \
      /var/lib/ntopng \
      /usr/local/share/ntopng

USER ntopng

EXPOSE 3000/tcp 2055/udp

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/ntopng --version || exit 1

ENTRYPOINT ["/bin/bash", "-o", "pipefail", "-c"]

CMD ["/opt/ntopng.bash"]



LABEL \
    org.opencontainers.image.title="ntopng" \
    org.opencontainers.image.description="ntopng with zeromq patch" \
    org.opencontainers.image.authors="Dave Williams <dave@dave.io>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://github.com/daveio/ntopng" \
    org.opencontainers.image.source="https://github.com/daveio/ntopng" \
    org.opencontainers.image.version="6.4-001"
