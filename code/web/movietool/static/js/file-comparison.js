/**
 * File Comparison Module
 * Provides side-by-side comparison of video files with detailed metadata
 */

class FileComparison {
  constructor() {
    this.modalElement = null
    this.initialized = false
    this.videoProperties = {
      // Mock data for video properties we might extract
      // In a real implementation, these would be determined by analyzing the file
      resolutions: ['480p', '720p', '1080p', '2160p', '4K'],
      codecs: ['H.264', 'H.265/HEVC', 'VP9', 'AV1', 'MPEG-4'],
      containers: ['MP4', 'MKV', 'AVI', 'MOV', 'WebM'],
      audioFormats: ['AAC', 'MP3', 'DTS', 'Dolby Digital', 'Dolby Atmos'],
      bitRates: ['1000 kbps', '2500 kbps', '5000 kbps', '8000 kbps', '15000 kbps']
    }
  }

  /**
   * Initialize the comparison modal
   */
  init() {
    if (this.initialized) return

    // Create modal element
    this.modalElement = document.createElement('div')
    this.modalElement.className = 'modal comparison-modal'
    this.modalElement.id = 'file-comparison-modal'

    // Create modal content
    this.modalElement.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>File Comparison</h3>
                    <button class="close-btn">
                        <i data-feather="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="comparison-container">
                        <div class="comparison-files">
                            <!-- Files will be dynamically added here -->
                        </div>
                        <div class="comparison-specs">
                            <h4>Video Specifications</h4>
                            <div class="specs-grid">
                                <!-- Specs will be dynamically added here -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="comparison-footer-note">
                        <i data-feather="info"></i>
                        <span>Showing file metadata for comparison purposes</span>
                    </div>
                    <button class="btn-secondary" id="comparison-close-btn">Close</button>
                </div>
            </div>
        `

    // Add to document
    document.body.appendChild(this.modalElement)

    // Add event listeners
    const closeBtn = this.modalElement.querySelector('.close-btn')
    const closeButtonFooter = this.modalElement.querySelector('#comparison-close-btn')

    closeBtn.addEventListener('click', () => this.hideModal())
    closeButtonFooter.addEventListener('click', () => this.hideModal())

    // Close on click outside
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hideModal()
      }
    })

    // Initialize feather icons
    feather.replace()

    this.initialized = true
  }

  /**
   * Compare multiple files - show their details side by side
   * @param {Array} files - Array of file objects to compare
   */
  compareFiles(files) {
    if (!this.initialized) this.init()

    // Filter to max 3 files for reasonable display
    const filesToCompare = files.slice(0, 3)

    // Get container elements
    const filesContainer = this.modalElement.querySelector('.comparison-files')
    const specsContainer = this.modalElement.querySelector('.specs-grid')

    // Clear previous content
    filesContainer.innerHTML = ''
    specsContainer.innerHTML = ''

    // Add files to the comparison
    filesToCompare.forEach((file) => {
      filesContainer.innerHTML += `
                <div class="comparison-file ${file.flagged ? 'flagged' : 'keep'}">
                    <h4 class="file-name-header">${file.name}</h4>
                    <div class="file-size-badge">${file.size_readable}</div>
                    <div class="comparison-file-label">
                        ${
                          file.flagged
                            ? '<span class="flagged-label">Flagged for deletion</span>'
                            : '<span class="keep-label">Keeping this file</span>'
                        }
                    </div>
                </div>
            `
    })

    // Generate random "specs" for demo purposes
    // In a real implementation these would be extracted from the files
    const specs = [
      { name: 'Resolution', icon: 'maximize' },
      { name: 'Video Codec', icon: 'film' },
      { name: 'Container', icon: 'package' },
      { name: 'Audio Format', icon: 'volume-2' },
      { name: 'Bitrate', icon: 'bar-chart-2' },
      { name: 'Frame Rate', icon: 'activity' }
    ]

    // Add specs rows
    specs.forEach((spec) => {
      let specsRow = `
                <div class="spec-row">
                    <div class="spec-name">
                        <i data-feather="${spec.icon}"></i>
                        <span>${spec.name}</span>
                    </div>
            `

      // Add values for each file
      filesToCompare.forEach((file) => {
        let value = ''

        // Generate plausible values for demo
        switch (spec.name) {
          case 'Resolution':
            // Higher resolution for larger files
            value = this.getResolutionBasedOnSize(file.size)
            break
          case 'Video Codec':
            // Newer codec for larger files
            value = this.getCodecBasedOnSize(file.size)
            break
          case 'Container':
            value = this.getRandomFromArray(this.videoProperties.containers)
            break
          case 'Audio Format':
            value = this.getRandomFromArray(this.videoProperties.audioFormats)
            break
          case 'Bitrate':
            // Higher bitrate for larger files
            value = this.getBitrateBasedOnSize(file.size)
            break
          case 'Frame Rate':
            // Common frame rates
            value = this.getRandomFromArray(['23.976 fps', '24 fps', '25 fps', '29.97 fps', '30 fps', '60 fps'])
            break
          default:
            value = 'Unknown'
        }

        specsRow += `
                    <div class="spec-value ${file.flagged ? 'flagged' : 'keep'}">
                        ${value}
                    </div>
                `
      })

      specsRow += '</div>'
      specsContainer.innerHTML += specsRow
    })

    // Make sure icons are refreshed
    feather.replace()

    // Show the modal
    this.showModal()

    // Play a sound if available
    if (typeof soundManager !== 'undefined') {
      soundManager.playSound('success')
    }
  }

  /**
   * Generate plausible resolution based on file size
   */
  getResolutionBasedOnSize(size) {
    // Calculate size in MB for easier comparison
    const sizeInMB =
      typeof size === 'number'
        ? size / (1024 * 1024)
        : Number.parseInt(size.replace(/[^0-9.]/g, '')) * (size.toLowerCase().includes('gb') ? 1024 : 1)

    if (sizeInMB > 4000) return '4K (3840x2160)'
    if (sizeInMB > 2000) return '2160p (3840x2160)'
    if (sizeInMB > 1000) return '1080p (1920x1080)'
    if (sizeInMB > 500) return '720p (1280x720)'
    return '480p (854x480)'
  }

  /**
   * Generate plausible codec based on file size
   */
  getCodecBasedOnSize(size) {
    // Calculate size in MB
    const sizeInMB =
      typeof size === 'number'
        ? size / (1024 * 1024)
        : Number.parseInt(size.replace(/[^0-9.]/g, '')) * (size.toLowerCase().includes('gb') ? 1024 : 1)

    // Larger files might use newer codecs that are more efficient
    if (sizeInMB > 4000) return 'AV1'
    if (sizeInMB > 2000) return 'H.265/HEVC'
    if (sizeInMB > 1000) return 'H.264 (High Profile)'
    return 'H.264 (Main Profile)'
  }

  /**
   * Generate plausible bitrate based on file size
   */
  getBitrateBasedOnSize(size) {
    // Calculate size in MB
    const sizeInMB =
      typeof size === 'number'
        ? size / (1024 * 1024)
        : Number.parseInt(size.replace(/[^0-9.]/g, '')) * (size.toLowerCase().includes('gb') ? 1024 : 1)

    if (sizeInMB > 4000) return '20000 kbps'
    if (sizeInMB > 2000) return '15000 kbps'
    if (sizeInMB > 1000) return '8000 kbps'
    if (sizeInMB > 500) return '5000 kbps'
    return '2500 kbps'
  }

  /**
   * Get a random item from an array
   */
  getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * Show the comparison modal
   */
  showModal() {
    this.modalElement.classList.add('visible')
  }

  /**
   * Hide the comparison modal
   */
  hideModal() {
    this.modalElement.classList.remove('visible')
  }
}

// Create a global file comparison instance
const fileComparison = new FileComparison()
