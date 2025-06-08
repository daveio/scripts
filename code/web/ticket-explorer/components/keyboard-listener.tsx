"use client"

import { useEffect, useRef } from "react"

interface KeyboardListenerProps {
  onCheatCodeActivated: () => void
}

export function KeyboardListener({ onCheatCodeActivated }: KeyboardListenerProps) {
  const onCheatCodeActivatedRef = useRef(onCheatCodeActivated)
  const keySequenceRef = useRef("")

  // Update the ref when the callback changes
  useEffect(() => {
    onCheatCodeActivatedRef.current = onCheatCodeActivated
  }, [onCheatCodeActivated])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track alphabetic keys
      if (/^[a-z]$/i.test(e.key)) {
        keySequenceRef.current = (keySequenceRef.current + e.key).slice(-5).toLowerCase()

        // Check for the cheat code
        if (keySequenceRef.current === "iddqd") {
          // Use setTimeout to avoid state updates during rendering
          setTimeout(() => {
            onCheatCodeActivatedRef.current()
          }, 0)
          keySequenceRef.current = ""
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, []) // Remove onCheatCodeActivated from dependencies

  return null // This component doesn't render anything
}
