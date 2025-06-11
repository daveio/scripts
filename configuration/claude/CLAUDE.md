# Global Rules

## 🚨 CRITICAL DEVELOPMENT RULES - MANDATORY FOR EVERY REQUEST

**⚠️ THESE RULES MUST BE FOLLOWED AT ALL TIMES, IN EVERY REQUEST ⚠️**

**1. Breaking Changes**: NO backwards compatibility. NO migrations. Document in AGENTS.md. ❌ No migration code.

**2. Quality > Speed**: Unlimited time/calls for correct implementations. Refactor ruthlessly. ❌ No "good enough".

**3. Mandatory Testing**: EVERYTHING with logic/side effects needs tests. ❌ Skip trivial getters, frontend components, config.

**4. Documentation Sync**: `AGENTS.md` = source of truth. Update after all changes. `CLAUDE.md`, `README.md` are symlinks to `AGENTS.md`.

**5. Quality Verification**: linters, typechecks, tests. ❌ No exceptions.

**6. Commit Hygiene**: `git add -A . && oco --fgm --yes` or `git add -A . && git commit -am "[emoji] [description]"`. Commit after features/bugs/refactoring.

**7. Zero Mock Data**: Only real service calls. NO mocks outside tests. Crash loudly on failure. ❌ No `Math.random()`, hardcoded values, fake delays. Exception: test files.

**8. No Incomplete Code**: Mark as comment with `TODO: [description]`. Prefer explicit errors over silent failures.

**9. TODO Management**: Use 6-hex IDs per logical issue. Update TODO.md. Examples:
```typescript
// TODO: (37c7b2) Skip Bun mocking - test separately
```
```markdown
- **TODO:** *37c7b2* `test/file.ts:18` Description
```

**11. Shared Code**: Extract duplicated logic immediately. Add comments, docs, tests, types. ❌ No copy-pasting.

## Important MCP Tools

### `sequential-thinking` / `sequentialThinking` / `sequentialthinking`

Provides tools for dynamic and reflective problem-solving through a structured thinking process.

- Break down complex problems into manageable steps
- Revise and refine thoughts as understanding deepens
- Branch into alternative paths of reasoning
- Adjust the total number of thoughts dynamically
- Generate and verify solution hypotheses


### `shared-memory` / `sharedMemory` / `sharedmemory`

- Persistent memory storage and retrieval.
- Shared between all AI software I use.
- Check memory before asking questions.
- Store important facts for future reference.
- Check for information when answers are needed.
- Checking the memory is free and quick, so do it often.
- Access in order:
  1. `sharedMemory` MCP server (if enabled).
  2. Any other available memory system.

## Shell Environment

- You are operating in the `fish` shell.
- You don't have to use `fish` for your scripts.
  - If you want touse a shell other than `fish`, **make sure you add the necessary shebang** for example `#!/usr/bin/env bash`.
- Particularly of note under `fish`:
  - Any `$` must be escaped.
  - `bash`/`zsh` syntax differs heavily from `fish`.
