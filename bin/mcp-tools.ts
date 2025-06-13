#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface McpServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface McpServers {
  [serverName: string]: McpServer;
}

interface ClaudeConfig {
  projects: {
    [projectPath: string]: {
      mcpServers: McpServers;
    };
  };
}

interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

async function readClaudeConfig(): Promise<McpServers> {
  const configPath = join(homedir(), '.claude.json');
  
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config: ClaudeConfig = JSON.parse(configContent);
    
    // Find the first project with MCP servers configured
    for (const projectPath in config.projects) {
      const project = config.projects[projectPath];
      if (project.mcpServers && Object.keys(project.mcpServers).length > 0) {
        return project.mcpServers;
      }
    }
    
    throw new Error('No MCP servers found in Claude configuration');
  } catch (error) {
    console.error(`Error reading Claude config: ${error}`);
    process.exit(1);
  }
}

async function queryMcpServer(serverName: string, server: McpServer): Promise<Tool[]> {
  const transport = new StdioClientTransport({
    command: server.command,
    args: server.args,
    env: { ...process.env, ...server.env }
  });

  const client = new Client({
    name: "mcp-tools-lister",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);
    const result = await client.listTools();
    await client.close();
    return result.tools || [];
  } catch (error) {
    try {
      await client.close();
    } catch (closeError) {
      // Ignore close errors
    }
    throw new Error(`Failed to query ${serverName}: ${error}`);
  }
}

async function main() {
  console.error('Reading Claude configuration...');
  const mcpServers = await readClaudeConfig();
  
  console.error(`Found ${Object.keys(mcpServers).length} MCP servers`);
  
  const results: Array<{ serverName: string; tools: Tool[] }> = [];
  
  // Query each server sequentially to avoid overwhelming the system
  for (const [serverName, server] of Object.entries(mcpServers)) {
    // Skip tavily as it seems to have connection issues
    if (serverName === 'tavily') {
      console.error(`Skipping ${serverName} (known to have connection issues)`);
      continue;
    }
    
    try {
      console.error(`Querying ${serverName}...`);
      const tools = await queryMcpServer(serverName, server);
      results.push({ serverName, tools });
      console.error(`  Found ${tools.length} tools`);
    } catch (error) {
      console.error(`  Failed to query ${serverName}: ${error}`);
    }
  }
  
  // Output results in the requested format
  for (const { serverName, tools } of results) {
    for (const tool of tools) {
      console.log(`mcp__${serverName}__${tool.name}`);
    }
  }
  
  console.error(`\nTotal tools found: ${results.reduce((sum, r) => sum + r.tools.length, 0)}`);
}

main().catch(error => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});