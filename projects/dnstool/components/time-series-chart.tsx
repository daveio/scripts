'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface TimeSeriesChartProps {
  timeSeriesData: {
    hourly_distribution: Array<{ hour: string; count: number }>
    query_type_distribution: Array<{ type: string; count: number }>
  }
}

export function TimeSeriesChart({ timeSeriesData }: TimeSeriesChartProps) {
  // Format hour labels for better display
  const formattedHourlyData = timeSeriesData.hourly_distribution.map((item) => ({
    ...item,
    hour: new Date(item.hour).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }))

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Time Analysis</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Query Volume Over Time</CardTitle>
            <CardDescription>Hourly distribution of DNS queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedHourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Query Types</CardTitle>
            <CardDescription>Distribution by DNS record type</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pie">
              <TabsList className="mb-4">
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              </TabsList>

              <TabsContent value="pie">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeSeriesData.query_type_distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                        label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {timeSeriesData.query_type_distribution.map((entry) => (
                          <Cell
                            key={entry.type}
                            fill={
                              COLORS[
                                timeSeriesData.query_type_distribution.findIndex((e) => e.type === entry.type) %
                                  COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="bar">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSeriesData.query_type_distribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Queries" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
