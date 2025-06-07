# typed: false
# frozen_string_literal: true

require "catppuccin"

# Create an instance of the Catppuccin::Palette
CATPPUCCIN_PALETTE = Catppuccin::Palette.new

# Make Catppuccin colors available in Ruby
# This can be used in Rails views and helpers
module CatppuccinColors
  FLAVORS = %i[latte frappe macchiato mocha].freeze
  DEFAULT_FLAVOR = :frappe  # Default to dark mode (frappe)
  LIGHT_FLAVOR = :latte     # Light mode flavor
  DARK_FLAVOR = :frappe     # Dark mode flavor

  def self.colors(flavor = DEFAULT_FLAVOR)
    CATPPUCCIN_PALETTE.list_colors(flavor)
  end

  def self.current_flavor
    DEFAULT_FLAVOR
  end

  # Helper to get a color by name
  def self.color(name, flavor = DEFAULT_FLAVOR)
    CATPPUCCIN_PALETTE.color_hex(flavor, name)
  end

  # Get a list of all available flavors
  def self.flavors
    FLAVORS
  end
end
