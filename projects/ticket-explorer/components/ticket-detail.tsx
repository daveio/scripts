"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Ticket } from "@/lib/types";
import {
	ArrowDownRight,
	ArrowUpRight,
	Calendar,
	FileText,
	Tag,
	User,
	Users,
	X,
} from "lucide-react";

interface TicketDetailProps {
	ticket: Ticket;
	allTickets: Ticket[];
	onTicketSelect: (ticket: Ticket) => void;
	isSynthwaveMode?: boolean;
}

export function TicketDetail({
	ticket,
	allTickets,
	onTicketSelect,
	isSynthwaveMode = false,
}: TicketDetailProps) {
	// Find parent ticket
	const parentTicket = ticket["Parent issue"]
		? allTickets.find((t) => t.ID === ticket["Parent issue"])
		: null;

	// Find child tickets
	const childTickets = allTickets.filter(
		(t) => t["Parent issue"] === ticket.ID,
	);

	// Get color for status badge
	const getStatusColor = (status: string) => {
		if (isSynthwaveMode) {
			switch (status.toLowerCase()) {
				case "backlog":
					return "bg-purple-900 text-purple-100 badge-glow";
				case "todo": // trunk-ignore(trunk-toolbox)
					return "bg-blue-900 text-blue-100 badge-glow";
				case "in progress":
					return "bg-pink-900 text-pink-100 badge-glow";
				case "in review":
					return "bg-indigo-900 text-indigo-100 badge-glow";
				case "done":
					return "bg-teal-900 text-teal-100 badge-glow";
				case "canceled":
					return "bg-red-900 text-red-100 badge-glow";
				default:
					return "bg-gray-900 text-gray-100 badge-glow";
			}
		}

		switch (status.toLowerCase()) {
			case "backlog":
				return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
			case "todo": // trunk-ignore(trunk-toolbox)
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
			case "in progress":
				return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
			case "in review":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
			case "done":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
			case "canceled":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

	// Get color for priority badge
	const getPriorityColor = (priority: string) => {
		if (isSynthwaveMode) {
			switch (priority.toLowerCase()) {
				case "urgent":
					return "bg-red-900 text-red-100 badge-glow";
				case "high":
					return "bg-orange-900 text-orange-100 badge-glow";
				case "medium":
					return "bg-blue-900 text-blue-100 badge-glow";
				case "low":
					return "bg-teal-900 text-teal-100 badge-glow";
				default:
					return "bg-gray-900 text-gray-100 badge-glow";
			}
		}

		switch (priority.toLowerCase()) {
			case "urgent":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
			case "high":
				return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
			case "medium":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

	return (
		<div
			className={`h-full overflow-auto bg-background p-4 ${isSynthwaveMode ? "grid-bg" : ""}`}
		>
			<div className="mb-4 flex items-center justify-between">
				<h2
					className={`text-xl font-semibold ${isSynthwaveMode ? "text-primary neon-text" : "text-primary"}`}
				>
					Ticket Details
				</h2>
				<Button
					variant="ghost"
					size="icon"
					className="text-foreground hover:bg-destructive/20 hover:text-destructive"
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			<div className="space-y-6">
				<div>
					<div className="mb-2 flex items-center justify-between">
						<h3
							className={`text-lg font-medium ${isSynthwaveMode ? "text-pink-400" : "text-amber-500"}`}
						>
							{ticket.ID}
						</h3>
						<div className="flex space-x-2">
							{ticket.Status && (
								<Badge className={getStatusColor(ticket.Status)}>
									{ticket.Status}
								</Badge>
							)}
							{ticket.Priority && (
								<Badge className={getPriorityColor(ticket.Priority)}>
									{ticket.Priority}
								</Badge>
							)}
						</div>
					</div>
					<h1
						className={`text-2xl font-bold text-foreground ${isSynthwaveMode ? "neon-text" : ""}`}
					>
						{ticket.Title}
					</h1>
				</div>

				{ticket.Project && (
					<div
						className={`rounded-md p-3 ${
							isSynthwaveMode
								? "border border-purple-500/50 bg-purple-900/20 neon-border"
								: "border border-purple-300/30 bg-purple-100/10 dark:border-purple-500/30 dark:bg-purple-900/10"
						}`}
					>
						<h3
							className={`mb-1 flex items-center text-sm font-medium ${
								isSynthwaveMode
									? "text-purple-300"
									: "text-purple-700 dark:text-purple-400"
							}`}
						>
							<Calendar className="mr-2 h-4 w-4" />
							Project
						</h3>
						<p className="text-foreground">{ticket.Project}</p>
					</div>
				)}

				{ticket.Description && (
					<div>
						<h3
							className={`mb-1 flex items-center text-sm font-medium ${
								isSynthwaveMode ? "text-cyan-300" : "text-primary"
							}`}
						>
							<FileText className="mr-2 h-4 w-4" />
							Description
						</h3>
						<div
							className={`rounded-md border border-border bg-card ${isSynthwaveMode ? "neon-border" : "p-3"}`}
						>
							<p className="whitespace-pre-wrap text-foreground">
								{ticket.Description}
							</p>
						</div>
					</div>
				)}

				{(ticket.Assignee || ticket.Creator) && (
					<div className="grid grid-cols-2 gap-4">
						{ticket.Assignee && (
							<div
								className={`rounded-md p-3 ${
									isSynthwaveMode
										? "border border-teal-500/50 bg-teal-900/20 neon-border"
										: "border border-green-300/30 bg-green-100/10 dark:border-green-500/30 dark:bg-green-900/10"
								}`}
							>
								<h3
									className={`mb-1 flex items-center text-sm font-medium ${
										isSynthwaveMode
											? "text-teal-300"
											: "text-green-700 dark:text-green-400"
									}`}
								>
									<User className="mr-2 h-4 w-4" />
									Assignee
								</h3>
								<p className="text-foreground">{ticket.Assignee}</p>
							</div>
						)}
						{ticket.Creator && (
							<div
								className={`rounded-md p-3 ${
									isSynthwaveMode
										? "border border-yellow-500/50 bg-yellow-900/20 neon-border"
										: "border border-yellow-300/30 bg-yellow-100/10 dark:border-yellow-500/30 dark:bg-yellow-900/10"
								}`}
							>
								<h3
									className={`mb-1 flex items-center text-sm font-medium ${
										isSynthwaveMode
											? "text-yellow-300"
											: "text-yellow-700 dark:text-yellow-400"
									}`}
								>
									<Users className="mr-2 h-4 w-4" />
									Creator
								</h3>
								<p className="text-foreground">{ticket.Creator}</p>
							</div>
						)}
					</div>
				)}

				{ticket.Labels && (
					<div>
						<h3
							className={`mb-1 flex items-center text-sm font-medium ${
								isSynthwaveMode
									? "text-cyan-300"
									: "text-yellow-700 dark:text-yellow-400"
							}`}
						>
							<Tag className="mr-2 h-4 w-4" />
							Labels
						</h3>
						<div className="flex flex-wrap gap-2">
							{ticket.Labels.split(",").map((label) => (
								<Badge
									key={label.trim()}
									className={
										isSynthwaveMode
											? "border-cyan-500 bg-cyan-900/20 text-cyan-300 badge-glow"
											: "border-yellow-500 bg-yellow-100/10 text-yellow-700 dark:text-yellow-400"
									}
								>
									{label.trim()}
								</Badge>
							))}
						</div>
					</div>
				)}

				{parentTicket && (
					<div>
						<h3
							className={`mb-1 flex items-center text-sm font-medium ${
								isSynthwaveMode
									? "text-pink-300"
									: "text-amber-700 dark:text-amber-400"
							}`}
						>
							<ArrowUpRight className="mr-2 h-4 w-4" />
							Parent Issue
						</h3>
						<Card
							className={`cursor-pointer p-3 ${
								isSynthwaveMode
									? "border-pink-500/50 bg-pink-900/20 hover:bg-pink-900/30 neon-border"
									: "border-amber-300/30 bg-amber-100/10 hover:bg-amber-100/20 dark:border-amber-500/30 dark:bg-amber-900/10 dark:hover:bg-amber-900/20"
							}`}
							onClick={() => onTicketSelect(parentTicket)}
						>
							<div className="flex items-center">
								<div>
									<span
										className={`font-medium ${
											isSynthwaveMode
												? "text-pink-300"
												: "text-amber-700 dark:text-amber-400"
										}`}
									>
										{parentTicket.ID}
									</span>{" "}
									- {parentTicket.Title}
								</div>
							</div>
						</Card>
					</div>
				)}

				{childTickets.length > 0 && (
					<div>
						<h3
							className={`mb-1 flex items-center text-sm font-medium ${
								isSynthwaveMode
									? "text-teal-300"
									: "text-green-700 dark:text-green-400"
							}`}
						>
							<ArrowDownRight className="mr-2 h-4 w-4" />
							Child Issues ({childTickets.length})
						</h3>
						<div className="space-y-2">
							{childTickets.map((childTicket) => (
								<Card
									key={childTicket.ID}
									className={`cursor-pointer p-3 ${
										isSynthwaveMode
											? "border-teal-500/50 bg-teal-900/20 hover:bg-teal-900/30 neon-border"
											: "border-green-300/30 bg-green-100/10 hover:bg-green-100/20 dark:border-green-500/30 dark:bg-green-900/10 dark:hover:bg-green-900/20"
									}`}
									onClick={() => onTicketSelect(childTicket)}
								>
									<div className="flex items-center">
										<div>
											<span
												className={`font-medium ${
													isSynthwaveMode
														? "text-teal-300"
														: "text-green-700 dark:text-green-400"
												}`}
											>
												{childTicket.ID}
											</span>{" "}
											- {childTicket.Title}
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
