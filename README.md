# agentgif

[![npm](https://img.shields.io/npm/v/agentgif)](https://www.npmjs.com/package/agentgif)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![AgentGIF Badge](https://agentgif.com/badge/npm/agentgif/version.svg?theme=dracula)](https://agentgif.com/docs/cli/)

**CLI for [AgentGIF](https://agentgif.com) — upload, manage, and share terminal GIFs from the command line.**

[AgentGIF](https://agentgif.com) is a developer GIF hosting platform built for terminal recordings. Upload GIFs with asciicast files for interactive replay across 15 terminal themes, generate terminal-themed package badges as a shields.io alternative, and share command-line demos with embeddable codes for GitHub READMEs and documentation. Built with TypeScript using [Commander.js](https://github.com/tj/commander.js).

> **Try it live at [agentgif.com](https://agentgif.com)** — [Explore GIFs](https://agentgif.com/explore/) | [Badge Generator](https://agentgif.com/docs/cli/) | [Upload](https://agentgif.com/upload/)

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [What You Can Do with AgentGIF](#what-you-can-do-with-agentgif)
  - [Upload and Share Terminal GIFs](#upload-and-share-terminal-gifs)
  - [Terminal Cast Replay with Themes](#terminal-cast-replay-with-themes)
  - [Terminal-Themed Package Badges](#terminal-themed-package-badges)
  - [AI Tape Generator](#ai-tape-generator)
  - [Collections and Tags](#collections-and-tags)
  - [Search and Embed](#search-and-embed)
- [Commands](#commands)
  - [Authentication](#authentication)
  - [GIF Management](#gif-management)
  - [Badge Service](#badge-service)
- [Configuration](#configuration)
- [Also Available](#also-available)
- [Learn More About AgentGIF](#learn-more-about-agentgif)
- [License](#license)

## Install

```bash
npm install -g agentgif
```

Requires Node.js 18+.

## Quick Start

```bash
# Authenticate via browser (device flow)
agentgif login

# Upload a GIF with metadata
agentgif upload demo.gif --title "npm test" --command "npm test -- --coverage"

# Search public terminal GIFs
agentgif search "webpack build"

# Generate embed codes for any GIF
agentgif embed abc12345

# Generate a terminal-themed badge for your npm package
agentgif badge url -p npm -k agentgif --theme monokai
```

## What You Can Do with AgentGIF

### Upload and Share Terminal GIFs

[AgentGIF](https://agentgif.com) hosts GIFs designed for developer workflows — terminal recordings from tools like [asciinema](https://asciinema.org), [VHS](https://github.com/charmbracelet/vhs), or screen capture. Each upload accepts metadata including title, description, the command being demonstrated, tags, and the repository context. GIFs are served from a global CDN at `media.agentgif.com`.

```bash
# Upload with full metadata
agentgif upload demo.gif \
  --title "Running Jest with coverage" \
  --description "Full test suite with branch coverage" \
  --command "npx jest --coverage" \
  --tags "javascript,testing,jest,coverage"

# Include an asciicast file for interactive terminal replay
agentgif upload demo.gif --cast demo.cast --theme solarized-dark
```

When you include a `.cast` asciicast file, [AgentGIF](https://agentgif.com/explore/) provides interactive terminal replay — viewers see exact keystrokes, timing, and output as if watching the terminal live. Choose from 15 terminal themes including Dracula, Monokai, Solarized Dark, and Nord.

Learn more: [Upload a GIF](https://agentgif.com/upload/) · [Explore Terminal GIFs](https://agentgif.com/explore/)

### Terminal Cast Replay with Themes

Every GIF on AgentGIF can include an asciicast recording for frame-by-frame terminal replay. The cast player supports 15 built-in terminal themes:

| Theme | Style | Best For |
|-------|-------|----------|
| Dracula | Purple-toned dark | General-purpose, high contrast |
| Monokai | Warm dark | Code demos, syntax-heavy output |
| Solarized Dark | Blue-green dark | Long-form terminal sessions |
| Nord | Cool blue dark | Minimal, distraction-free |
| Catppuccin Mocha | Pastel dark | Modern developer aesthetic |
| One Dark | Atom-inspired dark | Familiar to VS Code users |
| Tokyo Night | Deep purple dark | Japanese-inspired minimalism |
| Gruvbox Dark | Retro warm dark | Vim/Neovim workflows |

```bash
# Upload with a specific terminal theme
agentgif upload demo.gif --cast demo.cast --theme catppuccin-mocha
```

Learn more: [Terminal Themes](https://agentgif.com/themes/) · [Explore GIFs](https://agentgif.com/explore/)

### Terminal-Themed Package Badges

The [AgentGIF badge service](https://agentgif.com/docs/cli/) generates terminal-themed SVG badges — a developer-native alternative to shields.io. Badges render as terminal prompts with live data from PyPI, npm, crates.io, and GitHub.

```bash
# npm version badge
agentgif badge url -p npm -k express
# → https://agentgif.com/badge/npm/express/version.svg

# npm badge with Dracula theme
agentgif badge url -p npm -k react --theme dracula
# → https://agentgif.com/badge/npm/react/version.svg?theme=dracula

# GitHub stars badge
agentgif badge url -p github -k "vercel/next.js" -m stars
# → https://agentgif.com/badge/github/vercel/next.js/stars.svg

# Get Markdown embed code
agentgif badge url -p npm -k typescript --format md
```

**Providers:** `pypi`, `npm`, `crates`, `github`
**Metrics:** `version`, `downloads`, `stars`
**Themes:** All 15 terminal themes — `dracula`, `monokai`, `catppuccin-mocha`, `nord`, etc.

Learn more: [Badge Generator](https://agentgif.com/docs/cli/) · [Badge Documentation](https://agentgif.com/docs/cli/)

### AI Tape Generator

The `generate` command uses AI to automatically create [VHS tape files](https://github.com/charmbracelet/vhs) from any GitHub repository. It analyzes the README, `package.json`, and source code to produce realistic terminal demo recordings.

```bash
# Generate terminal demo GIFs from a GitHub repository
agentgif generate https://github.com/expressjs/express

# Check generation status
agentgif generate-status <job-id>
```

Learn more: [AI Tape Generator](https://agentgif.com/generate/) · [API Reference](https://agentgif.com/docs/api/)

### Collections and Tags

Organize GIFs into [collections](https://agentgif.com/collections/) — curated groups of related terminal recordings. Tag GIFs with descriptive labels for discovery across the platform.

```bash
# List your GIFs filtered by repository
agentgif list --repo "myorg/myrepo"

# View GIF details including tags
agentgif info abc12345
```

Learn more: [Collections](https://agentgif.com/collections/) · [Tags](https://agentgif.com/collections/)

### Search and Embed

Find terminal GIFs with full-text search. Every GIF includes ready-to-use embed codes for Markdown, HTML, iframes, and script tags — perfect for GitHub READMEs and documentation sites.

```bash
# Search for TypeScript-related terminal GIFs
agentgif search "tsc build"

# Get all embed formats
agentgif embed abc12345

# Get only the Markdown embed for GitHub README
agentgif embed abc12345 --format md
```

Learn more: [Search GIFs](https://agentgif.com/explore/) · [Embed Documentation](https://agentgif.com/docs/cli/)

## Commands

### Authentication

```bash
agentgif login          # Open browser to authenticate (device flow)
agentgif logout         # Remove stored credentials
agentgif whoami         # Show current user info
```

### GIF Management

```bash
agentgif upload <gif>   # Upload a GIF
  -t, --title <title>       GIF title
  -d, --description <desc>  Description
  -c, --command <cmd>        Command demonstrated
  --tags <tags>              Comma-separated tags
  --cast <path>              Asciicast file for interactive replay
  --theme <theme>            Terminal theme (dracula, monokai, nord, etc.)
  --unlisted                 Upload as unlisted
  --no-repo                  Don't auto-detect git repository

agentgif search <query>   # Search public GIFs
agentgif list             # List your GIFs
  --repo <repo>              Filter by repository slug

agentgif info <gifId>     # Show GIF details (JSON)
agentgif embed <gifId>    # Show embed codes
  -f, --format <fmt>         md, html, iframe, script, all

agentgif update <gifId>   # Update GIF metadata
  -t, --title <title>       New title
  -d, --description <desc>  New description
  -c, --command <cmd>        New command
  --tags <tags>              New tags

agentgif delete <gifId>   # Delete a GIF
  -y, --yes                  Skip confirmation

agentgif generate <url>         # AI-generate demo GIFs from a GitHub repo
agentgif generate-status <id>   # Check generation job status
```

### Badge Service

```bash
agentgif badge url        # Generate badge URL + embed codes
  -p, --provider <p>        pypi, npm, crates, github
  -k, --package <pkg>       Package name (or owner/repo for GitHub)
  -m, --metric <m>          version, downloads, stars (default: version)
  --theme <theme>            Terminal theme (e.g. dracula, monokai)
  --style <style>            Badge style (default, flat)
  -f, --format <fmt>         url, md, html, img, all

agentgif badge themes     # List all available terminal themes
```

## Configuration

Credentials are stored at `~/.config/agentgif/config.json`.

The CLI authenticates via GitHub OAuth device flow — run `agentgif login` and approve in your browser.

## Also Available

The AgentGIF CLI is available in 5 languages:

| Language | Package | Install | Source |
|----------|---------|---------|--------|
| Python | [PyPI](https://pypi.org/project/agentgif/) | `pip install agentgif` | [agentgif-python](https://github.com/dobestan/agentgif-python) |
| **Node.js** | [npm](https://www.npmjs.com/package/agentgif) | `npm install -g agentgif` | [agentgif-node](https://github.com/dobestan/agentgif-node) |
| Rust | [crates.io](https://crates.io/crates/agentgif) | `cargo install agentgif` | [agentgif-rust](https://github.com/dobestan/agentgif-rust) |
| Ruby | [RubyGems](https://rubygems.org/gems/agentgif) | `gem install agentgif` | [agentgif-ruby](https://github.com/dobestan/agentgif-ruby) |
| Go | [pkg.go.dev](https://pkg.go.dev/github.com/dobestan/agentgif-go) | `go install github.com/dobestan/agentgif-go@latest` | [agentgif-go](https://github.com/dobestan/agentgif-go) |

All implementations share the same command interface and API.

## Learn More About AgentGIF

- **Platform**: [agentgif.com](https://agentgif.com) — Developer GIF hosting for terminal recordings
- **Explore**: [Browse Terminal GIFs](https://agentgif.com/explore/) · [Collections](https://agentgif.com/collections/) · [Tags](https://agentgif.com/collections/)
- **Tools**: [Badge Generator](https://agentgif.com/docs/cli/) · [AI Tape Generator](https://agentgif.com/generate/) · [Upload](https://agentgif.com/upload/)
- **Search**: [Search GIFs](https://agentgif.com/explore/) · [Terminal Themes](https://agentgif.com/themes/)
- **Docs**: [CLI Documentation](https://agentgif.com/docs/cli/) · [API Reference](https://agentgif.com/docs/api/)

## License

MIT
