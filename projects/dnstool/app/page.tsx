"use client";

import { Dashboard } from "@/components/dashboard";
import { Instructions } from "@/components/instructions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Upload } from "@/components/upload";
import type { AnalysisData } from "@/lib/types";
import { useState } from "react";

export default function Home() {
	const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
	const [loading, setLoading] = useState(false);

	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
					<h1 className="text-xl font-bold">DNS Analysis Tool</h1>
					<ThemeToggle />
				</div>
			</header>
			<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{!analysisData ? (
					<>
						<Instructions />
						<Upload
							setAnalysisData={setAnalysisData}
							loading={loading}
							setLoading={setLoading}
						/>
					</>
				) : (
					<Dashboard
						analysisData={analysisData}
						onReset={() => setAnalysisData(null)}
					/>
				)}
			</main>
			<footer className="border-t py-4">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
					DNS Analysis Tool &copy; {new Date().getFullYear()}
				</div>
			</footer>
		</div>
	);
}
