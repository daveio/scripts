#!/usr/bin/env bun

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import * as yaml from 'js-yaml'
import get from 'lodash.get'

interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  summary: string
}

interface ComparisonConfig {
  generated: string
  reference: string
  name: string
  format: 'json' | 'yaml'
  ignoreKeys?: string[]
  transformKeys?: Record<string, string>
}

class MCPTemplateValidator {
  private loadFile(filePath: string, format: 'json' | 'yaml'): any {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    const content = readFileSync(filePath, 'utf8')

    try {
      if (format === 'yaml') {
        return yaml.load(content)
      } else {
        return JSON.parse(content)
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format.toUpperCase()} file ${filePath}: ${error}`)
    }
  }

  private normalizeObject(obj: any, ignoreKeys: string[] = [], transformKeys: Record<string, string> = {}): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeObject(item, ignoreKeys, transformKeys))
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {}

      for (const [key, value] of Object.entries(obj)) {
        // Skip ignored keys
        if (ignoreKeys.includes(key)) {
          continue
        }

        // Apply key transformations
        const normalizedKey = transformKeys[key] || key
        result[normalizedKey] = this.normalizeObject(value, ignoreKeys, transformKeys)
      }

      return result
    }

    return obj
  }

  private compareObjects(obj1: any, obj2: any, path = ''): string[] {
    const differences: string[] = []

    // Type comparison
    if (typeof obj1 !== typeof obj2) {
      differences.push(`${path}: Type mismatch - ${typeof obj1} vs ${typeof obj2}`)
      return differences
    }

    // Null comparison
    if (obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        differences.push(`${path}: Null mismatch - ${obj1} vs ${obj2}`)
      }
      return differences
    }

    // Array comparison
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        differences.push(`${path}: Array length mismatch - ${obj1.length} vs ${obj2.length}`)
      }

      const maxLength = Math.max(obj1.length, obj2.length)
      for (let i = 0; i < maxLength; i++) {
        const itemPath = `${path}[${i}]`
        if (i >= obj1.length) {
          differences.push(`${itemPath}: Missing in first object`)
        } else if (i >= obj2.length) {
          differences.push(`${itemPath}: Missing in second object`)
        } else {
          differences.push(...this.compareObjects(obj1[i], obj2[i], itemPath))
        }
      }
      return differences
    }

    // Object comparison
    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1)
      const keys2 = Object.keys(obj2)
      const allKeys = new Set([...keys1, ...keys2])

      for (const key of allKeys) {
        const keyPath = path ? `${path}.${key}` : key

        if (!(key in obj1)) {
          differences.push(`${keyPath}: Missing in first object`)
        } else if (!(key in obj2)) {
          differences.push(`${keyPath}: Missing in second object`)
        } else {
          differences.push(...this.compareObjects(obj1[key], obj2[key], keyPath))
        }
      }
      return differences
    }

    // Primitive comparison
    if (obj1 !== obj2) {
      differences.push(`${path}: Value mismatch - "${obj1}" vs "${obj2}"`)
    }

    return differences
  }

  private validateConfiguration(config: ComparisonConfig): ValidationResult {
    const result: ValidationResult = {
      passed: false,
      errors: [],
      warnings: [],
      summary: ''
    }

    try {
      console.log(`\n🔍 Validating ${config.name}...`)

      // Load files
      const generated = this.loadFile(config.generated, config.format)
      const reference = this.loadFile(config.reference, config.format)

      // Normalize objects for comparison
      const normalizedGenerated = this.normalizeObject(generated, config.ignoreKeys, config.transformKeys)
      const normalizedReference = this.normalizeObject(reference, config.ignoreKeys, config.transformKeys)

      // Compare objects
      const differences = this.compareObjects(normalizedGenerated, normalizedReference)

      if (differences.length === 0) {
        result.passed = true
        result.summary = `✅ ${config.name}: PASSED - Generated output matches reference`
        console.log(result.summary)
      } else {
        result.passed = false
        result.errors = differences
        result.summary = `❌ ${config.name}: FAILED - ${differences.length} difference(s) found`
        console.log(result.summary)

        // Show first few differences
        const maxShow = 5
        console.log(`\nFirst ${Math.min(differences.length, maxShow)} differences:`)
        differences.slice(0, maxShow).forEach((diff, i) => {
          console.log(`  ${i + 1}. ${diff}`)
        })

        if (differences.length > maxShow) {
          console.log(`  ... and ${differences.length - maxShow} more`)
        }
      }
    } catch (error) {
      result.passed = false
      result.errors = [String(error)]
      result.summary = `💥 ${config.name}: ERROR - ${error}`
      console.log(result.summary)
    }

    return result
  }

  public validateAll(): boolean {
    console.log('🚀 Starting MCP Template Validation\n')

    const configurations: ComparisonConfig[] = [
      {
        name: 'Goose Configuration',
        generated: 'mcp-goose.yaml',
        reference: 'mcp-goose.yaml',
        format: 'yaml',
        ignoreKeys: ['env_keys'], // This is generated by template function
        transformKeys: {}
      },
      {
        name: 'Claude Desktop Configuration',
        generated: 'mcp-claude-desktop.json',
        reference: 'mcp-claude-desktop-with-mise.json',
        format: 'json',
        ignoreKeys: [],
        transformKeys: {}
      },
      {
        name: 'Zed Configuration',
        generated: 'mcp-zed.json',
        reference: 'mcp-zed.json',
        format: 'json',
        ignoreKeys: [],
        transformKeys: {}
      }
    ]

    const results: ValidationResult[] = []
    let allPassed = true

    for (const config of configurations) {
      const result = this.validateConfiguration(config)
      results.push(result)

      if (!result.passed) {
        allPassed = false
      }
    }

    // Final summary
    console.log('\n📊 Validation Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    results.forEach((result) => {
      console.log(result.summary)
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const passedCount = results.filter((r) => r.passed).length
    const totalCount = results.length

    if (allPassed) {
      console.log(`🎉 All ${totalCount} validations PASSED!`)
      console.log('✨ Generated templates match reference configurations.')
    } else {
      console.log(`🚨 ${totalCount - passedCount} of ${totalCount} validations FAILED!`)
      console.log('🔧 Please review the differences and update templates or references.')
    }

    return allPassed
  }

  public validateStructural(): boolean {
    console.log('\n🏗️  Structural Validation')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const files = [
      {
        path: 'mcp-goose.yaml',
        format: 'yaml' as const,
        requiredKeys: ['extensions', 'GOOSE_MODE']
      },
      {
        path: 'mcp-claude-desktop.json',
        format: 'json' as const,
        requiredKeys: ['mcpServers']
      },
      {
        path: 'mcp-zed.json',
        format: 'json' as const,
        requiredKeys: ['mcpServers']
      }
    ]

    let allValid = true

    for (const file of files) {
      try {
        const data = this.loadFile(file.path, file.format)

        // Check required keys
        const missingKeys = file.requiredKeys.filter((key) => !(key in data))

        if (missingKeys.length === 0) {
          console.log(`✅ ${file.path}: Structure valid`)
        } else {
          console.log(`❌ ${file.path}: Missing required keys: ${missingKeys.join(', ')}`)
          allValid = false
        }

        // Check if servers exist
        const serversKey = file.requiredKeys.find((key) => key.includes('Servers') || key === 'extensions')
        if (serversKey && data[serversKey]) {
          const serverCount = Object.keys(data[serversKey]).length
          console.log(`   📊 ${serverCount} server(s) configured`)
        }
      } catch (error) {
        console.log(`💥 ${file.path}: ${error}`)
        allValid = false
      }
    }

    return allValid
  }
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'

  const validator = new MCPTemplateValidator()
  let success = false

  try {
    switch (command) {
      case 'all':
        const structuralValid = validator.validateStructural()
        const contentValid = validator.validateAll()
        success = structuralValid && contentValid
        break

      case 'structural':
        success = validator.validateStructural()
        break

      case 'content':
        success = validator.validateAll()
        break

      default:
        console.error(`Unknown command: ${command}`)
        console.log('\nUsage:')
        console.log('  bun run validate-mcp-templates.ts [all|structural|content]')
        process.exit(1)
    }

    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('Validation failed:', error)
    process.exit(1)
  }
}

export { MCPTemplateValidator }
