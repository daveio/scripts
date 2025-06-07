'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface EpicTransitionProps {
  isActive: boolean
  isSynthwave: boolean
  onTransitionComplete: () => void
}

export function EpicTransition({ isActive, isSynthwave, onTransitionComplete }: EpicTransitionProps) {
  const [showTransition, setShowTransition] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameIdRef = useRef<number | null>(null)
  const animationObjectsRef = useRef<THREE.Object3D[]>([])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5
    cameraRef.current = camera

    // Renderer setup with performance optimizations
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      precision: 'mediump' // Use medium precision for better performance
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio
    renderer.setClearColor(0x000000, 1) // Set a black background color
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)

      // Store containerRef.current in a variable to avoid the React hooks/exhaustive-deps warning
      const container = containerRef.current
      const renderer = rendererRef.current
      if (container && renderer) {
        container.removeChild(renderer.domElement)
      }

      // Dispose of all animation objects
      for (const object of animationObjectsRef.current) {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              for (const material of object.material) {
                material.dispose()
              }
            } else {
              object.material.dispose()
            }
          }
        }
      }

      if (renderer) renderer.dispose()
    }
  }, [])

  // Handle transition activation
  useEffect(() => {
    if (isActive) {
      setShowTransition(true)
      setupTransitionScene(isSynthwave)

      // Set timeout for transition completion
      const timer = setTimeout(() => {
        setShowTransition(false)
        if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
        onTransitionComplete()
      }, 3000) // Reduced from 5 seconds to 3 seconds for a faster transition

      return () => clearTimeout(timer)
    }
  }, [isActive, isSynthwave, onTransitionComplete])

  // Setup transition scene based on direction
  const setupTransitionScene = (toSynthwave: boolean) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

    // Clear existing scene and animation objects
    while (sceneRef.current.children.length > 0) {
      sceneRef.current.remove(sceneRef.current.children[0])
    }
    animationObjectsRef.current = []

    const scene = sceneRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current

    // Set background color based on transition direction
    if (toSynthwave) {
      renderer.setClearColor(0x120024, 1) // Dark purple background for synthwave
    } else {
      renderer.setClearColor(0x1a1a1a, 1) // Dark gray background for normal mode
    }

    if (toSynthwave) {
      // TO SYNTHWAVE: Create a digital portal effect

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xff00ff, 1)
      directionalLight.position.set(0, 1, 1)
      scene.add(directionalLight)

      // Create a tunnel of neon rings - reduced count for better performance
      const rings: THREE.Mesh[] = []
      const ringCount = 15 // Reduced from 20 to 15

      for (let i = 0; i < ringCount; i++) {
        const geometry = new THREE.TorusGeometry(5, 0.1, 16, 64) // Reduced segments from 100 to 64
        const material = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xff00ff : 0x00ffff,
          emissive: i % 2 === 0 ? 0xff00ff : 0x00ffff,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 1 - i / ringCount
        })

        const ring = new THREE.Mesh(geometry, material)
        ring.position.z = -i * 2
        ring.rotation.x = Math.PI / 2
        scene.add(ring)
        rings.push(ring)
        animationObjectsRef.current.push(ring)
      }

      // Create floating cubes - reduced count for better performance
      const cubes: THREE.Mesh[] = []
      for (let i = 0; i < 30; i++) {
        // Reduced from 50 to 30
        const size = Math.random() * 0.5 + 0.1
        const geometry = new THREE.BoxGeometry(size, size, size)
        const material = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xff00ff : 0x00ffff,
          emissive: Math.random() > 0.5 ? 0xff00ff : 0x00ffff,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.7
        })

        const cube = new THREE.Mesh(geometry, material)
        cube.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, -Math.random() * 40)
        scene.add(cube)
        cubes.push(cube)
        animationObjectsRef.current.push(cube)
      }

      // Create a sun at the end of the tunnel
      const sunGeometry = new THREE.SphereGeometry(3, 32, 32)
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff
      })
      const sun = new THREE.Mesh(sunGeometry, sunMaterial)
      sun.position.z = -50
      scene.add(sun)
      animationObjectsRef.current.push(sun)

      // Animation function
      const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate)

        // Animate camera moving through the tunnel
        camera.position.z -= 0.05

        // Rotate rings
        for (const [i, ring] of rings.entries()) {
          ring.rotation.z += 0.01 * (i % 2 === 0 ? 1 : -1)
        }

        // Animate cubes - only update every other frame for better performance
        if (Date.now() % 2 === 0) {
          for (const cube of cubes) {
            cube.rotation.x += 0.01
            cube.rotation.y += 0.01
          }
        }

        // Make sun pulse
        const time = Date.now() * 0.001
        sun.scale.set(1 + Math.sin(time) * 0.2, 1 + Math.sin(time) * 0.2, 1 + Math.sin(time) * 0.2)

        renderer.render(scene, camera)
      }

      animate()
    } else {
      // FROM SYNTHWAVE: Create a "reality collapse" effect

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      // Create a grid that will collapse
      const gridSize = 20
      const gridGeometry = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2, gridSize, gridSize)
      const gridMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      })

      const grid = new THREE.Mesh(gridGeometry, gridMaterial)
      grid.rotation.x = -Math.PI / 2
      grid.position.y = -2
      scene.add(grid)
      animationObjectsRef.current.push(grid)

      // Create sad emoji
      const emojiGeometry = new THREE.SphereGeometry(1, 32, 32)
      const emojiMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
      const emoji = new THREE.Mesh(emojiGeometry, emojiMaterial)
      emoji.position.z = -3
      scene.add(emoji)
      animationObjectsRef.current.push(emoji)

      // Create sad mouth
      const mouthGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 100, Math.PI)
      const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
      mouth.position.z = -2
      mouth.position.y = -0.3
      mouth.rotation.x = Math.PI
      emoji.add(mouth)
      animationObjectsRef.current.push(mouth)

      // Create eyes
      const eyeGeometry = new THREE.CircleGeometry(0.1, 32)
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      leftEye.position.set(-0.3, 0.3, 1)
      emoji.add(leftEye)
      animationObjectsRef.current.push(leftEye)

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      rightEye.position.set(0.3, 0.3, 1)
      emoji.add(rightEye)
      animationObjectsRef.current.push(rightEye)

      // Create tear drops
      const tearGeometry = new THREE.SphereGeometry(0.05, 16, 16)
      const tearMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
      })

      const leftTear = new THREE.Mesh(tearGeometry, tearMaterial)
      leftTear.position.set(-0.3, 0.1, 1)
      emoji.add(leftTear)
      animationObjectsRef.current.push(leftTear)

      const rightTear = new THREE.Mesh(tearGeometry, tearMaterial)
      rightTear.position.set(0.3, 0.1, 1)
      emoji.add(rightTear)
      animationObjectsRef.current.push(rightTear)

      // Create text
      const textGeometry = new THREE.PlaneGeometry(4, 1)
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      })

      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      textMesh.position.y = 1.5
      textMesh.position.z = -3
      scene.add(textMesh)
      animationObjectsRef.current.push(textMesh)

      // Animation function
      const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate)

        const time = Date.now() * 0.001

        // Make grid collapse - update less frequently for better performance
        if (Date.now() % 2 === 0) {
          const vertices = (gridGeometry.attributes.position as THREE.BufferAttribute).array
          for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i]
            const z = vertices[i + 2]

            // Calculate distance from center
            const distance = Math.sqrt(x * x + z * z)

            // Make vertices fall down over time
            vertices[i + 1] = Math.sin(distance * 0.5 + time) * 0.5 - time * 0.5
          }

          gridGeometry.attributes.position.needsUpdate = true
        }

        // Rotate emoji sadly
        emoji.rotation.z = Math.sin(time * 0.5) * 0.1

        // Animate tears
        leftTear.position.y = 0.1 - (time % 1) * 0.5
        rightTear.position.y = 0.1 - ((time + 0.5) % 1) * 0.5

        // Fade in text
        if (textMaterial.opacity < 1) {
          textMaterial.opacity += 0.005
        }

        renderer.render(scene, camera)
      }

      animate()
    }
  }

  return (
    <AnimatePresence>
      {showTransition && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Overlay text for synthwave transition */}
          {isSynthwave && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-center"
              >
                <h1
                  className="glitch-text mb-4 text-6xl font-bold text-white font-orbitron"
                  data-text="Ticket Explorer Pro Ultra Extreme &apos;95"
                >
                  Ticket Explorer Pro Ultra Extreme &apos;95
                </h1>
                <div className="terminal-text text-2xl text-cyan-300">MAXIMUM OVERDRIVE ENGAGED</div>
              </motion.div>
            </div>
          )}

          {/* Overlay text for normal transition */}
          {!isSynthwave && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-center"
              >
                <h1 className="mb-4 text-4xl font-bold text-gray-300">Back to Boring Reality</h1>
                <p className="text-xl text-gray-400">Fun detected. Eliminating...</p>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1, duration: 1 }}
                  className="mt-4 h-2 bg-gray-300 rounded-full"
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
