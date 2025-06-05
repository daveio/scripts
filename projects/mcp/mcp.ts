#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import boxen from 'boxen'
import chalk from 'chalk'
import { Command } from 'commander'
import yaml from 'js-yaml'
import JSON5 from 'json5'
import ora from 'ora'

// Types
interface MCPServer {
  name: string
  description: string
  command?: string
  args?: string[]
  type?: 'stdio' | 'builtin' | 'sse' | 'http'
  enabled?: boolean
  timeout?: number
  env?: Record<string, string>
  settings?: Record<string, unknown>
  bundled?: boolean | null
  display_name?: string
  env_keys?: string[]
  envs?: Record<string, string>
}

interface MCPConfig {
  servers: Record<string, MCPServer>
  config?: {
    version?: string
    default_timeout?: number
    default_type?: string
    default_enabled?: boolean
  }
  exports?: Record<
    string,
    {
      format: 'json' | 'yaml'
      path: string
      template: string
      enabled_only?: boolean
      filter?: string[]
      exclude?: string[]
    }
  >
}

// Global state
interface AppState {
  verbose: boolean
  quiet: boolean
  dryRun: boolean
  yes: boolean
}

const state: AppState = {
  verbose: false,
  quiet: false,
  dryRun: false,
  yes: false
}

// Pretty output utilities
class Logger {
  private spinner?: ReturnType<typeof ora>

  info(message: string) {
    if (state.quiet) return
    console.log(chalk.blue('ℹ'), message)
  }

  success(message: string) {
    if (state.quiet) return
    console.log(chalk.green('✓'), message)
  }

  warning(message: string) {
    if (state.quiet) return
    console.log(chalk.yellow('⚠'), message)
  }

  error(message: string) {
    console.error(chalk.red('✗'), message)
  }

  debug(message: string) {
    if (!state.verbose) return
    console.log(chalk.gray('🐛'), chalk.gray(message))
  }

  box(message: string, title?: string) {
    if (state.quiet) return
    console.log(
      boxen(message, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
        title: title,
        titleAlignment: 'center'
      })
    )
  }

  startSpinner(text: string) {
    if (state.quiet) return
    this.spinner = ora(text).start()
  }

  updateSpinner(text: string) {
    if (this.spinner) {
      this.spinner.text = text
    }
  }

  succeedSpinner(text?: string) {
    if (this.spinner) {
      this.spinner.succeed(text)
      this.spinner = undefined
    }
  }

  failSpinner(text?: string) {
    if (this.spinner) {
      this.spinner.fail(text)
      this.spinner = undefined
    }
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop()
      this.spinner = undefined
    }
  }
}

const logger = new Logger()

// File utilities
function loadConfig(path: string): MCPConfig {
  logger.debug(`Loading config from: ${path}`)

  if (!existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}`)
  }

  const content = readFileSync(path, 'utf-8')
  const ext = path.split('.').pop()?.toLowerCase()

  let rawConfig: unknown
  try {
    switch (ext) {
      case 'yaml':
      case 'yml':
        rawConfig = yaml.load(content)
        break
      case 'json':
        rawConfig = JSON.parse(content)
        break
      case 'json5':
        rawConfig = JSON5.parse(content)
        break
      default:
        throw new Error(`Unsupported file format: ${ext}`)
    }
  } catch (error) {
    throw new Error(`Failed to parse ${ext?.toUpperCase()} file: ${error}`)
  }

  // Normalize different JSON structures to canonical format
  return normalizeConfig(rawConfig)
}

function normalizeConfig(rawConfig: unknown): MCPConfig {
  const config = rawConfig as Record<string, unknown>

  // Handle different input formats
  let servers: Record<string, unknown> = {}

  if (config.servers) {
    // Canonical YAML format
    servers = config.servers as Record<string, unknown>
  } else if (config.mcpServers) {
    // Legacy JSON format
    servers = config.mcpServers as Record<string, unknown>
  } else if (config.extensions) {
    // Goose format
    servers = config.extensions as Record<string, unknown>
  } else {
    throw new Error('Invalid configuration: missing servers, mcpServers, or extensions section')
  }

  // Normalize each server configuration
  const normalizedServers: Record<string, MCPServer> = {}

  for (const [id, server] of Object.entries(servers)) {
    const serverConfig = server as Record<string, unknown>

    // Handle different command formats
    let command = serverConfig.command as string | { path: string; args?: string[]; env?: Record<string, string> }
    let args = (serverConfig.args as string[]) || []

    // Zed format has nested command object
    if (typeof command === 'object' && command.path) {
      args = command.args || []
      command = command.path
    }

    // Extract environment variables from different formats
    let env = (serverConfig.env as Record<string, string>) || {}
    if (serverConfig.envs) {
      env = { ...env, ...(serverConfig.envs as Record<string, string>) }
    }
    if (command && typeof command === 'object' && command.env) {
      env = { ...env, ...command.env }
    }

    normalizedServers[id] = {
      name: (serverConfig.name as string) || (serverConfig.display_name as string) || id,
      description: (serverConfig.description as string) || `MCP server: ${id}`,
      command: typeof command === 'string' ? command : (serverConfig.cmd as string),
      args: args,
      type: (serverConfig.type as 'stdio' | 'builtin' | 'sse' | 'http') || 'stdio',
      enabled: serverConfig.enabled !== false,
      timeout: (serverConfig.timeout as number) || 300,
      env: env,
      settings: (serverConfig.settings as Record<string, unknown>) || {},
      bundled: (serverConfig.bundled as boolean | null) || null,
      display_name: serverConfig.display_name as string,
      env_keys: (serverConfig.env_keys as string[]) || [],
      envs: (serverConfig.envs as Record<string, string>) || {}
    }
  }

  return {
    servers: normalizedServers,
    config: (config.config as MCPConfig['config']) || {
      version: '1.0.0',
      default_timeout: 300,
      default_type: 'stdio',
      default_enabled: true
    },
    exports: (config.exports as MCPConfig['exports']) || {}
  }
}

// TODO: Implement saveConfig when export functionality is added
// function saveConfig(config: MCPConfig, path: string, format: "json" | "yaml" = "yaml") {
//   logger.debug(`Saving config to: ${path} (format: ${format})`)
//
//   if (state.dryRun) {
//     logger.info(`Would save configuration to: ${path}`)
//     return
//   }
//
//   let content: string
//   switch (format) {
//     case "yaml":
//       content = yaml.dump(config, {
//         indent: 2,
//         lineWidth: 120,
//         noRefs: true,
//       })
//       break
//     case "json":
//       content = JSON.stringify(config, null, 2)
//       break
//     default:
//       throw new Error(`Unsupported format: ${format}`)
//   }
//
//   writeFileSync(path, content, "utf-8")
//   logger.success(`Configuration saved to: ${path}`)
// }

// Command implementations
async function listServers(configPath: string) {
  logger.startSpinner('Loading MCP configuration...')

  try {
    const config = loadConfig(configPath)
    logger.succeedSpinner('Configuration loaded')

    const servers = Object.entries(config.servers)

    if (servers.length === 0) {
      logger.warning('No servers configured')
      return
    }

    logger.box(`Found ${servers.length} MCP server${servers.length === 1 ? '' : 's'}`, 'MCP Servers')

    for (const [id, server] of servers) {
      const status = server.enabled !== false ? chalk.green('enabled') : chalk.red('disabled')

      const type = server.type || 'stdio'
      const timeout = server.timeout || 300

      console.log(`${chalk.bold(id)}`)
      console.log(`  ${chalk.gray('Name:')} ${server.name}`)
      console.log(`  ${chalk.gray('Description:')} ${server.description}`)
      console.log(`  ${chalk.gray('Status:')} ${status}`)
      console.log(`  ${chalk.gray('Type:')} ${type}`)
      console.log(`  ${chalk.gray('Timeout:')} ${timeout}s`)

      if (server.command) {
        console.log(`  ${chalk.gray('Command:')} ${server.command}`)
      }

      if (server.args && server.args.length > 0) {
        console.log(`  ${chalk.gray('Args:')} ${server.args.join(' ')}`)
      }

      if (server.env && Object.keys(server.env).length > 0) {
        console.log(`  ${chalk.gray('Environment:')} ${Object.keys(server.env).join(', ')}`)
      }

      console.log()
    }
  } catch (error) {
    logger.failSpinner('Failed to load configuration')
    logger.error(`${error}`)
    process.exit(1)
  }
}

async function validateConfig(configPath: string) {
  logger.startSpinner('Validating MCP configuration...')

  try {
    const config = loadConfig(configPath)
    logger.succeedSpinner('Configuration syntax is valid')

    // Basic validation
    let issues = 0

    for (const [id, server] of Object.entries(config.servers)) {
      if (!server.name) {
        logger.error(`Server '${id}' missing required 'name' field`)
        issues++
      }

      if (!server.description) {
        logger.error(`Server '${id}' missing required 'description' field`)
        issues++
      }

      if (!server.bundled && !server.command) {
        logger.error(`Server '${id}' missing required 'command' field (not bundled)`)
        issues++
      }
    }

    if (issues === 0) {
      logger.success('Configuration validation passed')
    } else {
      logger.error(`Configuration validation failed with ${issues} issue${issues === 1 ? '' : 's'}`)
      process.exit(1)
    }
  } catch (error) {
    logger.failSpinner('Configuration validation failed')
    logger.error(`${error}`)
    process.exit(1)
  }
}

async function exportConfig(configPath: string, exportName?: string) {
  logger.startSpinner('Loading MCP configuration...')

  try {
    const config = loadConfig(configPath)
    logger.succeedSpinner('Configuration loaded')

    if (!config.exports) {
      logger.error('No export configurations defined')
      process.exit(1)
    }

    const exports = exportName ? { [exportName]: config.exports[exportName] } : config.exports

    if (exportName && !config.exports[exportName]) {
      logger.error(`Export configuration '${exportName}' not found`)
      process.exit(1)
    }

    for (const [name, exportConfig] of Object.entries(exports)) {
      if (!exportConfig) continue

      logger.info(`Exporting configuration: ${name}`)

      // TODO: Implement actual export logic based on template
      logger.warning(`Export implementation for '${name}' not yet implemented`)
    }
  } catch (error) {
    logger.failSpinner('Export failed')
    logger.error(`${error}`)
    process.exit(1)
  }
}

// CLI setup
const program = new Command()

program
  .name('mcp')
  .description('MCP Server Configuration Management Utility')
  .version('1.0.0', '-V, --version', 'Display version information')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('-y, --yes', 'Automatically confirm all prompts')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts()
    state.dryRun = options.dryRun || false
    state.verbose = options.verbose || false
    state.quiet = options.quiet || false
    state.yes = options.yes || false

    if (state.verbose && state.quiet) {
      logger.error('Cannot use both --verbose and --quiet options')
      process.exit(1)
    }
  })

program
  .command('list')
  .alias('ls')
  .description('List all configured MCP servers')
  .option('-c, --config <path>', 'Configuration file path', 'mcp.yaml')
  .action(async (options) => {
    await listServers(options.config)
  })

program
  .command('validate')
  .alias('check')
  .description('Validate MCP configuration file')
  .option('-c, --config <path>', 'Configuration file path', 'mcp.yaml')
  .action(async (options) => {
    await validateConfig(options.config)
  })

program
  .command('export')
  .description('Export configuration for specific clients')
  .option('-c, --config <path>', 'Configuration file path', 'mcp.yaml')
  .option('-t, --target <name>', 'Specific export target (optional)')
  .action(async (options) => {
    await exportConfig(options.config, options.target)
  })

program
  .command('init')
  .description('Initialize a new MCP configuration file')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (_options) => {
    logger.warning('Init command not yet implemented')
  })

program
  .command('add')
  .description('Add a new MCP server configuration')
  .argument('<name>', 'Server name/identifier')
  .action(async (name, _options) => {
    logger.warning(`Add server '${name}' command not yet implemented`)
  })

program
  .command('remove')
  .alias('rm')
  .description('Remove an MCP server configuration')
  .argument('<name>', 'Server name/identifier')
  .action(async (name, _options) => {
    logger.warning(`Remove server '${name}' command not yet implemented`)
  })

program
  .command('enable')
  .description('Enable an MCP server')
  .argument('<name>', 'Server name/identifier')
  .action(async (name, _options) => {
    logger.warning(`Enable server '${name}' command not yet implemented`)
  })

program
  .command('disable')
  .description('Disable an MCP server')
  .argument('<name>', 'Server name/identifier')
  .action(async (name, _options) => {
    logger.warning(`Disable server '${name}' command not yet implemented`)
  })

// Error handling
program.exitOverride()

try {
  await program.parseAsync()
} catch (error: unknown) {
  if (
    (error as { code?: string }).code === 'commander.version' ||
    (error as { code?: string }).code === 'commander.help'
  ) {
    process.exit(0)
  } else {
    logger.error(`${(error as Error).message || error}`)
    process.exit(1)
  }
}
