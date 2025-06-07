import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggle", "selector"]

  connect() {
    this.loadThemePreference()
  }

  toggle() {
    const currentTheme = document.documentElement.getAttribute("data-theme")

    // Skip toggle if we're in synthwave mode - that's handled by synthwave controller
    if (currentTheme === "synthwave84") {
      return
    }

    // Toggle between light and dark themes
    let newTheme
    if (this.isLightTheme(currentTheme)) {
      newTheme = "dark"
    } else {
      newTheme = "light"
    }

    this.applyTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  select(event) {
    const selectedTheme = event.target.value
    if (selectedTheme) {
      const currentTheme = document.documentElement.getAttribute("data-theme")

      // Store the previous theme when switching to synthwave84
      if (selectedTheme === "synthwave84" && currentTheme !== "synthwave84") {
        localStorage.setItem("previousTheme", currentTheme)
      }

      this.applyTheme(selectedTheme)
      localStorage.setItem("theme", selectedTheme)

      // If switching to synthwave84, dispatch an event for the synthwave controller
      if (selectedTheme === "synthwave84") {
        const event = new CustomEvent("synthwave:activate")
        window.dispatchEvent(event)
      } else if (currentTheme === "synthwave84") {
        // If switching from synthwave84, dispatch deactivate event
        const event = new CustomEvent("synthwave:deactivate")
        window.dispatchEvent(event)
      }
    }
  }

  loadThemePreference() {
    // Default to catppuccin if no theme is set
    const savedTheme = localStorage.getItem("theme") || "catppuccin"

    // Ensure we're setting the meta color-scheme correctly at page load
    if (this.isLightTheme(savedTheme)) {
      document.querySelector('meta[name="color-scheme"]').setAttribute("content", "light dark")
    } else {
      document.querySelector('meta[name="color-scheme"]').setAttribute("content", "dark light")
    }

    // If the saved theme is synthwave84, let the synthwave controller handle it
    if (savedTheme === "synthwave84") {
      // Just set the selector value but don't apply the theme
      if (this.hasSelectorTarget) {
        this.selectorTarget.value = savedTheme
      }
      // The synthwave controller will handle the rest
      return
    }

    this.applyTheme(savedTheme)

    // Update selector if it exists
    if (this.hasSelectorTarget) {
      this.selectorTarget.value = savedTheme
    }
  }

  applyTheme(theme) {
    // Don't apply synthwave84 theme here - let the synthwave controller handle it
    if (theme === "synthwave84") {
      return
    }

    // Always remove any previously applied theme classes
    document.documentElement.setAttribute("data-theme", theme)

    // Update any toggle buttons
    if (this.hasToggleTarget) {
      const isDark = this.isDarkTheme(theme)
      this.toggleTargets.forEach((target) => {
        target.setAttribute("aria-checked", isDark.toString())
      })
    }

    // Update selector if it exists
    if (this.hasSelectorTarget) {
      this.selectorTarget.value = theme
    }

    // Update browser color-scheme
    if (this.isLightTheme(theme)) {
      document.querySelector('meta[name="color-scheme"]').setAttribute("content", "light dark")
    } else {
      document.querySelector('meta[name="color-scheme"]').setAttribute("content", "dark light")
    }
  }

  // Helper method to check if theme is dark
  isDarkTheme(theme) {
    return theme === "dark" || theme === "catppuccin" || theme === "synthwave84"
  }

  // Helper method to check if theme is light
  isLightTheme(theme) {
    return theme === "light"
  }
}
