FROM amazoncorretto:24.0.1-al2023-headless

LABEL maintainer="Dave W <dave@dave.io>"
LABEL org.opencontainers.image.description="Dockerfile for HentaiAtHome with Amazon Corretto, running as non-root user"
LABEL org.opencontainers.image.source="https://github.com/daveio/hath"

ARG HATH_VERSION=1.6.4

RUN dnf install -y wget-1.21.3-1.amzn2023.0.4 unzip-6.0-57.amzn2023.0.2 shadow-utils-4.9-12.amzn2023.0.4 && \
    wget --progress=dot:giga -O /tmp/hath-$HATH_VERSION.zip https://repo.e-hentai.org/hath/HentaiAtHome_$HATH_VERSION.zip && \
    ls -l /tmp && \
    mkdir -p /opt/hath /hath && \
    unzip /tmp/hath-$HATH_VERSION.zip -d /opt/hath && \
    rm /tmp/hath-$HATH_VERSION.zip && \
    dnf remove -y wget unzip && dnf clean all

WORKDIR /opt/hath
COPY --link run/start.sh /opt/hath/

RUN chmod +x /opt/hath/start.sh

RUN groupadd hathgroup && \
    useradd -m -g hathgroup -s /bin/false hathuser && \
    chown -R hathuser:hathgroup /opt/hath /hath

VOLUME ["/hath/cache", "/hath/data", "/hath/download", "/hath/log", "/hath/tmp"]

USER hathuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD ps aux | grep '[s]tart.sh' || exit 1
CMD ["/opt/hath/start.sh"]
