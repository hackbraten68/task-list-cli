# LazyTask 🚵‍♂️

A modern, `lazydocker`-inspired Task Management TUI with priority, due date, and flexible tagging support.

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

LazyTask features a modern TUI for interactive task management with support for priorities, due dates, detailed descriptions, and flexible tagging system.

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
lazytask add "Code review" --tags "urgent,work"
lazytask add "Grocery shopping" --tags "personal,weekly" --priority low
```

**Options:**
- `-p, --priority <priority>` — `low`, `medium`, `high`, `critical`
- `-d, --details <details>` — Additional task details
- `-u, --due-date <date>` — Due date (YYYY-MM-DD)
- `-t, --tags <tags>` — Comma-separated tags (e.g., "urgent,work")

### List Tasks
```bash
lazytask list
lazytask list --status todo
lazytask list --status in-progress
lazytask list --priority high
lazytask list --tags urgent
lazytask list --tags "work,personal"
```

**Options:**
- `-s, --status <status>` — Filter by `todo`, `in-progress`, `done`
- `-p, --priority <priority>` — Filter by priority
- `-t, --tags <tags>` — Filter by tags (comma-separated, partial matches supported)

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

## 🏷️ Task Tagging

LazyTask supports flexible task tagging to help organize and filter your tasks:

### Adding Tags
- **CLI:** Use `--tags "tag1,tag2,tag3"` when adding tasks
- **Interactive:** The add/update commands will prompt for tags (comma-separated)

### Tag Management
- **Update Tags:** Use `lazytask update` to modify existing tags
- **Preserve Tags:** Leave tag input empty to keep current tags
- **Clear Tags:** Enter `clear` when prompted to remove all tags

### Finding Tasks by Tags
```bash
# Find all urgent tasks
lazytask list --tags urgent

# Find tasks tagged with work or personal
lazytask list --tags "work,personal"

# Combine filters
lazytask list --status todo --tags urgent
```

### Tag Display
- Tags appear in the task list table
- Dashboard shows tags in task details
- Empty tag lists show as "-" in the interface

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
