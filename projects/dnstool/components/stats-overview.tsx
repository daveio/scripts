import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Activity, Clock, Database, Shield } from "lucide-react";

interface StatsOverviewProps {
	stats: {
		total_queries: number;
		unique_domains: number;
		unique_base_domains: number;
		unique_ips: number;
		source_distribution: Array<{ source: string; count: number }>;
		status_distribution: Array<{ status: string; count: number }>;
		time_range: {
			start: string;
			end: string;
			duration_hours: number;
		};
	};
}

export function StatsOverview({ stats }: StatsOverviewProps) {
	// Calculate blocked percentage
	const totalQueries = stats.total_queries;
	const blockedQueries =
		stats.status_distribution.find((s) => s.status === "blocked")?.count || 0;
	const blockedPercentage =
		totalQueries > 0 ? ((blockedQueries / totalQueries) * 100).toFixed(2) : "0";

	// Format dates
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString();
	};

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">DNS Analysis Overview</h2>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Queries</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.total_queries.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							{stats.unique_domains.toLocaleString()} unique domains
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Blocked Queries
						</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{blockedQueries.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							{blockedPercentage}% of total queries
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Unique Devices
						</CardTitle>
						<Database className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.unique_ips.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							Active network devices
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Time Range</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.time_range.duration_hours.toFixed(2)} hrs
						</div>
						<p className="text-xs text-muted-foreground">
							{formatDate(stats.time_range.start)} -{" "}
							{formatDate(stats.time_range.end)}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Source Distribution</CardTitle>
						<CardDescription>
							Query sources in the analyzed logs
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.source_distribution.map((source) => (
								<div key={source.source} className="flex items-center">
									<div className="w-1/3 font-medium capitalize">
										{source.source}
									</div>
									<div className="w-2/3">
										<div className="flex items-center gap-2">
											<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
												<div
													className="h-full bg-primary progress-bar-width"
													style={{
														width: `${(source.count / stats.total_queries) * 100}%`,
													}}
												/>
											</div>
											<span className="text-sm text-muted-foreground">
												{source.count.toLocaleString()}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Status Distribution</CardTitle>
						<CardDescription>
							Query statuses in the analyzed logs
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.status_distribution.map((status) => (
								<div key={status.status} className="flex items-center">
									<div className="w-1/3 font-medium capitalize">
										{status.status}
									</div>
									<div className="w-2/3">
										<div className="flex items-center gap-2">
											<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
												<div
													className={`h-full ${status.status === "blocked" ? "bg-destructive" : "bg-primary"} progress-bar-width`}
													style={{
														width: `${(status.count / stats.total_queries) * 100}%`,
													}}
												/>
											</div>
											<span className="text-sm text-muted-foreground">
												{status.count.toLocaleString()}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
