import { Controller } from "@hotwired/stimulus"
import h337 from "heatmap.js"

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
      this.loadInitialVotes()
      this.subscribeToChannel()
    })
  }

  disconnect() {
    if (this.subscription) this.subscription.unsubscribe()
  }

  async loadImage() {
    return new Promise((resolve) => {
      this.image = new Image()
      this.image.onload = resolve
      this.image.src = this.imageUrlValue
    })
  }

  createHeatmap() {
    // Create container
    this.element.innerHTML = ""
    const container = document.createElement("div")
    container.style.position = "relative"
    container.style.width = `${this.image.width}px`
    container.style.height = `${this.image.height}px`

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
    overlay.style.right = 0
    overlay.style.bottom = 0

    container.appendChild(imgEl)
    container.appendChild(overlay)
    this.element.appendChild(container)

    this.heatmap = h337.create({
      container: overlay,
      radius: this.radiusValue,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      gradient: {
        0.0: "#1d4ed8", // blue
        0.5: "#9ca3af", // gray
        1.0: "#dc2626"  // red
      }
    })
  }

  handleClick(event, container) {
    const rect = container.getBoundingClientRect()
    const x = Math.round((event.clientX - rect.left))
    const y = Math.round((event.clientY - rect.top))

    // Simple prompt for value for now; replace with UI buttons
    const choice = window.prompt("How do you feel? (cold/comfortable/hot)")
    const map = { cold: -1, comfortable: 0, hot: 1 }
    const value = map[choice]
    if (value === undefined) return

    fetch(this.votesUrlValue, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ vote: { x, y, value } })
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || data.errors?.join(", ") || "Failed to submit vote")
      }
    })
  }

  async loadInitialVotes() {
    const res = await fetch(this.votesUrlValue, { headers: { Accept: "application/json" } })
    const votes = await res.json()
    this.renderHeatmap(votes)
  }

  subscribeToChannel() {
    import("../channels/consumer").then(({ default: consumer }) => {
      this.subscription = consumer.subscriptions.create({ channel: "VotesChannel" }, {
        received: (data) => {
          this.renderHeatmap([data], { append: true })
        }
      })
    })
  }

  renderHeatmap(votes, { append = false } = {}) {
    const now = Date.now()
    const cutoffMs = this.cutoffMinutesValue * 60 * 1000
    const halfLifeMs = this.halfLifeMinutesValue * 60 * 1000

    const points = (append && this.currentPoints ? this.currentPoints : [])
    const baseTime = now

    // Filter and map votes with decay
    votes.forEach((v) => {
      const createdAt = new Date(v.created_at).getTime()
      const age = baseTime - createdAt
      if (age > cutoffMs) return
      const decay = Math.pow(0.5, age / halfLifeMs)
      const weight = v.value * decay
      // heatmap.js expects positive values; shift by +1 and scale
      const intensity = (weight + 1) / 2 // maps [-1,1] -> [0,1]
      points.push({ x: v.x, y: v.y, value: intensity })
    })

    this.currentPoints = points.filter((p) => p.value > 0.01)
    const max = 1
    this.heatmap.setData({ max, data: this.currentPoints })
  }
}
