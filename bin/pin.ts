#!/usr/bin/env -S bun --enable-source-maps
import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { Command } from "commander";
import * as yaml from "js-yaml";

const execAsync = promisify(exec);

// Function to generate timestamp string in YYYY-MM-DD_HH-MM-SS format
function getTimestamp(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}
const _MAX_CONCURRENCY = 5;

// Type definitions
interface ActionUpdate {
	actionPath: string;
	oldRef: string;
	newRef: string;
}

interface WorkflowUpdate {
	filePath: string;
	relativePath: string;
	updates: ActionUpdate[];
}

interface RepoUpdate {
	repoName: string;
	workflowUpdates: WorkflowUpdate[];
}

interface ProcessingSummary {
	repoUpdates: RepoUpdate[];
	errors: string[];
	totalReposProcessed: number;
	totalFilesProcessed: number;
	totalActionsUpdated: number;
}

interface RepoMetadata {
	defaultBranch: string;
	latestCommit: string;
}

interface GitHubRepoCache {
	[repoKey: string]: RepoMetadata;
}

// Find all repositories in a directory
function findRepositories(rootDir: string): string[] {
	const repos: string[] = [];

	try {
		const entries = fs.readdirSync(rootDir, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory() && !entry.name.startsWith(".")) {
				const repoPath = path.join(rootDir, entry.name);

				// Check if it's a git repository
				if (fs.existsSync(path.join(repoPath, ".git"))) {
					repos.push(repoPath);
				}
			}
		}
	} catch (error) {
		console.error(
			`Error reading directory ${rootDir}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	return repos;
}

// Extract all unique GitHub repositories from workflow files
function extractUniqueRepos(repositoriesToProcess: string[]): Set<string> {
	const uniqueRepos = new Set<string>();

	for (const repoPath of repositoriesToProcess) {
		const workflowsDir = path.join(repoPath, ".github", "workflows");
		if (!fs.existsSync(workflowsDir)) continue;

		const workflowFiles: string[] = [];
		const dirEntries = fs.readdirSync(workflowsDir, { withFileTypes: true });

		for (const entry of dirEntries) {
			if (
				entry.isFile() &&
				(entry.name.endsWith(".yml") || entry.name.endsWith(".yaml"))
			) {
				workflowFiles.push(path.join(workflowsDir, entry.name));
			}
		}

		for (const filePath of workflowFiles) {
			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const workflowYaml = yaml.load(content) as Record<string, unknown>;

				// Extract action references from the YAML
				const extractReposFromNode = (
					node: Record<string, unknown> | unknown[] | unknown,
				): void => {
					if (!node || typeof node !== "object") return;

					if (Array.isArray(node)) {
						for (const item of node) {
							extractReposFromNode(item);
						}
						return;
					}

					for (const key in node as Record<string, unknown>) {
						const typedNode = node as Record<string, unknown>;
						if (key === "uses" && typeof typedNode[key] === "string") {
							const actionRef = (typedNode[key] as string).trim();

							// Skip Docker references and local references
							if (
								actionRef.startsWith("./") ||
								actionRef.startsWith("docker://")
							)
								continue;

							// Check if reference contains a version/commit
							if (actionRef.includes("@")) {
								const splitResult = actionRef.split("@");
								if (
									splitResult.length < 2 ||
									!splitResult[0] ||
									!splitResult[1]
								)
									continue;

								const actionPath = splitResult[0];
								const repoPathParts = actionPath.split("/");
								if (repoPathParts.length < 2) continue;

								const owner = repoPathParts[0];
								const repo = repoPathParts[1];
								const fullRepo = `${owner}/${repo}`;
								uniqueRepos.add(fullRepo);
							}
						} else {
							extractReposFromNode(typedNode[key]);
						}
					}
				};

				extractReposFromNode(workflowYaml);
			} catch (error) {
				console.error(`Error reading workflow file ${filePath}: ${error}`);
			}
		}
	}

	return uniqueRepos;
}

// Build cache of repository metadata using GitHub GraphQL API
async function buildRepoCache(
	uniqueRepos: Set<string>,
): Promise<GitHubRepoCache> {
	const cache: GitHubRepoCache = {};

	console.log(
		`🔍 Fetching metadata for ${uniqueRepos.size} unique repositories using GraphQL...`,
	);

	// Get GitHub token
	const { stdout: token } = await execAsync("gh auth token");
	const githubToken = token.trim();

	// Convert set to array and split into batches (GraphQL has query size limits)
	const repoArray = Array.from(uniqueRepos);
	const batchSize = 50; // Conservative batch size to avoid query limits
	const batches = [];

	for (let i = 0; i < repoArray.length; i += batchSize) {
		batches.push(repoArray.slice(i, i + batchSize));
	}

	console.log(`  📦 Processing ${batches.length} batch(es) of repositories...`);

	for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
		const batch = batches[batchIndex];
		console.log(
			`  🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} repositories)...`,
		);

		try {
			// Build GraphQL query for this batch
			const repositoryQueries = batch
				.map((fullRepo, index) => {
					const [owner, name] = fullRepo.split("/");
					return `
          repo${index}: repository(owner: "${owner}", name: "${name}") {
            nameWithOwner
            defaultBranchRef {
              name
              target {
                ... on Commit {
                  oid
                }
              }
            }
          }`;
				})
				.join("\n");

			const query = `
        query {
          ${repositoryQueries}
        }`;

			// Execute GraphQL query
			const graphqlPayload = JSON.stringify({ query });
			const { stdout } = await execAsync(
				`curl -s -H "Authorization: bearer ${githubToken}" -H "Content-Type: application/json" -X POST -d '${graphqlPayload.replace(/'/g, "'\\''")}' https://api.github.com/graphql`,
			);

			const response = JSON.parse(stdout);

			if (response.errors) {
				console.error(`  ❌ GraphQL errors in batch ${batchIndex + 1}:`);
				console.error(response.errors);
				continue;
			}

			// Process the response data
			const data = response.data;
			let successCount = 0;

			for (let i = 0; i < batch.length; i++) {
				const fullRepo = batch[i];
				const repoData = data[`repo${i}`];

				if (repoData?.defaultBranchRef?.target) {
					const defaultBranch = repoData.defaultBranchRef.name;
					const latestCommit = repoData.defaultBranchRef.target.oid;

					cache[fullRepo] = {
						defaultBranch,
						latestCommit,
					};

					console.log(
						`    ✓ Cached ${fullRepo}: ${defaultBranch}@${latestCommit.substring(0, 8)}...`,
					);
					successCount++;
				} else {
					console.log(
						`    ❌ Failed to get data for ${fullRepo} (repository may not exist or be accessible)`,
					);
				}
			}

			console.log(
				`  📊 Batch ${batchIndex + 1} completed: ${successCount}/${batch.length} repositories cached`,
			);
		} catch (error) {
			console.error(`  ❌ Failed to process batch ${batchIndex + 1}: ${error}`);

			// Fallback to individual REST API calls for this batch
			console.log(
				`  🔄 Falling back to individual REST calls for batch ${batchIndex + 1}...`,
			);
			for (const fullRepo of batch) {
				try {
					const { stdout: branchStdout } = await execAsync(
						`gh repo view ${fullRepo} --json defaultBranchRef -q .defaultBranchRef.name`,
					);
					const defaultBranch = branchStdout.trim();

					const { stdout: commitStdout } = await execAsync(
						`gh api repos/${fullRepo}/commits/${defaultBranch} --jq .sha`,
					);
					const latestCommit = commitStdout.trim();

					cache[fullRepo] = {
						defaultBranch,
						latestCommit,
					};

					console.log(
						`    ✓ Cached ${fullRepo}: ${defaultBranch}@${latestCommit.substring(0, 8)}... (REST fallback)`,
					);
				} catch (restError) {
					console.error(
						`    ❌ Failed to fetch ${fullRepo} via REST: ${restError}`,
					);
				}
			}
		}
	}

	console.log(
		`📦 Built cache for ${Object.keys(cache).length}/${uniqueRepos.size} repositories\n`,
	);

	return cache;
}

// Main function to coordinate the entire process
async function main() {
	console.log(
		"🔍 Finding repositories and updating GitHub Action workflows...",
	);
	// Set up command-line interface using Commander
	const program = new Command();
	program
		.name("pin")
		.description(
			"Find repositories and update GitHub Action workflows to specific commit SHAs",
		)
		.argument("[directory]", "specific repository directory to process")
		.parse();

	// Determine what to process
	let repositoriesToProcess: string[] = [];

	if (program.args[0]) {
		// Process specific directory
		const targetPath = path.resolve(program.args[0]);

		if (!fs.existsSync(targetPath)) {
			console.error(`❌ Directory not found: ${targetPath}`);
			process.exit(1);
		}

		// Check if it's a repository itself
		if (fs.existsSync(path.join(targetPath, ".git"))) {
			repositoriesToProcess = [targetPath];
		} else {
			console.error(`❌ Not a git repository: ${targetPath}`);
			process.exit(1);
		}
	} else {
		// Process all subdirectories of the default path
		const defaultPath = "/Users/dave/src/github.com/daveio";
		console.log(`🔍 Scanning for repositories in: ${defaultPath}`);
		repositoriesToProcess = findRepositories(defaultPath);
	}

	if (repositoriesToProcess.length === 0) {
		console.log("No repositories found to process");
		return;
	}

	console.log(
		`Found ${repositoriesToProcess.length} repository(ies) to process\n`,
	);

	// Extract unique repositories from all workflow files and build cache
	const uniqueRepos = extractUniqueRepos(repositoriesToProcess);
	const repoCache = await buildRepoCache(uniqueRepos);

	const homeDir = process.env.HOME || "~";
	const backupRoot = path.join(homeDir, ".actions-backups");
	// Ensure backup root directory exists
	if (!fs.existsSync(backupRoot)) {
		fs.mkdirSync(backupRoot, { recursive: true });
	}

	// Create timestamped directory for this run
	const timestamp = getTimestamp();
	const backupDir = path.join(backupRoot, timestamp);
	fs.mkdirSync(backupDir, { recursive: true });

	console.log(`🕒 Creating backups in timestamped directory: ${backupDir}`);

	const summary: ProcessingSummary = {
		repoUpdates: [],
		errors: [],
		totalReposProcessed: 0,
		totalFilesProcessed: 0,
		totalActionsUpdated: 0,
	};

	// Process each repository
	for (const repoPath of repositoriesToProcess) {
		const repoName = path.basename(repoPath);
		try {
			const repoUpdate = await processRepository(
				repoName,
				repoPath,
				backupDir,
				summary,
				repoCache,
			);
			if (repoUpdate.workflowUpdates.length > 0) {
				summary.repoUpdates.push(repoUpdate);
			}
			summary.totalReposProcessed++;
		} catch (error) {
			summary.errors.push(`Error processing repository ${repoName}: ${error}`);
			console.error(
				`❌ Error processing repository ${repoName}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// Print summary
	printSummary(summary, backupDir);
}

// Process a single repository
async function processRepository(
	repoName: string,
	repoPath: string,
	backupDir: string,
	summary: ProcessingSummary,
	repoCache: GitHubRepoCache,
): Promise<RepoUpdate> {
	console.log(`\n📁 Processing repository: ${repoName}`);
	console.log(
		`  🔄 Backups will be stored in: ${path.join(backupDir, repoName)}`,
	);

	const repoUpdate: RepoUpdate = {
		repoName,
		workflowUpdates: [],
	};

	// Find workflow files
	const workflowsDir = path.join(repoPath, ".github", "workflows");
	if (!fs.existsSync(workflowsDir)) {
		console.log(`  No workflows directory found in ${repoName}`);
		return repoUpdate;
	}

	const workflowFiles: string[] = [];
	const dirEntries = fs.readdirSync(workflowsDir, { withFileTypes: true });

	for (const entry of dirEntries) {
		if (
			entry.isFile() &&
			(entry.name.endsWith(".yml") || entry.name.endsWith(".yaml"))
		) {
			workflowFiles.push(path.join(workflowsDir, entry.name));
		}
	}

	if (workflowFiles.length === 0) {
		console.log(`  No workflow files found in ${repoName}`);
		return repoUpdate;
	}

	console.log(`  Found ${workflowFiles.length} workflow files`);

	// Create backup directory for this repository
	const repoBackupDir = path.join(backupDir, repoName, ".github", "workflows");
	fs.mkdirSync(repoBackupDir, { recursive: true });

	// Process each workflow file
	const filePromises = workflowFiles.map((filePath) =>
		processWorkflowFile(filePath, repoPath, backupDir, repoCache),
	);

	const workflowUpdates = await Promise.all(filePromises);
	const validUpdates = workflowUpdates.filter(
		(update) => update !== null,
	) as WorkflowUpdate[];

	repoUpdate.workflowUpdates = validUpdates;
	summary.totalFilesProcessed += workflowFiles.length;
	summary.totalActionsUpdated += validUpdates.reduce(
		(total, update) => total + update.updates.length,
		0,
	);

	return repoUpdate;
}

// Process a single workflow file
async function processWorkflowFile(
	filePath: string,
	repoPath: string,
	backupDir: string,
	repoCache: GitHubRepoCache,
): Promise<WorkflowUpdate | null> {
	const relativePath = path.relative(repoPath, filePath);
	const backupPath = path.join(
		backupDir,
		path.basename(repoPath),
		relativePath,
	);

	try {
		// Create backup of the file
		const backupDirPath = path.dirname(backupPath);
		fs.mkdirSync(backupDirPath, { recursive: true });
		fs.copyFileSync(filePath, backupPath);

		// Read the file and parse YAML
		const content = fs.readFileSync(filePath, "utf-8");
		const workflowYaml = yaml.load(content) as Record<string, unknown>;

		// Find and process action references
		const updates: ActionUpdate[] = [];

		// Function to recursively update GitHub Actions in the YAML structure
		const processNode = (
			node: Record<string, unknown> | unknown[] | unknown,
		): boolean => {
			if (!node || typeof node !== "object") {
				return false;
			}

			let modified = false;
			// If this is an array, process each item
			if (Array.isArray(node)) {
				for (let i = 0; i < node.length; i++) {
					const childModified = processNode(node[i]);
					modified = modified || childModified;
				}
				return modified;
			}
			// Process object properties
			for (const key in node as Record<string, unknown>) {
				// If the key is 'uses', this might be a GitHub Action reference
				const typedNode = node as Record<string, unknown>;
				if (key === "uses" && typeof typedNode[key] === "string") {
					const actionRef = (typedNode[key] as string).trim();

					// Skip Docker references and local references
					if (actionRef.startsWith("./") || actionRef.startsWith("docker://")) {
						continue;
					}
					// Check if reference contains a version/commit
					if (actionRef.includes("@")) {
						const splitResult = actionRef.split("@");
						if (splitResult.length < 2 || !splitResult[0] || !splitResult[1]) {
							continue;
						}
						const actionPath = splitResult[0];
						const oldRef = splitResult[1];

						// Extract repo from action path (could be owner/repo or owner/repo/path)
						const repoPathParts = actionPath.split("/");
						if (repoPathParts.length < 2) {
							continue; // Invalid reference
						}
						const owner = repoPathParts[0];
						const repo = repoPathParts[1];
						const fullRepo = `${owner}/${repo}`;

						// Use cached data instead of making API calls
						const cachedRepo = repoCache[fullRepo];
						if (cachedRepo) {
							// Update the action reference in the YAML
							const latestCommit = cachedRepo.latestCommit;
							typedNode[key] = `${actionPath}@${latestCommit}`;
							updates.push({
								actionPath,
								oldRef,
								newRef: latestCommit,
							});
							console.log(
								`  📌 Pinned ${actionPath} from ${oldRef} to ${latestCommit.substring(0, 8)}...`,
							);
							modified = true;
						} else {
							console.log(
								`  ⚠️  No cached data for ${fullRepo}, skipping ${actionPath}@${oldRef}`,
							);
						}
					}
				} else {
					// Recursively process nested objects and arrays
					const childModified = processNode(typedNode[key]);
					modified = modified || childModified;
				}
			}
			return modified;
		};
		// Process the entire YAML structure
		const modified = processNode(workflowYaml);
		// Write updated content if there were changes
		if (updates.length > 0 && modified) {
			// Convert back to YAML and write to file
			const updatedContent = yaml.dump(workflowYaml, {
				lineWidth: -1, // Prevent line wrapping
				noRefs: true, // Don't use reference tags for duplicate objects
				quotingType: '"', // Use double quotes for strings
			});
			fs.writeFileSync(filePath, updatedContent);
			console.log(
				`  ✅ Updated ${relativePath} with ${updates.length} action references`,
			);

			return {
				filePath,
				relativePath,
				updates,
			};
		}

		return null;
	} catch (error) {
		console.error(
			`  ❌ Error processing ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

// Print summary of all changes
function printSummary(summary: ProcessingSummary, backupDir: string) {
	console.log("\n📊 Summary of GitHub Action Updates");
	console.log("===============================");
	console.log(`Repositories processed: ${summary.totalReposProcessed}`);
	console.log(`Workflow files processed: ${summary.totalFilesProcessed}`);
	console.log(`Action references updated: ${summary.totalActionsUpdated}`);
	console.log(`Backup location: ${backupDir}`);

	if (summary.repoUpdates.length > 0) {
		console.log("\n🔄 Changes made:");

		for (const repoUpdate of summary.repoUpdates) {
			console.log(`\n📁 Repository: ${repoUpdate.repoName}`);

			for (const workflowUpdate of repoUpdate.workflowUpdates) {
				console.log(`  📄 ${workflowUpdate.relativePath}`);

				for (const actionUpdate of workflowUpdate.updates) {
					console.log(`    - ${actionUpdate.actionPath}`);
					console.log(`      From: ${actionUpdate.oldRef}`);
					console.log(`      To:   ${actionUpdate.newRef}`);
				}
			}
		}
	} else {
		console.log("\n📝 No changes were made.");
	}

	if (summary.errors.length > 0) {
		console.log("\n❌ Errors:");
		for (const error of summary.errors) {
			console.log(`  - ${error}`);
		}
	}
}

// Run the main function
main().catch((error) => {
	console.error(
		`❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exit(1);
});
