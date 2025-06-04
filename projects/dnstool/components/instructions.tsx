"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy, FileDown, Loader2, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

export function Instructions() {
	const [scriptContent, setScriptContent] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchScript() {
			try {
				setIsLoading(true);
				const response = await fetch("/dns-analysis.py");
				if (!response.ok) {
					throw new Error(
						`Failed to load script: ${response.status} ${response.statusText}`,
					);
				}
				const content = await response.text();
				setScriptContent(content);
				setError(null);
			} catch (err) {
				console.error("Error loading script:", err);
				setError(err instanceof Error ? err.message : "Failed to load script");
			} finally {
				setIsLoading(false);
			}
		}

		fetchScript();
	}, []);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const downloadScript = () => {
		const element = document.createElement("a");
		element.setAttribute("href", "/dns-analysis.py");
		element.setAttribute("download", "dns-analysis.py");
		element.style.display = "none";
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	const pythonCommand =
		"python dns-analysis.py --routeros router.log --nextdns nextdns.csv --blocklist blocklist.txt --output analysis.json";

	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle>Getting Started</CardTitle>
				<CardDescription>
					Follow these steps to analyze your DNS logs
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="instructions">
					<TabsList className="mb-4">
						<TabsTrigger value="instructions">Instructions</TabsTrigger>
						<TabsTrigger value="script">Python Script</TabsTrigger>
						<TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
					</TabsList>

					<TabsContent value="instructions" className="space-y-6">
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Important</AlertTitle>
							<AlertDescription>
								You must process your log files locally using the Python script
								before uploading. This tool only accepts the preprocessed JSON
								file.
							</AlertDescription>
						</Alert>

						<ol className="list-decimal pl-5 space-y-2">
							<li>
								<strong>Download the Python script</strong> to your local
								machine
							</li>
							<li>
								<strong>Install dependencies:</strong>{" "}
								<code>pip install rich</code>
							</li>
							<li>
								<strong>Run the script locally</strong> to process your log
								files
							</li>
							<li>
								<strong>Upload the generated JSON file</strong> to this page for
								analysis
							</li>
						</ol>

						<div className="bg-muted p-3 rounded-md flex items-center justify-between">
							<code className="text-sm">{pythonCommand}</code>
							<Button
								variant="outline"
								size="sm"
								onClick={() => copyToClipboard(pythonCommand)}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex gap-2 mt-4">
							<Button variant="outline" onClick={downloadScript}>
								<FileDown className="mr-2 h-4 w-4" />
								Download Script
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									window.open("https://www.python.org/downloads/", "_blank")
								}
							>
								<Terminal className="mr-2 h-4 w-4" />
								Get Python
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="script">
						<div className="relative">
							{isLoading ? (
								<div className="flex items-center justify-center p-8">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
									<span className="ml-2">Loading script...</span>
								</div>
							) : error ? (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							) : (
								<pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs">
									<code>{scriptContent}</code>
								</pre>
							)}
							<div className="absolute top-2 right-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => copyToClipboard(scriptContent)}
									disabled={isLoading || !!error}
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="troubleshooting" className="space-y-4">
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Common Issues</AlertTitle>
							<AlertDescription>
								If you encounter problems running the script, check these common
								issues:
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<h3 className="font-semibold">Missing Dependencies</h3>
							<p>Install required Python packages:</p>
							<div className="bg-muted p-2 rounded-md">
								<code>pip install rich</code>
							</div>
						</div>

						<div className="space-y-2">
							<h3 className="font-semibold">File Path Issues</h3>
							<p>
								Make sure the file paths are correct and the files exist. Use
								absolute paths if needed:
							</p>
							<div className="bg-muted p-2 rounded-md">
								<code>
									python dns-analysis.py --routeros /path/to/router.log
									--nextdns /path/to/nextdns.csv --output analysis.json
								</code>
							</div>
						</div>

						<div className="space-y-2">
							<h3 className="font-semibold">Debug Mode</h3>
							<p>
								Run the script with the --debug flag to see more detailed error
								information:
							</p>
							<div className="bg-muted p-2 rounded-md">
								<code>
									python dns-analysis.py --routeros router.log --nextdns
									nextdns.csv --output analysis.json --debug
								</code>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
