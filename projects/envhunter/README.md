# EnvHunter 🔍

**EnvHunter** is a Ruby-based CLI tool that searches GitHub repositories or gists for `.env` files containing potentially sensitive high-entropy secrets like API keys or tokens.

## ⚙️ Features

- 🔎 Searches GitHub repos or gists for `.env` files
- 🧪 Detects `.env` variables with names containing `KEY` or `TOKEN`
- 📈 Filters secrets based on entropy (Shannon entropy)
- 💬 Outputs results to YAML file if desired
- 🔐 Uses GitHub API (requires a Personal Access Token)

## 🔐 Authentication

Set your GitHub token:

```bash
export GITHUB_TOKEN=your_token_here
```

## 🧰 Installation

### As a Ruby Gem

```bash
gem install envhunter
```

Or clone and build locally:

```bash
git clone https://github.com/yourusername/envhunter.git
cd envhunter
gem build envhunter.gemspec
gem install envhunter-1.0.0.gem
```

## 🐳 Docker

```bash
docker build -t envhunter .
docker run --rm -e GITHUB_TOKEN=your_token_here envhunter scan --mode gists --output envhunter.yaml
```

## 🚀 Usage

```bash
envhunter scan [options]
```

### Options

| Option              | Description                  |
| ------------------- | ---------------------------- |
| `--mode`            | `repos` (default) or `gists` |
| `--output FILENAME` | Write YAML to `FILENAME`     |

## 📝 License

MIT License © 2025 Dave Williams <dave@dave.io>
