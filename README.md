# LazyTask 🚀

**A modern, lazydocker-inspired Task Management TUI**

_Priority-based task management with interactive dashboard, bulk operations, and
flexible tagging_

## ⚡ Quick Start

```bash
# Install
deno task install

# Run
lazytask
```

## 🎯 Key Features

- **Interactive TUI Dashboard** - Navigate tasks with vim-like controls
- **Priority & Due Dates** - Organize tasks by urgency and deadlines
- **Multi-Select & Bulk Ops** - Efficiently manage multiple tasks
- **Statistics View** - Visual productivity analytics
- **Flexible Tagging** - Organize tasks with custom tags
- **Export/Import** - Backup and migrate your data

## 🛠️ Installation

**Prerequisites:** [Deno](https://deno.land/) v1.40+

```bash
# Install globally
deno task install

# Add to PATH (Bash/Zsh)
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 📋 Core Commands

### Dashboard Interfaces

```bash
lazytask          # CLI dashboard (menus/prompts)
lazytask dashboard  # TUI dashboard (interactive interface)
```

**Key Bindings:**

- `j/k` or `↓/↑` - Navigate tasks
- `a` - Add task
- `u` - Update task
- `d` - Delete task
- `Tab` - Multi-select mode
- `s` - Statistics view
- `q` - Quit

### CLI Operations

```bash
# Add tasks
lazytask add "Review code" --priority high --tags "work,urgent"

# List with filters
lazytask list --status todo --priority high

# Update tasks
lazytask update 1  # Interactive update

# Mark status
lazytask mark done 1

# Delete tasks
lazytask delete 1
```

## 🎛️ Dashboard Features

### Multi-Select Mode

- Press `Tab` to enter multi-select
- `Space` to select/deselect tasks
- `[✓]` shows selected tasks
- `Enter` - Full bulk operations menu
- `d` - Quick delete selected tasks

### Statistics View

- Press `s` to toggle statistics
- Completion progress bar
- Task distribution by status/priority
- Overdue task alerts

### Bulk Operations

```bash
# CLI bulk operations
lazytask bulk-mark done "1,2,3,5-8"
lazytask bulk-delete "1-5"
lazytask bulk-update "1,2,3" --priority high
```

## 🏷️ Task Options

### Priorities

- `low`, `medium`, `high`, `critical`

### Status

- `todo`, `in-progress`, `done`

### Tags

- Comma-separated: `--tags "work,urgent"`
- Filter by tags: `--tags work`

### Due Dates

- Format: `YYYY-MM-DD`
- Example: `--due-date 2024-12-31`

## 📤 Data Management

```bash
# Export tasks
lazytask export  # JSON export
lazytask export --format csv --output tasks.csv

# Import tasks
lazytask import backup.json
lazytask import --format csv tasks.csv
```

## 📊 Advanced Features

- **Search**: Press `/` in dashboard
- **Sort**: `o` to cycle sort fields, `r` to reverse
- **Menu System**: Press `h` for settings and advanced options
- **Real-time Updates**: Changes reflect immediately
- **Responsive Design**: Adapts to terminal width

## 🔧 Options Reference

### Add/Update Options

```bash
-p, --priority <level>    # Priority level
-d, --details <text>      # Task description
-u, --due-date <date>     # Due date (YYYY-MM-DD)
-t, --tags <tags>         # Comma-separated tags
```

### List/Filter Options

```bash
-s, --status <status>     # Filter by status
-p, --priority <level>    # Filter by priority
-t, --tags <tags>         # Filter by tags
--search <keyword>        # Search in description/details/tags
--sort-by <field>         # Sort field
--sort-order <asc|desc>   # Sort direction
```

### Export/Import Options

```bash
-f, --format <json|csv>   # File format
-o, --output <file>       # Output file
-m, --mode <merge|replace> # Import mode
```

## 🚀 Version 0.8.0

**UI Overhaul Release**

- Complete TUI redesign with modern interface
- Enhanced multi-select with visual indicators
- Improved bulk operations system
- Word wrapping for long text
- Statistics dashboard with progress bars
- Streamlined navigation and controls
