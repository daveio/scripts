# `{{ projectName }}`

## 🛑 MANDATORY RULES - CHECK BEFORE EVERY ACTION

### PRE-TASK CHECKLIST (Mental Review Required)
□ Am I following ALL 10 rules below?
□ Have I checked `AGENTS.md` for latest specs?
□ Will my code be production-ready?

### THE 10 COMMANDMENTS

**1. BREAK**: Ship breaking changes freely. Document in `AGENTS.md`. Never add migration code.

**2. PERFECT**: Take unlimited time/calls for correctness. Refactor aggressively. No "good enough".

**3. TEST**: Test everything with logic/side effects. Skip only: trivial getters, UI components, config.

**4. SYNC**: `AGENTS.md` = truth. Update after API/feature/auth changes. `CLAUDE.md` & `README.md` = symlinks to `AGENTS.md`.

**5. VERIFY**: Run lint/typecheck/test before proceeding. Never continue with errors.

**6. COMMIT**: `git add -A . && oco --fgm --yes` after each feature/fix/refactor.

**7. REAL**: Use actual service calls only. Crash on failure. No mocks/randoms/delays (except tests).

**8. COMPLETE**: Finish all code or mark `TODO: [description]`. Fail explicitly, never silently.

**9. TRACK**: TODOs use 6-hex IDs. Update TODO.md:
   ```typescript
   // TODO: (37c7b2) Skip Bun mocking - test separately
   ```
   ```markdown
   - **TODO:** _37c7b2_ `test/file.ts:18` Description
   ```

**10. SHARE**: Extract duplicated logic to a shared utility immediately. Add docs+tests+types.

### ⚡ QUICK REFERENCE
**ALWAYS**: Break compatibility • Test everything • Real data only • Complete code • Extract duplicates
**NEVER**: Migration code • Mock data • Silent failures • Copy-paste • Outdated docs

