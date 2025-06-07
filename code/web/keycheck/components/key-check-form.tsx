'use client'

import type React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle2, Copy, KeyRound, Shield } from 'lucide-react'
import { useState } from 'react'

type KeyType = 'PKCS#8' | 'SSH' | 'Unknown' | null

export default function KeyCheckForm() {
  const [privateKey, setPrivateKey] = useState('')
  const [keyType, setKeyType] = useState<KeyType>(null)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  const detectKeyType = (key: string): KeyType => {
    if (!key.trim()) return null

    if (
      key.includes('-----BEGIN PRIVATE KEY-----') ||
      key.includes('-----BEGIN RSA PRIVATE KEY-----') ||
      key.includes('-----BEGIN EC PRIVATE KEY-----')
    ) {
      return 'PKCS#8'
    } else if (key.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
      return 'SSH'
    } else {
      return 'Unknown'
    }
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setPrivateKey(value)
    setKeyType(detectKeyType(value))
    setSubmitted(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const copyWarningMessage = () => {
    const message = "Never share your private keys! They're called 'private' for a reason."
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getKeyTypeColor = () => {
    if (keyType === 'PKCS#8' || keyType === 'SSH') return 'text-green-500'
    if (keyType === 'Unknown') return 'text-yellow-500'
    return ''
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Private Key Validator
        </CardTitle>
        <CardDescription>Paste your private key below to check its format</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Paste your private key here..."
              className="font-mono text-sm h-48"
              value={privateKey}
              onChange={handleKeyChange}
            />
            {keyType && (
              <p className="text-sm">
                Detected format: <span className={getKeyTypeColor()}>{keyType}</span>
              </p>
            )}
          </div>

          {submitted && (
            <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">Wait! Don&apos;t share that!</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  🚨 <strong>Hold up!</strong> Sharing your private key is like giving someone the keys to your house,
                  your car, your safe, AND the password to your dating profile.
                </p>
                <p className="mb-2">
                  Private keys should be kept, well... <em>private</em>. That&apos;s not just clever marketing!
                </p>
                <p>
                  If you&apos;re trying to authenticate with a service, you probably need to share your
                  <strong> public key</strong> instead. The one that starts with &quot;ssh-rsa&quot; or
                  &quot;ssh-ed25519&quot;.
                </p>
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={copyWarningMessage}>
                    {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy warning'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPrivateKey('')
              setKeyType(null)
              setSubmitted(false)
            }}
          >
            Clear
          </Button>
          <Button type="submit" disabled={!privateKey.trim()} className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Check Key
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
