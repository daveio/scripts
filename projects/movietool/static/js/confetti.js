/**
 * Simple Confetti Animation
 * Creates a fun celebration effect when a scan completes
 */

class Confetti {
	constructor(options = {}) {
		this.container = options.container || document.body;
		this.count = options.count || 150;
		this.duration = options.duration || 3000; // ms
		this.particles = [];
		this.colors = options.colors || [
			"#ffd86d", // yellow
			"#8caaee", // blue
			"#a6d189", // green
			"#ef9f76", // peach
			"#ca9ee6", // mauve
			"#e78284", // red
			"#99d1db", // sky
			"#f4b8e4", // pink
		];
		this.initialized = false;
	}

	init() {
		if (this.initialized) return;
		this.initialized = true;

		// Create a container element for the confetti
		this.element = document.createElement("div");
		this.element.className = "confetti-container";
		this.element.style.position = "fixed";
		this.element.style.top = "0";
		this.element.style.left = "0";
		this.element.style.width = "100%";
		this.element.style.height = "100%";
		this.element.style.pointerEvents = "none";
		this.element.style.zIndex = "9999";
		this.container.appendChild(this.element);

		// Create the confetti particles
		for (let i = 0; i < this.count; i++) {
			const particle = document.createElement("div");
			particle.className = "confetti-particle";

			const size = Math.random() * 10 + 5; // 5-15px

			particle.style.position = "absolute";
			particle.style.width = `${size}px`;
			particle.style.height = `${size / 2}px`;
			particle.style.background =
				this.colors[Math.floor(Math.random() * this.colors.length)];
			particle.style.borderRadius = "50%";
			particle.style.opacity = Math.random() * 0.8 + 0.2; // 0.2-1.0

			// Set random starting positions at the top
			particle.style.left = Math.random() * 100 + "vw";
			particle.style.top = "-10px";

			// Random rotation
			particle.style.transform = `rotate(${Math.random() * 360}deg)`;

			this.element.appendChild(particle);
			this.particles.push({
				element: particle,
				size: size,
				speedX: Math.random() * 3 - 1.5, // -1.5 to 1.5
				speedY: Math.random() * 5 + 5, // 5 to 10
				rotation: Math.random() * 6 - 3, // -3 to 3 deg per frame
				opacitySpeed: (Math.random() * 0.5 + 0.5) / (this.duration / 16), // fade over the duration
			});
		}
	}

	start() {
		if (!this.initialized) this.init();

		this.element.style.display = "block";
		this.animationStartTime = Date.now();
		this.animating = true;

		// Play celebration sound if available
		if (typeof soundManager !== "undefined" && soundManager.isSoundEnabled()) {
			soundManager.playSound("complete");
		}

		// Reset particles
		this.particles.forEach((particle) => {
			particle.element.style.left = Math.random() * 100 + "vw";
			particle.element.style.top = "-10px";
			particle.element.style.opacity = Math.random() * 0.8 + 0.2;
			particle.element.style.transform = `rotate(${Math.random() * 360}deg)`;
		});

		this.animate();

		// Auto-stop after duration
		setTimeout(() => this.stop(), this.duration);
	}

	stop() {
		this.animating = false;
		setTimeout(() => {
			if (this.element) {
				this.element.style.display = "none";
			}
		}, 100);
	}

	animate() {
		if (!this.animating) return;

		const elapsed = Date.now() - this.animationStartTime;
		const progress = Math.min(elapsed / this.duration, 1);

		this.particles.forEach((particle) => {
			const top = Number.parseFloat(particle.element.style.top);
			const left = Number.parseFloat(particle.element.style.left);
			const rotation = Number.parseFloat(
				particle.element.style.transform.replace(/[^0-9.-]/g, "") || 0,
			);

			// Move particle
			particle.element.style.top = top + particle.speedY + "px";
			particle.element.style.left = left + particle.speedX + "vw";

			// Rotate particle
			particle.element.style.transform = `rotate(${rotation + particle.rotation}deg)`;

			// Fade out as it falls
			particle.element.style.opacity = Math.max(
				0,
				Number.parseFloat(particle.element.style.opacity) -
					particle.opacitySpeed,
			);

			// Add a gentle wobble
			if (Math.random() > 0.95) {
				particle.speedX += Math.random() * 0.4 - 0.2;
			}

			// Constrain horizontal speed
			particle.speedX = Math.max(-2, Math.min(2, particle.speedX));
		});

		if (this.animating) {
			requestAnimationFrame(() => this.animate());
		}
	}

	// Clean up
	destroy() {
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
		this.particles = [];
		this.initialized = false;
		this.animating = false;
	}
}

// Create a global confetti instance
const confettiCelebration = new Confetti();
