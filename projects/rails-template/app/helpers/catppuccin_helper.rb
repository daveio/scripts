# typed: false
# frozen_string_literal: true

# Provides access to Catppuccin theme colors and theme switching functionality
module CatppuccinHelper
  # Returns the current Catppuccin flavor (e.g., :frappe, :latte)
  def current_catppuccin_flavor
    CatppuccinColors.current_flavor
  end

  # Get a Catppuccin color value by name
  # @param name [Symbol, String] color name (e.g., :blue, "green")
  # @param flavor [Symbol, nil] optional flavor to use, otherwise uses current flavor
  # @return [String] hex color value
  def catppuccin_color(name, flavor = nil)
    CatppuccinColors.color(name, flavor)
  end

  # Returns all available Catppuccin flavors
  # @return [Array<Symbol>] array of flavor names
  def catppuccin_flavors
    CatppuccinColors.flavors
  end

  # Returns all available themes, including Catppuccin flavors and the Synthwave '84 theme
  # @return [Array<String>] array of theme names
  def all_themes
    catppuccin_flavors.map(&:to_s) + ["synthwave84"]
  end

  # Generates HTML attributes for theme switching
  # @param html_options [Hash] additional HTML attributes
  # @return [Hash] HTML attributes with data attributes for theme switching
  def theme_switch_attributes(html_options = {})
    html_options.merge(
      {
        'data-theme-toggle': "true",
        'data-light-theme': "light",
        'data-dark-theme': "dark"
      }
    )
  end

  # Returns true if the current theme is Synthwave '84
  # @return [Boolean] true if current theme is Synthwave '84
  def synthwave_theme?
    request.cookies["theme"] == "synthwave84"
  end

  # Returns CSS classes for Synthwave '84 glow effects
  # @param type [Symbol] type of glow effect (:text, :blue, or :green)
  # @return [String] CSS classes for the glow effect
  def synthwave_glow_class(type = :text)
    return "" unless synthwave_theme?

    case type
    when :blue
      "synthwave-glow-blue"
    when :green
      "synthwave-glow-green"
    else
      "synthwave-glow-text"
    end
  end
end
