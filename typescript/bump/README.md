# 🚀 Bump

A powerful dependency manager that updates packages across multiple repositories and programming languages with intelligent version bumping.

## ✨ Features

- **Multi-Repository Support** - Process all repos under `/Users/dave/src/github.com/daveio/` or target a specific one
- **Multi-Language Support** - Handle dependencies from JavaScript/TypeScript, Python, and Ruby projects
- **Smart Version Bumping** - Automatically apply updates based on semver rules:
  - Patch updates (`z` in `x.y.z`) - Update silently
  - Minor updates (`y` in `x.y.z`) - Update and note in output
  - Major updates (`x` in `x.y.z`) - Don't update by default, but note in output
- **Git Integration** - Fetch, pull, commit, and push changes seamlessly
- **Beautiful Terminal UI** - Colorful output with spinners, progress indicators, and boxed summaries
- **Customizable Workflow** - Skip any step of the process with command-line flags

## 📦 Installation

The script is already installed at:
```bash
/Users/dave/src/github.com/daveio/myriad/typescript/bump/
```

A symlink has been created at `/Users/dave/bin/bump` for easy access from anywhere.

If you need to rebuild the TypeScript code:

```bash
cd /Users/dave/src/github.com/daveio/myriad/typescript/bump
bun install
bun run build
```

## 🚀 Usage

### Basic Usage

```bash
# Check updates across all repositories
bump

# Target a specific repository
bump next-dave-io

# Dry run mode (no changes)
bump --dry-run

# Update all dependencies, including major versions
bump --unsafe
```

### Examples

```bash
# Check what would be updated without making changes
bump --dry-run

# Update dependencies for a specific repo but don't commit
bump next-dave-io --no-commit

# Skip git operations but update lockfiles
bump --no-pull --no-commit --no-push

# Allow major version updates
bump --unsafe
```

## 🎛️ Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Make no changes, just print what would be updated |
| `--unsafe` | Override version rules to bump all version levels to latest |
| `--no-pull` | Skip git fetch and pull operations |
| `--no-install` | Skip dependency installation/update |
| `--no-commit` | Skip git commit step |
| `--no-push` | Skip git push step |
| `[repo]` | Target a specific repository |

## ⚙️ How It Works

1. **Repository Discovery**
   - Find all git repositories under `/Users/dave/src/github.com/daveio/`
   - Or focus on a specific repository provided as an argument

2. **Git Operations**
   - Fetch all branches, tags, and prune
   - Pull with rebase

3. **Dependency Reading**
   - Parse dependency files based on language
   - Extract dependency names and versions

4. **Update Check**
   - Query package manager APIs for latest versions
   - Determine update type (patch, minor, major)

5. **Apply Updates**
   - Update files with new versions based on update rules
   - Respect original file formatting

6. **Update Lockfiles**
   - Run appropriate package manager commands
   - Ensure dependencies are properly locked

7. **Commit & Push**
   - Add all changes
   - Commit using OpenCommit
   - Push to remote

8. **Output Summary**
   - Display detailed update information
   - Group by repository or dependency based on mode

## 📄 Supported File Types

| Language | File Types |
|----------|------------|
| JavaScript/TypeScript | `package.json` |
| Python | `pyproject.toml` |
| Ruby | `Gemfile`, `*.gemspec` |

## 🔮 Limitations & Future Improvements

- **Parallelization** - Process multiple repositories and API calls concurrently
- **Additional Languages** - Add support for Cargo (Rust), Go modules, etc.
- **Caching** - Cache registry queries for better performance
- **Custom Rules** - Allow per-repository or per-package update rules
- **Rollback Support** - Automatic rollback if build/tests fail after update
- **Update Groups** - Group related dependencies that should be updated together
- **Changelogs** - Fetch and display changelog information for updated packages
- **Pre/Post Hooks** - Run custom commands before or after updates
- **Update Schedule** - Support for scheduled updates with a cron-like interface

## 📝 License

MIT

