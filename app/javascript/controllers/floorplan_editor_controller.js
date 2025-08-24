import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="floorplan-editor"
export default class extends Controller {
  static values = {
    imageUrl: String,
    thermostatsUrl: String,
    floorplanUrl: String,
    radius: { type: Number, default: 50 }
  }

  connect() {
    this.currentRadius = this.radiusValue
    this.loadImage().then(() => {
      this.createEditor()
      this.createRadiusPanel()
      this.loadThermostats()
    })
  }

  async loadImage() {
    console.log("Loading image from:", this.imageUrlValue)
    return new Promise((resolve) => {
      this.image = new Image()
      this.image.onload = () => {
        console.log("Image loaded, dimensions:", this.image.width, "x", this.image.height)
        resolve()
      }
      this.image.onerror = (error) => {
        console.error("Failed to load image:", error)
        resolve()
      }
      this.image.src = this.imageUrlValue
    })
  }

  createEditor() {
    console.log("Creating floorplan editor with image dimensions:", this.image.width, "x", this.image.height)

    // Create container
    this.element.innerHTML = ""
    const container = document.createElement("div")
    container.style.position = "relative"
    container.style.width = `${this.image.width}px`
    container.style.height = `${this.image.height}px`
    container.style.maxWidth = "100%"
    container.style.overflow = "auto"

    const imgEl = document.createElement("img")
    imgEl.src = this.image.src
    imgEl.style.display = "block"
    imgEl.style.width = "100%"
    imgEl.style.height = "100%"
    imgEl.addEventListener("click", (e) => this.handleClick(e, container))

    const overlay = document.createElement("div")
    overlay.style.position = "absolute"
    overlay.style.left = 0
    overlay.style.top = 0
    overlay.style.width = "100%"
    overlay.style.height = "100%"
    overlay.style.pointerEvents = "none"

    container.appendChild(imgEl)
    container.appendChild(overlay)
    this.element.appendChild(container)

    // Create canvas for preview circles
    setTimeout(() => {
      const canvas = document.createElement('canvas')
      canvas.width = this.image.width
      canvas.height = this.image.height
      canvas.style.position = 'absolute'
      canvas.style.left = '0'
      canvas.style.top = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'

      overlay.appendChild(canvas)

      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
    }, 100)
  }

  createRadiusPanel() {
    const panel = document.createElement("div")
    panel.className = "fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-40"
    panel.style.minWidth = "280px"

    panel.innerHTML = `
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3-8a3 3 0 106 0 3 3 0 00-6 0z" clip-rule="evenodd"></path>
          </svg>
          Vote Circle Size
        </h3>

        <div class="space-y-3">
          <div class="flex justify-between text-sm text-gray-600">
            <span>Radius: <span id="radius-display">${this.currentRadius}</span> pixels</span>
            <button id="preview-btn" class="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
              Preview
            </button>
          </div>

          <input
            type="range"
            id="radius-slider"
            min="10"
            max="200"
            value="${this.currentRadius}"
            step="5"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />

          <div class="flex justify-between text-xs text-gray-500">
            <span>10px</span>
            <span>200px</span>
          </div>

          <button id="save-radius-btn" class="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
            Save Radius Settings
          </button>
        </div>

        <div class="border-t border-gray-200 pt-3">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Thermostat Management</h4>
          <div class="text-xs text-gray-500 space-y-1">
            <div>• Click anywhere to place a thermostat</div>
            <div>• Click existing thermostats to remove them</div>
            <div>• Use the radius slider to see vote circle sizes</div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(panel)
    this.radiusPanel = panel

    // Set up slider functionality
    const slider = panel.querySelector('#radius-slider')
    const display = panel.querySelector('#radius-display')
    const previewBtn = panel.querySelector('#preview-btn')
    const saveBtn = panel.querySelector('#save-radius-btn')

    slider.addEventListener('input', (e) => {
      this.currentRadius = parseInt(e.target.value)
      display.textContent = this.currentRadius
    })

    previewBtn.addEventListener('click', () => {
      this.showRadiusPreview()
    })

    saveBtn.addEventListener('click', () => {
      this.saveRadius()
    })
  }

  handleClick(event, container) {
    const rect = container.getBoundingClientRect()
    const scaleX = this.image.width / rect.width
    const scaleY = this.image.height / rect.height

    const x = Math.round((event.clientX - rect.left) * scaleX)
    const y = Math.round((event.clientY - rect.top) * scaleY)

    console.log("Click coordinates:", { x, y })

    // Check if clicked on existing thermostat
    const clickedThermostat = this.findThermostatAtPosition(x, y)
    if (clickedThermostat) {
      this.removeThermostat(clickedThermostat)
      return
    }

    // Place new thermostat
    this.showThermostatPlacementModal(x, y)
  }

  showRadiusPreview() {
    if (!this.canvas || !this.ctx) return

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw preview circles at several locations
    const previewPoints = [
      { x: this.image.width * 0.2, y: this.image.height * 0.3 },
      { x: this.image.width * 0.7, y: this.image.height * 0.4 },
      { x: this.image.width * 0.4, y: this.image.height * 0.7 }
    ]

    previewPoints.forEach(point => {
      this.drawPreviewCircle(point.x, point.y, this.currentRadius)
    })

    // Clear preview after 3 seconds
    setTimeout(() => {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
    }, 3000)
  }

  drawPreviewCircle(x, y, radius) {
    this.ctx.save()
    this.ctx.globalAlpha = 0.6

    // Create gradient
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, '#3b82f6')
    gradient.addColorStop(0.7, '#3b82f680')
    gradient.addColorStop(1, 'transparent')

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
    this.ctx.fill()

    // Add border
    this.ctx.globalAlpha = 0.8
    this.ctx.strokeStyle = '#3b82f6'
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    this.ctx.restore()
  }

  async saveRadius() {
    try {
      const response = await fetch(this.floorplanUrlValue, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          floorplan: { radius: this.currentRadius }
        })
      })

      if (response.ok) {
        const result = await response.json()
        this.radiusValue = result.radius
        this.showNotification('Radius saved successfully!', 'success')
      } else {
        const error = await response.json()
        this.showNotification(error.errors?.join(', ') || 'Failed to save radius', 'error')
      }
    } catch (error) {
      console.error('Error saving radius:', error)
      this.showNotification('Failed to save radius', 'error')
    }
  }

  showNotification(message, type) {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  // Thermostat functionality
  async loadThermostats() {
    try {
      const response = await fetch(this.thermostatsUrlValue, {
        headers: { Accept: 'application/json' }
      })
      this.thermostats = await response.json()
      console.log('Loaded thermostats:', this.thermostats)
      this.renderThermostats()
    } catch (error) {
      console.error('Failed to load thermostats:', error)
    }
  }

  renderThermostats() {
    // Clear existing thermostat elements
    const existingThermostats = this.element.querySelectorAll('.thermostat-marker')
    existingThermostats.forEach(el => el.remove())

    if (!this.thermostats) return

    this.thermostats.forEach(thermostat => {
      this.drawThermostat(thermostat)
    })
  }

  drawThermostat(thermostat) {
    const container = this.element.querySelector('div[style*="position: relative"]')
    if (!container) return

    const marker = document.createElement('div')
    marker.className = 'thermostat-marker'
    marker.style.cssText = `
      position: absolute;
      left: ${thermostat.x}px;
      top: ${thermostat.y}px;
      width: 40px;
      height: 40px;
      background: white;
      border: 3px solid #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 10;
      transform: translate(-50%, -50%);
    `
    marker.innerHTML = '🌡️'
    marker.title = `${thermostat.name} - Click to remove`
    marker.dataset.thermostatId = thermostat.id
    
    marker.addEventListener('click', (e) => {
      e.stopPropagation()
      this.removeThermostat(thermostat)
    })

    container.appendChild(marker)
  }

  findThermostatAtPosition(x, y) {
    if (!this.thermostats) return null

    const threshold = 30 // pixels
    return this.thermostats.find(thermostat => {
      const distance = Math.sqrt(
        Math.pow(thermostat.x - x, 2) + Math.pow(thermostat.y - y, 2)
      )
      return distance <= threshold
    })
  }

  showThermostatPlacementModal(x, y) {
    const backdrop = document.createElement('div')
    backdrop.className = 'thermostat-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'

    const modal = document.createElement('div')
    modal.className = 'bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl'

    modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 text-center">Place Thermostat</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Thermostat Name</label>
          <input type="text" id="thermostat-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Zone A">
        </div>
        <div class="flex gap-3">
          <button id="place-thermostat" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Place Thermostat
          </button>
          <button id="cancel-placement" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    `

    backdrop.appendChild(modal)
    document.body.appendChild(backdrop)

    const nameInput = modal.querySelector('#thermostat-name')
    const placeButton = modal.querySelector('#place-thermostat')
    const cancelButton = modal.querySelector('#cancel-placement')

    nameInput.focus()

    placeButton.addEventListener('click', async () => {
      const name = nameInput.value.trim()
      if (!name) {
        alert('Please enter a thermostat name')
        return
      }

      await this.createThermostat(x, y, name)
      backdrop.remove()
    })

    cancelButton.addEventListener('click', () => {
      backdrop.remove()
    })

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove()
    })
  }

  removeThermostat(thermostat) {
    const confirmed = confirm(`Remove thermostat "${thermostat.name}"?\n\nThis will delete the thermostat and all its temperature history.`)
    
    if (confirmed) {
      this.deleteThermostat(thermostat.id)
    }
  }

  async createThermostat(x, y, name) {
    try {
      const response = await fetch(this.thermostatsUrlValue, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({
          thermostat: { name, x, y }
        })
      })

      if (response.ok) {
        const newThermostat = await response.json()
        this.thermostats = this.thermostats || []
        this.thermostats.push(newThermostat)
        this.renderThermostats()
        this.showNotification(`Thermostat "${name}" placed successfully!`, 'success')
      } else {
        const error = await response.json()
        this.showNotification(error.errors?.join(', ') || 'Failed to create thermostat', 'error')
      }
    } catch (error) {
      console.error('Error creating thermostat:', error)
      this.showNotification('Failed to create thermostat', 'error')
    }
  }

  async deleteThermostat(thermostatId) {
    try {
      const response = await fetch(`${this.thermostatsUrlValue}/${thermostatId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
      })

      if (response.ok) {
        this.thermostats = this.thermostats.filter(t => t.id !== thermostatId)
        this.renderThermostats()
        this.showNotification('Thermostat removed successfully!', 'success')
      } else {
        this.showNotification('Failed to delete thermostat', 'error')
      }
    } catch (error) {
      console.error('Error deleting thermostat:', error)
      this.showNotification('Failed to delete thermostat', 'error')
    }
  }

  disconnect() {
    if (this.radiusPanel) {
      this.radiusPanel.remove()
    }
    
    const notifications = document.querySelectorAll('.fixed.top-4.right-4')
    notifications.forEach(notification => notification.remove())
    
    const thermostatMarkers = document.querySelectorAll('.thermostat-marker')
    thermostatMarkers.forEach(marker => marker.remove())
  }
}