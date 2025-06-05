#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import Ajv from 'ajv'
import * as changeCase from 'change-case'
import * as yaml from 'js-yaml'
import { JSONPath } from 'jsonpath-plus'
import get from 'lodash.get'
import merge from 'lodash.merge'
import set from 'lodash.set'

interface MCPServer {
  command: string
  args: string[]
  description?: string
  enabled: boolean
  env?: Record<string, string>
  name: string
  settings?: Record<string, any>
  timeout: number
  type: string
}

interface MCPConfig {
  config: {
    defaults: Record<string, any>
    output: Record<string, any>
  }
  servers: Record<string, MCPServer>
}

interface PropertyMapping {
  path?: string
  transform?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'omit'
  default?: any
  required?: boolean
}

interface ConditionalProperty {
  condition: string
  properties: Record<string, any>
}

interface Template {
  $schema?: string
  metadata: {
    name: string
    description?: string
    version?: string
    outputFormat: 'json' | 'yaml'
    targetTool: string
  }
  transform: {
    rootKey: string
    serverFilter?: {
      enabledOnly?: boolean
      include?: string[]
      exclude?: string[]
    }
    serverNameMapping?: {
      strategy?: 'keep' | 'singleWord' | 'camelCase' | 'kebab-case'
      prefix?: string
      suffix?: string
    }
    propertyMappings?: Record<string, string | PropertyMapping>
    staticProperties?: Record<string, any>
    conditionalProperties?: ConditionalProperty[]
    globalProperties?: Record<string, any>
  }
  postProcess?: {
    removeEmptyObjects?: boolean
    removeNullValues?: boolean
    sortKeys?: boolean
    customTransforms?: any[]
  }
}

class MCPTemplateProcessor {
  private ajv: Ajv
  private schema: any

  constructor() {
    this.ajv = new Ajv({ allErrors: true })
    this.loadSchema()
  }

  private loadSchema() {
    try {
      const schemaPath = resolve(__dirname, '../mcp-templates/template.schema.json')
      this.schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
    } catch (error) {
      console.error('Failed to load template schema:', error)
      process.exit(1)
    }
  }

  private loadTemplate(templatePath: string): Template {
    if (!existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const content = readFileSync(templatePath, 'utf8')
    let template: Template

    try {
      if (templatePath.endsWith('.yaml') || templatePath.endsWith('.yml')) {
        template = yaml.load(content) as Template
      } else {
        template = JSON.parse(content)
      }
    } catch (error) {
      throw new Error(`Failed to parse template: ${error}`)
    }

    // Validate template against schema
    const isValid = this.ajv.validate(this.schema, template)
    if (!isValid) {
      throw new Error(`Template validation failed: ${JSON.stringify(this.ajv.errors, null, 2)}`)
    }

    return template
  }

  private loadMCPConfig(configPath: string): MCPConfig {
    if (!existsSync(configPath)) {
      throw new Error(`MCP config file not found: ${configPath}`)
    }

    const content = readFileSync(configPath, 'utf8')
    try {
      return yaml.load(content) as MCPConfig
    } catch (error) {
      throw new Error(`Failed to parse MCP config: ${error}`)
    }
  }

  private filterServers(
    servers: Record<string, MCPServer>,
    filter?: Template['transform']['serverFilter']
  ): Record<string, MCPServer> {
    if (!filter) return servers

    let filtered = { ...servers }

    // Filter by enabled status
    if (filter.enabledOnly) {
      filtered = Object.fromEntries(Object.entries(filtered).filter(([_, server]) => server.enabled))
    }

    // Include specific servers
    if (filter.include && filter.include.length > 0) {
      filtered = Object.fromEntries(Object.entries(filtered).filter(([name]) => filter.include!.includes(name)))
    }

    // Exclude specific servers
    if (filter.exclude && filter.exclude.length > 0) {
      filtered = Object.fromEntries(Object.entries(filtered).filter(([name]) => !filter.exclude!.includes(name)))
    }

    return filtered
  }

  private transformServerName(name: string, mapping?: Template['transform']['serverNameMapping']): string {
    if (!mapping) return name

    let transformed = name

    // Apply strategy
    switch (mapping.strategy) {
      case 'singleWord':
        // Remove hyphens, underscores, and spaces to create single word
        transformed = name.replace(/[-_\s]/g, '').toLowerCase()
        break
      case 'camelCase':
        transformed = changeCase.camelCase(name)
        break
      case 'kebab-case':
        transformed = changeCase.kebabCase(name)
        break
      case 'keep':
      default:
        // Keep original name
        break
    }

    // Apply prefix/suffix
    if (mapping.prefix) {
      transformed = mapping.prefix + transformed
    }
    if (mapping.suffix) {
      transformed = transformed + mapping.suffix
    }

    return transformed
  }

  private applyPropertyMappings(
    server: MCPServer,
    mappings?: Template['transform']['propertyMappings']
  ): Record<string, any> {
    if (!mappings) return { ...server }

    const result: Record<string, any> = {}

    for (const [sourceKey, mapping] of Object.entries(mappings)) {
      const sourceValue = get(server, sourceKey)

      if (typeof mapping === 'string') {
        // Simple string mapping
        if (sourceValue !== undefined) {
          set(result, mapping, sourceValue)
        }
      } else {
        // Complex mapping object
        const { path, transform, default: defaultValue, required } = mapping

        let value = sourceValue !== undefined ? sourceValue : defaultValue

        if (value === undefined && required) {
          throw new Error(`Required property ${sourceKey} is missing`)
        }

        if (value !== undefined && transform !== 'omit') {
          // Apply type transformations
          switch (transform) {
            case 'string':
              value = String(value)
              break
            case 'number':
              value = Number(value)
              break
            case 'boolean':
              value = Boolean(value)
              break
            case 'array':
              value = Array.isArray(value) ? value : [value]
              break
            case 'object':
              value = typeof value === 'object' ? value : {}
              break
          }

          if (path) {
            set(result, path, value)
          }
        }
      }
    }

    return result
  }

  private applyStaticProperties(server: Record<string, any>, statics?: Record<string, any>): Record<string, any> {
    if (!statics) return server
    return merge({}, server, statics)
  }

  private evaluateCondition(condition: string, server: MCPServer): boolean {
    try {
      // Simple property existence check
      if (condition.startsWith('$.') && !condition.includes('==') && !condition.includes('!=')) {
        const path = condition.substring(2)
        return get(server, path) !== undefined
      }

      // JSONPath evaluation
      const results = JSONPath({ path: condition, json: server })
      return results.length > 0 && results[0]
    } catch (error) {
      console.warn(`Failed to evaluate condition "${condition}":`, error)
      return false
    }
  }

  private applyConditionalProperties(
    server: Record<string, any>,
    originalServer: MCPServer,
    conditionals?: ConditionalProperty[]
  ): Record<string, any> {
    if (!conditionals) return server

    let result = { ...server }

    for (const conditional of conditionals) {
      if (this.evaluateCondition(conditional.condition, originalServer)) {
        const processedProperties = this.processTemplateProperties(conditional.properties, originalServer)
        result = merge(result, processedProperties)
      }
    }

    return result
  }

  private postProcess(data: any, options?: Template['postProcess']): any {
    if (!options) return data

    let result = JSON.parse(JSON.stringify(data)) // Deep clone

    if (options.removeNullValues) {
      result = this.removeNullValues(result)
    }

    if (options.removeEmptyObjects) {
      result = this.removeEmptyObjects(result)
    }

    if (options.sortKeys) {
      result = this.sortKeys(result)
    }

    return result
  }

  private removeNullValues(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeNullValues(item)).filter((item) => item !== null)
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const processedValue = this.removeNullValues(value)
        if (processedValue !== null) {
          result[key] = processedValue
        }
      }
      return result
    }
    return obj
  }

  private removeEmptyObjects(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeEmptyObjects(item))
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const processedValue = this.removeEmptyObjects(value)
        if (
          processedValue !== null &&
          !(typeof processedValue === 'object' && Object.keys(processedValue).length === 0)
        ) {
          result[key] = processedValue
        }
      }
      return result
    }
    return obj
  }

  private sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortKeys(item))
    } else if (obj !== null && typeof obj === 'object') {
      const sortedKeys = Object.keys(obj).sort()
      const result: any = {}
      for (const key of sortedKeys) {
        result[key] = this.sortKeys(obj[key])
      }
      return result
    }
    return obj
  }

  private processTemplateProperties(properties: Record<string, any>, server: MCPServer): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const templateFunction = value.slice(2, -2)
        result[key] = this.executeTemplateFunction(templateFunction, server)
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.processTemplateProperties(value, server)
      } else {
        result[key] = value
      }
    }

    return result
  }

  private executeTemplateFunction(functionName: string, server: MCPServer): any {
    switch (functionName) {
      case 'extractEnvKeys':
        return server.env ? Object.keys(server.env) : []
      default:
        console.warn(`Unknown template function: ${functionName}`)
        return null
    }
  }

  public process(mcpConfigPath: string, templatePath: string, outputPath?: string): string {
    console.log(`Processing MCP config: ${mcpConfigPath}`)
    console.log(`Using template: ${templatePath}`)

    // Load inputs
    const mcpConfig = this.loadMCPConfig(mcpConfigPath)
    const template = this.loadTemplate(templatePath)

    console.log(`Loaded template: ${template.metadata.name} v${template.metadata.version || '1.0.0'}`)

    // Filter servers
    const filteredServers = this.filterServers(mcpConfig.servers, template.transform.serverFilter)
    console.log(`Filtered servers: ${Object.keys(filteredServers).length} of ${Object.keys(mcpConfig.servers).length}`)

    // Process each server
    const processedServers: Record<string, any> = {}

    for (const [originalName, server] of Object.entries(filteredServers)) {
      const transformedName = this.transformServerName(originalName, template.transform.serverNameMapping)

      // Apply property mappings
      let processedServer = this.applyPropertyMappings(server, template.transform.propertyMappings)

      // Apply static properties
      processedServer = this.applyStaticProperties(processedServer, template.transform.staticProperties)

      // Apply conditional properties
      processedServer = this.applyConditionalProperties(
        processedServer,
        server,
        template.transform.conditionalProperties
      )

      processedServers[transformedName] = processedServer
    }

    // Build final output
    let output: Record<string, any> = {
      [template.transform.rootKey]: processedServers
    }

    // Add global properties
    if (template.transform.globalProperties) {
      output = merge(template.transform.globalProperties, output)
    }

    // Post-process
    output = this.postProcess(output, template.postProcess)

    // Generate output string
    let outputContent: string
    if (template.metadata.outputFormat === 'yaml') {
      outputContent = yaml.dump(output, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      })
    } else {
      outputContent = JSON.stringify(output, null, 2)
    }

    // Write to file if output path provided
    if (outputPath) {
      writeFileSync(outputPath, outputContent, 'utf8')
      console.log(`Generated output: ${outputPath}`)
    }

    return outputContent
  }

  public processAll(mcpConfigPath: string, templatesDir: string, outputDir: string) {
    const fs = require('fs')
    const path = require('path')

    if (!existsSync(templatesDir)) {
      throw new Error(`Templates directory not found: ${templatesDir}`)
    }

    if (!existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const templateFiles = fs
      .readdirSync(templatesDir)
      .filter((file: string) => file.endsWith('.yaml') || file.endsWith('.yml'))
      .filter((file: string) => file !== 'template.schema.json')

    console.log(`Found ${templateFiles.length} template(s): ${templateFiles.join(', ')}`)

    for (const templateFile of templateFiles) {
      try {
        const templatePath = path.join(templatesDir, templateFile)
        const template = this.loadTemplate(templatePath)

        const outputFileName = `mcp-${template.metadata.targetTool}.${template.metadata.outputFormat}`
        const outputPath = path.join(outputDir, outputFileName)

        this.process(mcpConfigPath, templatePath, outputPath)
      } catch (error) {
        console.error(`Failed to process template ${templateFile}:`, error)
      }
    }
  }
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage:
  bun run mcp-template-processor.ts <command> [options]

Commands:
  process <mcp-config> <template> [output]     Process single template
  process-all <mcp-config> <templates-dir> <output-dir>  Process all templates

Examples:
  bun run mcp-template-processor.ts process mcp.yaml mcp-templates/goose.yaml mcp-goose.yaml
  bun run mcp-template-processor.ts process-all mcp.yaml mcp-templates/ ./output/
    `)
    process.exit(1)
  }

  const processor = new MCPTemplateProcessor()

  try {
    if (args[0] === 'process') {
      if (args.length < 3) {
        console.error('Missing required arguments for process command')
        process.exit(1)
      }
      processor.process(args[1], args[2], args[3])
    } else if (args[0] === 'process-all') {
      if (args.length < 4) {
        console.error('Missing required arguments for process-all command')
        process.exit(1)
      }
      processor.processAll(args[1], args[2], args[3])
    } else {
      console.error(`Unknown command: ${args[0]}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

export { MCPTemplateProcessor }
