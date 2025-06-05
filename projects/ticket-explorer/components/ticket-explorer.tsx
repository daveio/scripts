'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAnalytics } from '@/hooks/use-analytics'
import { parseCSV } from '@/lib/data-utils'
import { organizeEpics, parseHighLevelCSV } from '@/lib/high-level-data'
import type { Epic, HighLevelTicket } from '@/lib/high-level-data'
import type { FilterState, Ticket, ViewMode } from '@/lib/types'
import { AlertTriangle, Database, FileText, GitBranch, Layers, Loader2, Power } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EpicTransition } from './epic-transition'
import { EpicView } from './epic-view'
import { FilterSidebar } from './filter-sidebar'
import { HighLevelView } from './high-level-view'
import { KeyboardListener } from './keyboard-listener'
import { ParticleSystem } from './particle-system'
import { RelationshipView } from './relationship-view'
import { SynthwaveBackground } from './synthwave-background'
import { ThemeToggle } from './theme-toggle'
import { TicketDetail } from './ticket-detail'
import { TicketList } from './ticket-list'

// Define the URLs for the data sources
const TICKETS_URL = 'https://data.dave.io/TICKETS.csv'
const HIGH_LEVEL_TICKETS_URL = 'https://data.dave.io/HIGH-LEVEL-TICKETS.csv'

export function TicketExplorer() {
  const analytics = useAnalytics()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [highLevelTickets, setHighLevelTickets] = useState<HighLevelTicket[]>([])
  const [epics, setEpics] = useState<Epic[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCorsError, setIsCorsError] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isSynthwaveMode, setIsSynthwaveMode] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [nextThemeState, setNextThemeState] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    projects: [],
    statuses: [],
    priorities: [],
    labels: [],
    searchTerm: '',
    showOnlyParents: false,
    showOnlyChildren: false
  })

  // Load and parse CSV data
  useEffect(() => {
    // Function to detect if an error is a CORS error - defined inside to avoid dependency issues
    const isCORSError = (error: Error): boolean => {
      // CORS errors typically don't provide much information due to security restrictions
      // We can check for common patterns in error messages or if the error was thrown during a fetch
      return (
        error.message?.includes('CORS') ||
        error.message?.includes('Cross-Origin') ||
        error.name === 'TypeError' ||
        error.message?.includes('Failed to fetch')
      )
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        setIsCorsError(false)

        // Load regular tickets
        let ticketsResponse: Response
        let highLevelTicketsResponse: Response

        try {
          ticketsResponse = await fetch(TICKETS_URL)
        } catch (err: unknown) {
          const error = err as Error
          if (isCORSError(error)) {
            setIsCorsError(true)
            setError(`CORS error when fetching tickets: ${error.message}`)
          } else {
            setError(`Failed to fetch tickets: ${error.message}`)
          }
          setLoading(false)
          return
        }

        if (!ticketsResponse.ok) {
          setError(`Failed to fetch tickets: ${ticketsResponse.status} ${ticketsResponse.statusText}`)
          setLoading(false)
          return
        }

        const csvText = await ticketsResponse.text()
        const parsedTickets = parseCSV(csvText)
        setTickets(parsedTickets)
        setFilteredTickets(parsedTickets)

        // Load high-level tickets
        try {
          highLevelTicketsResponse = await fetch(HIGH_LEVEL_TICKETS_URL)
        } catch (err: unknown) {
          const error = err as Error
          if (isCORSError(error)) {
            setIsCorsError(true)
            setError(`CORS error when fetching high-level tickets: ${error.message}`)
          } else {
            setError(`Failed to fetch high-level tickets: ${error.message}`)
          }
          setLoading(false)
          return
        }

        if (!highLevelTicketsResponse.ok) {
          setError(
            `Failed to fetch high-level tickets: ${highLevelTicketsResponse.status} ${highLevelTicketsResponse.statusText}`
          )
          setLoading(false)
          return
        }

        const highLevelCsvText = await highLevelTicketsResponse.text()
        const highLevelTicketsData = parseHighLevelCSV(highLevelCsvText)
        setHighLevelTickets(highLevelTicketsData)

        // Organize epics
        const organizedEpics = organizeEpics(highLevelTicketsData)
        setEpics(organizedEpics)
      } catch (err: unknown) {
        const error = err as Error
        if (isCORSError(error)) {
          setIsCorsError(true)
          setError(`CORS error: ${error.message}`)
        } else {
          setError(`Failed to load ticket data: ${error.message}`)
        }
        console.error('Error loading CSV:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, []) // No dependencies needed as we only want to run this once

  // Apply filters when they change
  useEffect(() => {
    if (tickets.length === 0) return

    let result = [...tickets]

    // Filter by project
    if (filters.projects.length > 0) {
      result = result.filter((ticket) => filters.projects.includes(ticket.Project))
    }

    // Filter by status
    if (filters.statuses.length > 0) {
      result = result.filter((ticket) => filters.statuses.includes(ticket.Status))
    }

    // Filter by priority
    if (filters.priorities.length > 0) {
      result = result.filter((ticket) => filters.priorities.includes(ticket.Priority))
    }

    // Filter by labels
    if (filters.labels.length > 0) {
      result = result.filter((ticket) => {
        if (!ticket.Labels) return false
        const ticketLabels = ticket.Labels.split(',').map((label) => label.trim())
        return filters.labels.some((label) => ticketLabels.includes(label))
      })
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      result = result.filter(
        (ticket) =>
          ticket.Title.toLowerCase().includes(term) || ticket.Description?.toLowerCase().includes(term) || false
      )
    }

    // Filter by parent/child relationship
    if (filters.showOnlyParents) {
      result = result.filter((ticket) => tickets.some((t) => t['Parent issue'] === ticket.ID))
    }

    if (filters.showOnlyChildren) {
      result = result.filter((ticket) => Boolean(ticket['Parent issue']))
    }

    setFilteredTickets(result)
  }, [tickets, filters])

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => {
      const updatedFilters = { ...prev, ...newFilters }
      analytics.trackFilterChange(updatedFilters)
      return updatedFilters
    })
  }

  // Handle ticket selection
  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    analytics.trackTicketView({
      ticketId: ticket.ID,
      title: ticket.Title,
      status: ticket.Status,
      priority: ticket.Priority
    })
  }

  // Handle cheat code activation - immediately start transition
  const handleCheatCode = () => {
    // Set next theme state first
    setNextThemeState(!isSynthwaveMode)
    // Then immediately start transition
    setIsTransitioning(true)
    analytics.trackThemeChange({
      theme: 'synthwave',
      enabled: !isSynthwaveMode
    })
  }

  // Handle transition completion
  const handleTransitionComplete = () => {
    setIsSynthwaveMode(nextThemeState)
    setIsTransitioning(false)
  }

  // Handle exit synthwave mode
  const handleExitSynthwaveMode = () => {
    setNextThemeState(false)
    setIsTransitioning(true)
    analytics.trackThemeChange({
      theme: 'synthwave',
      enabled: false
    })
  }

  // Track view mode changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    analytics.track('view_mode_change', {
      mode,
      timestamp: new Date().toISOString()
    })
  }

  // Track search when filters change
  useEffect(() => {
    if (filters.searchTerm) {
      analytics.trackSearch(filters.searchTerm, filteredTickets.length)
    }
  }, [filters.searchTerm, filteredTickets.length, analytics])

  // Track errors
  useEffect(() => {
    if (error) {
      analytics.trackError(new Error(error), 'TicketExplorer')
    }
  }, [error, analytics])

  // Retry loading data
  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setIsCorsError(false)
    // Re-trigger the effect by changing a dependency
    // Since we don't have any dependencies in the effect, we'll force a re-render
    setTickets([])
    setHighLevelTickets([])
    setEpics([])
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <span className="text-xl text-foreground">Loading ticket data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">Error Loading Data</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">{error}</p>

              {isCorsError && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm">
                  <h3 className="font-bold">CORS Error Detected</h3>
                  <p className="mt-2">
                    This is likely a Cross-Origin Resource Sharing (CORS) issue. The server at data.dave.io needs to
                    allow requests from your domain.
                  </p>
                  <h4 className="mt-4 font-semibold">Possible solutions:</h4>
                  <ul className="mt-2 list-disc pl-5">
                    <li>
                      Configure the server to add the following header:{' '}
                      <code className="rounded bg-destructive/20 px-1">Access-Control-Allow-Origin: *</code>
                    </li>
                    <li>Create a proxy API route in your Next.js app to fetch the data server-side</li>
                    <li>Host the CSV files on the same domain as this application</li>
                    <li>Use a CORS proxy service (for development only)</li>
                  </ul>
                </div>
              )}

              <Button onClick={handleRetry} className="mt-4">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <>
      <KeyboardListener onCheatCodeActivated={handleCheatCode} />
      <EpicTransition
        isActive={isTransitioning}
        isSynthwave={nextThemeState}
        onTransitionComplete={handleTransitionComplete}
      />

      {isSynthwaveMode && (
        <>
          <SynthwaveBackground />
          <ParticleSystem />
        </>
      )}

      <div
        className={`relative flex h-screen flex-col overflow-hidden bg-background md:flex-row ${
          isSynthwaveMode ? 'synthwave-mode' : ''
        }`}
      >
        <FilterSidebar
          tickets={tickets}
          filters={filters}
          onFilterChange={handleFilterChange}
          isSynthwaveMode={isSynthwaveMode}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className={`relative border-b border-border p-4 ${isSynthwaveMode ? 'grid-bg' : ''}`}>
            <div className="flex items-center justify-between">
              {/* Only show title in synthwave mode */}
              {isSynthwaveMode ? (
                <h1
                  className="text-2xl font-bold text-foreground font-orbitron glitch-text"
                  data-text="Ticket Explorer Pro Ultra Extreme &apos;95"
                >
                  <span className="neon-text">Ticket Explorer</span>{' '}
                  <span className="neon-text-cyan">Pro Ultra Extreme &apos;95</span>
                </h1>
              ) : null}
              <div className="flex items-center space-x-2">
                {/* Show theme toggle in normal mode, exit button in synthwave mode */}
                {isSynthwaveMode ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleExitSynthwaveMode}
                          className="border-red-500 bg-red-900/20 text-red-300 hover:bg-red-900/40 hover:text-red-200 neon-border cyberpunk-button"
                        >
                          <Power className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Exit Synthwave Mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <ThemeToggle />
                )}
                <Tabs defaultValue="list" onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
                  <TabsList className={isSynthwaveMode ? 'neon-border cyberpunk-button' : ''}>
                    <TabsTrigger value="list" className={isSynthwaveMode ? 'text-white' : ''}>
                      <Database className="mr-2 h-4 w-4" />
                      List
                    </TabsTrigger>
                    <TabsTrigger value="relationships" className={isSynthwaveMode ? 'text-white' : ''}>
                      <GitBranch className="mr-2 h-4 w-4" />
                      Relationships
                    </TabsTrigger>
                    <TabsTrigger value="epics" className={isSynthwaveMode ? 'text-white' : ''}>
                      <Layers className="mr-2 h-4 w-4" />
                      Epics
                    </TabsTrigger>
                    <TabsTrigger value="high-level" className={isSynthwaveMode ? 'text-white' : ''}>
                      <FileText className="mr-2 h-4 w-4" />
                      High-Level
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            {isSynthwaveMode && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
            )}
          </div>

          <div className={`relative flex flex-1 overflow-hidden ${isSynthwaveMode ? 'sun-grid' : ''}`}>
            <div className="flex-1 overflow-auto p-4">
              {viewMode === 'list' && (
                <TicketList
                  tickets={filteredTickets}
                  onTicketSelect={handleTicketSelect}
                  selectedTicket={selectedTicket}
                  isSynthwaveMode={isSynthwaveMode}
                />
              )}

              {viewMode === 'relationships' && (
                <RelationshipView
                  tickets={tickets}
                  filteredTickets={filteredTickets}
                  onTicketSelect={handleTicketSelect}
                  isSynthwaveMode={isSynthwaveMode}
                />
              )}

              {viewMode === 'epics' && (
                <EpicView
                  epics={epics}
                  tickets={tickets}
                  onTicketSelect={handleTicketSelect}
                  isSynthwaveMode={isSynthwaveMode}
                />
              )}

              {viewMode === 'high-level' && (
                <HighLevelView
                  highLevelTickets={highLevelTickets}
                  tickets={tickets}
                  onTicketSelect={handleTicketSelect}
                  isSynthwaveMode={isSynthwaveMode}
                />
              )}
            </div>

            {selectedTicket && (
              <div
                className={`relative w-full border-l border-border md:w-1/3 lg:w-2/5 ${isSynthwaveMode ? 'neon-border-cyan' : ''}`}
              >
                <TicketDetail
                  ticket={selectedTicket}
                  allTickets={tickets}
                  onTicketSelect={handleTicketSelect}
                  isSynthwaveMode={isSynthwaveMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
