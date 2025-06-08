"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAnalytics } from "@/hooks/use-analytics"
import {
  AlertTriangle,
  Briefcase,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  Search,
  Server,
  Shield,
  Unlock
} from "lucide-react"
import { useEffect, useState } from "react"

type KeyType = "PKCS#8" | "SSH" | "Unknown" | null
type ScanState = "idle" | "scanning" | "analyzing" | "revealing" | "revealed"

export default function KeyCompromiseChecker() {
  const [privateKey, setPrivateKey] = useState("")
  const [keyType, setKeyType] = useState<KeyType>(null)
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [progress, setProgress] = useState(0)
  const [glitchClass, setGlitchClass] = useState("")
  const [scanMessage, setScanMessage] = useState("")
  const [showKeyNotSent, setShowKeyNotSent] = useState(false)
  const [showSystemMessage, setShowSystemMessage] = useState(false)
  const [showDevOpsMessage, setShowDevOpsMessage] = useState(false)
  const { trackEvent } = useAnalytics()

  const detectKeyType = (key: string): KeyType => {
    if (!key.trim()) return null

    if (
      key.includes("-----BEGIN PRIVATE KEY-----") ||
      key.includes("-----BEGIN RSA PRIVATE KEY-----") ||
      key.includes("-----BEGIN EC PRIVATE KEY-----")
    ) {
      return "PKCS#8"
    } else if (key.includes("-----BEGIN OPENSSH PRIVATE KEY-----")) {
      return "SSH"
    } else {
      return "Unknown"
    }
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setPrivateKey(value)
    const detectedType = detectKeyType(value)
    setKeyType(detectedType)
    setScanState("idle")
    setProgress(0)

    if (detectedType) {
      trackEvent("key_type_detected", { type: detectedType })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setScanState("scanning")
    setProgress(0)
    setShowKeyNotSent(false)
    setShowSystemMessage(false)
    setShowDevOpsMessage(false)

    trackEvent("scan_started", { keyType: keyType || "unknown" })

    // Fake scanning messages
    const scanMessages = [
      "Initializing secure connection...",
      "Encrypting transmission channel...",
      "Connecting to breach database...",
      "Searching dark web repositories...",
      "Checking against known leaks...",
      "Analyzing key fingerprint...",
      "Running cryptographic validation...",
      "Cross-referencing with threat intelligence..."
    ]

    let messageIndex = 0
    const messageInterval = setInterval(() => {
      if (messageIndex < scanMessages.length) {
        setScanMessage(scanMessages[messageIndex])
        messageIndex++
      } else {
        clearInterval(messageInterval)
      }
    }, 600)
  }

  useEffect(() => {
    if (scanState === "scanning") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          if (newProgress >= 100) {
            clearInterval(interval)
            setScanState("revealing")
            setGlitchClass("glitch")
            trackEvent("scan_revealing")

            setTimeout(() => {
              setScanState("revealed")
              setGlitchClass("")
              trackEvent("scan_revealed")

              // Set timers for the additional messages
              setTimeout(() => {
                setShowKeyNotSent(true)
                trackEvent("key_not_sent_shown")

                setTimeout(() => {
                  setShowDevOpsMessage(true)
                  trackEvent("devops_message_shown")

                  setTimeout(() => {
                    setShowSystemMessage(true)
                    trackEvent("system_message_shown")
                  }, 2000) // Show system message 2s after DevOps message
                }, 2500) // Show DevOps message 2.5s after key not sent message
              }, 8500) // Show key not sent message 8.5s after reveal
            }, 2000)
            return 100
          }
          return newProgress
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [scanState, trackEvent])

  const getKeyTypeColor = () => {
    if (keyType === "PKCS#8") return "text-emerald-400"
    if (keyType === "SSH") return "text-cyan-400"
    if (keyType === "Unknown") return "text-yellow-400"
    return ""
  }

  const handleCVLinkClick = () => {
    trackEvent("cv_link_clicked")
  }

  return (
    <Card className={`w-full relative overflow-hidden border-cyan-800 bg-gray-900/95 ${glitchClass} z-20`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      <CardHeader className="border-b border-cyan-900">
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Shield className="h-5 w-5 text-purple-400" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-500">
            Scan a private key
          </span>
        </CardTitle>
        <CardDescription className="text-cyan-300">
          Paste your private key to check if it has been exposed in any known data breaches
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {scanState === "idle" && (
            <div className="space-y-2">
              <Textarea
                placeholder="Paste your private key here..."
                className="font-mono text-sm h-48 bg-gray-800 border-cyan-900 text-cyan-100 placeholder:text-cyan-700"
                value={privateKey}
                onChange={handleKeyChange}
              />
              {keyType && (
                <p className="text-sm flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-purple-400" />
                  Detected format: <span className={getKeyTypeColor()}>{keyType}</span>
                </p>
              )}
            </div>
          )}

          {scanState === "scanning" && (
            <div className="space-y-4 py-8">
              <div className="flex justify-center mb-4">
                <div className="relative w-16 h-16">
                  <Search className="w-16 h-16 text-cyan-400 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-center text-lg font-bold text-cyan-300">Scanning Key</h3>
              <p className="text-center text-sm text-cyan-500">{scanMessage}</p>
              <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-linear-to-r from-cyan-500 to-purple-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center text-xs text-cyan-400">Scanning databases ({Math.round(progress)}%)</p>
            </div>
          )}

          {scanState === "revealing" && (
            <div className="space-y-4 py-8 glitch-content">
              <div className="flex justify-center mb-4">
                <Unlock className="w-16 h-16 text-red-500 animate-pulse" />
              </div>
              <h3 className="text-center text-lg font-bold text-red-500 glitch-text">SECURITY ALERT</h3>
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              </div>
            </div>
          )}

          {scanState === "revealed" && (
            <div className="space-y-4 terminal-output">
              <div className="bg-black text-green-500 p-4 font-mono text-sm rounded-md border-2 border-green-500 overflow-hidden shadow-[0_0_15px_rgba(0,255,0,0.5)]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-500">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-xs text-green-400">terminal@security-alert</span>
                </div>
                <p className="mb-2 typewriter-heading flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 shrink-0" />
                  <span className="text-red-500 font-bold">WARNING</span>
                  <AlertTriangle className="h-4 w-4 text-red-500 ml-2 shrink-0" />
                </p>
                <p className="mb-2 typewriter-text typewriter-delay-1 text-cyan-400">
                  This is <span className="text-red-500 font-bold">not</span> actually a key compromise checker. Sharing
                  your private key with <span className="text-yellow-500">ANY</span> service (including this one) would
                  be a <span className="text-red-500 font-bold">MAJOR</span> security risk.
                </p>
                <p className="mb-2 typewriter-text typewriter-delay-2 text-purple-400">
                  Private keys should <span className="text-red-500 font-bold">NEVER</span> be shared with anyone or any
                  service. They are called &quot;
                  <span className="text-green-300">private</span>&quot; for a reason!
                </p>
                <p className="mb-2 typewriter-text typewriter-delay-3 text-cyan-400">
                  If you were about to paste a real private key, please consider:
                </p>
                <ul className="list-disc pl-5 mb-2 typewriter-text typewriter-delay-4 text-yellow-400">
                  <li>Generating a new key pair immediately</li>
                  <li>Revoking any certificates associated with that key</li>
                  <li>Updating your authentication methods anywhere the key was used</li>
                </ul>
                <p className="typewriter-text typewriter-delay-5 text-green-300 font-bold">
                  Remember: The only safe private key is one that stays private.
                </p>

                {/* New prominent message about key not being sent - controlled by state */}
                {showKeyNotSent && (
                  <div className="mt-6 mb-4 p-3 border border-blue-500 bg-blue-900/30 rounded typewriter-text-appear pulse-border">
                    <div className="flex items-start gap-2">
                      <Server className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-bold mb-1">YOUR KEY WAS NOT SENT ANYWHERE</p>
                        <p className="text-blue-200">
                          This app runs entirely in your browser. Your private key was never transmitted to any server.
                        </p>
                        <p className="text-yellow-300 mt-2">
                          <span className="font-bold">BUT...</span> if you entered a real key, you might want to rotate
                          it anyway. After all, I <em>could</em> be lying about this. Trust no one when it comes to
                          private keys!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* DevOps job seeking message - removed border-top */}
                {showDevOpsMessage && (
                  <div className="mt-6 typewriter-text-appear">
                    <div className="p-3 bg-purple-950/30 border border-purple-700 rounded-md">
                      <p className="text-purple-300 font-bold flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-purple-400" />
                        If I might be a bit cheeky...
                      </p>
                      <p className="text-purple-200">
                        I'm a high-level DevOps engineer and team lead looking for remote work. If you're impressed by
                        this little demo and need someone with serious infrastructure skills, my CV is available at:
                      </p>
                      <a
                        href="https://cv.dave.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
                        onClick={handleCVLinkClick}
                      >
                        https://cv.dave.io
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* System message controlled by state */}
                {showSystemMessage && (
                  <div className="mt-4 pt-2 border-t border-green-800 typewriter-text-appear">
                    <p className="text-xs text-green-600">
                      [System]: Connection terminated. Security protocols engaged.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-gray-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPrivateKey("")
              setKeyType(null)
              setScanState("idle")
              setProgress(0)
              setShowKeyNotSent(false)
              setShowSystemMessage(false)
              setShowDevOpsMessage(false)
              trackEvent("form_cleared")
            }}
            className="border-cyan-700 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300"
          >
            Clear
          </Button>
          {scanState === "idle" && (
            <Button
              type="submit"
              disabled={!privateKey.trim()}
              className="bg-linear-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              Check for Compromise
            </Button>
          )}
        </CardFooter>
      </form>

      <style jsx global>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(
              to right,
              rgba(0, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(0, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 20px 20px;
        }

        .glitch {
          animation: glitch 0.5s linear infinite;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }

        @keyframes glitch {
          0% {
            transform: translate(0);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          20% {
            transform: translate(-2px, 2px);
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
          }
          40% {
            transform: translate(-2px, -2px);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          60% {
            transform: translate(2px, 2px);
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
          }
          80% {
            transform: translate(2px, -2px);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          100% {
            transform: translate(0);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
        }

        .glitch-text {
          animation: glitch-text 0.4s linear infinite;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
        }

        @keyframes glitch-text {
          0% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
          }
          30% {
            opacity: 0.6;
            text-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
            transform: skewX(10deg);
          }
          50% {
            opacity: 1;
            text-shadow: 0 0 5px rgba(255, 0, 0, 0.7);
            transform: skewX(0);
          }
          70% {
            opacity: 0.7;
            text-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
            transform: skewX(-10deg);
          }
          100% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
            transform: skewX(0);
          }
        }

        /* Pulsing border animation */
        .pulse-border {
          animation: pulse-border 2s infinite;
        }

        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        /* Scanning line animation */
        .scan-line {
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(256px);
          }
        }

        /* New typewriter animation that allows text wrapping */
        .typewriter-heading {
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid transparent;
          width: 0;
          animation: typing 1s steps(20, end) forwards;
        }

        .typewriter-text {
          position: relative;
          overflow: hidden;
          white-space: normal;
          max-height: 0;
          animation: reveal-text 2s forwards;
        }

        /* New animation for appearing elements */
        .typewriter-text-appear {
          opacity: 0;
          animation: appear 1s forwards;
        }

        @keyframes appear {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reveal-text {
          0% {
            max-height: 0;
            opacity: 0;
          }
          100% {
            max-height: 500px;
            opacity: 1;
          }
        }

        @keyframes typing {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .typewriter-delay-1 {
          animation-delay: 0.5s;
        }

        .typewriter-delay-2 {
          animation-delay: 2.5s;
        }

        .typewriter-delay-3 {
          animation-delay: 4s;
        }

        .typewriter-delay-4 {
          animation-delay: 5s;
        }

        .typewriter-delay-5 {
          animation-delay: 7s;
        }

        .terminal-output {
          position: relative;
          overflow: hidden;
        }

        .terminal-output::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 0, 0.1),
            rgba(0, 255, 0, 0.1) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 1;
          animation: scanline 8s linear infinite;
        }

        @keyframes scanline {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .terminal-output::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.4) 100%
          );
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </Card>
  )
}
