import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
	static values = {
		active: { type: Boolean, default: false },
	};

	connect() {
		// Check for saved easter egg activation
		const synthwaveActivated =
			localStorage.getItem("synthwave84Activated") === "true" ||
			localStorage.getItem("theme") === "synthwave84";

		if (synthwaveActivated) {
			this.activateTheme();
		}

		// Listen for activation/deactivation events from theme controller
		window.addEventListener(
			"synthwave:activate",
			this.activateTheme.bind(this),
		);
		window.addEventListener(
			"synthwave:deactivate",
			this.deactivateTheme.bind(this),
		);

		// Listen for the konami code or other "cheat codes" to activate
		this.initializeKonamiCode();
	}

	disconnect() {
		// Remove event listeners to prevent memory leaks
		window.removeEventListener(
			"synthwave:activate",
			this.activateTheme.bind(this),
		);
		window.removeEventListener(
			"synthwave:deactivate",
			this.deactivateTheme.bind(this),
		);
	}

	// Konami code sequence: ↑ ↑ ↓ ↓ ← → ← → B A
	initializeKonamiCode() {
		const konamiCode = [
			"ArrowUp",
			"ArrowUp",
			"ArrowDown",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			"ArrowLeft",
			"ArrowRight",
			"b",
			"a",
		];
		let konamiIndex = 0;

		document.addEventListener("keydown", (e) => {
			// Reset if the key doesn't match the expected key in sequence
			if (e.key.toLowerCase() !== konamiCode[konamiIndex].toLowerCase()) {
				konamiIndex = 0;
				return;
			}

			// Move to the next key in the sequence
			konamiIndex++;

			// If the full sequence is entered, activate Synthwave
			if (konamiIndex === konamiCode.length) {
				this.toggleTheme();
				konamiIndex = 0;
			}
		});
	}

	toggleTheme() {
		if (this.activeValue) {
			this.deactivateTheme();
		} else {
			this.activateTheme();
		}
	}

	activateTheme() {
		// Display console message when activated
		console.log(
			"%c🌌 SYNTHWAVE'84 ACTIVATED! 🌌",
			"color: #ffffff; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #f72c88, 0 0 20px #f72c88; background: linear-gradient(90deg, #0b1e3a, #471458); padding: 10px; border-radius: 5px;",
		);
		console.log(
			"%c🎮 Press the Konami code again to deactivate 🎮",
			"color: #03edf9; font-size: 14px; font-style: italic;",
		);

		// Save the previous theme if not coming from synthwave already
		const currentTheme = document.documentElement.getAttribute("data-theme");
		if (currentTheme !== "synthwave84") {
			localStorage.setItem("previousTheme", currentTheme || "dark");
		}

		// Apply theme - completely replacing the previous theme
		document.documentElement.setAttribute("data-theme", "synthwave84");

		// Add wrapper for scanlines effect if not already present
		if (!document.querySelector(".synthwave-scanlines-wrapper")) {
			const wrapper = document.createElement("div");
			wrapper.className =
				"synthwave-scanlines-wrapper synthwave-scanlines fixed inset-0 pointer-events-none z-50 opacity-10";
			document.body.appendChild(wrapper);
		}

		// Add glow classes to various UI elements
		this.applyGlowEffects();

		// Setup mutation observer to apply effects to dynamically added elements
		this.setupMutationObserver();

		// Store preference
		localStorage.setItem("synthwave84Activated", "true");
		localStorage.setItem("theme", "synthwave84");

		// Update selector if it exists
		const selector = document.querySelector('[data-theme-target="selector"]');
		if (selector) {
			selector.value = "synthwave84";
		}

		this.activeValue = true;
	}

	deactivateTheme() {
		// Display console message when deactivated
		console.log(
			"%c🔌 SYNTHWAVE'84 DEACTIVATED 🔌",
			"color: #03edf9; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #03edf9; background: #1a1a1a; padding: 10px; border-radius: 5px;",
		);
		console.log(
			"%c👋 See you in the future...",
			"color: #f72c88; font-size: 14px; font-style: italic;",
		);

		// Restore previous theme (if stored, otherwise default to dark)
		const previousTheme = localStorage.getItem("previousTheme") || "dark";
		document.documentElement.setAttribute("data-theme", previousTheme);

		// Remove scanlines effect
		const wrapper = document.querySelector(".synthwave-scanlines-wrapper");
		if (wrapper) {
			wrapper.remove();
		}

		// Remove glow classes
		this.removeGlowEffects();

		// Disconnect mutation observer
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		// Store preference
		localStorage.setItem("synthwave84Activated", "false");
		localStorage.setItem("theme", previousTheme);

		// Update selector if it exists
		const selector = document.querySelector('[data-theme-target="selector"]');
		if (selector) {
			selector.value = previousTheme;
		}

		this.activeValue = false;
	}

	setupMutationObserver() {
		// Disconnect existing observer if it exists
		if (this.observer) {
			this.observer.disconnect();
		}

		// Create a new observer
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.addedNodes.length &&
					document.documentElement.getAttribute("data-theme") === "synthwave84"
				) {
					// When new nodes are added, apply glow effects if we're in Synthwave mode
					this.applyGlowEffects();
				}
			});
		});

		// Start observing the document body for DOM changes
		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	applyGlowEffects() {
		// Apply glow to headings
		document.querySelectorAll("h1, h2, h3").forEach((heading) => {
			heading.classList.add("synthwave-glow-text");
		});

		// Apply glow to buttons based on their type
		document.querySelectorAll(".btn-primary").forEach((btn) => {
			btn.classList.add("synthwave-glow-text");
		});

		document.querySelectorAll(".btn-secondary").forEach((btn) => {
			btn.classList.add("synthwave-glow-blue");
		});

		document.querySelectorAll(".btn-accent").forEach((btn) => {
			btn.classList.add("synthwave-glow-green");
		});

		// Apply glow to card titles
		document.querySelectorAll(".card-title").forEach((title) => {
			title.classList.add("synthwave-glow-text");
		});

		// Apply glow to tab components
		document.querySelectorAll(".tab.tab-active").forEach((tab) => {
			tab.classList.add("synthwave-glow-text");
		});

		// Apply subtle glow to inputs when focused
		document.querySelectorAll("input, textarea, select").forEach((input) => {
			input.addEventListener("focus", () => {
				if (
					document.documentElement.getAttribute("data-theme") === "synthwave84"
				) {
					input.style.boxShadow = "0 0 8px rgba(3, 237, 249, 0.5)";
				}
			});

			input.addEventListener("blur", () => {
				if (
					document.documentElement.getAttribute("data-theme") === "synthwave84"
				) {
					input.style.boxShadow = "";
				}
			});
		});

		// Apply glow to alert icons
		document.querySelectorAll(".alert svg").forEach((icon) => {
			if (icon.closest(".alert-info")) {
				icon.classList.add("synthwave-glow-blue");
			} else if (icon.closest(".alert-success")) {
				icon.classList.add("synthwave-glow-green");
			} else if (icon.closest(".alert-warning")) {
				icon.style.filter = "drop-shadow(0 0 5px rgba(255, 249, 81, 0.5))";
			} else if (icon.closest(".alert-error")) {
				icon.style.filter = "drop-shadow(0 0 5px rgba(254, 68, 80, 0.5))";
			}
		});

		// Apply active borders to various active elements
		document
			.querySelectorAll(".active, .selected, .tab-active")
			.forEach((element) => {
				element.classList.add("active-border");
			});
	}

	removeGlowEffects() {
		// Remove all synthwave specific classes
		const synthwaveClasses = [
			"synthwave-glow-text",
			"synthwave-glow-blue",
			"synthwave-glow-green",
			"active-border",
		];

		synthwaveClasses.forEach((className) => {
			document.querySelectorAll(`.${className}`).forEach((element) => {
				element.classList.remove(className);
			});
		});

		// Remove any inline styles added for glow effects
		document
			.querySelectorAll('[style*="box-shadow"], [style*="filter"]')
			.forEach((element) => {
				if (
					element.style.boxShadow &&
					element.style.boxShadow.includes("rgb(3, 237, 249)")
				) {
					element.style.boxShadow = "";
				}
				if (
					element.style.filter &&
					element.style.filter.includes("drop-shadow")
				) {
					element.style.filter = "";
				}
			});

		// Remove event listeners (no easy way to do this, but they will be garbage collected)
	}
}
