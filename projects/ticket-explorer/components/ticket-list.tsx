'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ticket } from '@/lib/types'
import { motion } from 'framer-motion'
import { GitBranch, GitMerge } from 'lucide-react'

interface TicketListProps {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  onTicketSelect: (ticket: Ticket) => void
  isSynthwaveMode?: boolean
}

export function TicketList({ tickets, selectedTicket, onTicketSelect, isSynthwaveMode = false }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={`text-muted-foreground ${isSynthwaveMode ? 'neon-text' : ''}`}>No tickets match your filters.</p>
      </div>
    )
  }

  // Get color for status badge
  const getStatusColor = (status: string) => {
    if (isSynthwaveMode) {
      switch (status.toLowerCase()) {
        case 'backlog':
          return 'bg-purple-900 text-purple-100 badge-glow'
        case 'todo': // trunk-ignore(trunk-toolbox)
          return 'bg-blue-900 text-blue-100 badge-glow'
        case 'in progress':
          return 'bg-pink-900 text-pink-100 badge-glow'
        case 'in review':
          return 'bg-indigo-900 text-indigo-100 badge-glow'
        case 'done':
          return 'bg-teal-900 text-teal-100 badge-glow'
        case 'canceled':
          return 'bg-red-900 text-red-100 badge-glow'
        default:
          return 'bg-gray-900 text-gray-100 badge-glow'
      }
    }

    switch (status.toLowerCase()) {
      case 'backlog':
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'todo': // trunk-ignore(trunk-toolbox)
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'in review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Get color for priority badge
  const getPriorityColor = (priority: string) => {
    if (isSynthwaveMode) {
      switch (priority.toLowerCase()) {
        case 'urgent':
          return 'bg-red-900 text-red-100 badge-glow'
        case 'high':
          return 'bg-orange-900 text-orange-100 badge-glow'
        case 'medium':
          return 'bg-blue-900 text-blue-100 badge-glow'
        case 'low':
          return 'bg-teal-900 text-teal-100 badge-glow'
        default:
          return 'bg-gray-900 text-gray-100 badge-glow'
      }
    }

    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
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
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isSynthwaveMode ? 'neon-text' : 'text-foreground'}`}>
          Tickets{' '}
          <span
            className={`rounded-full px-2 py-1 text-sm ${
              isSynthwaveMode ? 'bg-pink-900/30 text-pink-300 badge-glow' : 'bg-primary/20 text-primary'
            }`}
          >
            {tickets.length}
          </span>
        </h2>
      </div>

      <motion.div
        className="space-y-3"
        variants={isSynthwaveMode ? container : {}}
        initial={isSynthwaveMode ? 'hidden' : ''}
        animate={isSynthwaveMode ? 'show' : ''}
      >
        {tickets.map((ticket, index) => (
          <motion.div
            key={ticket.ID}
            variants={isSynthwaveMode ? item : {}}
            custom={index}
            style={
              isSynthwaveMode
                ? {
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                    position: 'relative',
                    zIndex: 2
                  }
                : {}
            }
            whileHover={
              isSynthwaveMode
                ? {
                    rotateX: 5,
                    rotateY: 5,
                    z: 10,
                    transition: { duration: 0.3 }
                  }
                : {}
            }
            onClick={() => onTicketSelect(ticket)}
            className={`ticket-card cursor-pointer transition-all ${selectedTicket?.ID === ticket.ID ? 'border-primary' : ''} ${isSynthwaveMode ? 'neon-border pointer-events-auto' : ''}`}
          >
            <Card className="transition-all hover:border-primary">
              <CardHeader className={'p-4 pb-2'}>
                <div className={'flex items-start justify-between'}>
                  <CardTitle className={`text-base font-medium ${isSynthwaveMode ? 'neon-text' : 'text-foreground'}`}>
                    <span className={isSynthwaveMode ? 'text-pink-500' : 'text-primary'}>{ticket.ID}</span>{' '}
                    {ticket.Title}
                  </CardTitle>
                  <div className={'flex space-x-2'}>
                    {ticket.Status && <Badge className={`${getStatusColor(ticket.Status)}`}>{ticket.Status}</Badge>}
                    {ticket.Priority && (
                      <Badge className={`${getPriorityColor(ticket.Priority)}`}>{ticket.Priority}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className={'p-4 pt-2'}>
                <div className={'flex flex-wrap items-center gap-2 text-sm'}>
                  {ticket.Project && (
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        isSynthwaveMode
                          ? 'bg-purple-900/50 text-purple-200 holographic'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {ticket.Project}
                    </span>
                  )}
                  {ticket['Parent issue'] && (
                    <span
                      className={`flex items-center text-xs ${
                        isSynthwaveMode ? 'text-pink-300' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <GitMerge className="mr-1 h-3 w-3" />
                      Child of: {ticket['Parent issue']}
                    </span>
                  )}
                  {!ticket['Parent issue'] && tickets.some((t) => t['Parent issue'] === ticket.ID) && (
                    <span
                      className={`flex items-center text-xs ${
                        isSynthwaveMode ? 'text-teal-300' : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      <GitBranch className="mr-1 h-3 w-3" />
                      Parent
                    </span>
                  )}
                  {ticket.Labels && (
                    <div className={'flex flex-wrap gap-1'}>
                      {ticket.Labels.split(',').map((label) => (
                        <Badge
                          key={label.trim()}
                          variant="outline"
                          className={
                            isSynthwaveMode
                              ? 'border-cyan-500 bg-cyan-900/20 text-xs text-cyan-300 badge-glow'
                              : 'border-yellow-500 bg-yellow-100/10 text-xs text-yellow-700 dark:text-yellow-400'
                          }
                        >
                          {label.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
