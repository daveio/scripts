# .baseline

A comprehensive development toolkit providing standardized configurations, rules, and automation scripts for modern software development.

## Overview

This repository serves as a centralized baseline for development tools, configurations, and automation scripts across multiple projects. It includes:

- **Cursor Rules**: Comprehensive coding guidelines for various frameworks and languages
- **Development Configurations**: Standardized configs for linting, formatting, and tooling
- **Automation Scripts**: Utilities for repository management and CI/CD workflows
- **PostgreSQL Setup**: Local development database configuration

## Quick Start

### Working with the Baseline repo

Generate Cursor app-wide rules from the individual MDC files:

```shell
mise rules
```

### Scripts

#### GitHub Actions Pinning (`scripts/pin.ts`)

Automatically updates GitHub Action workflows to pin them to the latest commit SHAs instead of using version tags. This improves security by preventing potential supply chain attacks.

**Features:**
- Scans all repositories for GitHub Actions workflows
- Uses GraphQL API for efficient bulk repository metadata fetching
- Creates timestamped backups before making changes
- Supports both single repository and bulk processing
- Provides detailed summary of all changes made

**Usage:**
```shell
# Pin actions in all repositories under /Users/dave/src/github.com/daveio
bun run scripts/pin.ts

# Pin actions in a specific repository
bun run scripts/pin.ts /path/to/repository

# Help
bun run scripts/pin.ts --help
```

#### Dependency Grouping (`scripts/dependagroup.ts`)

Configures Dependabot to group related dependency updates, reducing PR noise and simplifying maintenance.

**Usage:**
```shell
bun run scripts/dependagroup.ts
```

#### Maintenance Runner (`scripts/maint`)

Convenience script that runs both pin and dependagroup operations sequentially.

**Usage:**
```shell
bun run scripts/maint
```

### Development Environment

#### PostgreSQL

Local PostgreSQL development environment using Docker:

```shell
cd postgres
cp postgres.env.example postgres.env
# Edit postgres.env with your preferred settings
docker-compose up -d
```

#### Traffic Analysis

Network traffic analysis tools:

```shell
cd traffic-analysis
docker-compose up -d
```

## Repository Structure

```plaintext
├── _cursor/           # Cursor IDE rules and configurations
│   └── rules/         # Framework-specific coding guidelines
├── _github/           # GitHub workflows and configurations
├── _trunk/            # Trunk.io configurations
├── postgres/          # PostgreSQL development setup
├── rules/             # Comprehensive rule collection
│   ├── rules-mdc/     # Modern rule format (MDC)
│   └── cursor-rules-cli/  # CLI tool for rule management
├── scripts/           # Automation and utility scripts
└── traffic-analysis/  # Network analysis tools
```

## Rules Collection

The `rules/` directory contains an extensive collection of coding guidelines and best practices for:

- **Frontend**: React, Next.js, Vue, Angular, Svelte
- **Backend**: Node.js, Python, Go, Rust, Java
- **Mobile**: React Native, Flutter, iOS, Android
- **Infrastructure**: Docker, Kubernetes, AWS, GCP, Azure
- **Databases**: PostgreSQL, MongoDB, Redis
- **AI/ML**: PyTorch, TensorFlow, LangChain, Transformers

### Using Rules

Rules are available in MDC format under `rules/rules-mdc/`. Copy relevant rules to your project's `.cursor/rules/` directory:

```shell
# Copy specific framework rules
cp rules/rules-mdc/react.mdc .cursor/rules/
cp rules/rules-mdc/typescript.mdc .cursor/rules/

# Or use the CLI tool
cd rules/cursor-rules-cli
python -m src.main install react typescript
```

## Manual Repository Setup Steps

When creating a new repository, follow these manual configuration steps:

### Codacy

1. Add repository to Codacy
2. Set `CODACY_PROJECT_TOKEN` in repository secrets

### Trunk

1. Add repository to Trunk.io platform
2. Configure quality gates and checks

### Code Scanning

1. Enable CodeQL code scanning
2. Enable Dependabot security updates
3. Configure security alerts

### Branch Protection

Set up branch protection using the provided configuration:

```shell
# Apply branch protection rules
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --input .github/protect-main.json
```

## Configuration Files

- **biome.json**: Biome formatter and linter configuration
- **tsconfig*.json**: TypeScript configurations for different environments
- **mise.toml**: Development environment tool management
- **mcp*.json**: Model Context Protocol configurations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the established patterns
4. Test your changes
5. Submit a pull request

## License

See [LICENSE](LICENSE) for details.
