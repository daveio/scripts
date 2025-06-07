'use client'

import { track } from '@vercel/analytics'
import { useCallback } from 'react'

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, string | number | boolean>) => {
    track(eventName, properties)
  }, [])

  return {
    trackEvent
  }
}
