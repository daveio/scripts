# `{{projectName}}`

<!-- trunk-ignore-all(markdownlint/MD036) -->

## 🚨 CRITICAL DEVELOPMENT RULES - MANDATORY FOR EVERY REQUEST

**⚠️ THESE RULES MUST BE FOLLOWED AT ALL TIMES, IN EVERY REQUEST ⚠️**

**1. Breaking Changes**: NO backwards compatibility. Document in AGENTS.md. ❌ No migration code.

**2. Quality > Speed**: Unlimited time/calls for correct implementations. Refactor ruthlessly. ❌ No "good enough".

**3. Mandatory Testing**: EVERYTHING with logic/side effects needs tests. ❌ Skip trivial getters, frontend components, config.

**4. Documentation Sync**: AGENTS.md = source of truth. Update after API/feature/auth changes. CLAUDE.md = symlink to AGENTS.md. README.md = symlink to AGENTS.md. ❌ No outdated docs.

**5. Quality Verification**: Use the linting, typechecking, and testing tools. ❌ Never commit broken code.

**6. Commit Hygiene**: `git add -A . && oco --fgm --yes` or `git add -A . && git commit -am "[emoji] [description]"`. Commit after features/bugs/refactoring.

**7. Zero Mock Data**: Only real service calls. Crash loudly on failure. ❌ No `Math.random()`, hardcoded values, fake delays. Exception: test files.

**8. No Incomplete Code**: Comment with `TODO: [description]`. Prefer explicit errors over silent failures.

**9. TODO Management**: Use 6-hex IDs per logical issue. Update TODO.md. Examples:

```typescript
// TODO: (37c7b2) Skip Bun mocking - test separately
```

```markdown
- **TODO:** _37c7b2_ `test/file.ts:18` Description
```

**10. Shared Code**: Extract duplicated logic to `server/utils/` immediately. Add documentation, comments, tests, types. ❌ No copy-pasting.
