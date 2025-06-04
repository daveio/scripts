# typed: false
# frozen_string_literal: true

# Controller for demonstration pages, only available in development mode
class DemoController < ApplicationController
  before_action :require_development_mode

  def index
    # Main demo page
  end

  def ui
    # UI components demo page
  end

  private

  def require_development_mode
    render plain: "This page is only available in development mode", status: :forbidden unless Rails.env.development?
  end
end
