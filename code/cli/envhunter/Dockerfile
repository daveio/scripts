FROM ruby:3.4.4

WORKDIR /app

RUN useradd -m envhunter

COPY . .

RUN gem install bundler:2.6.9 && \
    bundle install && \
    chown -R envhunter:envhunter /app

USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD test -x /app/bin/envhunter || exit 1

ENTRYPOINT ["bin/envhunter"]
