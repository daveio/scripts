'use client'

import { useEffect, useRef } from 'react'

interface DigitalRainProps {
  opacity?: number
}

export default function DigitalRain({ opacity = 0.15 }: DigitalRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Initialize canvas
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Characters to use (mix of katakana, numbers, and symbols)
    const characters =
      'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ'

    // Create drops
    const fontSize = 14
    const columns = Math.ceil(canvas.width / fontSize)
    const drops: number[] = []

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -canvas.height)
    }

    // Draw function
    const draw = () => {
      // Semi-transparent black background to create fade effect
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set text style
      ctx.fillStyle = '#0fa'
      ctx.font = `${fontSize}px monospace`

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = characters.charAt(Math.floor(Math.random() * characters.length))

        // Calculate x position
        const x = i * fontSize

        // Calculate y position
        const y = drops[i] * fontSize

        // Calculate opacity based on position (brighter at the head)
        const dropLength = Math.random() * 20 + 10
        const headPosition = drops[i]

        // Only draw if within canvas
        if (y > 0 && y < canvas.height) {
          // Draw the head character with full brightness
          ctx.fillStyle = '#0fa'
          ctx.fillText(char, x, y)

          // Draw trailing characters with decreasing brightness
          for (let j = 1; j < dropLength; j++) {
            if (headPosition - j > 0) {
              const trailY = (headPosition - j) * fontSize
              const opacity = 1 - j / dropLength

              if (trailY > 0 && trailY < canvas.height) {
                const trailChar = characters.charAt(Math.floor(Math.random() * characters.length))
                ctx.fillStyle = `rgba(0, 255, 170, ${opacity * 0.8})`
                ctx.fillText(trailChar, x, trailY)
              }
            }
          }
        }

        // Move drops down
        drops[i]++

        // Reset drop when it reaches bottom or randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = Math.floor(Math.random() * -50)
        }
      }
    }

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      draw()
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [opacity])

  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" style={{ opacity }} />
  )
}
