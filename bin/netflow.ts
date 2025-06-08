#!/usr/bin/env bun

/**
 * netflow.ts - Generate docker-compose.yml from template with environment variables
 *
 * This script reads docker-compose.template.yml, replaces placeholders with values
 * from .env file, and writes the result to docker-compose.yml for deployment.
 *
 * Usage: bun run netflow [--qnap] (from repo root)
 * Options:
 *   --qnap  Use QNAP-specific template to avoid ZFS build issues
 */

import { existsSync } from "node:fs"
import { join } from "node:path"

interface EnvVars {
  [key: string]: string
}

/**
 * Parse .env file into key-value pairs
 */
async function parseEnvFile(filePath: string): Promise<EnvVars> {
  if (!existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`)
    process.exit(1)
  }

  const envFile = Bun.file(filePath)
  const content = await envFile.text()
  const envVars: EnvVars = {}

  for (const line of content.split("\n")) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue

    // Parse KEY=VALUE or KEY="VALUE"
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match && match[1] !== undefined && match[2] !== undefined) {
      const key = match[1]
      const value = match[2]
      // Remove surrounding quotes if present
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, "")
    }
  }

  return envVars
}

/**
 * Replace placeholders in template content with environment values
 */
function replacePlaceholders(content: string, envVars: EnvVars): string {
  let result = content

  // Define placeholder patterns
  const placeholders = [
    {
      placeholder: "xxxGEOIPUPDATE_ACCOUNT_IDxxx",
      envKey: "GEOIPUPDATE_ACCOUNT_ID"
    },
    {
      placeholder: "xxxGEOIPUPDATE_LICENSE_KEYxxx",
      envKey: "GEOIPUPDATE_LICENSE_KEY"
    }
  ]

  for (const { placeholder, envKey } of placeholders) {
    const value = envVars[envKey]

    if (!value) {
      console.error(`❌ Missing environment variable: ${envKey}`)
      process.exit(1)
    }

    // Replace all occurrences of the placeholder
    const regex = new RegExp(placeholder, "g")
    result = result.replace(regex, value)

    console.log(`✅ Replaced ${placeholder} with ${envKey}`)
  }

  return result
}

/**
 * Detect if we're running on QNAP or if --qnap flag is used
 */
function shouldUseQnapTemplate(): boolean {
  // Check command line arguments
  if (process.argv.includes("--qnap")) {
    return true
  }

  // Auto-detect QNAP environment
  if (existsSync("/etc/config/uLinux.conf") || existsSync("/share/CACHEDEV1_DATA") || process.env.QNAP_PLATFORM) {
    return true
  }

  return false
}

/**
 * Main function
 */
async function main() {
  const cwd = process.cwd()
  const useQnap = shouldUseQnapTemplate()

  // Always read template from the netflow directory
  const netflowDir = join(cwd, "code", "docker", "netflow")
  const templateFileName = useQnap ? "docker-compose.qnap.template.yml" : "docker-compose.template.yml"
  const templatePath = join(netflowDir, templateFileName)
  const envPath = join(cwd, ".env") // still use .env from cwd
  const outputPath = join(cwd, "docker-compose.yml") // output to cwd

  console.log("🚀 Starting netflow deployment preparation...")
  console.log(`📋 Using ${useQnap ? "QNAP-specific" : "standard"} template\n`)

  // Check if template file exists
  if (!existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`)
    process.exit(1)
  }

  try {
    // Parse environment variables
    console.log("📖 Reading environment variables...")
    const envVars = await parseEnvFile(envPath)
    console.log(`✅ Loaded ${Object.keys(envVars).length} environment variables\n`)

    // Read template file
    console.log(`📄 Reading docker-compose template (${templateFileName})...`)
    const templateFile = Bun.file(templatePath)
    const templateContent = await templateFile.text()
    console.log("✅ Template loaded successfully\n")

    // Replace placeholders
    console.log("🔄 Replacing placeholders...")
    const processedContent = replacePlaceholders(templateContent, envVars)
    console.log()

    // Write output file
    console.log("💾 Writing docker-compose.yml to repo root...")
    await Bun.write(outputPath, processedContent)
    console.log(`✅ Successfully wrote ${outputPath}\n`)

    console.log("🎉 Docker Compose file generated successfully!")
    console.log("📝 The file contains embedded secrets and is ready for deployment.")
    console.log("⚠️  Remember: docker-compose.yml is gitignored for security.")
  } catch (error) {
    console.error("❌ Error processing files:", error)
    process.exit(1)
  }
}

// Run the script
if (process.argv[1]?.endsWith("netflow.ts") || process.argv[1]?.endsWith("netflow.js")) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error)
    process.exit(1)
  })
}
