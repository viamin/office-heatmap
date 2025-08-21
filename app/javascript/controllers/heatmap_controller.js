import { Controller } from "@hotwired/stimulus"
import consumer from "../channels/consumer"

// Connects to data-controller="heatmap"
export default class extends Controller {
  static values = {
    imageUrl: String,
    votesUrl: String,
    halfLifeMinutes: { type: Number, default: 30 },
    cutoffMinutes: { type: Number, default: 120 },
    radius: { type: Number, default: 50 }
  }

  connect() {
    this.loadImage().then(() => {
      this.createHeatmap()
      this.addHeaderButtons()
      this.subscribeToChannel()
      this.setupKonamiCode()
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

  addHeaderButtons() {
    // Find the header container
    const header = document.querySelector('h1').parentElement

    // Create button container
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'flex items-center space-x-2'

    // Legend toggle button
    const legendBtn = document.createElement('button')
    legendBtn.className = 'px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors'
    legendBtn.innerHTML = `
      <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>
      Legend
    `
    legendBtn.addEventListener('click', () => this.toggleLegend())

    // Time travel toggle button
    const timeTravelBtn = document.createElement('button')
    timeTravelBtn.className = 'px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors'
    timeTravelBtn.innerHTML = `
      <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
      </svg>
      Time Travel
    `
    timeTravelBtn.addEventListener('click', () => this.toggleTimeTravel())

    buttonContainer.appendChild(legendBtn)
    buttonContainer.appendChild(timeTravelBtn)

    // Insert buttons after the title
    header.appendChild(buttonContainer)

    // Store references
    this.legendBtn = legendBtn
    this.timeTravelBtn = timeTravelBtn
  }

  toggleLegend() {
    if (this.legend && this.legend.style.display !== 'none') {
      this.legend.style.display = 'none'
      this.legendBtn.innerHTML = `
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        Show Legend
      `
    } else {
      if (this.legend) {
        this.legend.style.display = 'block'
      } else {
        this.createLegend()
      }
      this.legendBtn.innerHTML = `
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        Legend
      `
    }
  }

  toggleTimeTravel() {
    if (this.timeSliderContainer && this.timeSliderContainer.style.display !== 'none') {
      this.timeSliderContainer.style.display = 'none'
      this.timeTravelBtn.innerHTML = `
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
        </svg>
        Show Time Travel
      `
    } else {
      if (this.timeSliderContainer) {
        this.timeSliderContainer.style.display = 'block'
      } else {
        this.createTimeSlider()
      }
      this.timeTravelBtn.innerHTML = `
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
        </svg>
        Time Travel
      `
    }
  }

  createHeatmap() {
    console.log("Creating heatmap with image dimensions:", this.image.width, "x", this.image.height)

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
    overlay.style.pointerEvents = "none" // Allow clicks to pass through to image

    container.appendChild(imgEl)
    container.appendChild(overlay)
    this.element.appendChild(container)

    // Add legend by default
    this.createLegend()

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      console.log("Creating custom overlay canvas")

      // Create canvas for custom overlay
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

      // Set up canvas properties
      this.ctx.globalCompositeOperation = 'multiply'
      this.ctx.globalAlpha = 0.6

      console.log("Custom overlay canvas created:", this.canvas)

      // No background overlay - only show vote circles

      // Load votes after canvas is created
      this.loadInitialVotes()
    }, 100)
  }

  createTimeSlider() {
    const sliderContainer = document.createElement("div")
    sliderContainer.className = "fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-40"
    sliderContainer.style.minWidth = "300px"

    sliderContainer.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
          </svg>
          Time Travel
        </h3>
        <div class="flex items-center space-x-2">
          <button class="text-xs text-blue-600 hover:text-blue-800 transition-colors" id="reset-time-btn">
            Reset to Now
          </button>
          <button class="text-xs text-gray-400 hover:text-gray-600 transition-colors" id="hide-time-travel-btn">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex justify-between text-xs text-gray-600">
          <span id="time-display">Now</span>
          <span id="time-offset">0 min</span>
        </div>

        <input
          type="range"
          id="time-slider"
          min="-240"
          max="60"
          value="0"
          step="1"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />

        <div class="flex justify-between text-xs text-gray-500">
          <span>4 hours ago</span>
          <span>1 hour ahead</span>
        </div>
      </div>

      <div class="mt-3 text-xs text-gray-500">
        <div class="flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
          </svg>
          Drag to see vote history and decay
        </div>
      </div>
    `

    document.body.appendChild(sliderContainer)
    this.timeSliderContainer = sliderContainer

    // Set up slider functionality
    const slider = sliderContainer.querySelector('#time-slider')
    const timeDisplay = sliderContainer.querySelector('#time-display')
    const timeOffset = sliderContainer.querySelector('#time-offset')
    const resetBtn = sliderContainer.querySelector('#reset-time-btn')
    const hideBtn = sliderContainer.querySelector('#hide-time-travel-btn')

    // Initialize time state
    this.currentTimeOffset = 0
    this.isTimeTraveling = false

    // Update time display
    const updateTimeDisplay = () => {
      const now = new Date()
      const targetTime = new Date(now.getTime() + (this.currentTimeOffset * 60 * 1000))

      timeDisplay.textContent = targetTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })

      const offsetText = this.currentTimeOffset === 0 ? 'Now' :
        this.currentTimeOffset > 0 ? `+${this.currentTimeOffset} min` :
        `${this.currentTimeOffset} min`
      timeOffset.textContent = offsetText
    }

    // Handle slider input
    slider.addEventListener('input', (e) => {
      this.currentTimeOffset = parseInt(e.target.value)
      this.isTimeTraveling = this.currentTimeOffset !== 0
      updateTimeDisplay()
      this.renderHeatmapAtTime()
    })

    // Handle reset button
    resetBtn.addEventListener('click', () => {
      slider.value = 0
      this.currentTimeOffset = 0
      this.isTimeTraveling = false
      updateTimeDisplay()
      this.renderHeatmapAtTime()
    })

    // Handle hide button
    hideBtn.addEventListener('click', () => {
      this.toggleTimeTravel()
    })

    // Initial display
    updateTimeDisplay()
  }

  renderHeatmapAtTime() {
    if (this.currentVotes) {
      this.renderHeatmap(this.currentVotes, { append: false })
    }
  }

  createLegend() {
    const legend = document.createElement("div")
    legend.className = "fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-40"
    legend.style.maxWidth = "280px"
    legend.style.position = "fixed" // Ensure fixed positioning

    legend.innerHTML = `
      <div class="relative">
        <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          Temperature Legend
        </h3>

        <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors" id="hide-legend-btn">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>

      <div class="space-y-3">
        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700">Too Hot</div>
            <div class="text-xs text-gray-500">Red areas indicate temperature complaints</div>
          </div>
        </div>

        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700">Too Cold</div>
            <div class="text-xs text-gray-500">Blue areas indicate temperature complaints</div>
          </div>
        </div>

        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700">Comfortable</div>
            <div class="text-xs text-gray-500">Green areas indicate comfortable temperatures</div>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-3 mt-3">
          <div class="text-xs text-gray-600 mb-2">Visual Indicators:</div>
          <div class="flex items-center text-xs text-gray-500">
            <div class="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
            <span>Larger circles = more votes</span>
          </div>
          <div class="flex items-center text-xs text-gray-500 mt-1">
            <div class="w-3 h-3 rounded-full border-2 border-gray-400 mr-2"></div>
            <span>Thicker borders = higher activity</span>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-3 mt-3">
          <div class="text-xs text-gray-500">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
              Votes fade over 30 minutes
            </div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(legend)

    // Store reference for cleanup
    this.legend = legend

    // Add hide button functionality
    const hideBtn = legend.querySelector('#hide-legend-btn')
    hideBtn.addEventListener('click', () => {
      this.toggleLegend()
    })
  }

  handleClick(event, container) {
    const rect = container.getBoundingClientRect()
    const scaleX = this.image.width / rect.width
    const scaleY = this.image.height / rect.height

    const x = Math.round((event.clientX - rect.left) * scaleX)
    const y = Math.round((event.clientY - rect.top) * scaleY)

    console.log("Click coordinates:", {
      clientX: event.clientX,
      clientY: event.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      scaleX,
      scaleY,
      finalX: x,
      finalY: y
    })

    this.showVoteModal(x, y)
  }

  showVoteModal(x, y) {
    // Remove any existing modal
    const existingModal = document.querySelector('.vote-modal')
    if (existingModal) {
      existingModal.remove()
    }

    // Create modal backdrop
    const backdrop = document.createElement('div')
    backdrop.className = 'vote-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'

    // Create modal content
    const modal = document.createElement('div')
    modal.className = 'bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl'

    modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 text-center">How does this area feel?</h3>
      <div class="flex flex-col gap-3">
        <button class="vote-btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors" data-value="-1">
          🥶 Too Cold
        </button>
        <button class="vote-btn bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors" data-value="0">
          😊 Comfortable
        </button>
        <button class="vote-btn bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors" data-value="1">
          🥵 Too Hot
        </button>
      </div>
      <button class="cancel-btn mt-4 w-full text-gray-500 hover:text-gray-700 py-2 transition-colors">
        Cancel
      </button>
    `

    backdrop.appendChild(modal)
    document.body.appendChild(backdrop)

    // Handle button clicks
    const voteButtons = modal.querySelectorAll('.vote-btn')
    voteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const value = parseInt(button.dataset.value)
        this.submitVote(x, y, value)
        backdrop.remove()
      })
    })

    // Handle cancel
    const cancelButton = modal.querySelector('.cancel-btn')
    cancelButton.addEventListener('click', () => {
      backdrop.remove()
    })

    // Handle backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.remove()
      }
    })

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        backdrop.remove()
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  }

  submitVote(x, y, value) {
    console.log("Submitting vote:", { x, y, value })

    fetch(this.votesUrlValue, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify({ vote: { x, y, value } })
    }).then(async (res) => {
      console.log("Vote response status:", res.status)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error("Vote error:", data)
        alert(data.error || data.errors?.join(", ") || "Failed to submit vote")
      } else {
        console.log("Vote submitted successfully")
      }
    }).catch(error => {
      console.error("Vote submission error:", error)
      alert("Failed to submit vote")
    })
  }

  async loadInitialVotes() {
    console.log("Loading initial votes from:", this.votesUrlValue)
    try {
      const res = await fetch(this.votesUrlValue, { headers: { Accept: "application/json" } })
      const votes = await res.json()
      console.log("Loaded votes:", votes)
      this.renderHeatmap(votes)
    } catch (error) {
      console.error("Failed to load initial votes:", error)
    }
  }

  subscribeToChannel() {
    console.log("Subscribing to VotesChannel")
    this.subscription = consumer.subscriptions.create({ channel: "VotesChannel" }, {
      connected: () => {
        console.log("Connected to VotesChannel")
      },
      disconnected: () => {
        console.log("Disconnected from VotesChannel")
      },
      received: (data) => {
        console.log("Received vote data:", data)
        this.renderHeatmap([data], { append: true })
      }
    })
  }

  renderHeatmap(votes, { append = false } = {}) {
    console.log("Rendering custom overlay with votes:", votes, "append:", append)

    if (!this.canvas || !this.ctx) {
      console.error("Canvas not available")
      return
    }

    // Calculate the target time based on current time and offset
    const now = Date.now()
    const targetTime = now + (this.currentTimeOffset * 60 * 1000)
    const cutoffMs = this.cutoffMinutesValue * 60 * 1000
    const halfLifeMs = this.halfLifeMinutesValue * 60 * 1000

    // Clear the canvas completely
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Get all votes to render (current + new if appending)
    let allVotes = []
    if (append && this.currentVotes) {
      allVotes = [...this.currentVotes]
    }
    allVotes.push(...votes)

    // Group votes by proximity and aggregate their values
    const voteGroups = this.groupVotesByProximity(allVotes, targetTime, cutoffMs, halfLifeMs)

    // Render aggregated vote groups
    voteGroups.forEach(group => {
      const color = this.getColorForAggregatedVotes(group.totalValue, group.voteCount)
      const intensity = Math.min(1.0, group.totalIntensity)
      const radius = this.radiusValue * (0.5 + (group.voteCount * 0.1)) // Larger radius for more votes

      this.drawAggregatedVoteCircle(group.x, group.y, color, intensity, radius, group.voteCount)
    })

    this.currentVotes = allVotes
    console.log("Custom overlay rendered")
  }

  groupVotesByProximity(votes, targetTime, cutoffMs, halfLifeMs) {
    const groups = []
    const groupRadius = this.radiusValue * 0.8 // Votes within this distance are grouped together

    votes.forEach((vote) => {
      const createdAt = new Date(vote.created_at).getTime()
      const age = targetTime - createdAt
      if (age > cutoffMs) return

      const decay = Math.pow(0.5, age / halfLifeMs)
      const weightedValue = vote.value * decay

      // Find existing group within proximity
      let group = groups.find(g => {
        const distance = Math.sqrt(Math.pow(g.x - vote.x, 2) + Math.pow(g.y - vote.y, 2))
        return distance <= groupRadius
      })

      if (group) {
        // Add to existing group
        group.totalValue += weightedValue
        group.totalIntensity += decay
        group.voteCount += 1
        // Update position to weighted average
        group.x = (group.x * (group.voteCount - 1) + vote.x) / group.voteCount
        group.y = (group.y * (group.voteCount - 1) + vote.y) / group.voteCount
      } else {
        // Create new group
        groups.push({
          x: vote.x,
          y: vote.y,
          totalValue: weightedValue,
          totalIntensity: decay,
          voteCount: 1
        })
      }
    })

    return groups
  }

  getColorForAggregatedVotes(totalValue, voteCount) {
    // Calculate average vote value
    const avgValue = totalValue / voteCount

    if (avgValue < -0.33) {
      return '#1d4ed8' // Blue for predominantly cold
    } else if (avgValue > 0.33) {
      return '#dc2626' // Red for predominantly hot
    } else {
      return '#22c55e' // Green for predominantly comfortable or mixed
    }
  }

  drawAggregatedVoteCircle(x, y, color, intensity, radius, voteCount) {
    const alpha = Math.min(0.8, 0.4 + (intensity * 0.4))

    this.ctx.save()
    this.ctx.globalAlpha = alpha

    // Create gradient for better visual effect
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.7, color + '80') // Semi-transparent
    gradient.addColorStop(1, 'transparent')

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
    this.ctx.fill()

    // Add a subtle border to show vote count
    if (voteCount > 1) {
      this.ctx.globalAlpha = alpha * 0.8
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = Math.min(4, voteCount)
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  setupKonamiCode() {
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'KeyB', 'KeyA'
    ]

    let konamiIndex = 0

    const handleKeydown = (event) => {
      if (event.code === konamiCode[konamiIndex]) {
        konamiIndex++

        if (konamiIndex === konamiCode.length) {
          console.log('Konami code activated! Generating random test votes...')
          this.generateRandomVotes()
          konamiIndex = 0
        }
      } else {
        konamiIndex = 0
      }
    }

    document.addEventListener('keydown', handleKeydown)

    // Store the event listener for cleanup
    this.konamiListener = handleKeydown
  }

  generateRandomVotes() {
    if (!this.image) return

    const numVotes = 50 // Generate 50 random votes
    const testVotes = []

    for (let i = 0; i < numVotes; i++) {
      const x = Math.floor(Math.random() * this.image.width)
      const y = Math.floor(Math.random() * this.image.height)
      const value = Math.random() < 0.33 ? -1 : Math.random() < 0.5 ? 0 : 1 // cold, comfortable, hot

      testVotes.push({
        id: `test-${Date.now()}-${i}`,
        x: x,
        y: y,
        value: value,
        created_at: new Date().toISOString()
      })
    }

    console.log(`Generated ${numVotes} test votes`)
    this.renderHeatmap(testVotes, { append: true })
  }

  disconnect() {
    if (this.subscription) this.subscription.unsubscribe()
    if (this.konamiListener) {
      document.removeEventListener('keydown', this.konamiListener)
    }
    if (this.legend) {
      this.legend.remove()
    }
    if (this.timeSliderContainer) {
      this.timeSliderContainer.remove()
    }
  }
}
