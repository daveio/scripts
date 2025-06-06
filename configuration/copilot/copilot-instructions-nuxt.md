# Copilot Instructions

## Codacy Rules

Configuration for AI behavior when interacting with Codacy's MCP Server

### Using tools with provider/organization/repository arguments
- ALWAYS use:
  - provider: gh
  - organization: daveio
  - repository: dave-io-nuxt
- Avoid calling `git remote -v` unless necessary

### After ANY successful edit_file or reapply operation
- YOU MUST IMMEDIATELY run `codacy_cli_analyze` tool for each edited file with:
  - `rootPath`: workspace path
  - `file`: path of edited file
  - `tool`: leave empty/unset
- If issues found, propose and apply fixes
- NOTE: Failure to follow this rule is critical error

### CRITICAL: Dependencies and Security Checks
- IMMEDIATELY after ANY dependency operations (npm/yarn/pnpm install, adding to package.json, requirements.txt, pom.xml, build.gradle):
- MUST run `codacy_cli_analyze` with:
  - `rootPath`: workspace path
  - `tool`: "trivy"
  - `file`: leave empty/unset
- If vulnerabilities found:
  - Stop all operations
  - Propose and apply security fixes
  - Only continue after resolution

### General Guidelines
- Repeat steps for each modified file
- "Propose fixes" means suggest and automatically apply fixes
- MUST NOT wait for user to ask for analysis
- Don't run for duplicated code or complexity metrics
- Don't run for code coverage
- Don't manually install Codacy CLI
- When 404 error on repository/organization tools, offer to run `codacy_setup_repository`

## Technology-Specific Rules

### Bash
- Use 2 spaces for indentation, no tabs
- Limit lines to 80 characters
- Function names: lowercase with underscores
- Variable names: lowercase with underscores
- Constants: ALL_CAPS with underscores
- Always quote variables unless careful expansion needed
- Use `${variable}` instead of `$variable`
- Use `set -e` to exit on errors
- Check return values with `$?`
- Use `[[ ]]` over `[ ]` for comparisons
- Prefer built-in commands over external
- Use `$(command)` instead of backticks
- Minimize global variables, use `local` in functions
- Handle signals with `trap`
- Use `mktemp` for temporary files

### Bun
- Use `Bun.file()` for file operations
- Use `fetch` API for HTTP requests
- Use `Bun.env` for environment variables
- Use state management libraries for complex state
- Use code splitting with dynamic imports

### CSS
- Use semantic class names
- Follow BEM methodology
- Use CSS custom properties (variables)
- Minimize specificity conflicts
- Use flexbox/grid for layouts
- Prefer relative units (rem, em, %)
- Use meaningful color names/variables
- Optimize for performance
- Use CSS reset/normalize
- Group related properties
- Use shorthand properties when appropriate
- Avoid !important unless necessary

### Docker
- Use official base images
- Minimize layers in Dockerfile
- Use multi-stage builds
- Copy only necessary files
- Use .dockerignore
- Don't run as root user
- Use specific image tags, not latest
- Clean up package manager caches
- Use HEALTHCHECK instruction
- Set appropriate resource limits
- Use secrets management
- Scan images for vulnerabilities

### ESBuild
- Configure target for browser support
- Use tree shaking and bundle splitting
- Enable source maps for development
- Use watch mode for development

### Git
- Write clear, descriptive commit messages
- Use present tense in commit messages
- Keep commits atomic and focused
- Use conventional commit format
- Create feature branches for new work
- Use pull requests for code review
- Keep main branch stable
- Tag releases appropriately
- Use .gitignore for build artifacts
- Rebase before merging when appropriate

### GitHub Actions
- Use specific action versions
- Cache dependencies when possible
- Use matrix builds for multiple environments
- Store secrets securely
- Use environment protection rules
- Minimize workflow duration
- Use meaningful job names
- Group related steps
- Use conditional execution
- Monitor workflow performance

### Kubernetes
- Use namespaces for organization
- Set resource requests and limits
- Use ConfigMaps for configuration
- Use Secrets for sensitive data
- Implement health checks
- Use labels for resource organization
- Follow least privilege principle
- Use network policies
- Implement monitoring and logging
- Use Ingress for external access

### Nuxt
- Use composables for shared logic
- Follow auto-import conventions
- Use pages directory for routing
- Implement proper SEO with useSeoMeta
- Use middleware for auth/validation
- Use server directory for API routes

### TypeScript
- Enable strict mode
- Use proper type annotations
- Avoid any type when possible
- Use union types for multiple possibilities
- Implement proper error handling
- Use generics for reusable code
- Follow naming conventions
- Use enums for constants
- Implement proper interfaces
- Use type guards for runtime checks

### Vue 3
- Use Composition API
- Use computed for derived state
- Use watchers for side effects
- Use props validation and proper event emission
- Use provide/inject for dependency injection

### Vite
- Use ES modules and environment variables
- Configure proxy and dev server for development
- Use plugins and optimize bundle splitting
- Use preview mode for testing builds

### Vitest
- Write descriptive test names with proper structure (Arrange, Act, Assert)
- Mock external dependencies and test edge cases
- Use setup/teardown and group related tests

## General Best Practices

### Security
- Validate all inputs and use environment variables for secrets
- Implement proper authentication and use HTTPS
- Use secure headers and implement rate limiting
- Follow least privilege principle

### Performance
- Minimize bundle sizes and use lazy loading
- Implement caching strategies and optimize assets
- Use efficient algorithms and minimize network requests

### Testing
- Write unit, integration, and E2E tests
- Mock dependencies and test error conditions
- Maintain appropriate test coverage
- Implement CI/CD testing

### Code Quality
- Use TypeScript for type safety
- Implement proper error handling with try-catch
- Follow naming conventions (camelCase for JS/TS, kebab-case for components, PascalCase for React components)
- Export only necessary functions/classes
- Use explicit imports over globals
- Minimize dependencies and optimize build performance
- Cache frequently accessed data and monitor memory usage