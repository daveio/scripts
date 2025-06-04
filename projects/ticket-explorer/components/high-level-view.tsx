"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HighLevelTicket } from "@/lib/high-level-data";
import { findRelatedTickets } from "@/lib/high-level-data";
import type { Ticket } from "@/lib/types";
import { motion } from "framer-motion";
import { FileCode, FileText, Layers } from "lucide-react";
import { useState } from "react";

interface HighLevelViewProps {
	highLevelTickets: HighLevelTicket[];
	tickets: Ticket[];
	onTicketSelect: (ticket: Ticket) => void;
	isSynthwaveMode?: boolean;
}

export function HighLevelView({
	highLevelTickets,
	tickets,
	onTicketSelect,
	isSynthwaveMode = false,
}: HighLevelViewProps) {
	const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

	if (highLevelTickets.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<p
					className={`text-muted-foreground ${isSynthwaveMode ? "neon-text" : ""}`}
				>
					No high-level tickets available.
				</p>
			</div>
		);
	}

	const container = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	return (
		<div className="space-y-6">
			<div className="mb-4 flex items-center justify-between">
				<h2
					className={`text-xl font-semibold ${isSynthwaveMode ? "neon-text" : "text-foreground"}`}
				>
					High-Level Tickets{" "}
					<span
						className={`rounded-full px-2 py-1 text-sm ${
							isSynthwaveMode
								? "bg-pink-900/30 text-pink-300 badge-glow"
								: "bg-primary/20 text-primary"
						}`}
					>
						{highLevelTickets.length}
					</span>
				</h2>
			</div>

			<motion.div
				className="space-y-4"
				variants={isSynthwaveMode ? container : {}}
				initial={isSynthwaveMode ? "hidden" : ""}
				animate={isSynthwaveMode ? "show" : ""}
			>
				{highLevelTickets.map((ticket) => {
					const relatedTickets = findRelatedTickets(ticket, tickets);
					const isExpanded = expandedTicket === ticket.ID;

					return (
						<motion.div
							key={ticket.ID}
							variants={isSynthwaveMode ? item : {}}
							className={`overflow-hidden rounded-lg border ${
								isSynthwaveMode
									? "neon-border border-cyan-500 bg-cyan-900/20"
									: "border-border bg-card"
							}`}
						>
							<div className={`p-6 ${isSynthwaveMode ? "grid-bg" : ""}`}>
								<div className="mb-2 flex items-center justify-between">
									<div className="flex items-center">
										<FileText
											className={`mr-2 h-5 w-5 ${isSynthwaveMode ? "text-cyan-300" : "text-primary"}`}
										/>
										<h3
											className={`text-lg font-semibold ${isSynthwaveMode ? "neon-text-cyan" : "text-foreground"}`}
										>
											{ticket.ID}: {ticket.Title}
										</h3>
									</div>
									<Badge
										className={
											isSynthwaveMode
												? "bg-cyan-900 text-cyan-100 badge-glow"
												: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
										}
									>
										{ticket.Type}
									</Badge>
								</div>

								<div className="mb-4">
									<p
										className={`${isSynthwaveMode ? "text-cyan-100" : "text-muted-foreground"}`}
									>
										{ticket.Description}
									</p>
								</div>

								<div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
									<div className="flex items-center">
										<Layers
											className={`mr-1 h-4 w-4 ${isSynthwaveMode ? "text-pink-300" : "text-muted-foreground"}`}
										/>
										<span
											className={
												isSynthwaveMode
													? "text-pink-300"
													: "text-muted-foreground"
											}
										>
											{ticket["Story Points"] || "N/A"} Points
										</span>
									</div>

									<Badge
										className={
											isSynthwaveMode
												? "bg-purple-900 text-purple-100 badge-glow"
												: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
										}
									>
										{ticket["Epic ID"]}
									</Badge>
								</div>

								{relatedTickets.length > 0 && (
									<>
										<div className="flex items-center justify-between">
											<h4
												className={`text-sm font-medium ${isSynthwaveMode ? "text-yellow-300" : "text-foreground"}`}
											>
												Implementation Tickets ({relatedTickets.length})
											</h4>

											<Button
												variant={isSynthwaveMode ? "outline" : "ghost"}
												size="sm"
												className={`${
													isSynthwaveMode
														? "border-yellow-500 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/40 hover:text-yellow-200"
														: ""
												}`}
												onClick={() =>
													setExpandedTicket(isExpanded ? null : ticket.ID)
												}
												onKeyUp={(e) =>
													e.key === "Enter" &&
													setExpandedTicket(isExpanded ? null : ticket.ID)
												}
												onKeyDown={(e) => e.key === " " && e.preventDefault()}
											>
												{isExpanded ? "Hide" : "Show"}
											</Button>
										</div>

										{isExpanded && (
											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.3 }}
												className="mt-4 space-y-2"
											>
												{relatedTickets.map((relatedTicket) => (
													<button
														type="button"
														key={relatedTicket.ID}
														className={`flex w-full cursor-pointer items-center rounded-md border p-2 text-left ${
															isSynthwaveMode
																? "border-yellow-500/50 bg-yellow-900/10 hover:bg-yellow-900/20"
																: "border-border bg-background hover:bg-secondary"
														}`}
														onClick={() => onTicketSelect(relatedTicket)}
													>
														<FileCode
															className={`mr-2 h-4 w-4 ${isSynthwaveMode ? "text-yellow-300" : "text-primary"}`}
														/>
														<div>
															<div
																className={`text-sm font-medium ${
																	isSynthwaveMode
																		? "text-yellow-300"
																		: "text-foreground"
																}`}
															>
																{relatedTicket.ID}: {relatedTicket.Title}
															</div>
															<div
																className={`text-xs ${
																	isSynthwaveMode
																		? "text-yellow-200/70"
																		: "text-muted-foreground"
																}`}
															>
																{relatedTicket.Status} •{" "}
																{relatedTicket.Priority}
															</div>
														</div>
													</button>
												))}
											</motion.div>
										)}
									</>
								)}
							</div>
						</motion.div>
					);
				})}
			</motion.div>
		</div>
	);
}
