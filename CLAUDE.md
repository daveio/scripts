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

### 9️⃣ **KV SIMPLE DATA STORAGE**

**RATIONALE**: KV storage should contain simple, directly usable data values. Complex wrapper objects defeat the purpose of key-value storage and make debugging harder.

**CORE RULE**: KV values must be simple data types. Multiple KV operations are acceptable to achieve this simplicity.

**REQUIRED PATTERNS**:
- ✅ Store simple values: strings, numbers, booleans, simple JSON objects
- ✅ Use colon-separated hierarchical keys: `metrics:api:internal:ok`
- ✅ Use lowercase kebab-case for all key segments: `auth:revocation:token-uuid`
- ✅ Multiple KV reads/writes are acceptable for data organization
- ✅ Direct KV operations: `kv.put(key, value)` in Workers, `cloudflare.kv.namespaces.values.update(id, key, {value})` in CLI

**FORBIDDEN PATTERNS**:
- ❌ Metadata wrapper objects: `{ "value": "data", "metadata": "{}" }`
- ❌ Complex nested objects as single KV values (prefer multiple keys)
- ❌ Using `metadata` parameter in Cloudflare SDK calls
- ❌ CamelCase or snake_case in key names
- ❌ Non-hierarchical flat keys when structure is needed

**KEY NAMING CONVENTIONS**:
```typescript
// ✅ CORRECT - hierarchical, lowercase, kebab-case
"metrics:api:internal:ok"
"auth:revocation:abc123def456"
"redirect:github"
"dashboard:cache:user-stats"

// ❌ WRONG - flat, mixed case, underscores
"metricsApiInternalOk"
"auth_revocation_abc123def456"
"redirectGithub"
```

**KV OPERATION EXAMPLES**:
```typescript
// ✅ CORRECT - Workers Runtime KV
await env.DATA.put("metrics:api:ok", "42")
await env.DATA.put("auth:revocation:uuid", "true")

// ✅ CORRECT - Cloudflare SDK (CLI tools)
await cloudflare.kv.namespaces.values.update(namespace, key, {
  account_id: accountId,
  value: "42"  // No metadata parameter
})

// ❌ WRONG - metadata wrapper
await cloudflare.kv.namespaces.values.update(namespace, key, {
  account_id: accountId,
  value: "42",
  metadata: "{}"  // This creates wrapper objects
})
```

**PRINCIPLE**: KV storage should be transparent and debuggable. Simple data in, simple data out.

**DATA MANAGEMENT**: Update `data/kv/_init.yaml` when defining new KV keys or modifying the schema structure. This file serves as the canonical reference for all KV key definitions and should be kept synchronized with code changes.
