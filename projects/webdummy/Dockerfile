FROM caddy:2.10.0-alpine
LABEL org.opencontainers.image.source=https://github.com/daveio/webdummy
LABEL maintainer="Dave Williams <dave@dave.io>"
COPY Caddyfile /etc/caddy/Caddyfile
COPY html /srv
COPY html/404.html /srv/index.html
RUN adduser -D -s /bin/false caddy && chown -R caddy /srv
USER caddy
WORKDIR /srv
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
