"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  alpha: number
  alphaSpeed: number
}

export function ParticleSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Create particles
    const particles: Particle[] = []
    const particleCount = 100

    const colors = [
      "#ff00ff", // Pink
      "#00ffff", // Cyan
      "#ff00aa", // Magenta
      "#aa00ff", // Purple
      "#00aaff" // Blue
    ]

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
        alphaSpeed: Math.random() * 0.01 + 0.005
      })
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Clear canvas with slight fade effect for trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      for (const particle of particles) {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1
        }

        // Pulse alpha
        particle.alpha += particle.alphaSpeed
        if (particle.alpha > 0.7 || particle.alpha < 0.1) {
          particle.alphaSpeed *= -1
        }

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255)
          .toString(16)
          .padStart(2, "0")}`
        ctx.fill()

        // Draw glow
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3)
        gradient.addColorStop(
          0,
          `${particle.color}${Math.floor(particle.alpha * 0.5 * 255)
            .toString(16)
            .padStart(2, "0")}`
        )
        gradient.addColorStop(1, `${particle.color}00`)

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  // Fixed z-index to ensure it's behind UI elements
  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] pointer-events-none" />
}
