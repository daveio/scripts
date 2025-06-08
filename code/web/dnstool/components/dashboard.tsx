"use client"

import { DeviceBreakdown } from "@/components/device-breakdown"
import { DomainAnalysis } from "@/components/domain-analysis"
import { StatsOverview } from "@/components/stats-overview"
import { SuspiciousDomains } from "@/components/suspicious-domains"
import { TimeSeriesChart } from "@/components/time-series-chart"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AnalysisData } from "@/lib/types"
import { ArrowLeft, Download } from "lucide-react"
import { useState } from "react"

interface DashboardProps {
  analysisData: AnalysisData
  onReset: () => void
}

export function Dashboard({ analysisData, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const downloadJson = () => {
    const dataStr = JSON.stringify(analysisData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileDefaultName = "dns-analysis.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>
        <Button variant="outline" onClick={downloadJson}>
          <Download className="mr-2 h-4 w-4" />
          Download JSON
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 px-1">
          <StatsOverview stats={analysisData.stats} />
        </TabsContent>

        <TabsContent value="devices" className="mt-6 px-1">
          <DeviceBreakdown devices={analysisData.devices.devices} />
        </TabsContent>

        <TabsContent value="domains" className="mt-6 px-1">
          <DomainAnalysis relationships={analysisData.relationships} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6 px-1">
          <TimeSeriesChart timeSeriesData={analysisData.time_series} />
        </TabsContent>

        <TabsContent value="suspicious" className="mt-6 px-1">
          <SuspiciousDomains domains={analysisData.suspicious_domains} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
