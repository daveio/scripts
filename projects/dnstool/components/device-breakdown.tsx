"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { useState } from "react";
import {
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
	YAxis,
} from "recharts";

interface DeviceBreakdownProps {
	devices: Array<{
		ip: string;
		query_count: number;
		unique_domains: number;
		blocked_count: number;
		blocked_percentage: number;
	}>;
}

export function DeviceBreakdown({ devices }: DeviceBreakdownProps) {
	const [searchTerm, setSearchTerm] = useState("");

	// Filter devices based on search term
	const filteredDevices = devices.filter((device) =>
		device.ip.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Sort devices by query count (descending)
	const sortedDevices = [...filteredDevices].sort(
		(a, b) => b.query_count - a.query_count,
	);

	// Prepare data for charts
	const barChartData = sortedDevices.slice(0, 10).map((device) => ({
		name: device.ip,
		queries: device.query_count,
		blocked: device.blocked_count,
	}));

	const pieChartData = [
		{
			name: "Allowed",
			value: devices.reduce(
				(sum, device) => sum + (device.query_count - device.blocked_count),
				0,
			),
		},
		{
			name: "Blocked",
			value: devices.reduce((sum, device) => sum + device.blocked_count, 0),
		},
	];

	const COLORS = ["#10b981", "#ef4444"];

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Device Activity</h2>

			<div className="grid gap-6 md:grid-cols-2">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Query Distribution by Device</CardTitle>
						<CardDescription>Top 10 devices by query volume</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={barChartData}
									margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="name"
										angle={-45}
										textAnchor="end"
										height={70}
									/>
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="queries" name="Total Queries" fill="#3b82f6" />
									<Bar
										dataKey="blocked"
										name="Blocked Queries"
										fill="#ef4444"
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Query Status Distribution</CardTitle>
						<CardDescription>Allowed vs. Blocked queries</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieChartData}
										cx="50%"
										cy="50%"
										labelLine={false}
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
										label={({ name, percent }) =>
											`${name}: ${(percent * 100).toFixed(0)}%`
										}
									>
										{pieChartData.map((entry) => (
											<Cell
												key={entry.name}
												fill={
													COLORS[
														pieChartData.findIndex(
															(e) => e.name === entry.name,
														) % COLORS.length
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Device Details</CardTitle>
						<CardDescription>
							Search and filter devices by IP address
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Search input moved outside of CardDescription */}
						<div className="flex items-center mb-4">
							<Search className="mr-2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by IP address..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="h-8"
							/>
						</div>

						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>IP Address</TableHead>
										<TableHead className="text-right">Queries</TableHead>
										<TableHead className="text-right">Unique Domains</TableHead>
										<TableHead className="text-right">Blocked</TableHead>
										<TableHead className="text-right">Blocked %</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedDevices.map((device) => (
										<TableRow key={device.ip}>
											<TableCell className="font-medium">{device.ip}</TableCell>
											<TableCell className="text-right">
												{device.query_count}
											</TableCell>
											<TableCell className="text-right">
												{device.unique_domains}
											</TableCell>
											<TableCell className="text-right">
												{device.blocked_count}
											</TableCell>
											<TableCell className="text-right">
												{device.blocked_percentage}%
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
