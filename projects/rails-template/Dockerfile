# syntax=docker/dockerfile:1
# check=error=true

# This Dockerfile is designed for production, not development. Use with Kamal or build'n'run by hand:
# docker build -t %%PROJECTNAME%% .
# docker run -d -p 80:80 -e RAILS_MASTER_KEY=<value from config/master.key> --name %%PROJECTNAME%% %%PROJECTNAME%%

# For a containerized dev environment, see Dev Containers: https://guides.rubyonrails.org/getting_started_with_devcontainer.html

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=3.4.3
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

# Set shell options for all RUN commands
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Rails app lives here
WORKDIR /rails

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    curl=7.88.1-10+deb12u12 \
    libjemalloc2=5.3.0-1 \
    libvips42=8.14.1-3+deb12u2 \
    sqlite3=3.40.1-2+deb12u1 \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Set shell options for all RUN commands
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install packages needed to build gems and setup Bun
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential=12.9 \
    git=1:2.39.5-0+deb12u2 \
    libyaml-dev=0.2.5-1 \
    pkg-config=1.8.1-1 \
    unzip=6.0-28 \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives && \
    curl -fsSL https://bun.sh/install | bash -s -- "bun-v1.2.13" && \
    echo "export BUN_INSTALL=/usr/local/bun" >> /etc/profile && \
    echo "export PATH=/usr/local/bun/bin:\$PATH" >> /etc/profile

ENV BUN_INSTALL=/usr/local/bun
ENV PATH=/usr/local/bun/bin:$PATH

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Install node modules
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times and assets for production
RUN bundle exec bootsnap precompile app/ lib/ && \
    SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# Final stage for app image
FROM base

# Set shell options for all RUN commands
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Copy built artifacts: gems, application
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER 1000:1000

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Add healthcheck to ensure container is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD curl -f http://localhost:80/ || exit 1

# Start server via Thruster by default, this can be overwritten at runtime
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
