#!/usr/bin/env bun

/**
 * netflow.ts - Generate docker-compose.yml from template with environment variables
 *
 * This script reads docker-compose.template.yml, replaces placeholders with values
 * from .env file, and writes the result to docker-compose.yml for deployment.
 *
 * Usage: bun run netflow (from repo root)
 */

import { existsSync } from 'fs'
import { join } from 'path'

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

  for (const line of content.split('\n')) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue

    // Parse KEY=VALUE or KEY="VALUE"
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      // Remove surrounding quotes if present
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
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
      placeholder: 'xxxGEOIPUPDATE_ACCOUNT_IDxxx',
      envKey: 'GEOIPUPDATE_ACCOUNT_ID'
    },
    {
      placeholder: 'xxxGEOIPUPDATE_LICENSE_KEYxxx',
      envKey: 'GEOIPUPDATE_LICENSE_KEY'
    }
  ]

  for (const { placeholder, envKey } of placeholders) {
    const value = envVars[envKey]

    if (!value) {
      console.error(`❌ Missing environment variable: ${envKey}`)
      process.exit(1)
    }

    // Replace all occurrences of the placeholder
    const regex = new RegExp(placeholder, 'g')
    result = result.replace(regex, value)

    console.log(`✅ Replaced ${placeholder} with ${envKey}`)
  }

  return result
}

/**
 * Main function
 */
async function main() {
  const repoRoot = process.cwd()
  const netflowDir = join(repoRoot, 'projects', 'netflow')

  const templatePath = join(netflowDir, 'docker-compose.template.yml')
  const envPath = join(netflowDir, '.env')
  const outputPath = join(repoRoot, 'docker-compose.yml')

  console.log('🚀 Starting netflow deployment preparation...\n')

  // Check if template file exists
  if (!existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`)
    process.exit(1)
  }

  try {
    // Parse environment variables
    console.log('📖 Reading environment variables...')
    const envVars = await parseEnvFile(envPath)
    console.log(`✅ Loaded ${Object.keys(envVars).length} environment variables\n`)

    // Read template file
    console.log('📄 Reading docker-compose template...')
    const templateFile = Bun.file(templatePath)
    const templateContent = await templateFile.text()
    console.log('✅ Template loaded successfully\n')

    // Replace placeholders
    console.log('🔄 Replacing placeholders...')
    const processedContent = replacePlaceholders(templateContent, envVars)
    console.log()

    // Write output file
    console.log('💾 Writing docker-compose.yml to repo root...')
    await Bun.write(outputPath, processedContent)
    console.log(`✅ Successfully wrote ${outputPath}\n`)

    console.log('🎉 Docker Compose file generated successfully!')
    console.log('📝 The file contains embedded secrets and is ready for deployment.')
    console.log('⚠️  Remember: docker-compose.yml is gitignored for security.')
  } catch (error) {
    console.error('❌ Error processing files:', error)
    process.exit(1)
  }
}

// Run the script
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
}
