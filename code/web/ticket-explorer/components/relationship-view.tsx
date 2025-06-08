"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { buildTicketHierarchy } from "@/lib/data-utils"
import type { Ticket } from "@/lib/types"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

interface RelationshipViewProps {
  tickets: Ticket[]
  filteredTickets: Ticket[]
  onTicketSelect: (ticket: Ticket) => void
  isSynthwaveMode?: boolean
}

interface TicketNode {
  ticket: Ticket
  children: TicketNode[]
  level: number
}

export function RelationshipView({
  tickets,
  filteredTickets,
  onTicketSelect,
  isSynthwaveMode = false
}: RelationshipViewProps) {
  const [hierarchyData, setHierarchyData] = useState<TicketNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Build hierarchy from filtered tickets, but include necessary parents
    const hierarchy = buildTicketHierarchy(tickets, filteredTickets)
    setHierarchyData(hierarchy)

    // Auto-expand all nodes initially
    const nodeIds = new Set<string>()
    const collectIds = (nodes: TicketNode[]) => {
      for (const node of nodes) {
        nodeIds.add(node.ticket.ID)
        if (node.children.length > 0) {
          collectIds(node.children)
        }
      }
    }
    collectIds(hierarchy)
    setExpandedNodes(nodeIds)
  }, [tickets, filteredTickets])

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Get color for status badge
  const getStatusColor = (status: string) => {
    if (isSynthwaveMode) {
      switch (status.toLowerCase()) {
        case "backlog":
          return "bg-purple-900 text-purple-100 badge-glow"
        case "todo": // trunk-ignore(trunk-toolbox)
          return "bg-blue-900 text-blue-100 badge-glow"
        case "in progress":
          return "bg-pink-900 text-pink-100 badge-glow"
        case "in review":
          return "bg-indigo-900 text-indigo-100 badge-glow"
        case "done":
          return "bg-teal-900 text-teal-100 badge-glow"
        case "canceled":
          return "bg-red-900 text-red-100 badge-glow"
        default:
          return "bg-gray-900 text-gray-100 badge-glow"
      }
    }

    switch (status.toLowerCase()) {
      case "backlog":
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
      case "todo": // trunk-ignore(trunk-toolbox)
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "in progress":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "in review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  // Get color for priority badge
  const getPriorityColor = (priority: string) => {
    if (isSynthwaveMode) {
      switch (priority.toLowerCase()) {
        case "urgent":
          return "bg-red-900 text-red-100 badge-glow"
        case "high":
          return "bg-orange-900 text-orange-100 badge-glow"
        case "medium":
          return "bg-blue-900 text-blue-100 badge-glow"
        case "low":
          return "bg-teal-900 text-teal-100 badge-glow"
        default:
          return "bg-gray-900 text-gray-100 badge-glow"
      }
    }

    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "high":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  // Get connection line color based on level
  const getConnectionColor = (level: number) => {
    if (isSynthwaveMode) {
      const colors = [
        "border-pink-500",
        "border-cyan-500",
        "border-purple-500",
        "border-yellow-500",
        "border-teal-500",
        "border-red-500"
      ]
      return colors[level % colors.length]
    }

    const colors = [
      "border-blue-500",
      "border-green-500",
      "border-purple-500",
      "border-amber-500",
      "border-yellow-500",
      "border-red-500"
    ]
    return colors[level % colors.length]
  }

  const renderNode = (node: TicketNode) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.ticket.ID)
    const connectionColor = getConnectionColor(node.level)

    return (
      <div key={node.ticket.ID} className="mb-2" style={{ ["--level" as string]: node.level }}>
        <div className="relative ml-[calc(24px*var(--level))] flex items-start">
          {node.level > 0 && (
            <div
              className={`absolute -left-6 top-4 h-8 w-6 border-b border-l ${connectionColor}`}
              style={{ left: "-24px" }}
            />
          )}

          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleNode(node.ticket.ID)}
              className={`mr-2 mt-1.5 flex h-6 w-6 items-center justify-center rounded-sm border text-xs ${
                isSynthwaveMode
                  ? "border-primary bg-primary/20 text-primary hover:bg-primary/30"
                  : "border-border bg-card text-foreground hover:bg-secondary hover:text-primary"
              }`}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {!hasChildren && <div className="mr-2 w-6" />}

          <Card
            className={`ticket-card flex-1 cursor-pointer p-3 transition-all hover:border-primary ${
              isSynthwaveMode ? "neon-border" : ""
            }`}
            onClick={() => onTicketSelect(node.ticket)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`font-medium text-foreground ${isSynthwaveMode ? "neon-text" : ""}`}>
                  <span className="text-primary">{node.ticket.ID}</span> {node.ticket.Title}
                </div>
                {node.ticket.Project && (
                  <div
                    className={`mt-1 text-sm ${
                      isSynthwaveMode ? "text-purple-300" : "text-purple-700 dark:text-purple-400"
                    }`}
                  >
                    {node.ticket.Project}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {node.ticket.Status && (
                  <Badge className={getStatusColor(node.ticket.Status)}>{node.ticket.Status}</Badge>
                )}
                {node.ticket.Priority && (
                  <Badge className={getPriorityColor(node.ticket.Priority)}>{node.ticket.Priority}</Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        {isExpanded && node.children.length > 0 && (
          <div className="mt-2 space-y-2">{node.children.map((child) => renderNode(child))}</div>
        )}
      </div>
    )
  }

  if (hierarchyData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No tickets match your filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h2
          className={`text-xl font-semibold ${
            isSynthwaveMode ? "text-teal-300 neon-text" : "text-green-600 dark:text-green-400"
          }`}
        >
          Relationship View
        </h2>
      </div>

      <div className="space-y-2">{hierarchyData.map((node) => renderNode(node))}</div>
    </div>
  )
}
