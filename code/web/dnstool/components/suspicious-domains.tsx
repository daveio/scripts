'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, Search } from 'lucide-react'
import { useState } from 'react'

interface SuspiciousDomainsProps {
  domains: Array<{
    domain: string
    timestamp: string
    source_ip: string
    status: string
    matchedPattern: string
  }>
}

export function SuspiciousDomains({ domains }: SuspiciousDomainsProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter domains based on search term
  const filteredDomains = domains.filter(
    (domain) =>
      domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.source_ip.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suspicious Domains</h2>
        <Badge variant="destructive" className="text-sm">
          <AlertTriangle className="mr-1 h-3 w-3" />
          {domains.length} Suspicious Queries
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Potentially Malicious Domains</CardTitle>
          <CardDescription>Domains that match blocklist patterns but were not blocked</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search input moved outside of CardDescription */}
          <div className="flex items-center mb-4">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains or IP addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Matched Pattern</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.length > 0 ? (
                  filteredDomains.map((domain) => (
                    <TableRow key={`${domain.domain}-${domain.timestamp}-${domain.source_ip}`}>
                      <TableCell className="font-medium">{domain.domain}</TableCell>
                      <TableCell>{domain.source_ip}</TableCell>
                      <TableCell>
                        <Badge variant={domain.status === 'blocked' ? 'outline' : 'destructive'}>{domain.status}</Badge>
                      </TableCell>
                      <TableCell>{formatTimestamp(domain.timestamp)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={domain.matchedPattern}>
                        {domain.matchedPattern}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No suspicious domains found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
