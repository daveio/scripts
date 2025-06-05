'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FilterState, Ticket } from '@/lib/types'
import { AlertTriangle, CheckCircle, ChevronUp, Filter, GitBranch, Search, Tag, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface FilterSidebarProps {
  tickets: Ticket[]
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  isSynthwaveMode?: boolean
}

export function FilterSidebar({ tickets, filters, onFilterChange, isSynthwaveMode = false }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [uniqueProjects, setUniqueProjects] = useState<string[]>([])
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([])
  const [uniquePriorities, setUniquePriorities] = useState<string[]>([])
  const [uniqueLabels, setUniqueLabels] = useState<string[]>([])

  // Extract unique values for filters
  useEffect(() => {
    if (tickets.length === 0) return

    // Extract unique projects
    const projects = [...new Set(tickets.map((t) => t.Project).filter(Boolean))]
    setUniqueProjects(projects)

    // Extract unique statuses
    const statuses = [...new Set(tickets.map((t) => t.Status).filter(Boolean))]
    setUniqueStatuses(statuses)

    // Extract unique priorities
    const priorities = [...new Set(tickets.map((t) => t.Priority).filter(Boolean))]
    setUniquePriorities(priorities)

    // Extract unique labels
    const allLabels = tickets
      .map((t) => t.Labels)
      .filter(Boolean)
      .flatMap((labels) => labels.split(',').map((label) => label.trim()))
      .filter(Boolean)

    const labels = [...new Set(allLabels)]
    setUniqueLabels(labels)
  }, [tickets])

  const toggleFilter = (filterType: keyof FilterState, value: string) => {
    const currentValues = filters[filterType] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    onFilterChange({ [filterType]: newValues })
  }

  const resetFilters = () => {
    onFilterChange({
      projects: [],
      statuses: [],
      priorities: [],
      labels: [],
      searchTerm: '',
      showOnlyParents: false,
      showOnlyChildren: false
    })
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

  return (
    <div
      className={`relative border-r border-border bg-card transition-all duration-300 ${
        isOpen ? 'w-full md:w-72' : 'w-12'
      } ${isSynthwaveMode ? 'neon-border' : ''}`}
    >
      <div
        className={`flex h-14 items-center justify-between border-b border-border px-4 ${isSynthwaveMode ? 'grid-bg' : ''}`}
      >
        {isOpen && (
          <h2 className={`text-lg font-semibold ${isSynthwaveMode ? 'neon-text' : 'text-primary'}`}>Filters</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={`ml-auto ${
            isSynthwaveMode
              ? 'text-cyan-300 hover:bg-cyan-900/30 hover:text-cyan-100 cyberpunk-button'
              : 'text-foreground hover:bg-secondary hover:text-primary'
          }`}
        >
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen && (
        <div className={`p-4 ${isSynthwaveMode ? 'digital-rain' : ''}`}>
          <div className="mb-4">
            <div className="relative">
              <Search
                className={`absolute left-2 top-2.5 h-4 w-4 ${isSynthwaveMode ? 'text-cyan-300' : 'text-muted-foreground'}`}
              />
              <Input
                placeholder="Search tickets..."
                value={filters.searchTerm}
                onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
                className={`pl-8 text-foreground placeholder:text-muted-foreground ${isSynthwaveMode ? 'neon-border' : ''}`}
              />
              {filters.searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute right-1 top-1.5 h-6 w-6 ${
                    isSynthwaveMode
                      ? 'hover:bg-red-900/30 hover:text-red-300'
                      : 'hover:bg-destructive/20 hover:text-destructive'
                  }`}
                  onClick={() => onFilterChange({ searchTerm: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Accordion type="multiple" defaultValue={['projects', 'relationships']} className="space-y-2">
            <AccordionItem value="projects" className={`border-border ${isSynthwaveMode ? 'neon-border' : ''}`}>
              <AccordionTrigger
                className={`py-2 ${
                  isSynthwaveMode ? 'text-cyan-300 hover:text-cyan-100' : 'text-foreground hover:text-primary'
                }`}
              >
                <div className="flex items-center">
                  <Filter className={`mr-2 h-4 w-4 ${isSynthwaveMode ? 'text-cyan-300' : 'text-primary'}`} />
                  Projects
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {uniqueProjects.map((project) => (
                    <div key={project} className="flex items-center space-x-2">
                      <Checkbox
                        id={`project-${project}`}
                        checked={filters.projects.includes(project)}
                        onCheckedChange={() => toggleFilter('projects', project)}
                        className={isSynthwaveMode ? 'border-cyan-500 text-pink-500' : ''}
                      />
                      <Label
                        htmlFor={`project-${project}`}
                        className={`text-sm ${isSynthwaveMode ? 'text-cyan-100' : 'text-foreground'}`}
                      >
                        {project}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="status" className={`border-border ${isSynthwaveMode ? 'neon-border' : ''}`}>
              <AccordionTrigger
                className={`py-2 ${
                  isSynthwaveMode ? 'text-cyan-300 hover:text-cyan-100' : 'text-foreground hover:text-primary'
                }`}
              >
                <div className="flex items-center">
                  <CheckCircle className={`mr-2 h-4 w-4 ${isSynthwaveMode ? 'text-teal-300' : 'text-green-500'}`} />
                  Status
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {uniqueStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={() => toggleFilter('statuses', status)}
                        className={isSynthwaveMode ? 'border-cyan-500 text-pink-500' : ''}
                      />
                      <Label htmlFor={`status-${status}`} className="flex items-center text-sm text-foreground">
                        <Badge className={`mr-2 ${getStatusColor(status)}`}>{status}</Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="priority" className={`border-border ${isSynthwaveMode ? 'neon-border' : ''}`}>
              <AccordionTrigger
                className={`py-2 ${
                  isSynthwaveMode ? 'text-cyan-300 hover:text-cyan-100' : 'text-foreground hover:text-primary'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle className={`mr-2 h-4 w-4 ${isSynthwaveMode ? 'text-pink-300' : 'text-amber-500'}`} />
                  Priority
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {uniquePriorities.map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={filters.priorities.includes(priority)}
                        onCheckedChange={() => toggleFilter('priorities', priority)}
                        className={isSynthwaveMode ? 'border-cyan-500 text-pink-500' : ''}
                      />
                      <Label htmlFor={`priority-${priority}`} className="flex items-center text-sm text-foreground">
                        <Badge className={`mr-2 ${getPriorityColor(priority)}`}>{priority}</Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="labels" className={`border-border ${isSynthwaveMode ? 'neon-border' : ''}`}>
              <AccordionTrigger
                className={`py-2 ${
                  isSynthwaveMode ? 'text-cyan-300 hover:text-cyan-100' : 'text-foreground hover:text-primary'
                }`}
              >
                <div className="flex items-center">
                  <Tag className={`mr-2 h-4 w-4 ${isSynthwaveMode ? 'text-yellow-300' : 'text-yellow-500'}`} />
                  Labels
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div
                  className={`max-h-40 space-y-2 overflow-y-auto rounded-md border border-border ${isSynthwaveMode ? 'neon-border' : 'p-2'}`}
                >
                  {uniqueLabels.map((label) => (
                    <div key={label} className="flex items-center space-x-2">
                      <Checkbox
                        id={`label-${label}`}
                        checked={filters.labels.includes(label)}
                        onCheckedChange={() => toggleFilter('labels', label)}
                        className={isSynthwaveMode ? 'border-cyan-500 text-pink-500' : ''}
                      />
                      <Label
                        htmlFor={`label-${label}`}
                        className={`text-sm ${isSynthwaveMode ? 'text-cyan-100' : 'text-foreground'}`}
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="relationships" className={`border-border ${isSynthwaveMode ? 'neon-border' : ''}`}>
              <AccordionTrigger
                className={`py-2 ${
                  isSynthwaveMode ? 'text-cyan-300 hover:text-cyan-100' : 'text-foreground hover:text-primary'
                }`}
              >
                <div className="flex items-center">
                  <GitBranch className={`mr-2 h-4 w-4 ${isSynthwaveMode ? 'text-purple-300' : 'text-purple-500'}`} />
                  Relationships
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-parents"
                      checked={filters.showOnlyParents}
                      onCheckedChange={(checked) => onFilterChange({ showOnlyParents: !!checked })}
                      className={isSynthwaveMode ? 'border-cyan-500 text-pink-500' : ''}
                    />
                    <Label
                      htmlFor="show-parents"
                      className={`text-sm ${isSynthwaveMode ? 'text-cyan-100' : 'text-foreground'}`}
                    >
                      Show only parent tickets
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-children"
                      checked={filters.showOnlyChildren}
                      onCheckedChange={(checked) => onFilterChange({ showOnlyChildren: !!checked })}
                      className={isSynthwaveMode ? 'border-cyan-500 text-pink-500' : ''}
                    />
                    <Label
                      htmlFor="show-children"
                      className={`text-sm ${isSynthwaveMode ? 'text-cyan-100' : 'text-foreground'}`}
                    >
                      Show only child tickets
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className={`mt-4 w-full ${
              isSynthwaveMode
                ? 'border-red-500 bg-red-900/20 text-red-300 hover:bg-red-900/40 hover:text-red-200 neon-border cyberpunk-button'
                : 'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive'
            }`}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
