#!/usr/bin/env bun
/**
 * Bump - A dependency manager that updates packages across multiple repositories
 *
 * Features:
 * - Processes all repos under `/Users/dave/src/github.com/daveio/` or a specific one
 * - Handles dependencies from JavaScript/TypeScript, Python, and Ruby projects
 * - Applies smart version bumping based on semver rules
 * - Efficiently batches API calls to package registries with retry logic
 * - Provides beautiful terminal UI with detailed progress information
 */

import { exec as execCallback } from "child_process";
import * as path from "path";
import { promisify } from "util";
import * as toml from "@iarna/toml";
import axios from "axios";
import boxen from "boxen";
import chalk from "chalk";
import { Command } from "commander";
import * as fs from "fs/promises";
import * as yaml from "js-yaml";
import ora from "ora";
import * as semver from "semver";

const exec = promisify(execCallback);

// Define interfaces for command options and dependency data

// Define interfaces for TOML structures
interface PoetryDependency {
	version?: string;
	[key: string]: unknown;
}

interface PoetryConfig {
	dependencies?: Record<string, string | PoetryDependency>;
	[key: string]: unknown;
}

interface PyProjectTool {
	poetry?: PoetryConfig;
	[key: string]: unknown;
}

interface PyProjectConfig {
	dependencies?: string[] | Record<string, string>;
	[key: string]: unknown;
}

interface PyProject {
	tool?: PyProjectTool;
	project?: PyProjectConfig;
	[key: string]: unknown;
}

interface CommandOptions {
	dryRun: boolean;
	unsafe: boolean;
	pull: boolean;
	install: boolean;
	commit: boolean;
	push: boolean;
	repo?: string;
}

interface Dependency {
	name: string;
	currentVersion: string;
	latestVersion?: string;
	manager: "npm" | "pypi" | "rubygems";
	updateType?: "none" | "patch" | "minor" | "major";
	repository: string;
	repoPath: string;
	filePath: string;
	fileType: "package.json" | "pyproject.toml" | "gemfile" | "gemspec";
}

interface UpdateSummary {
	total: number;
	updated: number;
	patches: number;
	minors: number;
	majorsSkipped: number;
	errors: number;
}

// Create a new instance of the Command class
const program = new Command();

// Set up the Commander CLI
program
	.name("bump")
	.description("A tool for updating dependencies across repositories")
	.version("1.0.0")
	.option(
		"--dry-run",
		"Make no changes, just print what would be updated",
		false,
	)
	.option(
		"--unsafe",
		"Override version rules to bump all version levels to latest",
		false,
	)
	.option("--no-pull", "Skip git fetch and pull operations")
	.option("--no-install", "Skip dependency installation/update")
	.option("--no-commit", "Skip git commit step")
	.option("--no-push", "Skip git push step")
	.argument("[repo]", "Target a specific repository")
	.parse();

const options: CommandOptions = program.opts();
options.repo = program.args[0];

// Discover repositories to process
async function discoverRepositories(targetRepo?: string): Promise<string[]> {
	const spinner = ora("Discovering repositories...").start();

	try {
		const baseDir = "/Users/dave/src/github.com/daveio";

		if (targetRepo) {
			const repoPath = path.isAbsolute(targetRepo)
				? targetRepo
				: path.join(baseDir, targetRepo);

			// Check if the repo directory exists and is a git repository
			const isDir = await fs
				.stat(repoPath)
				.then((stat) => stat.isDirectory())
				.catch(() => false);
			const isGitRepo =
				isDir &&
				(await fs
					.stat(path.join(repoPath, ".git"))
					.then((stat) => stat.isDirectory())
					.catch(() => false));

			if (!isGitRepo) {
				spinner.fail(
					`${chalk.red("Error:")} ${repoPath} is not a valid git repository.`,
				);
				process.exit(1);
			}

			spinner.succeed(`Found repository: ${chalk.green(repoPath)}`);
			return [repoPath];
		}

		// Read all directories in the base directory
		const entries = await fs.readdir(baseDir, { withFileTypes: true });
		const repoDirs = [];

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const dirPath = path.join(baseDir, entry.name);
				const isGitRepo = await fs
					.stat(path.join(dirPath, ".git"))
					.then((stat) => stat.isDirectory())
					.catch(() => false);

				if (isGitRepo) {
					repoDirs.push(dirPath);
				}
			}
		}

		spinner.succeed(`Discovered ${chalk.green(repoDirs.length)} repositories.`);
		return repoDirs;
	} catch (error) {
		spinner.fail(`${chalk.red("Error:")} Failed to discover repositories.`);
		console.error(error);
		process.exit(1);
	}
}

// Sync git repositories
async function syncGitRepositories(
	repoPaths: string[],
	shouldPull: boolean,
): Promise<void> {
	if (!shouldPull) {
		console.log(chalk.yellow("Git pull operations skipped."));
		return;
	}

	for (const repoPath of repoPaths) {
		const repoName = path.basename(repoPath);
		const spinner = ora(`Syncing repository: ${repoName}...`).start();

		try {
			// Change to the repository directory
			process.chdir(repoPath);

			// Fetch all branches, tags, and prune
			await exec(
				"git fetch --all --prune --tags --prune-tags --recurse-submodules=yes | cat",
			);

			// Pull all branches and rebase
			await exec("git pull --all --prune --rebase | cat");

			spinner.succeed(`Synced repository: ${chalk.green(repoName)}`);
		} catch (error) {
			spinner.fail(`Failed to sync repository: ${chalk.red(repoName)}`);
			console.error(error);
		}
	}
}

// Read dependencies from different file types
async function readDependencies(repoPaths: string[]): Promise<Dependency[]> {
	const allDependencies: Dependency[] = [];

	for (const repoPath of repoPaths) {
		const repoName = path.basename(repoPath);
		const spinner = ora(`Reading dependencies from ${repoName}...`).start();

		try {
			// Look for package.json files
			const packageJsonFiles = await findFiles(repoPath, "package.json");
			for (const filePath of packageJsonFiles) {
				const deps = await readPackageJsonDependencies(
					filePath,
					repoName,
					repoPath,
				);
				allDependencies.push(...deps);
			}

			// Look for pyproject.toml files
			const pyprojectTomlFiles = await findFiles(repoPath, "pyproject.toml");
			for (const filePath of pyprojectTomlFiles) {
				const deps = await readPyprojectTomlDependencies(
					filePath,
					repoName,
					repoPath,
				);
				allDependencies.push(...deps);
			}

			// Look for Gemfile files
			const gemfileFiles = await findFiles(repoPath, "Gemfile");
			for (const filePath of gemfileFiles) {
				const deps = await readGemfileDependencies(
					filePath,
					repoName,
					repoPath,
				);
				allDependencies.push(...deps);
			}

			// Look for .gemspec files
			const gemspecFiles = await findFiles(repoPath, "*.gemspec");
			for (const filePath of gemspecFiles) {
				const deps = await readGemspecDependencies(
					filePath,
					repoName,
					repoPath,
				);
				allDependencies.push(...deps);
			}

			spinner.succeed(`Read dependencies from ${chalk.green(repoName)}`);
		} catch (error) {
			spinner.fail(`Failed to read dependencies from ${chalk.red(repoName)}`);
			console.error(error);
		}
	}

	return allDependencies;
}

// Helper function to find files matching a pattern
async function findFiles(dir: string, pattern: string): Promise<string[]> {
	try {
		// Escape special characters in directory path
		const escapedDir = dir.replace(/(["\s'$`\\])/g, "\\$1");

		// Create a proper find command that explicitly excludes node_modules and .git directories
		// The -path patterns need to come before -name to properly exclude directories
		const findCommand = `find ${escapedDir} -type f \\( -path "*/node_modules/*" -o -path "*/.git/*" \\) -prune -o -type f -name "${pattern}" -print`;

		console.log(`DEBUG: Running find command: ${findCommand}`);

		const { stdout } = await exec(findCommand);
		const files = stdout.trim().split("\n").filter(Boolean);

		console.log(
			`DEBUG: Found ${files.length} files matching pattern "${pattern}" in ${dir}`,
		);

		return files;
	} catch (error) {
		console.error(`Error finding files: ${error}`);
		return [];
	}
}

// Read dependencies from package.json
async function readPackageJsonDependencies(
	filePath: string,
	repoName: string,
	repoPath: string,
): Promise<Dependency[]> {
	const dependencies: Dependency[] = [];

	try {
		const content = await fs.readFile(filePath, "utf-8");
		const pkg = JSON.parse(content);

		const sections = [
			"dependencies",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
		];

		for (const section of sections) {
			if (pkg[section]) {
				for (const [name, version] of Object.entries(pkg[section])) {
					dependencies.push({
						name,
						currentVersion: version as string,
						manager: "npm",
						repository: repoName,
						repoPath,
						filePath,
						fileType: "package.json",
					});
				}
			}
		}
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error);
	}

	return dependencies;
}

// Read dependencies from pyproject.toml
async function readPyprojectTomlDependencies(
	filePath: string,
	repoName: string,
	repoPath: string,
): Promise<Dependency[]> {
	const dependencies: Dependency[] = [];

	try {
		const content = await fs.readFile(filePath, "utf-8");
		const pyproject = toml.parse(content) as PyProject;

		// Poetry dependencies
		if (
			pyproject.tool &&
			pyproject.tool.poetry &&
			pyproject.tool.poetry.dependencies
		) {
			const poetryDeps = pyproject.tool.poetry.dependencies;
			for (const name of Object.keys(poetryDeps)) {
				if (name !== "python") {
					const versionInfo = poetryDeps[name];
					let version = "";

					if (typeof versionInfo === "string") {
						version = versionInfo;
					} else if (
						versionInfo &&
						typeof versionInfo === "object" &&
						"version" in versionInfo
					) {
						version = versionInfo.version || "";
					}

					dependencies.push({
						name,
						currentVersion: version,
						manager: "pypi",
						repository: repoName,
						repoPath,
						filePath,
						fileType: "pyproject.toml",
					});
				}
			}
		}

		// PEP 621 dependencies
		if (pyproject.project && pyproject.project.dependencies) {
			const projectDeps = pyproject.project.dependencies;
			const deps = Array.isArray(projectDeps)
				? projectDeps
				: Object.entries(projectDeps).map(
						([name, version]) => `${name}${version}`,
					);

			for (const dep of deps) {
				// Parse dependency string like "requests>=2.25.1"
				const match = dep.match(/([a-zA-Z0-9_.-]+)([<>=!~]+)([a-zA-Z0-9_.-]+)/);
				if (match && match.length >= 4) {
					const name = match[1];
					const operator = match[2];
					const version = match[3];
					dependencies.push({
						name,
						currentVersion: `${operator}${version}`,
						manager: "pypi",
						repository: repoName,
						repoPath,
						filePath,
						fileType: "pyproject.toml",
					});
				}
			}
		}
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error);
	}

	return dependencies;
}

// Read dependencies from Gemfile
async function readGemfileDependencies(
	filePath: string,
	repoName: string,
	repoPath: string,
): Promise<Dependency[]> {
	const dependencies: Dependency[] = [];

	try {
		const content = await fs.readFile(filePath, "utf-8");
		const lines = content.split("\n");

		// Simple regex-based parsing for gem declarations
		const gemRegex = /^\s*gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/;

		for (const line of lines) {
			const match = line.match(gemRegex);
			if (match) {
				const [, name, version] = match;
				dependencies.push({
					name,
					currentVersion: version || "*",
					manager: "rubygems",
					repository: repoName,
					repoPath,
					filePath,
					fileType: "gemfile",
				});
			}
		}
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error);
	}

	return dependencies;
}

// Read dependencies from .gemspec
async function readGemspecDependencies(
	filePath: string,
	repoName: string,
	repoPath: string,
): Promise<Dependency[]> {
	const dependencies: Dependency[] = [];

	try {
		const content = await fs.readFile(filePath, "utf-8");
		const lines = content.split("\n");

		// Simple regex-based parsing for gemspec dependencies
		const addDependencyRegex =
			/\.(add_(?:development_|runtime_)?dependency)\s*\(?['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/;

		for (const line of lines) {
			const match = line.match(addDependencyRegex);
			if (match) {
				const [, , name, version] = match;
				dependencies.push({
					name,
					currentVersion: version || "*",
					manager: "rubygems",
					repository: repoName,
					repoPath,
					filePath,
					fileType: "gemspec",
				});
			}
		}
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error);
	}

	return dependencies;
}

// Utility function to chunk an array into batches
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}
	return chunks;
}

// Sleep function for implementing delays in retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	retries = 3,
	initialDelay = 1000,
	maxDelay = 10000,
): Promise<T> {
	let delay = initialDelay;
	let attempt = 0;

	while (true) {
		try {
			return await fn();
		} catch (error: any) {
			attempt++;

			// Check if we've exhausted our retries
			if (attempt >= retries) {
				throw error;
			}

			// Check if the error is due to rate limiting
			const isRateLimit =
				error.response?.status === 429 ||
				(error.message && error.message.includes("rate limit"));

			// If it's a rate limit error, use a longer delay
			if (isRateLimit) {
				const retryAfter = error.response?.headers?.["retry-after"];
				if (retryAfter && !isNaN(Number.parseInt(retryAfter))) {
					delay = Number.parseInt(retryAfter) * 1000;
				} else {
					delay = Math.min(delay * 2, maxDelay); // Exponential backoff
				}

				console.log(
					chalk.yellow(
						`Rate limit hit, retrying in ${delay / 1000}s (attempt ${attempt}/${retries})...`,
					),
				);
			} else {
				// For other errors, use standard exponential backoff
				delay = Math.min(delay * 1.5, maxDelay);
				console.log(
					chalk.yellow(
						`Request failed, retrying in ${delay / 1000}s (attempt ${attempt}/${retries})...`,
					),
				);
			}

			// Wait before retrying
			await sleep(delay);
		}
	}
}

// Process npm dependencies in batches
async function processNpmDependenciesBatch(
	deps: Dependency[],
	batchSize: number,
): Promise<void> {
	const batches = chunkArray(deps, batchSize);
	console.log(
		`Processing ${deps.length} npm dependencies in ${batches.length} batches of up to ${batchSize} packages each`,
	);

	for (const [batchIndex, batch] of batches.entries()) {
		const batchSpinner = ora(
			`Processing npm batch ${batchIndex + 1}/${batches.length} (${batch.length} packages)`,
		).start();

		try {
			await Promise.all(
				batch.map(async (dep) => {
					try {
						await retryWithBackoff(async () => {
							const response = await axios.get(
								`https://registry.npmjs.org/${encodeURIComponent(dep.name)}`,
								{ timeout: 15000 }, // 15 second timeout
							);
							const latestVersion = response.data["dist-tags"]?.latest;

							if (latestVersion) {
								dep.latestVersion = latestVersion;
								dep.updateType = determineUpdateType(
									dep.currentVersion,
									latestVersion,
								);
							}
						});
					} catch (error) {
						console.error(
							`Error fetching npm package ${chalk.yellow(dep.name)} after retries:`,
							error,
						);
					}
				}),
			);

			batchSpinner.succeed(
				`Completed npm batch ${batchIndex + 1}/${batches.length}`,
			);
		} catch (error) {
			batchSpinner.fail(
				`Failed to process npm batch ${batchIndex + 1}/${batches.length}`,
			);
			console.error(error);
		}
	}
}

// Process PyPI dependencies in batches
async function processPypiDependenciesBatch(
	deps: Dependency[],
	batchSize: number,
): Promise<void> {
	const batches = chunkArray(deps, batchSize);
	console.log(
		`Processing ${deps.length} PyPI dependencies in ${batches.length} batches of up to ${batchSize} packages each`,
	);

	for (const [batchIndex, batch] of batches.entries()) {
		const batchSpinner = ora(
			`Processing PyPI batch ${batchIndex + 1}/${batches.length} (${batch.length} packages)`,
		).start();

		try {
			await Promise.all(
				batch.map(async (dep) => {
					try {
						await retryWithBackoff(async () => {
							const response = await axios.get(
								`https://pypi.org/pypi/${encodeURIComponent(dep.name)}/json`,
								{ timeout: 15000 }, // 15 second timeout
							);
							const latestVersion = response.data.info.version;

							if (latestVersion) {
								dep.latestVersion = latestVersion;
								dep.updateType = determineUpdateType(
									extractVersionFromConstraint(dep.currentVersion),
									latestVersion,
								);
							}
						});
					} catch (error) {
						console.error(
							`Error fetching PyPI package ${chalk.yellow(dep.name)} after retries:`,
							error,
						);
					}
				}),
			);

			batchSpinner.succeed(
				`Completed PyPI batch ${batchIndex + 1}/${batches.length}`,
			);
		} catch (error) {
			batchSpinner.fail(
				`Failed to process PyPI batch ${batchIndex + 1}/${batches.length}`,
			);
			console.error(error);
		}
	}
}

// Process RubyGems dependencies in batches
async function processRubygemsDependenciesBatch(
	deps: Dependency[],
	batchSize: number,
): Promise<void> {
	const batches = chunkArray(deps, batchSize);
	console.log(
		`Processing ${deps.length} RubyGems dependencies in ${batches.length} batches of up to ${batchSize} packages each`,
	);

	for (const [batchIndex, batch] of batches.entries()) {
		const batchSpinner = ora(
			`Processing RubyGems batch ${batchIndex + 1}/${batches.length} (${batch.length} packages)`,
		).start();

		try {
			await Promise.all(
				batch.map(async (dep) => {
					try {
						await retryWithBackoff(async () => {
							const response = await axios.get(
								`https://rubygems.org/api/v1/gems/${encodeURIComponent(dep.name)}.json`,
								{ timeout: 15000 }, // 15 second timeout
							);
							const latestVersion = response.data.version;

							if (latestVersion) {
								dep.latestVersion = latestVersion;
								dep.updateType = determineUpdateType(
									extractVersionFromConstraint(dep.currentVersion),
									latestVersion,
								);
							}
						});
					} catch (error) {
						console.error(
							`Error fetching RubyGems package ${chalk.yellow(dep.name)} after retries:`,
							error,
						);
					}
				}),
			);

			batchSpinner.succeed(
				`Completed RubyGems batch ${batchIndex + 1}/${batches.length}`,
			);
		} catch (error) {
			batchSpinner.fail(
				`Failed to process RubyGems batch ${batchIndex + 1}/${batches.length}`,
			);
			console.error(error);
		}
	}
}

// Check for updates using package manager APIs with batching
async function checkForUpdates(
	dependencies: Dependency[],
): Promise<Dependency[]> {
	const spinner = ora("Checking for updates...").start();

	try {
		// Group dependencies by manager to reduce API calls
		const npmDeps = dependencies.filter((dep) => dep.manager === "npm");
		const pypiDeps = dependencies.filter((dep) => dep.manager === "pypi");
		const rubygemsDeps = dependencies.filter(
			(dep) => dep.manager === "rubygems",
		);

		// Deduplicate dependencies by name to reduce API calls even further
		const uniqueNpmDeps = Array.from(
			new Map(npmDeps.map((dep) => [dep.name, dep])).values(),
		);
		const uniquePypiDeps = Array.from(
			new Map(pypiDeps.map((dep) => [dep.name, dep])).values(),
		);
		const uniqueRubygemsDeps = Array.from(
			new Map(rubygemsDeps.map((dep) => [dep.name, dep])).values(),
		);

		// Log the deduplication results
		if (npmDeps.length > uniqueNpmDeps.length) {
			console.log(
				chalk.green(
					`Deduplicated npm dependencies: ${npmDeps.length} → ${uniqueNpmDeps.length}`,
				),
			);
		}
		if (pypiDeps.length > uniquePypiDeps.length) {
			console.log(
				chalk.green(
					`Deduplicated PyPI dependencies: ${pypiDeps.length} → ${uniquePypiDeps.length}`,
				),
			);
		}
		if (rubygemsDeps.length > uniqueRubygemsDeps.length) {
			console.log(
				chalk.green(
					`Deduplicated RubyGems dependencies: ${rubygemsDeps.length} → ${uniqueRubygemsDeps.length}`,
				),
			);
		}

		// Configure batch sizes - increased for efficiency
		const npmBatchSize = 20; // npm registry can handle larger batches
		const pypiBatchSize = 10; // PyPI has stricter rate limits
		const rubygemsBatchSize = 10; // RubyGems has stricter rate limits

		// Process all package managers in parallel
		spinner.text = "Checking for updates in parallel batches...";

		const startTime = Date.now();

		await Promise.all([
			// Process npm dependencies in batches
			processNpmDependenciesBatch(uniqueNpmDeps, npmBatchSize),

			// Process PyPI dependencies in batches
			processPypiDependenciesBatch(uniquePypiDeps, pypiBatchSize),

			// Process RubyGems dependencies in batches
			processRubygemsDependenciesBatch(uniqueRubygemsDeps, rubygemsBatchSize),
		]);

		// Apply version information from unique dependencies back to all dependencies
		const versionMap = new Map<
			string,
			{
				latestVersion?: string;
				updateType?: "none" | "patch" | "minor" | "major";
			}
		>();

		// Collect version info from unique dependencies
		[...uniqueNpmDeps, ...uniquePypiDeps, ...uniqueRubygemsDeps].forEach(
			(dep) => {
				if (dep.latestVersion) {
					versionMap.set(`${dep.manager}:${dep.name}`, {
						latestVersion: dep.latestVersion,
						updateType: dep.updateType,
					});
				}
			},
		);

		// Apply collected version info to all dependencies
		dependencies.forEach((dep) => {
			const key = `${dep.manager}:${dep.name}`;
			const versionInfo = versionMap.get(key);
			if (versionInfo) {
				dep.latestVersion = versionInfo.latestVersion;
				dep.updateType = versionInfo.updateType;
			}
		});

		const duration = ((Date.now() - startTime) / 1000).toFixed(2);
		spinner.succeed(
			`Checked ${chalk.green(dependencies.length)} dependencies for updates in ${chalk.blue(duration)}s.`,
		);
		return dependencies;
	} catch (error) {
		spinner.fail(`${chalk.red("Error:")} Failed to check for updates.`);
		console.error(error);
		return dependencies;
	}
}

// Helper function to extract version from constraint (e.g., '>=1.2.3' -> '1.2.3')
function extractVersionFromConstraint(constraint: string): string {
	const match = constraint.match(/[0-9]+\.[0-9]+\.[0-9]+/);
	return match ? match[0] : constraint;
}

// Determine update type based on semver
function determineUpdateType(
	currentVersion: string,
	latestVersion: string,
): "none" | "patch" | "minor" | "major" {
	// Extract version numbers from version strings that might have constraints
	const currentClean = extractVersionFromConstraint(currentVersion);
	const latestClean = extractVersionFromConstraint(latestVersion);

	// Skip if the current version is already the latest
	if (currentClean === latestClean) {
		return "none";
	}

	// Skip invalid semver versions
	if (
		!semver.valid(semver.coerce(currentClean)) ||
		!semver.valid(semver.coerce(latestClean))
	) {
		return "none";
	}

	// Parse semver
	const current = semver.coerce(currentClean);
	const latest = semver.coerce(latestClean);

	if (!current || !latest) {
		return "none";
	}

	// Compare major, minor, and patch versions
	if (latest.major > current.major) {
		return "major";
	} else if (latest.minor > current.minor) {
		return "minor";
	} else if (latest.patch > current.patch) {
		return "patch";
	}

	return "none";
}

// Apply updates according to version bump rules
async function applyUpdates(
	dependencies: Dependency[],
	options: CommandOptions,
): Promise<Dependency[]> {
	const spinner = ora("Applying updates...").start();

	if (options.dryRun) {
		spinner.info(chalk.blue("Dry run mode enabled. No changes will be made."));
	}

	// Group dependencies by file to minimize file I/O
	const fileGroups = new Map<string, Dependency[]>();

	for (const dep of dependencies) {
		if (!fileGroups.has(dep.filePath)) {
			fileGroups.set(dep.filePath, []);
		}
		fileGroups.get(dep.filePath)?.push(dep);
	}

	const updatedDependencies = [];

	// Process each file
	for (const [filePath, deps] of fileGroups.entries()) {
		const fileType = deps[0].fileType;
		const repoName = deps[0].repository;

		try {
			// Only apply updates to dependencies that need it
			const depsToUpdate = deps.filter((dep) => {
				if (!dep.latestVersion || !dep.updateType) {
					return false;
				}

				// Apply updates based on version bump rules
				if (dep.updateType === "major" && !options.unsafe) {
					return false;
				}

				return dep.updateType !== "none";
			});

			if (depsToUpdate.length === 0) {
				continue;
			}

			if (options.dryRun) {
				// For dry run, just mark them as "would update"
				for (const dep of depsToUpdate) {
					if (dep.latestVersion) {
						updatedDependencies.push({
							...dep,
							currentVersion: dep.latestVersion,
						});
					}
				}
				continue;
			}

			// Read file content
			const content = await fs.readFile(filePath, "utf-8");

			// Update file content based on file type
			let updatedContent = content;

			switch (fileType) {
				case "package.json":
					updatedContent = updatePackageJson(content, depsToUpdate);
					break;
				case "pyproject.toml":
					updatedContent = updatePyprojectToml(content, depsToUpdate);
					break;
				case "gemfile":
					updatedContent = updateGemfile(content, depsToUpdate);
					break;
				case "gemspec":
					updatedContent = updateGemspec(content, depsToUpdate);
					break;
			}

			// Write updated content back to file
			if (updatedContent !== content) {
				await fs.writeFile(filePath, updatedContent, "utf-8");

				// Mark dependencies as updated
				for (const dep of depsToUpdate) {
					if (dep.latestVersion) {
						updatedDependencies.push({
							...dep,
							currentVersion: dep.latestVersion,
						});
					}
				}
			}
		} catch (error) {
			console.error(`Error updating ${filePath}:`, error);
		}
	}

	spinner.succeed(
		`Applied ${chalk.green(updatedDependencies.length)} updates.`,
	);
	return updatedDependencies;
}

// Update package.json
function updatePackageJson(
	content: string,
	dependencies: Dependency[],
): string {
	try {
		const pkg = JSON.parse(content);

		// Update each dependency section
		const sections = [
			"dependencies",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
		];

		for (const section of sections) {
			if (pkg[section]) {
				for (const dep of dependencies) {
					if (pkg[section][dep.name] && dep.latestVersion) {
						// Preserve prefix like ^, ~, >=, etc.
						const prefix = pkg[section][dep.name].match(/^[^0-9]*/)[0];
						pkg[section][dep.name] = `${prefix}${dep.latestVersion}`;
					}
				}
			}
		}

		// Preserve formatting
		return JSON.stringify(pkg, null, 2) + "\n";
	} catch (error) {
		console.error("Error updating package.json:", error);
		return content;
	}
}

// Update pyproject.toml
function updatePyprojectToml(
	content: string,
	dependencies: Dependency[],
): string {
	try {
		const lines = content.split("\n");
		const updatedLines = [...lines];

		for (const dep of dependencies) {
			if (!dep.latestVersion) continue;

			// Handle different formats of Python dependencies
			const poetryPattern = new RegExp(
				`(\\s*${dep.name}\\s*=\\s*["\'])([^"']+)(["\'])`,
			);
			const pep621Pattern = new RegExp(
				`(\\s*["']${dep.name}\\s*)([<>=!~]+\\s*[0-9.]+)(["'])`,
			);

			for (let i = 0; i < lines.length; i++) {
				const poetryMatch = lines[i].match(poetryPattern);
				if (poetryMatch) {
					updatedLines[i] = lines[i].replace(
						poetryPattern,
						`$1${dep.latestVersion}$3`,
					);
					continue;
				}

				const pep621Match = lines[i].match(pep621Pattern);
				if (pep621Match && pep621Match.length >= 3) {
					// Extract the operator (>=, ==, etc.)
					const operatorMatch = pep621Match[2].match(/^([<>=!~]+)/);
					const operator =
						operatorMatch && operatorMatch.length > 1 ? operatorMatch[1] : "==";
					updatedLines[i] = lines[i].replace(
						pep621Pattern,
						`$1${operator}${dep.latestVersion}$3`,
					);
				}
			}
		}

		return updatedLines.join("\n");
	} catch (error) {
		console.error("Error updating pyproject.toml:", error);
		return content;
	}
}

// Update Gemfile
function updateGemfile(content: string, dependencies: Dependency[]): string {
	try {
		const lines = content.split("\n");
		const updatedLines = [...lines];

		for (const dep of dependencies) {
			if (!dep.latestVersion) continue;

			const gemPattern = new RegExp(
				`(\\s*gem\\s+["']${dep.name}["']\\s*,\\s*["'])([^"']+)(["'])`,
			);

			for (let i = 0; i < lines.length; i++) {
				const match = lines[i].match(gemPattern);
				if (match) {
					updatedLines[i] = lines[i].replace(
						gemPattern,
						`$1${dep.latestVersion}$3`,
					);
				}
			}
		}

		return updatedLines.join("\n");
	} catch (error) {
		console.error("Error updating Gemfile:", error);
		return content;
	}
}

// Update .gemspec
function updateGemspec(content: string, dependencies: Dependency[]): string {
	try {
		const lines = content.split("\n");
		const updatedLines = [...lines];

		for (const dep of dependencies) {
			if (!dep.latestVersion) continue;

			const gemspecPattern = new RegExp(
				`(\\.add_(?:development_|runtime_)?dependency\\s*\\(?["']${dep.name}["']\\s*,\\s*["'])([^"']+)(["'])`,
			);

			for (let i = 0; i < lines.length; i++) {
				const match = lines[i].match(gemspecPattern);
				if (match) {
					updatedLines[i] = lines[i].replace(
						gemspecPattern,
						`$1${dep.latestVersion}$3`,
					);
				}
			}
		}

		return updatedLines.join("\n");
	} catch (error) {
		console.error("Error updating .gemspec:", error);
		return content;
	}
}

// Update lockfiles
async function updateLockfiles(
	repoPaths: string[],
	shouldInstall: boolean,
): Promise<void> {
	if (!shouldInstall) {
		console.log(chalk.yellow("Dependency installation skipped."));
		return;
	}

	for (const repoPath of repoPaths) {
		const repoName = path.basename(repoPath);
		const spinner = ora(`Updating lockfiles for ${repoName}...`).start();

		try {
			// Change to the repository directory
			process.chdir(repoPath);

			// Check for package.json
			const hasPackageJson = await fs
				.stat(path.join(repoPath, "package.json"))
				.then(() => true)
				.catch(() => false);

			// Check for pyproject.toml
			const hasPyprojectToml = await fs
				.stat(path.join(repoPath, "pyproject.toml"))
				.then(() => true)
				.catch(() => false);

			// Check for Gemfile
			const hasGemfile = await fs
				.stat(path.join(repoPath, "Gemfile"))
				.then(() => true)
				.catch(() => false);

			// Update JavaScript/TypeScript lockfiles
			if (hasPackageJson) {
				await exec("bun install --no-save | cat");
			}

			// Update Python lockfiles
			if (hasPyprojectToml) {
				await exec("uv sync | cat");
			}

			// Update Ruby lockfiles
			if (hasGemfile) {
				await exec("bundle update | cat");
			}

			spinner.succeed(`Updated lockfiles for ${chalk.green(repoName)}`);
		} catch (error) {
			spinner.fail(`Failed to update lockfiles for ${chalk.red(repoName)}`);
			console.error(error);
		}
	}
}

// Commit and push changes
async function commitAndPush(
	repoPaths: string[],
	shouldCommit: boolean,
	shouldPush: boolean,
): Promise<void> {
	if (!shouldCommit) {
		console.log(chalk.yellow("Git commit operations skipped."));
		return;
	}

	for (const repoPath of repoPaths) {
		const repoName = path.basename(repoPath);
		const spinner = ora(`Committing changes for ${repoName}...`).start();

		try {
			// Change to the repository directory
			process.chdir(repoPath);

			// Check if there are changes to commit
			const { stdout: status } = await exec("git status --porcelain | cat");

			if (!status.trim()) {
				spinner.info(`No changes to commit for ${chalk.blue(repoName)}`);
				continue;
			}

			// Add all changes
			await exec("git add -A .");

			// Commit changes using opencommit
			await exec("oco --fgm --yes | cat");

			spinner.succeed(`Committed changes for ${chalk.green(repoName)}`);

			// Push changes if requested
			if (shouldPush) {
				const pushSpinner = ora(`Pushing changes for ${repoName}...`).start();

				try {
					await exec("git push | cat");
					pushSpinner.succeed(`Pushed changes for ${chalk.green(repoName)}`);
				} catch (error) {
					pushSpinner.fail(`Failed to push changes for ${chalk.red(repoName)}`);
					console.error(error);
				}
			}
		} catch (error) {
			spinner.fail(`Failed to commit changes for ${chalk.red(repoName)}`);
			console.error(error);
		}
	}
}

// Print summary of dependency updates
function printUpdateSummary(
	dependencies: Dependency[],
	updatedDependencies: Dependency[],
	options: CommandOptions,
): void {
	const summary: UpdateSummary = {
		total: dependencies.length,
		updated: 0,
		patches: 0,
		minors: 0,
		majorsSkipped: 0,
		errors: 0,
	};

	// Count dependencies by update type
	for (const dep of dependencies) {
		if (!dep.updateType || !dep.latestVersion) {
			summary.errors++;
			continue;
		}

		switch (dep.updateType) {
			case "patch":
				if (
					options.dryRun ||
					updatedDependencies.some(
						(d) => d.name === dep.name && d.repository === dep.repository,
					)
				) {
					summary.patches++;
					summary.updated++;
				}
				break;
			case "minor":
				if (
					options.dryRun ||
					updatedDependencies.some(
						(d) => d.name === dep.name && d.repository === dep.repository,
					)
				) {
					summary.minors++;
					summary.updated++;
				}
				break;
			case "major":
				if (
					options.unsafe &&
					(options.dryRun ||
						updatedDependencies.some(
							(d) => d.name === dep.name && d.repository === dep.repository,
						))
				) {
					summary.updated++;
				} else {
					summary.majorsSkipped++;
				}
				break;
		}
	}

	// Group dependencies by repository or by dependency based on mode
	const byRepo = new Map<string, Map<string, Dependency[]>>();
	const byDep = new Map<string, Map<string, Dependency>>();

	for (const dep of dependencies) {
		if (!dep.updateType || !dep.latestVersion || dep.updateType === "none") {
			continue;
		}

		// Skip patches in output unless dry run
		if (dep.updateType === "patch" && !options.dryRun) {
			continue;
		}

		// Skip majors unless unsafe mode
		if (dep.updateType === "major" && !options.unsafe) {
			continue;
		}

		// Organize by repository
		if (!byRepo.has(dep.repository)) {
			byRepo.set(dep.repository, new Map<string, Dependency[]>());
		}
		const repoMap = byRepo.get(dep.repository)!;

		if (!repoMap.has(dep.name)) {
			repoMap.set(dep.name, []);
		}
		repoMap.get(dep.name)!.push(dep);

		// Organize by dependency
		if (!byDep.has(dep.name)) {
			byDep.set(dep.name, new Map<string, Dependency>());
		}
		byDep.get(dep.name)!.set(dep.repository, dep);
	}

	// Generate summary output
	console.log("\n");
	console.log(
		boxen(chalk.bold("Dependency Update Summary"), {
			padding: 1,
			borderColor: "green",
		}),
	);
	console.log("\n");

	if (options.dryRun) {
		console.log(chalk.yellow("Dry run mode: no changes were made."));
	}

	if (options.unsafe) {
		console.log(chalk.red("Unsafe mode: major version bumps were included."));
	}

	console.log("\n");
	console.log(`Total dependencies: ${chalk.cyan(summary.total)}`);
	console.log(`Updates applied: ${chalk.green(summary.updated)}`);
	console.log(`Patch updates: ${chalk.green(summary.patches)}`);
	console.log(`Minor updates: ${chalk.yellow(summary.minors)}`);
	console.log(`Major updates skipped: ${chalk.red(summary.majorsSkipped)}`);
	console.log(`Errors: ${chalk.red(summary.errors)}`);
	console.log("\n");

	// Display dependency updates grouped by mode
	if (options.repo) {
		// Group by dependency
		for (const [depName, repoMap] of byDep.entries()) {
			console.log(chalk.bold(`Dependency: ${depName}`));

			for (const [repoName, dep] of repoMap.entries()) {
				const updateSymbol =
					dep.updateType === "major"
						? chalk.red("✗")
						: dep.updateType === "minor"
							? chalk.yellow("△")
							: chalk.green("✓");

				console.log(
					`  ${updateSymbol} ${chalk.blue(repoName)}: ${dep.currentVersion} → ${dep.latestVersion}`,
				);
			}

			console.log("\n");
		}
	} else {
		// Group by repository and then dependency
		for (const [repoName, depMap] of byRepo.entries()) {
			console.log(chalk.bold(`Repository: ${repoName}`));

			for (const [depName, deps] of depMap.entries()) {
				const dep = deps[0]; // Take the first one since they're grouped by name

				const updateSymbol =
					dep.updateType === "major"
						? chalk.red("✗")
						: dep.updateType === "minor"
							? chalk.yellow("△")
							: chalk.green("✓");

				console.log(
					`  ${updateSymbol} ${chalk.blue(depName)}: ${dep.currentVersion} → ${dep.latestVersion}`,
				);
			}

			console.log("\n");
		}
	}
}

// Main function to orchestrate the entire process
async function main() {
	console.log(
		boxen(chalk.bold.green("Dependency Bumper"), {
			padding: 1,
			borderColor: "green",
		}),
	);

	const options: CommandOptions = program.opts();
	options.repo = program.args[0];

	try {
		const startTime = Date.now();
		const mainSpinner = ora("Starting dependency update process...").start();

		// Discover repositories to process
		mainSpinner.text = "Discovering repositories...";
		const repoPaths = await discoverRepositories(options.repo);
		mainSpinner.succeed(
			`Found ${chalk.green(repoPaths.length)} repositories to process.`,
		);

		// Read ALL dependencies up front from all repositories - this is key for efficient batching
		const depsSpinner = ora(
			"Reading all dependencies from all repositories...",
		).start();
		const dependencies = await readDependencies(repoPaths);

		// Log statistics about discovered dependencies
		const npmDeps = dependencies.filter((dep) => dep.manager === "npm");
		const pypiDeps = dependencies.filter((dep) => dep.manager === "pypi");
		const rubygemsDeps = dependencies.filter(
			(dep) => dep.manager === "rubygems",
		);

		depsSpinner.succeed(
			`Found ${chalk.green(dependencies.length)} dependencies across ${chalk.blue(repoPaths.length)} repositories.\n` +
				`  • ${chalk.yellow(npmDeps.length)} npm packages\n` +
				`  • ${chalk.yellow(pypiDeps.length)} PyPI packages\n` +
				`  • ${chalk.yellow(rubygemsDeps.length)} RubyGems packages`,
		);

		// Git operations only after we've read all dependencies
		if (options.pull) {
			const gitSpinner = ora("Syncing git repositories...").start();
			await syncGitRepositories(repoPaths, options.pull);
			gitSpinner.succeed(
				`Synced ${chalk.green(repoPaths.length)} git repositories.`,
			);
		} else {
			console.log(chalk.yellow("Git operations skipped (--no-pull)."));
		}

		// Check for updates using package manager APIs with batching
		console.log(chalk.blue.bold("\nChecking for dependency updates:"));
		const depsWithUpdates = await checkForUpdates(dependencies);

		// Apply updates according to version bump rules
		const updateSpinner = ora("Applying dependency updates...").start();
		const updatedDependencies = await applyUpdates(depsWithUpdates, options);
		updateSpinner.succeed(
			`Applied ${chalk.green(updatedDependencies.length)} dependency updates.`,
		);

		// Update lockfiles
		if (!options.dryRun) {
			if (options.install) {
				const lockSpinner = ora("Updating lockfiles...").start();
				await updateLockfiles(repoPaths, options.install);
				lockSpinner.succeed("Updated lockfiles for all repositories.");
			} else {
				console.log(chalk.yellow("Lockfile updates skipped (--no-install)."));
			}
		}

		// Commit and push changes
		if (!options.dryRun) {
			if (options.commit) {
				const commitSpinner = ora("Committing changes...").start();
				await commitAndPush(repoPaths, options.commit, options.push);
				commitSpinner.succeed(
					`Committed changes${options.push ? " and pushed" : ""}.`,
				);
			} else {
				console.log(
					chalk.yellow("Git commit operations skipped (--no-commit)."),
				);
			}
		}

		// Print summary of dependency updates
		printUpdateSummary(depsWithUpdates, updatedDependencies, options);

		// Print total execution time
		const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`\nTotal execution time: ${chalk.blue(totalTime)}s`);
	} catch (error) {
		console.error(chalk.red("Error:"), error);
		process.exit(1);
	}
}
// Call the main function
main();
