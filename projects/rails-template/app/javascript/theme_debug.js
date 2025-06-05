// Debug script for theme selector
document.addEventListener('DOMContentLoaded', () => {
  console.log('Theme debug script loaded')

  // Get the HTML element
  const htmlElement = document.documentElement
  console.log('Initial data-theme:', htmlElement.getAttribute('data-theme'))

  // Check if the selector exists
  const themeSelector = document.querySelector('[data-theme-target="selector"]')
  if (themeSelector) {
    console.log('Theme selector found', themeSelector)

    // Add a manual event listener
    themeSelector.addEventListener('change', (event) => {
      const theme = event.target.value
      console.log('Theme changed to:', theme)
      htmlElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    })

    // Set initial theme from localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      console.log('Applying saved theme:', savedTheme)
      htmlElement.setAttribute('data-theme', savedTheme)
      themeSelector.value = savedTheme
    }
  } else {
    console.error('Theme selector not found')
  }
})
