# LazyTask 🚵‍♂️

A modern, `lazydocker`-inspired Task Management TUI. Effortlessly manage your productivity with a keyboard-driven, multi-pane experience.

![LazyTask Header](https://raw.githubusercontent.com/deno-libs/cliffy/main/assets/cliffy.png)

## ✨ Features

- **Multi-Pane Dashboard**: Navigate tasks in a responsive sidebar and view full details, timestamps, and priorities in the main preview panel.
- **Interactive Modals**: Seamlessly add or update tasks in centered popup windows.
- **Contextual Dimming**: The background dashboard dynamically dims when modals are active, keeping your focus on the task at hand.
- **Modern ANSI Aesthetics**: Rich color palettes, ASCII branding, and smooth TUI transitions.
- **Keyboard Mastery**: Optimized for speed with single-key navigation and global shortcuts.
- **Smart Persistence**: Automatic saving and loading via `tasks.json`.

## 🚀 Quick Start

### Prerequisites
- [Deno](https://deno.land/) (v1.40+)

### Global Installation
Install LazyTask globally to use the `lazytask` command anywhere:
```bash
deno task install
```
> [!NOTE]
> Make sure `~/.deno/bin` is in your `PATH`.

### Local Execution
```bash
# Run the TUI immediately
deno task dashboard
```

## ⌨️ Keybindings

| Key | Action |
|-----|--------|
| `j` / `↓` | Select next task |
| `k` / `↑` | Select previous task |
| `a` | **Add** a new task (Modal) |
| `u` / `⏎` | **Update** selected task (Modal) |
| `d` | **Delete** selected task (Modal) |
| `m` | **Mark** status (followed by `t`: todo, `i`: in-progress, `d`: done) |
| `q` / `⌃C` | Quit LazyTask |

## 🛠 Related Tasks (CLI Mode)
LazyTask also supports traditional CLI arguments for quick automation:
```bash
lazytask add "New task" --priority high
lazytask list --status todo
lazytask mark done 1
```

## 📂 Project Structure
- `main.ts`: Entry point and CLI command definitions.
- `src/commands/`: Individual logic for dashboard, add, update, etc.
- `src/ui.ts`: The TUI rendering engine (panels, boxes, modals).
- `src/storage.ts`: Task persistence and migration logic.

---
Built with [Cliffy](https://cliffy.io/) & [Deno](https://deno.com/) 🦕
