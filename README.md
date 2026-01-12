# LazyTask 🚵‍♂️

A `lazydocker`-inspired, multi-pane Terminal User Interface (TUI) for managing your tasks. Built with Deno and Cliffy.

## Features
- **Modern Multi-Pane TUI:** Navigate your tasks with a sidebar and detailed view.
- **Interactive Modals:** Add, update, and delete tasks in centered popup windows with dimmed backgrounds.
- **Keyboard Driven:** Use `j/k` or arrows for navigation; `a`, `u`, `d`, `m` for actions.
- **Persistent Storage:** Tasks are saved automatically to `tasks.json`.

## Installation

### Prerequisites
- [Deno](https://deno.land/) installed on your system.

### Global Installation
Install LazyTask as a global command:
```bash
deno install -A -n lazytask file:///home/sam/github/task-list-cli/main.ts
```

## Usage
Run the dashboard:
```bash
lazytask
# or
deno task dashboard
```

### Keybindings
| Key | Action |
|-----|--------|
| `j` / `↓` | Select next task |
| `k` / `↑` | Select previous task |
| `a` | Add new task (Modal) |
| `u` / `Enter` | Update selected task (Modal) |
| `d` | Delete selected task (Modal) |
| `m` | Mark status (Followed by `t`, `i`, or `d`) |
| `q` / `Ctrl+C` | Quit |

## Development
```bash
# Run the dashboard
deno task dashboard
```
