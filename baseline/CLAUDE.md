# .baseline - Claude Context

# CLAUDE.md - AI Agent Instructions

## 🚨 CRITICAL DEVELOPMENT RULES (MUST FOLLOW ALWAYS)

These rules are MANDATORY and override all other considerations. Follow them religiously on every task.

### 1️⃣ **NO BACKWARDS COMPATIBILITY** (Pre-Production Only)

**RATIONALE**: We are NOT in production yet. Break things freely to improve code quality.

**WHAT THIS MEANS**:
- Remove fields from JWT tokens without migration
- Delete KV storage keys without data preservation
- Change API responses without version compatibility
- Modify database schemas destructively
- Refactor interfaces without legacy support

**REQUIRED ACTIONS**:
- ✅ Document all breaking changes in CLAUDE.md and README.md
- ✅ List what will break for users
- ✅ Explain why the change improves the codebase
- ❌ Do NOT write migration code
- ❌ Do NOT preserve old field names or formats

**REMOVAL DATE**: This rule will be removed when we enter production.

### 2️⃣ **PRIORITIZE QUALITY OVER SPEED**

**RATIONALE**: Perfect code quality is more valuable than fast delivery.

**WHAT THIS MEANS**:
- Spend unlimited time getting implementations right
- Use as many AI calls as needed for research and verification
- Choose the most robust solution, not the quickest
- Refactor ruthlessly when you spot improvements

**FORBIDDEN**:
- ❌ "Good enough" implementations
- ❌ Quick hacks or shortcuts
- ❌ Worrying about API call costs
- ❌ Rushing to completion

### 3️⃣ **MANDATORY TESTING**

**RATIONALE**: Untested code WILL break. Tests prevent regressions and ensure correctness.

**RULES**:
- **EVERYTHING with logic or side effects MUST have a test**
- **NO EXCEPTIONS** - if you write a function, write its test
- Tests must cover edge cases and error conditions
- Tests must run successfully before committing

**WHAT TO TEST**:
- ✅ All API endpoints (backend MANDATORY)
- ✅ Utility functions with logic
- ✅ Authentication and validation
- ✅ Database operations
- ✅ Error handling paths

**WHAT TO SKIP**:
- ❌ Trivial getters/setters with no logic
- ❌ Frontend components (often impractical)
- ❌ Pure configuration objects

**TESTING COMMANDS**:
```bash
bun run test        # Unit tests with Vitest
bun run test:ui     # Interactive test runner
bun run test:api    # HTTP API integration tests
```

### 4️⃣ **SYNCHRONIZED DOCUMENTATION**

**RATIONALE**: Outdated docs are worse than no docs. They mislead and waste time.

**MANDATORY UPDATES**:
After ANY significant change, update BOTH:
- `CLAUDE.md` - Technical reference for AI agents and developers
- `README.md` - User-friendly guide with examples and personality

**UPDATE TRIGGERS**:
- API endpoint changes
- New features or removed features
- Architecture modifications
- Authentication changes
- Configuration changes
- Breaking changes

**DOCUMENTATION STYLE**:
- CLAUDE.md: Technical, precise, structured
- README.md: Friendly, sardonic, example-rich (reflects Dave's personality)

### 5️⃣ **QUALITY VERIFICATION WORKFLOW**

**RATIONALE**: Automated checks catch bugs before they reach users.

**MANDATORY SEQUENCE** (Do NOT skip steps):

1. **PRIMARY CHECKS** (run these first):
   ```bash
   bun run lint        # Linting with Biome and Trunk
   bun run typecheck   # TypeScript type verification
   bun run test        # Unit test suite
   ```

2. **FULL BUILD** (only after primary checks pass):
   ```bash
   bun run check       # Comprehensive build + all checks
   ```
   - ⚠️ Expensive operation - only run when everything else passes
   - ⚠️ This will catch final integration issues

**IF CHECKS FAIL**:
- Fix the issues immediately
- Do NOT commit broken code
- If you must defer fixes, add specific TODO comments

**BYPASS CONDITIONS** (very rare):
- Scoping limitations require deferring work
- Must add `// TODO: [specific description of what needs fixing]`

### 6️⃣ **COMMIT HYGIENE**

**RATIONALE**: Good commit history enables debugging, rollbacks, and collaboration.

**WHEN TO COMMIT**:
- After completing any feature
- After fixing any bug
- After any significant refactoring
- Before starting new work

**COMMIT SEQUENCE**:
1. **Primary method** (auto-generates commit messages):
   ```bash
   git add -A . && oco --fgm --yes
   ```

2. **Fallback method** (if primary fails):
   ```bash
   git add -A . && git commit -am "[emoji] [description]"
   ```
   - Use descriptive emojis: 🐛 bugs, ✨ features, 🔧 improvements, 📝 docs
   - Keep to single line
   - Be specific about what changed

**NEVER COMMIT**:
- ❌ Failing tests
- ❌ TypeScript errors
- ❌ Linting violations
- ❌ Broken builds

### 7️⃣ **ZERO TOLERANCE FOR MOCK DATA**

**RATIONALE**: This app prioritizes debugging visibility over user experience. Real failures are better than fake success.

**CORE PRINCIPLE**: Use ONLY real service calls (`env.AI.run()`, `env.DATA.get/put()`). Crash loudly when services fail.

**FORBIDDEN PATTERNS**:
- ❌ `Math.random()` for data generation
- ❌ Hardcoded percentages/metrics ("99.2%", "success rate: 95%")
- ❌ Mock time series or chart data
- ❌ Simulated delays or processing times
- ❌ Default fallback values that mask missing data
- ❌ "Demo" modes with fake data
- ❌ Try/catch blocks returning fake data instead of re-throwing
- ❌ Loading states with placeholder data that looks real
- ❌ `shouldAllowMockData()` conditional switches

**REQUIRED BEHAVIOR**:
- ✅ Real service calls with explicit error handling
- ✅ Throw errors when real data unavailable
- ✅ Return proper HTTP codes (500/503) when services fail
- ✅ Log errors for debugging without masking them
- ✅ Let components crash visibly when data missing
- ✅ Document service limitations clearly

**DETECTION WARNING**: Mock patterns often lack obvious keywords. Search for `mock|fake|simulate` won't catch subtle violations. **Manual review required** for hardcoded calculations, "safe" defaults, or fallback values.

**EXCEPTION**: Mocks are acceptable in test files only.

### 8️⃣ **NO INCOMPLETE IMPLEMENTATIONS**

**RATIONALE**: Deferred work gets forgotten. Incomplete code hides problems and creates technical debt.

**CORE RULE**: Nothing gets left "for later" without explicit marking.

**FORBIDDEN PATTERNS**:
- ❌ Empty function bodies waiting for implementation
- ❌ Generic errors without real functionality
- ❌ Comments like "implement later" without TODO
- ❌ Partial implementations that silently do nothing
- ❌ Components rendering empty without indicating why

**REQUIRED BEHAVIOR**:
- ✅ Every incomplete piece MUST have `// TODO: [specific description]`
- ✅ TODO comments must be searchable and specific
- ✅ Prefer explicit errors over silent incomplete behavior
- ✅ Make incompleteness obvious to developers

**TODO FORMAT**:
```typescript
// TODO: Implement user preference caching with Redis
throw new Error("User preferences not implemented yet")

// TODO: Add rate limiting with sliding window algorithm
// TODO: Validate image file types and sizes
```

**PRINCIPLE**: Better to crash visibly than fail silently.

---

This repository serves as Dave's centralized development baseline, containing standardized configurations, rules, and automation scripts for modern software development.

## Repository Purpose

The `.baseline` repository is a comprehensive toolkit that provides:

1. **Cursor Rules**: Extensive collection of coding guidelines for 100+ frameworks and languages
2. **Development Configurations**: Standardized configs for linting, formatting, and tooling
3. **Automation Scripts**: Utilities for repository management and CI/CD workflows
4. **Development Environment**: PostgreSQL and traffic analysis setups

## Key Components

### Scripts (`scripts/`)

- **pin.ts**: GitHub Actions security pinning tool
  - Uses GraphQL API for efficient bulk repository metadata fetching
  - Pins GitHub Actions to specific commit SHAs instead of version tags
  - Creates timestamped backups and provides detailed change summaries
  - Supports both single repository and bulk processing

- **dependagroup.ts**: Dependabot configuration tool
  - Groups related dependency updates to reduce PR noise
  - Automatically configures Dependabot grouping rules

- **maint**: Convenience script that runs pin and dependagroup sequentially

### Rules Collection (`rules/`)

- **rules-mdc/**: Modern rule format containing 100+ framework-specific guidelines
- **cursor-rules-cli/**: Python CLI tool for rule management and installation
- **rules-v0-deprecated/**: Legacy rule formats (deprecated)

### Configurations

- **_cursor/**: Cursor IDE-specific rules and configurations
- **_github/**: GitHub workflows including CI and DevSkim security scanning
- **_trunk/**: Trunk.io configurations for code quality
- **biome.json**: Biome formatter and linter configuration
- **tsconfig*.json**: TypeScript configurations for different environments

### Development Environment

- **postgres/**: Local PostgreSQL development setup using Docker
- **traffic-analysis/**: Network traffic analysis tools

## Working with This Repository

### Common Tasks

1. **Update GitHub Actions across all repositories:**
   ```shell
   bun run scripts/pin.ts
   ```

2. **Generate Cursor rules:**
   ```shell
   mise rules
   ```

3. **Configure Dependabot grouping:**
   ```shell
   bun run scripts/dependagroup.ts
   ```

4. **Run full maintenance:**
   ```shell
   bun run scripts/maint
   ```

### Project Structure Conventions

- All automation scripts use TypeScript with Bun runtime
- Configuration files follow modern formats (TOML, JSON5 where possible)
- Rules are organized by framework/language in MDC format
- Backup mechanisms are built into all destructive operations

### Security Considerations

- GitHub Actions are pinned to commit SHAs for security
- Secrets management follows GitHub best practices
- Code scanning is enabled via DevSkim and CodeQL
- Branch protection rules are standardized

## Integration Points

This baseline integrates with:
- **Cursor IDE**: Via rules and configurations
- **GitHub**: Via workflows and branch protection
- **Trunk.io**: Via quality configurations
- **Codacy**: Via project tokens and analysis
- **Dependabot**: Via automated grouping configuration

## Development Philosophy

The baseline follows these principles:
- **Standardization**: Consistent tooling and configuration across projects
- **Automation**: Minimize manual repository setup and maintenance
- **Security**: Pin dependencies and enable comprehensive scanning
- **Documentation**: Comprehensive README and inline documentation
- **Modularity**: Framework-specific rules can be used independently

## File Naming Conventions

- Scripts: `scripts/*.ts` (TypeScript with Bun)
- Rules: `rules/rules-mdc/*.mdc` (Framework-specific)
- Configs: `*.json`, `*.toml`, `*.yaml` (Standard formats)
- Private configs: `_*/` (Underscore prefix for tool-specific directories)

## Maintenance Notes

- Pin script creates timestamped backups in `~/.actions-backups/`
- GraphQL optimization reduces API calls from O(n) to O(1) for repository metadata
- Rule collection is continuously updated with new frameworks and best practices
- Docker environments provide consistent development setups
