/**
 * File Scanner Module
 * Handles directory scanning functionality and result processing
 */

class FileScanner {
  constructor() {
    this.scanResults = null
    this.flaggedFiles = []
  }

  /**
   * Scan a directory for video files
   * @param {Object} options - Scan options
   * @returns {Promise} - Resolves with scan results
   */
  async scanDirectory(options) {
    try {
      // Show progress indicator
      this.showProgress()

      // Convert extensions to array if provided as comma-separated string
      if (typeof options.extensions === 'string') {
        options.extensions = options.extensions
          .split(',')
          .map((ext) => ext.trim())
          .filter((ext) => ext)
      }

      // Setup Server-Sent Events for real-time progress updates
      const scanEventSource = new EventSource(`/api/scan-progress?timestamp=${Date.now()}`)

      // Start the actual scan in a separate request
      const scanPromise = fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      })

      // Listen for progress updates and log entries
      scanEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Update status text only - we've switched to an auto-animated progress bar
          if (this.progressText && data.status) {
            this.progressText.textContent = data.status
          }

          // We don't set width anymore, it's always 100% with animation
          // Just keep particles floating for visual interest
          if (this.particles) {
            this.particles.forEach((p) => {
              if (!p.style.animation || p.style.animation === 'none') {
                p.style.animation = 'float 1.5s ease-in-out infinite'
              }
            })
          }

          // Log entries removed as requested
        } catch (e) {
          console.error('Error parsing progress data:', e)
        }
      }

      scanEventSource.onerror = () => {
        // Close the event source on error
        scanEventSource.close()
      }

      // Wait for the scan to complete
      const response = await scanPromise

      // Close the event source when done
      scanEventSource.close()

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to scan directory')
      }

      this.scanResults = await response.json()
      this.flaggedFiles = this.scanResults.flagged_files || []

      // Hide progress and return results
      this.hideProgress()
      return this.scanResults
    } catch (error) {
      this.hideProgress()
      throw error
    }
  }

  /**
   * Generate a deletion script for flagged files
   * @param {string} scriptType - Type of script to generate (bash/batch)
   * @returns {Promise} - Resolves with script content
   */
  async generateDeletionScript(scriptType) {
    try {
      if (!this.flaggedFiles || this.flaggedFiles.length === 0) {
        throw new Error('No files have been flagged for deletion')
      }

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: this.flaggedFiles,
          script_type: scriptType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate deletion script')
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating deletion script:', error)
      throw error
    }
  }

  /**
   * Show progress indicator
   */
  showProgress() {
    const progressSection = document.getElementById('scan-progress')
    if (progressSection) {
      progressSection.classList.remove('hidden')

      // Get all progress elements
      this.progressFill = progressSection.querySelector('.progress-fill')
      this.progressText = progressSection.querySelector('.progress-text')
      this.progressPercentage = progressSection.querySelector('.progress-percentage')

      // Set progress bar to full width for continuous animation
      if (this.progressFill) {
        this.progressFill.style.width = '100%'
      }

      // Set progress text to indicate scanning is in progress
      if (this.progressPercentage) {
        this.progressPercentage.textContent = 'Scanning...'
      }

      if (this.progressText) {
        this.progressText.textContent = 'Processing files...'
      }

      // No particles to animate (removed)
    }
  }

  // Removed particle animations and scan log functionality

  /**
   * Hide progress indicator
   */
  hideProgress() {
    const progressSection = document.getElementById('scan-progress')
    if (progressSection) {
      // Complete the progress bar animation
      const progressFill = progressSection.querySelector('.progress-fill')
      progressFill.style.width = '100%'

      if (this.progressPercentage) {
        this.progressPercentage.textContent = '100%'
      }

      if (this.progressText) {
        this.progressText.textContent = 'Scan completed successfully!'
      }

      // Play completion sound
      soundManager.playSound('complete')

      // Hide the progress section after a short delay
      setTimeout(() => {
        progressSection.classList.add('hidden')
        progressFill.style.width = '0%'
      }, 1000)
    }
  }

  /**
   * Create a chart visualizing file distribution
   * @param {HTMLCanvasElement} canvas - Canvas element for the chart
   */
  createDistributionChart(canvas) {
    if (!this.scanResults || !canvas) return

    const stats = this.scanResults.stats

    // Destroy previous chart if it exists
    if (this.chart) {
      this.chart.destroy()
    }

    const ctx = canvas.getContext('2d')
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Flagged Files', 'Kept Files'],
        datasets: [
          {
            data: [stats.flagged_files, stats.total_files - stats.flagged_files],
            backgroundColor: [
              getComputedStyle(document.body).getPropertyValue('--red').trim(),
              getComputedStyle(document.body).getPropertyValue('--green').trim()
            ],
            borderColor: [
              getComputedStyle(document.body).getPropertyValue('--base').trim(),
              getComputedStyle(document.body).getPropertyValue('--base').trim()
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--text').trim(),
              font: {
                family: "'Inter', sans-serif",
                size: 14
              }
            }
          },
          tooltip: {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--overlay').trim(),
            titleColor: getComputedStyle(document.body).getPropertyValue('--text').trim(),
            bodyColor: getComputedStyle(document.body).getPropertyValue('--text').trim(),
            borderColor: getComputedStyle(document.body).getPropertyValue('--accent').trim(),
            borderWidth: 1,
            displayColors: true,
            padding: 10,
            titleFont: {
              family: "'Inter', sans-serif",
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: "'Inter', sans-serif",
              size: 13
            },
            callbacks: {
              label: (context) => {
                const label = context.label || ''
                const value = context.raw || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} files (${percentage}%)`
              }
            }
          }
        }
      }
    })
  }
}

// Create a singleton instance
const fileScanner = new FileScanner()
