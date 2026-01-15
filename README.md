# LazyTask 🚵‍♂️

A modern, `lazydocker`-inspired Task Management TUI.

## 🛠 Installation

### Prerequisites
- [Deno](https://deno.land/) (v1.40+)

### Global Installation
Install LazyTask globally to use the `lazytask` command anywhere:
```bash
deno task install
```

### 🛣 Path Configuration
To run `lazytask` from anywhere, ensure that `~/.deno/bin` is in your `PATH`.

#### Bash / Zsh
Add the following to your `~/.bashrc` or `~/.zshrc`:
```bash
export PATH="$HOME/.deno/bin:$PATH"
```
Then reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

#### Fish
Run the following command in your terminal:
```fish
set -U fish_user_paths $HOME/.deno/bin $fish_user_paths
```

## 🚀 Getting Started

```bash
# Start the TUI dashboard
lazytask
```

## 📋 Commands

### Dashboard
```bash
lazytask                    # Open the TUI dashboard (default)
lazytask dashboard          # Same as above
```

### Add Tasks
```bash
lazytask add "Buy groceries"
lazytask add "Fix bug" --priority high
lazytask add "Deploy" --priority critical --details "Production release"
lazytask add "Meeting" --due-date 2026-01-20
```

**Options:**
- `-p, --priority <priority>` — `low`, `medium`, `high`, `critical`
- `-d, --details <details>` — Additional task details
- `-u, --due-date <date>` — Due date (YYYY-MM-DD)

### List Tasks
```bash
lazytask list
lazytask list --status todo
lazytask list --status in-progress
lazytask list --priority high
```

**Options:**
- `-s, --status <status>` — Filter by `todo`, `in-progress`, `done`
- `-p, --priority <priority>` — Filter by priority

### Update Tasks
```bash
lazytask update 1           # Interactive update for task #1
lazytask update             # Interactive task selection
```

### Mark Status
```bash
lazytask mark todo 1
lazytask mark in-progress 1
lazytask mark done 1
lazytask mark done          # Interactive task selection
```

**Statuses:** `todo`, `in-progress`, `done`

### Delete Tasks
```bash
lazytask delete 1           # Delete task #1
lazytask delete             # Interactive task selection
```

## ⌨️ Dashboard Keybindings

| Key | Action |
|-----|--------|
| `j` / `↓` | Select next task |
| `k` / `↑` | Select previous task |
| `a` | Add new task |
| `u` / `⏎` | Update selected task |
| `d` | Delete selected task |
| `m` | Mark status (`t`: todo, `i`: in-progress, `d`: done) |
| `q` / `⌃C` | Quit |
