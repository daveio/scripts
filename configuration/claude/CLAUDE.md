# CLAUDE.md - AI Agent Instructions

**TARGET AUDIENCE**: AI agents only. Humans use README.md.
**OPTIMIZATION**: Information density maximized, token usage minimized.

## 🚨 UNIVERSAL DEVELOPMENT RULES (MANDATORY)

These rules are REQUIRED for all repositories and override all other considerations.

### 1️⃣ **QUALITY OVER SPEED**
- Unlimited time for correct implementations
- Unlimited AI calls for research/verification
- Most robust solution, not quickest
- Ruthless refactoring when improvements spotted
- FORBIDDEN: "good enough", hacks, shortcuts, API call concerns

### 2️⃣ **MANDATORY TESTING**
- All logic/side effects MUST have tests
- NO EXCEPTIONS - function written = test written
- Cover edge cases and error conditions
- Tests must pass before commits
- TEST: API endpoints (backend), utility functions, auth/validation, database ops, error paths
- SKIP: trivial getters/setters, frontend components, pure config objects

### 3️⃣ **SYNCHRONIZED DOCUMENTATION**
After ANY significant change, update BOTH:
- `CLAUDE.md` - Technical reference for AI agents
- `README.md` - User-friendly guide
- TRIGGERS: API changes, features, architecture, auth, config, breaking changes

### 4️⃣ **QUALITY VERIFICATION WORKFLOW**
MANDATORY SEQUENCE:
1. PRIMARY: `bun run lint`, `bun run typecheck`, `bun run test`
2. FULL BUILD: `bun run check` (only after primary passes)
- Fix immediately if fails
- Add specific TODOs if must defer

### 5️⃣ **COMMIT HYGIENE**
- WHEN: after features/bugs/refactoring, before new work
- METHOD: `git add -A . && oco --fgm --yes` or `git add -A . && git commit -am "[emoji] [description]"`
- NEVER COMMIT: failing tests, TS errors, lint violations, broken builds

### 6️⃣ **ZERO TOLERANCE MOCK DATA**
- PRINCIPLE: Real service calls only, crash loudly on failure
- FORBIDDEN: Math.random(), hardcoded metrics, mock data, demo modes, fallback masking
- REQUIRED: Real service calls, explicit errors, proper HTTP codes, visible crashes
- EXCEPTION: Test files only

### 7️⃣ **NO INCOMPLETE IMPLEMENTATIONS**
- Nothing "for later" without explicit marking
- FORBIDDEN: Empty functions, generic errors, silent failures
- REQUIRED: `// TODO: [specific description]` for all incomplete work
- PRINCIPLE: Crash visibly vs fail silently

### 8️⃣ **PRE-PRODUCTION BREAKING CHANGES** (Active Until Production)
- Break freely to improve code quality
- FORBIDDEN: migrations, backwards compatibility
- REQUIRED: Document changes, list breakage, explain improvements

## Interaction

Interact with me in a friendly, slightly sardonic and sarcastic, tone.

## Creative Writing

When writing creatively for human consumption (for example, not `CLAUDE.md`), write in the same friendly, slightly sardonic and sarcastic, tone. Apply this to documentation comments too. Don't let it stop you from getting information across in a succinct way.

## Help and Documentation

There is a collection of rules which may assist you in `/Users/dave/src/github.com/daveio/myriad/submodules/sanjeed5--awesome-cursor-rules/rules-mdc`.

The rules cover a wide range of tools, frameworks, and languages.

## MCP tools

- You should always feel free to use the MCP tools as much as you like.
- If you want to use a MCP which I have listed but it is not available or enabled, ask me to enable it.
  - You may just be hitting limits of enabled tools, and it's a problem I can trivially solve.

### `ableton-live` / `abletonLive` / `abletonlive`

Interact with the Ableton Live DAW.

### `claude-code` / `claudeCode` / `claudecode`

A toolkit provided by Claude Code, made available to other agents.

### `cloudflare-ai` / `cloudflareAi` / `cloudflareai`

Search your logs, get details about the prompts and responses.

### `cloudflare-audit` / `cloudflareAudit` / `cloudflareaudit`

Query audit logs and generate reports for review.

### `cloudflare-autorag` / `cloudflareAutorag` / `cloudflareautorag`

List and search documents on your AutoRAGs

### `cloudflare-bindings` / `cloudflareBindings` / `cloudflarebindings`

Build Workers applications with storage, AI, and compute primitives.

### `cloudflare-container` / `cloudflareContainer` / `cloudflarecontainer`

Spin up a sandbox development environment. Spin up remote containers and interact with them.

### `cloudflare-dns` / `cloudflareDns` / `cloudflareDns`

Optimize DNS performance and debug issues based on current set up.

### `cloudflare-documentation` / `cloudflareDocumentation` / `cloudflaredocumentation`

Get up to date reference information from Cloudflare Developer Documentation.

  - Consult this MCP whenever you need to interact with Cloudflare or develop for a Cloudflare platform.
  - It can both answer questions and provide best practices, so check it early and often.

### `cloudflare-observability` / `cloudflareObservability` / `cloudflareobservability`

Debug and get insight into your Workers application's logs and analytics.

### `cloudflare-radar` / `cloudflareRadar` / `cloudflareradar`

Get global Internet traffic insights, trends, URL scans, and other utilities.

- **Cloudflare One CASB**: Quickly identify any security misconfigurations for SaaS applications to safeguard applications, users, and data

### `cloudflare-rendering` / `cloudflareRendering` / `cloudflarerendering`

Fetch web pages, convert them to markdown and take screenshots.

### `console-ninja` / `consoleNinja` / `consoleninja`

Provide browser and server errors and logs from the running app (in a browser) to an AI agent.

### `context7`

Get information about:

- Languages
- Libraries
- Frameworks
- Databases
- Snippets
- Configuration
- Concepts

Always check the `context7` MCP tool. It often has useful information.

### `docker`

Get information about and interact with:

- `docker` images
- `docker` containers
- `docker` networks
- `docker` volumes
- `docker` compose files

### `duckduckgo`

Web search and page fetching capabilities. Often fails due to rate limiting.

### `fetch`

Web content fetching and processing.


`fetch` - Fetches a URL from the internet and extracts its contents as markdown.

- url (string, required): URL to fetch
- max_length (integer, optional): Maximum number of characters to return (default: 5000)
- start_index (integer, optional): Start content from this character index (default: 0)
- raw (booleanå, optional): Get raw content without markdown conversion (default: false)


### `filesystem`

Filesystem utilities, including file manipulation, editing, and searching.


- Read/write files
- Create/list/delete directories
- Move files/directories
- Search files
- Get file metadata


### `git`

Get information about and interact with:

- `git` repositories
- `git` branches
- `git` commits
- `git` tags
- `git` commit messages
- `git` commit authors

### `github`

Get information about and interact with:

- `github` organizations
- `github` repositories
- `github` users
- `github` teams
- `github` labels
- `github` milestones
- `github` issues
- `github` pull requests

### `linear`

- Linear is my tool for managing tasks, both development and otherwise.
- I have memory issues. I add the most trivial tasks to Linear to remember them. You should do the same.
- Set appropriate team, project, estimate based on content.
- Default: assign to Dave Williams.
- Include helpful information in content.

### `notion`

- Notion is my tool for managing information.
- I have memory issues. I add the most trivial things to Notion to remember them. You should do the same.
- Create new pages in the Inbox.
  - Inbox database ID: `7f0b51a57eb4457aaaff0ed52b8542f9?v=eb077bbefeb0456c92d0dcb7de945ed8`
  - Write new pages directly into this database. Don't create a container page.
  - You may need to format the database ID differently.
- Include helpful information in content.

### `pdf-reader` / `pdfReader` / `pdfreader`

Get plain text or Markdown from PDF files.

### `pieces`

Access the Pieces long-term memory engine. It monitors my computer use and forms context about what I've been doing.

You can ask `pieces` about what I've been doing and it will answer with context. Due to my memory issues, Pieces is likely to remember things better than I can.

Prefer `shared-memory` / `sharedMemory` / `sharedmemory` when writing information, but ask  `pieces` questions as much as you like.

Writing to Pieces can be difficult due to the expected JSON format.

You can ask `pieces` about what I've been doing and it will answer with context. Due to my memory issues, Pieces is likely to remember things better than I can.

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

## Shell

⚠️ IMPORTANT ⚠️

- You are operating in the `fish` shell.
- You don't have to use `fish` for your scripts.
  - If you want touse a shell other than `fish`, **make sure you add the necessary shebang** for example `#!/usr/bin/env bash`.
- Particularly of note under `fish`:
  - Any `$` must be escaped.
  - `bash`/`zsh` syntax differs heavily from `fish`.