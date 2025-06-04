# typed: false
# frozen_string_literal: true

# Require the Synthwave84Colors module
require_relative "../../app/models/synthwave84_colors"

# Initialize with development warning
if defined?(Rails) && Rails.env.production?
  Rails.logger.info "Synthwave '84 theme is available (but hidden by default) in production"
else
  Rails.logger.info "Synthwave '84 theme is available in development and test environments"
  Rails.logger.info "Use the Konami code to activate: ↑↑↓↓←→←→BA"
end
