/**
 * Main Application Script
 * Handles UI interactions and displays scan results
 */

document.addEventListener("DOMContentLoaded", () => {
	// Initialize Feather icons
	feather.replace();

	// Initialize FileScanner and other modules
	const fileScanner = new FileScanner();
	const fileComparison = new FileComparison();
	const soundManager = new SoundManager();
	const confettiCelebration = new Confetti();

	// Get Elements
	const scanForm = document.getElementById("scan-form");
	const scanResults = document.getElementById("scan-results");
	const generateScriptBtn = document.getElementById("generate-script-btn");
	const scriptModal = document.getElementById("script-modal");
	const closeModalBtn = scriptModal.querySelector(".close-btn");
	const copyScriptBtn = document.getElementById("copy-script-btn");
	const downloadScriptBtn = document.getElementById("download-script-btn");
	const showOnlyDuplicates = document.getElementById("show-only-duplicates");
	// Synthetic delay controls removed

	// Initialize chart
	const fileDistributionChart = null;

	// Handle scan form submission
	scanForm.addEventListener("submit", async (e) => {
		e.preventDefault();

		try {
			const directoryPath = document.getElementById("directory-path").value;
			const fileExtensions = document.getElementById("file-extensions").value;
			const includePattern = document.getElementById("include-pattern").value;
			const excludePattern = document.getElementById("exclude-pattern").value;

			// Build scan options
			const scanOptions = {
				directory: directoryPath,
				extensions: fileExtensions,
			};

			// Add optional parameters if provided
			if (includePattern) scanOptions.include_pattern = includePattern;
			if (excludePattern) scanOptions.exclude_pattern = excludePattern;

			// Perform scan
			const results = await fileScanner.scanDirectory(scanOptions);

			// Update UI with results
			displayScanResults(results);

			// Celebrate with confetti if we found flagged files
			if (results.stats && results.stats.flagged_files > 0) {
				// Launch confetti with a small delay so people can see the results first
				setTimeout(() => {
					// Start the confetti celebration
					confettiCelebration.start();

					// Play a cheerful sound (optional)
					const audio = new Audio();
					audio.src =
						"data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
					audio
						.play()
						.catch((e) =>
							console.log("Audio play prevented by browser policy"),
						);
				}, 800);
			}

			// If it was saved to the database, we can show a notification
			if (results.scan_id) {
				showNotification("Scan saved to history. You can access it later.");
			}
		} catch (error) {
			showError(`Error scanning directory: ${error.message}`);
		}
	});

	// Handle generate script button click
	generateScriptBtn.addEventListener("click", async () => {
		try {
			const scriptTypeEl = document.querySelector(
				'input[name="script-type"]:checked',
			);
			const scriptType = scriptTypeEl ? scriptTypeEl.value : "bash";

			const scriptResult = await fileScanner.generateDeletionScript(scriptType);

			// Update modal with script content
			document.getElementById("script-content").textContent =
				scriptResult.script;
			document.getElementById("script-file-count").textContent =
				scriptResult.file_count;
			document.getElementById("script-file-size").textContent = formatSize(
				scriptResult.total_size,
			);

			// Show modal
			scriptModal.classList.remove("hidden");
			scriptModal.classList.add("visible");

			// Re-initialize feather icons in the modal
			feather.replace();
		} catch (error) {
			showError(`Error generating script: ${error.message}`);
		}
	});

	// Handle close modal button click
	closeModalBtn.addEventListener("click", () => {
		scriptModal.classList.remove("visible");
		setTimeout(() => {
			scriptModal.classList.add("hidden");
		}, 300);
	});

	// Handle copy script button click
	copyScriptBtn.addEventListener("click", () => {
		const scriptContent = document.getElementById("script-content").textContent;
		navigator.clipboard
			.writeText(scriptContent)
			.then(() => {
				showNotification("Script copied to clipboard");
			})
			.catch((err) => {
				showError("Failed to copy script to clipboard");
			});
	});

	// Handle download script button click
	downloadScriptBtn.addEventListener("click", () => {
		const scriptContent = document.getElementById("script-content").textContent;
		const scriptType = document.querySelector(
			'input[name="script-type"]:checked',
		).value;
		const extension = scriptType === "bash" ? "sh" : "bat";

		const blob = new Blob([scriptContent], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");

		a.href = url;
		a.download = `delete_flagged_files.${extension}`;
		document.body.appendChild(a);
		a.click();

		// Clean up
		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 0);
	});

	// Handle filter for directories with duplicates
	showOnlyDuplicates.addEventListener("change", () => {
		displayDirectories(fileScanner.scanResults?.directories || []);
	});

	// Click outside modal to close
	scriptModal.addEventListener("click", (e) => {
		if (e.target === scriptModal) {
			closeModalBtn.click();
		}
	});

	// Synthetic delay controls removed

	// Display scan results in the UI
	function displayScanResults(results) {
		// Show results section
		scanResults.classList.remove("hidden");

		// Play duplicate sound if duplicates found
		if (results.stats && results.stats.flagged_files > 0) {
			soundManager.playSound("duplicate");
		}

		// Update statistics with animated counters
		animateCounter("stat-total-dirs", 0, results.stats.total_dirs);
		animateCounter(
			"stat-dirs-with-duplicates",
			0,
			results.stats.dirs_with_duplicates,
		);
		animateCounter("stat-total-files", 0, results.stats.total_files);
		animateCounter("stat-flagged-files", 0, results.stats.flagged_files);

		// Set the size values directly since they are strings
		const totalSizeEl = document.getElementById("stat-total-size");
		const flaggedSizeEl = document.getElementById("stat-potential-savings");

		totalSizeEl.textContent = "0 B";
		flaggedSizeEl.textContent = "0 B";

		setTimeout(() => {
			totalSizeEl.style.animation = "number-pop 0.5s";
			totalSizeEl.textContent = results.stats.total_size_readable;

			setTimeout(() => {
				flaggedSizeEl.style.animation = "number-pop 0.5s";
				flaggedSizeEl.textContent = results.stats.flagged_size_readable;
			}, 200);

			// Remove animation after it completes
			setTimeout(() => {
				totalSizeEl.style.animation = "";
				flaggedSizeEl.style.animation = "";
			}, 1000);
		}, 800);

		// Create chart
		const chartCanvas = document.getElementById("file-distribution-chart");
		fileScanner.createDistributionChart(chartCanvas);

		// Display directories
		displayDirectories(results.directories);

		// Reinitialize Feather icons in the new content
		feather.replace();

		// Scroll to results
		scanResults.scrollIntoView({ behavior: "smooth" });
	}

	// Display directory listings
	function displayDirectories(directories) {
		const directoriesContainer = document.getElementById(
			"directories-container",
		);
		const showOnlyDuplicatesChecked = showOnlyDuplicates.checked;

		// Clear previous content
		directoriesContainer.innerHTML = "";

		// Filter directories if needed
		const filteredDirs = showOnlyDuplicatesChecked
			? directories.filter((dir) => dir.has_duplicates)
			: directories;

		if (filteredDirs.length === 0) {
			directoriesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No directories ${showOnlyDuplicatesChecked ? "with duplicates " : ""}found.</p>
                </div>
            `;
			return;
		}

		// Create directory cards
		filteredDirs.forEach((dir) => {
			const dirCard = document.createElement("div");
			dirCard.className = "directory-card";
			dirCard.innerHTML = `
                <div class="directory-header">
                    <div>
                        <h4>${dir.name}</h4>
                        <div class="directory-path">${dir.path}</div>
                    </div>
                    <div class="directory-summary">
                        ${
													dir.has_duplicates
														? `<span class="flagged-label">${dir.files.filter((f) => f.flagged).length} Flagged</span>`
														: '<span class="keep-label">No Duplicates</span>'
												}
                        <i data-feather="chevron-down" class="toggle-icon"></i>
                    </div>
                </div>
                <div class="file-list">
                    ${dir.files
											.map(
												(file) => `
                        <div class="file-item ${file.flagged ? "flagged" : "keep"}">
                            <div class="file-info">
                                <div class="file-name">
                                    ${file.name}
                                    ${
																			file.flagged
																				? '<span class="flagged-label">Flagged</span>'
																				: '<span class="keep-label">Keep</span>'
																		}
                                </div>
                            </div>
                            <div class="file-actions">
                                <div class="file-size">${file.size_readable}</div>
                                ${
																	dir.files.length > 1
																		? '<button class="compare-files-btn"><span>Compare</span></button>'
																		: ""
																}</div>
                        </div>
                    `,
											)
											.join("")}
                </div>
            `;

			// Complete rewrite of the click handling to ensure the entire header is clickable
			const toggleDirectory = (dirCard) => {
				// Toggle the card expanded state
				dirCard.classList.toggle("expanded");
				const icon = dirCard.querySelector(".toggle-icon");
				if (dirCard.classList.contains("expanded")) {
					icon.setAttribute("data-feather", "chevron-up");
				} else {
					icon.setAttribute("data-feather", "chevron-down");
				}
				feather.replace();

				// Play a subtle sound if available
				if (typeof soundManager !== "undefined") {
					soundManager.playSound("click");
				}
			};

			// Style the entire card to look clickable
			dirCard.style.cursor = "pointer";

			// Make the entire directory card clickable for the header part
			dirCard.onclick = (event) => {
				// Only handle clicks on the top part of the card (not the expanded file list)
				const fileList = dirCard.querySelector(".file-list");
				if (
					event.target.closest(".file-list") ||
					event.target.closest(".btn") ||
					event.target.closest(".compare-files-btn")
				) {
					return;
				}

				toggleDirectory(dirCard);
			};

			// Add direct click handler to the entire directory card header (for redundancy)
			dirCard.querySelector(".directory-header").onclick = (event) => {
				// Prevent toggling if click was on a button inside the header
				if (
					event.target.closest(".btn") ||
					event.target.closest(".compare-files-btn")
				) {
					return;
				}

				event.stopPropagation(); // Stop propagation to avoid duplicate toggling
				toggleDirectory(dirCard);
			};

			// Also allow clicking directly on the h4 title and path to toggle
			dirCard.querySelector("h4").onclick = (event) => {
				event.stopPropagation();
				toggleDirectory(dirCard);
			};

			dirCard.querySelector(".directory-path").onclick = (event) => {
				event.stopPropagation();
				toggleDirectory(dirCard);
			};

			// Make the flagged/keep labels directly clickable too
			const directoryLabel = dirCard.querySelector(
				".directory-summary > .flagged-label, .directory-summary > .keep-label",
			);
			if (directoryLabel) {
				directoryLabel.onclick = (event) => {
					event.stopPropagation();
					toggleDirectory(dirCard);
				};
			}

			// Make the toggle icon directly clickable
			const toggleIcon = dirCard.querySelector(".toggle-icon");
			if (toggleIcon) {
				toggleIcon.onclick = (event) => {
					event.stopPropagation();
					toggleDirectory(dirCard);
				};
			}

			directoriesContainer.appendChild(dirCard);

			// Add file comparison functionality
			dirCard.querySelectorAll(".compare-files-btn").forEach((compareBtn) => {
				compareBtn.addEventListener("click", (e) => {
					e.stopPropagation(); // Prevent directory toggle

					// Find the directory and its files
					const dirName = dirCard.querySelector("h4").textContent;
					const targetDir = filteredDirs.find((d) => d.name === dirName);

					if (targetDir && targetDir.files && targetDir.files.length > 1) {
						// Use the file comparison module
						fileComparison.compareFiles(targetDir.files);
					}
				});
			});
		});

		// Initialize feather icons in the new content
		feather.replace();
	}

	// Show error notification
	function showError(message) {
		console.error(message);

		// Play alert sound
		soundManager.playSound("alert");

		// Create error notification element
		const errorNotification = document.createElement("div");
		errorNotification.className = "notification error";
		errorNotification.innerHTML = `
            <div class="notification-content">
                <i data-feather="alert-circle"></i>
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i data-feather="x"></i>
            </button>
        `;

		// Add to page
		document.body.appendChild(errorNotification);

		// Initialize icons
		feather.replace();

		// Add close functionality
		errorNotification
			.querySelector(".notification-close")
			.addEventListener("click", () => {
				errorNotification.remove();
			});

		// Auto-remove after 5 seconds
		setTimeout(() => {
			if (document.body.contains(errorNotification)) {
				errorNotification.remove();
			}
		}, 5000);
	}

	// Show notification
	function showNotification(message) {
		// Play success sound
		soundManager.playSound("success");

		// Create notification element
		const notification = document.createElement("div");
		notification.className = "notification";
		notification.innerHTML = `
            <div class="notification-content">
                <i data-feather="check-circle"></i>
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i data-feather="x"></i>
            </button>
        `;

		// Add to page
		document.body.appendChild(notification);

		// Initialize icons
		feather.replace();

		// Add close functionality
		notification
			.querySelector(".notification-close")
			.addEventListener("click", () => {
				notification.remove();
			});

		// Auto-remove after 3 seconds
		setTimeout(() => {
			if (document.body.contains(notification)) {
				notification.remove();
			}
		}, 3000);
	}

	// Helper function to format file size
	function formatSize(bytes) {
		if (bytes === 0) return "0 B";

		const units = ["B", "KB", "MB", "GB", "TB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));

		return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
	}

	/**
	 * Animate counting up to a target number
	 * @param {string} elementId - ID of the element to update
	 * @param {number} start - Starting value
	 * @param {number} end - Ending value
	 * @param {number} [duration=1000] - Animation duration in ms
	 */
	function animateCounter(elementId, start, end, duration = 1000) {
		const element = document.getElementById(elementId);
		if (!element) return;

		// Make sure start and end are numbers
		start = Number.parseInt(start, 10) || 0;
		end = Number.parseInt(end, 10) || 0;

		// Don't animate if numbers are the same or if end is 0
		if (start === end || end === 0) {
			element.textContent = end;
			return;
		}

		const range = end - start;
		const minStep = end < 30 ? 1 : Math.floor(range / 30);
		const stepTime = Math.abs(Math.floor(duration / range));
		const startTime = new Date().getTime();

		function updateNumber() {
			const now = new Date().getTime();
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for a more natural animation
			const easeOutQuart = 1 - Math.pow(1 - progress, 4);
			const currentValue = Math.floor(start + range * easeOutQuart);

			element.textContent = currentValue;
			element.style.animation = "number-pop 0.5s";

			if (progress < 1) {
				setTimeout(updateNumber, stepTime);
			} else {
				element.textContent = end;
				// Remove animation after it's done
				setTimeout(() => {
					element.style.animation = "";
				}, 500);
			}
		}

		updateNumber();
	}
});
