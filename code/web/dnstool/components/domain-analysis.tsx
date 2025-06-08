"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { useState } from "react"

interface DomainAnalysisProps {
  relationships: {
    ip_to_domains: Array<{
      ip: string
      domains: Array<{ domain: string; count: number }>
      total_lookups: number
      unique_domains: number
    }>
    domain_to_ips: Array<{
      domain: string
      ips: Array<{ ip: string; count: number }>
      total_lookups: number
      unique_ips: number
    }>
  }
}

export function DomainAnalysis({ relationships }: DomainAnalysisProps) {
  const [ipSearchTerm, setIpSearchTerm] = useState("")
  const [domainSearchTerm, setDomainSearchTerm] = useState("")
  const [expandedIpRows, setExpandedIpRows] = useState<Record<string, boolean>>({})
  const [expandedDomainRows, setExpandedDomainRows] = useState<Record<string, boolean>>({})

  // Filter IP to domains based on search term
  const filteredIpToDomains = relationships.ip_to_domains.filter((item) =>
    item.ip.toLowerCase().includes(ipSearchTerm.toLowerCase())
  )

  // Filter domain to IPs based on search term
  const filteredDomainToIps = relationships.domain_to_ips.filter((item) =>
    item.domain.toLowerCase().includes(domainSearchTerm.toLowerCase())
  )

  // Toggle expanded state for IP rows
  const toggleIpRowExpanded = (ip: string) => {
    setExpandedIpRows((prev) => ({
      ...prev,
      [ip]: !prev[ip]
    }))
  }

  // Toggle expanded state for domain rows
  const toggleDomainRowExpanded = (domain: string) => {
    setExpandedDomainRows((prev) => ({
      ...prev,
      [domain]: !prev[domain]
    }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Domain Analysis</h2>

      <Tabs defaultValue="ip-to-domains">
        <TabsList>
          <TabsTrigger value="ip-to-domains">Devices to Domains</TabsTrigger>
          <TabsTrigger value="domain-to-ips">Domains to Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="ip-to-domains" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Device to Domain Relationships</CardTitle>
              <CardDescription>Search and filter by IP address</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input moved outside of CardDescription */}
              <div className="flex items-center mb-4">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by IP address..."
                  value={ipSearchTerm}
                  onChange={(e) => setIpSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Top Domains</TableHead>
                      <TableHead className="text-right">Total Lookups</TableHead>
                      <TableHead className="text-right">Unique Domains</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIpToDomains.map((item) => (
                      <TableRow key={item.ip}>
                        <TableCell className="font-medium">{item.ip}</TableCell>
                        <TableCell>
                          <div className={expandedIpRows[item.ip] ? "" : "max-h-24 overflow-auto"}>
                            {(expandedIpRows[item.ip] ? item.domains : item.domains.slice(0, 5)).map((domain) => (
                              <div key={domain.domain} className="text-sm">
                                {domain.domain} <span className="text-muted-foreground">({domain.count})</span>
                              </div>
                            ))}
                            {!expandedIpRows[item.ip] && item.domains.length > 5 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs"
                                onClick={() => toggleIpRowExpanded(item.ip)}
                              >
                                <ChevronDown className="mr-1 h-3 w-3" />
                                Show all {item.domains.length} domains
                              </Button>
                            )}
                            {expandedIpRows[item.ip] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs"
                                onClick={() => toggleIpRowExpanded(item.ip)}
                              >
                                <ChevronUp className="mr-1 h-3 w-3" />
                                Show less
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.total_lookups}</TableCell>
                        <TableCell className="text-right">{item.unique_domains}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain-to-ips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain to Device Relationships</CardTitle>
              <CardDescription>Search and filter by domain name</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input moved outside of CardDescription */}
              <div className="flex items-center mb-4">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by domain..."
                  value={domainSearchTerm}
                  onChange={(e) => setDomainSearchTerm(e.target.value)}
                  className="h-8"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Queried By</TableHead>
                      <TableHead className="text-right">Total Lookups</TableHead>
                      <TableHead className="text-right">Unique Devices</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDomainToIps.map((item) => (
                      <TableRow key={item.domain}>
                        <TableCell className="font-medium">{item.domain}</TableCell>
                        <TableCell>
                          <div className={expandedDomainRows[item.domain] ? "" : "max-h-24 overflow-auto"}>
                            {(expandedDomainRows[item.domain] ? item.ips : item.ips.slice(0, 5)).map((ip) => (
                              <div key={ip.ip} className="text-sm">
                                {ip.ip} <span className="text-muted-foreground">({ip.count})</span>
                              </div>
                            ))}
                            {!expandedDomainRows[item.domain] && item.ips.length > 5 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs"
                                onClick={() => toggleDomainRowExpanded(item.domain)}
                              >
                                <ChevronDown className="mr-1 h-3 w-3" />
                                Show all {item.ips.length} devices
                              </Button>
                            )}
                            {expandedDomainRows[item.domain] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs"
                                onClick={() => toggleDomainRowExpanded(item.domain)}
                              >
                                <ChevronUp className="mr-1 h-3 w-3" />
                                Show less
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.total_lookups}</TableCell>
                        <TableCell className="text-right">{item.unique_ips}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
