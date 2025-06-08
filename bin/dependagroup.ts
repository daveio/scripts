#!/usr/bin/env -S bun --enable-source-maps
import fs from "node:fs"
import path from "node:path"
import { Command } from "commander"
import * as yaml from "js-yaml"

// Type definitions for Dependabot config
interface DependabotGroup {
  patterns: string[]
}

interface DependabotUpdate {
  "package-ecosystem": string
  directory: string
  schedule: {
    interval: string
  }
  groups?: {
    [key: string]: DependabotGroup
  }
}

interface DependabotConfig {
  version: number
  updates: DependabotUpdate[]
}

// Process a single repository
async function processRepository(repoPath: string): Promise<boolean> {
  const dependabotPath = path.join(repoPath, ".github", "dependabot.yml")

  // Check if dependabot.yml exists
  if (!fs.existsSync(dependabotPath)) {
    return false
  }

  console.log(`📝 Processing: ${path.basename(repoPath)}`)

  try {
    // Read and parse the dependabot.yml file
    const content = fs.readFileSync(dependabotPath, "utf-8")
    const config = yaml.load(content) as DependabotConfig

    if (!config.updates || !Array.isArray(config.updates)) {
      console.log(`  ⚠️  Invalid dependabot.yml structure in ${path.basename(repoPath)}`)
      return false
    }

    let modified = false

    // Process each update configuration
    for (const update of config.updates) {
      // Always set up the groups object with our all-dependencies group
      update.groups = {
        "all-dependencies": {
          patterns: ["*"]
        }
      }
      modified = true
    }

    if (modified) {
      // Write the updated configuration back
      const updatedContent = yaml.dump(config, {
        lineWidth: -1, // Prevent line wrapping
        noRefs: true, // Don't use reference tags
        quotingType: '"' // Use double quotes
      })

      fs.writeFileSync(dependabotPath, updatedContent)
      console.log(`  ✅ Updated ${path.basename(repoPath)}/dependabot.yml with dependency grouping`)
      return true
    }
    console.log(`  ℹ️  No changes needed for ${path.basename(repoPath)}`)
    return false
  } catch (error) {
    console.error(
      `  ❌ Error processing ${path.basename(repoPath)}: ${error instanceof Error ? error.message : String(error)}`
    )
    return false
  }
}

// Find all repositories in a directory
function findRepositories(rootDir: string): string[] {
  const repos: string[] = []

  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const repoPath = path.join(rootDir, entry.name)

        // Check if it's a git repository
        if (fs.existsSync(path.join(repoPath, ".git"))) {
          repos.push(repoPath)
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${rootDir}: ${error instanceof Error ? error.message : String(error)}`)
  }

  return repos
}

// Main function
async function main() {
  // Set up command-line interface
  const program = new Command()
  program
    .name("dependagroup")
    .description("Enable Dependabot dependency grouping for repositories")
    .argument("[directory]", "specific repository directory to process")
    .option("-d, --dry-run", "show what would be changed without making modifications")
    .parse()

  const options = program.opts()
  const isDryRun = options.dryRun || false

  // Determine what to process
  let repositories: string[] = []

  if (program.args[0]) {
    // Process specific directory
    const targetPath = path.resolve(program.args[0])

    if (!fs.existsSync(targetPath)) {
      console.error(`❌ Directory not found: ${targetPath}`)
      process.exit(1)
    }

    // Check if it's a repository itself
    if (fs.existsSync(path.join(targetPath, ".git"))) {
      repositories = [targetPath]
    } else {
      console.error(`❌ Not a git repository: ${targetPath}`)
      process.exit(1)
    }
  } else {
    // Process all subdirectories of the default path
    const defaultPath = "/Users/dave/src/github.com/daveio"
    console.log(`🔍 Scanning for repositories in: ${defaultPath}`)
    repositories = findRepositories(defaultPath)
  }

  if (repositories.length === 0) {
    console.log("No repositories found to process")
    return
  }

  console.log(`Found ${repositories.length} repository(ies) to process\n`)

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n")
  }

  // Process each repository
  let updatedCount = 0
  let processedCount = 0

  for (const repoPath of repositories) {
    if (!isDryRun) {
      const updated = await processRepository(repoPath)
      if (updated) updatedCount++
      processedCount++
    } else {
      // In dry run mode, just check if the file exists and needs updating
      const dependabotPath = path.join(repoPath, ".github", "dependabot.yml")
      if (fs.existsSync(dependabotPath)) {
        console.log(`Would process: ${path.basename(repoPath)}`)
        processedCount++
      }
    }
  }

  // Summary
  console.log("\n📊 Summary")
  console.log("================")
  console.log(`Repositories scanned: ${repositories.length}`)
  console.log(`Dependabot configs found: ${processedCount}`)
  if (!isDryRun) {
    console.log(`Configs updated: ${updatedCount}`)
  }
}

// Run the main function
main().catch((error) => {
  console.error(`❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
