# typed: false
# frozen_string_literal: true

# Provides access to Synthwave '84 theme colors
module Synthwave84Colors
  # Color map for Synthwave '84 colors
  COLORS = {
    primary: "#f92aad",
    secondary: "#03edf9",
    tertiary: "#72f1b8",
    background: "#2a2139",
    background_dark: "#241b2f",
    background_darker: "#1e1726",
    text: "#f4eee4",
    accent: "#34294f",
    yellow: "#fff951",
    orange: "#fc9867",
    red: "#f97e72",
    purple: "#b893ce"
  }.freeze

  # Get a Synthwave '84 color value by name
  # @param name [Symbol, String] color name (e.g., :primary, "secondary")
  # @return [String] hex color value
  def self.color(name)
    COLORS[name.to_sym] || COLORS[:text]
  end

  # Returns all available Synthwave '84 colors
  # @return [Hash] hash of color names and hex values
  def self.colors
    COLORS
  end

  # Returns a CSS string for defining Synthwave '84 colors as custom properties
  # @return [String] CSS custom properties
  def self.css_variables
    COLORS.map { |name, value| "--synthwave84-#{name}: #{value};" }.join("\n")
  end

  # Returns true if the given theme name is Synthwave '84
  # @param theme [String, Symbol] theme name
  # @return [Boolean] true if theme is Synthwave '84
  def self.synthwave84?(theme)
    theme.to_s == "synthwave84"
  end
end
