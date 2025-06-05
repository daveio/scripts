'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Epic } from '@/lib/high-level-data'
import { findEpicRelatedTickets } from '@/lib/high-level-data'
import type { Ticket } from '@/lib/types'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, FileText, Layers } from 'lucide-react'
import { useState } from 'react'

interface EpicViewProps {
  epics: Epic[]
  tickets: Ticket[]
  onTicketSelect: (ticket: Ticket) => void
  isSynthwaveMode?: boolean
}

export function EpicView({ epics, tickets, onTicketSelect, isSynthwaveMode = false }: EpicViewProps) {
  const [expandedEpic, setExpandedEpic] = useState<string | null>(null)

  if (epics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={`text-muted-foreground ${isSynthwaveMode ? 'neon-text' : ''}`}>No epics available.</p>
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isSynthwaveMode ? 'neon-text' : 'text-foreground'}`}>
          Epics{' '}
          <span
            className={`rounded-full px-2 py-1 text-sm ${
              isSynthwaveMode ? 'bg-pink-900/30 text-pink-300 badge-glow' : 'bg-primary/20 text-primary'
            }`}
          >
            {epics.length}
          </span>
        </h2>
      </div>

      <motion.div
        className="space-y-6"
        variants={isSynthwaveMode ? container : {}}
        initial={isSynthwaveMode ? 'hidden' : ''}
        animate={isSynthwaveMode ? 'show' : ''}
      >
        {epics.map((epic) => {
          const relatedTickets = findEpicRelatedTickets(epic, tickets)
          const isExpanded = expandedEpic === epic.ID

          return (
            <motion.div
              key={epic.ID}
              variants={isSynthwaveMode ? item : {}}
              className={`rounded-lg border ${
                isSynthwaveMode ? 'neon-border border-purple-500 bg-purple-900/20' : 'border-border bg-card'
              }`}
            >
              <div
                className={`p-6 ${isSynthwaveMode ? 'grid-bg' : ''}`}
                onClick={() => setExpandedEpic(isExpanded ? null : epic.ID)}
                onKeyUp={(e) => e.key === 'Enter' && setExpandedEpic(isExpanded ? null : epic.ID)}
                onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${isSynthwaveMode ? 'neon-text' : 'text-primary'}`}>
                    {epic.ID}: {epic.Title}
                  </h3>
                  <Badge
                    className={
                      isSynthwaveMode
                        ? 'bg-purple-900 text-purple-100 badge-glow'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }
                  >
                    {epic.Tickets.length} Tickets
                  </Badge>
                </div>

                <p className={`mb-4 ${isSynthwaveMode ? 'text-cyan-100' : 'text-muted-foreground'}`}>
                  {epic.Description}
                </p>

                <div className="flex items-center text-sm">
                  <Clock className={`mr-1 h-4 w-4 ${isSynthwaveMode ? 'text-pink-300' : 'text-muted-foreground'}`} />
                  <span className={isSynthwaveMode ? 'text-pink-300' : 'text-muted-foreground'}>
                    {epic['Time Estimation']}
                  </span>
                </div>

                <Button
                  variant={isSynthwaveMode ? 'outline' : 'ghost'}
                  size="sm"
                  className={`mt-4 ${
                    isSynthwaveMode
                      ? 'border-cyan-500 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/40 hover:text-cyan-200 neon-border-cyan'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedEpic(isExpanded ? null : epic.ID)
                  }}
                >
                  {isExpanded ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>

              {isExpanded && (
                <div className={`border-t ${isSynthwaveMode ? 'border-purple-500/50' : 'border-border'}`}>
                  <div className="p-6">
                    <h4
                      className={`mb-4 text-md font-medium ${isSynthwaveMode ? 'neon-text-cyan' : 'text-foreground'}`}
                    >
                      High-Level Tickets
                    </h4>

                    <Accordion type="single" collapsible className="space-y-2">
                      {epic.Tickets.map((ticket) => (
                        <AccordionItem
                          key={ticket.ID}
                          value={ticket.ID}
                          className={`rounded-md border ${
                            isSynthwaveMode ? 'border-cyan-500/50 bg-cyan-900/10 neon-border-cyan' : 'border-border'
                          }`}
                        >
                          <AccordionTrigger
                            className={`px-4 py-2 ${
                              isSynthwaveMode
                                ? 'text-cyan-300 hover:text-cyan-100'
                                : 'text-foreground hover:text-primary'
                            }`}
                          >
                            <div className="flex items-center">
                              <FileText
                                className={`mr-2 h-4 w-4 ${isSynthwaveMode ? 'text-cyan-300' : 'text-primary'}`}
                              />
                              {ticket.Title}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <p className={`mb-2 ${isSynthwaveMode ? 'text-cyan-100' : 'text-muted-foreground'}`}>
                              {ticket.Description}
                            </p>

                            <div className="mb-4 flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                <Layers
                                  className={`mr-1 h-4 w-4 ${
                                    isSynthwaveMode ? 'text-pink-300' : 'text-muted-foreground'
                                  }`}
                                />
                                <span className={isSynthwaveMode ? 'text-pink-300' : 'text-muted-foreground'}>
                                  {ticket['Story Points'] || 'N/A'} Points
                                </span>
                              </div>
                            </div>

                            {relatedTickets.length > 0 && (
                              <div className="mt-4">
                                <h5
                                  className={`mb-2 text-sm font-medium ${
                                    isSynthwaveMode ? 'text-yellow-300' : 'text-foreground'
                                  }`}
                                >
                                  Related Implementation Tickets
                                </h5>
                                <div className="space-y-2">
                                  {relatedTickets.map((relatedTicket) => (
                                    <button
                                      type="button"
                                      key={relatedTicket.ID}
                                      className={`flex w-full cursor-pointer items-center rounded-md border p-2 text-left ${
                                        isSynthwaveMode
                                          ? 'border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20'
                                          : 'border-border bg-background hover:bg-secondary'
                                      }`}
                                      onClick={() => onTicketSelect(relatedTicket)}
                                    >
                                      <ArrowRight
                                        className={`mr-2 h-4 w-4 ${
                                          isSynthwaveMode ? 'text-yellow-300' : 'text-primary'
                                        }`}
                                      />
                                      <div>
                                        <div
                                          className={`text-sm font-medium ${
                                            isSynthwaveMode ? 'text-yellow-300' : 'text-foreground'
                                          }`}
                                        >
                                          {relatedTicket.ID}: {relatedTicket.Title}
                                        </div>
                                        <div
                                          className={`text-xs ${
                                            isSynthwaveMode ? 'text-yellow-200/70' : 'text-muted-foreground'
                                          }`}
                                        >
                                          {relatedTicket.Status} • {relatedTicket.Priority}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
