/**
 * Theme Switcher
 * Toggles between Catppuccin Frappé (dark) and Latte (light) themes
 */

document.addEventListener("DOMContentLoaded", () => {
	const themeToggleBtn = document.getElementById("theme-toggle-btn");
	const themeIcon = document.getElementById("theme-icon");

	// Check for saved theme preference or use device preference
	const savedTheme = localStorage.getItem("theme");
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	// Set initial theme
	if (savedTheme === "latte") {
		document.body.classList.remove("theme-frappe");
		document.body.classList.add("theme-latte");
		themeIcon.setAttribute("data-feather", "sun");
	} else if (savedTheme === "frappe" || prefersDark) {
		document.body.classList.remove("theme-latte");
		document.body.classList.add("theme-frappe");
		themeIcon.setAttribute("data-feather", "moon");
	} else {
		document.body.classList.remove("theme-latte");
		document.body.classList.add("theme-frappe");
		themeIcon.setAttribute("data-feather", "moon");
	}

	// Update Feather icons after changing the icon type
	feather.replace();

	// Toggle theme on button click
	themeToggleBtn.addEventListener("click", () => {
		if (document.body.classList.contains("theme-frappe")) {
			// Switch to light theme
			document.body.classList.remove("theme-frappe");
			document.body.classList.add("theme-latte");
			themeIcon.setAttribute("data-feather", "sun");
			localStorage.setItem("theme", "latte");
		} else {
			// Switch to dark theme
			document.body.classList.remove("theme-latte");
			document.body.classList.add("theme-frappe");
			themeIcon.setAttribute("data-feather", "moon");
			localStorage.setItem("theme", "frappe");
		}

		// Update Feather icons after changing the icon type
		feather.replace();
	});
});
