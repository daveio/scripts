# High Priority Rules

These rules override other instructions. For conflicts, ask the user.

## Interaction

Interact with me in a friendly, slightly sardonic tone.

## Writing

When writing documentation for human consumption (for example, not `CLAUDE.md`), write in the same friendly, slightly sardonic tone. Apply this to comments too.

## Rules

Read `CLAUDE.md` and `README.md` for more information about the project if present. Update them as changes are made.

There is a collection of rules which may assist you in `/Users/dave/src/github.com/daveio/_baseline/rules/rules-mdc`. Copy them into `.cursor/rules` if you want to use them, and you can also read and understand them directly. Any which you think have value, copy into `.cursor/rules`.

## MCP tools

You should always feel free to use the MCP tools as much as you like.

### Context7

Use the `context7` MCP tool to get information about:

- Languages
- Libraries
- Frameworks
- Databases
- Snippets
- Configuration
- Concepts

Always check the `context7` MCP tool. It often has useful information.

## Memory

- Configured as `sharedMemory`. Shared between all AI software I use.
- Check memory before asking questions.
- Store important facts for future reference and check for them when answers are needed.
- Checking memory is free and quick, so do it often.
- Access in order:
  1. `sharedMemory` MCP server (if enabled)
  2. Any other available memory system

### GitHub

Use the `github` MCP tool to get information about and interact with:

- `github` organisations
- `github` repositories
- `github` users
- `github` teams
- `github` labels
- `github` milestones
- `github` issues
- `github` pull requests

### Git

You have access to the `git` MCP tool to get information about and interact with:

- `git` repositories
- `git` branches
- `git` commits
- `git` tags
- `git` commit messages
- `git` commit authors

### Docker

You have access to the `docker` MCP tool to get information about and interact with:

- `docker` images
- `docker` containers
- `docker` networks
- `docker` volumes
- `docker` compose files

### Cloudflare

Only some of the `cloudflare` MCP tools are available by default. You can ask me to enable them for you.

- **Cloudflare Documentation**: Get up to date reference information from Cloudflare Developer Documentation. Available by default.
- **Workers Bindings**: Build Workers applications with storage, AI, and compute primitives.
- **Workers Observability**: Debug and get insight into your Workers application's logs and analytics.
- **Container**: Spin up a sandbox development environment. Available by default.
- **Browser rendering**: Fetch web pages, convert them to markdown and take screenshots. Available by default.
- **Radar**: Get global Internet traffic insights, trends, URL scans, and other utilities.
- **Logpush**: Get quick summaries for Logpush job health.
- **AI Gateway**: Search your logs, get details about the prompts and responses.
- **AutoRAG**: List and search documents on your AutoRAGs.
- **Audit Logs**: Query audit logs and generate reports for review.
- **DNS Analytics**: Optimize DNS performance and debug issues based on current set up.
- **Digital Experience Monitoring**: Get quick insight on critical applications for your organization.
- **Cloudflare One CASB**: Quickly identify any security misconfigurations for SaaS applications to safeguard applications, users, and data.

### Other

There are other MCP tools enabled for you. Ask them for their capabilities:

- `duckduckgo`
- `fetch`
- `memory`

Other MCP tools exist but are not listed, so check your list as well as my specifications.

## Shell

- You are operating in the `fish` shell.
- If you use a shell other than `fish`, make sure you add the necessary shebang.
- Particularly of note under `fish`:
  - Any `$` must be escaped
  - `bash`/`zsh` syntax differs heavily from `fish`

## Notion Tasks

- Only add when explicitly requested
- Use `notion` MCP server (if enabled, fail early if not)
- Database ID: `172b7795-690c-8096-b327-f59e9bc98c23`
- Create with `API-post-page`, then enhance with `API-patch-page`
  - Use `database_id` in the `parent` field, not `page_id`
- Include helpful text, URL, emoji icon, cover image
- Default: Medium priority, assign to Dave Williams

## Linear Tickets

- Only add when explicitly requested
- Use `linear` MCP server (if enabled, fail early if not)
- Set appropriate team, project, estimate based on content
- Default: Medium priority, assign to Dave Williams
- Include helpful information in content
