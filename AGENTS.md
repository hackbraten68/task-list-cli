# Agent Guidelines for Task List CLI

This document provides guidelines for AI agents working on the LazyTask CLI
codebase.

## Build, Test, and Lint Commands

### Running Tests

```bash
# Run all tests
deno test

# Run a specific test file
deno test main_test.ts

# Run tests with coverage
deno test --coverage=coverage main_test.ts
```

### Linting and Formatting

```bash
# Lint the codebase
deno lint

# Format code
deno fmt

# Check formatting without changes
deno fmt --check
```

### Development and Build Commands

```bash
# Development server (watch mode)
deno task dev

# Run specific CLI commands
deno task dashboard    # Open TUI dashboard
deno task list         # List tasks
deno task add          # Add task interactively
deno task update       # Update task interactively
deno task delete       # Delete task interactively
deno task mark-done    # Mark task as done
deno task mark-in-progress  # Mark task as in progress

# Install globally
deno task install
```

## Code Style Guidelines

### TypeScript and Deno Conventions

#### Imports

- Use JSR imports for Deno standard library and third-party modules
- Group imports: external libraries first, then local imports
- Use relative imports for local modules (`./`, `../`)
- Sort imports alphabetically within groups

```typescript
import { Command } from "cliffy";
import { colors } from "cliffy/ansi";
import { format } from "@std/datetime";
import { assertEquals } from "@std/assert";

import { Task } from "./types.ts";
import { UI } from "./ui.ts";
```

#### Types and Interfaces

- Define interfaces in `types.ts` for shared types
- Use union types for enums (string literals)
- Use optional properties with `?` for nullable fields
- Prefer interfaces over type aliases for object shapes

```typescript
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: number;
  description: string;
  details?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Naming Conventions

- **Files**: kebab-case (`add-command.ts`, `task-storage.ts`)
- **Functions**: camelCase (`addTask`, `loadTasks`, `getNextId`)
- **Variables**: camelCase (`taskList`, `newTask`)
- **Constants**: UPPER_SNAKE_CASE (`TASK_FILE`)
- **Classes/Types**: PascalCase (`TaskManager`, `UI`)
- **Properties**: camelCase (`taskId`, `createdAt`)

#### Functions and Async Code

- Use async/await for asynchronous operations
- Return `Promise<T>` for async functions
- Use arrow functions for callbacks and short functions
- Prefer const over let, avoid var

```typescript
export async function loadTasks(): Promise<Task[]> {
  try {
    const data = await Deno.readTextFile(TASK_FILE);
    return JSON.parse(data);
  } catch {
    return [];
  }
}
```

#### Error Handling

- Use try/catch blocks for file operations and external calls
- Empty catch blocks are acceptable for optional operations (loading files that
  may not exist)
- Throw descriptive errors for invalid inputs
- Use early returns to avoid deep nesting

```typescript
export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await Deno.writeTextFile(TASK_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    throw new Error(`Failed to save tasks: ${error.message}`);
  }
}
```

#### Control Flow and Logic

- Use switch statements for enum-based logic
- Prefer array methods (map, filter, find) over loops when possible
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safe property
  access
- Destructure objects and arrays for cleaner code

```typescript
const statusText = this.statusPipe(task.status);

const priority = task.priority ?? "medium";
const { description, details } = task;
```

### CLI and TUI Patterns

#### Command Structure

- Use Cliffy for CLI argument parsing
- Define commands in `main.ts` with clear descriptions
- Use action callbacks for command execution
- Validate inputs before processing

```typescript
.command("add", "Add a new task")
.arguments("[description:string]")
.option("-p, --priority <priority:string>", "Task priority")
.action(async (options, description) => {
    await addCommand(description, options);
})
```

#### UI/UX Patterns

- Use consistent colors from Cliffy for status indicators
- Provide clear success/error/info messages
- Use ANSI escape codes for cursor positioning in TUI
- Handle both interactive (TUI) and non-interactive (CLI) modes

#### Task Management Logic

- Always load/save tasks through storage functions
- Use `getNextId()` for generating new task IDs
- Update `updatedAt` timestamp on modifications
- Maintain data integrity during operations

### File Organization

#### Project Structure

```
├── main.ts              # CLI entry point
├── main_test.ts         # Test suite
├── deno.json           # Deno configuration
├── src/
│   ├── types.ts        # Type definitions
│   ├── storage.ts      # Data persistence
│   ├── ui.ts           # TUI rendering
│   └── commands/       # Command implementations
│       ├── add.ts
│       ├── list.ts
│       └── ...
```

#### File Responsibilities

- `main.ts`: CLI setup and command routing only
- `src/commands/*.ts`: Individual command logic
- `src/storage.ts`: File I/O and data persistence
- `src/ui.ts`: TUI rendering and display logic
- `src/types.ts`: All type definitions
- `main_test.ts`: Integration tests

### Testing Guidelines

#### Test Structure

- Use Deno's built-in test framework
- Group related tests with `t.step()`
- Test both success and error cases
- Clean up state between tests

```typescript
Deno.test("Task management", async (t) => {
  await t.step("add task", async () => {
    // test logic
  });

  await t.step("update task", async () => {
    // test logic
  });
});
```

#### Assertions

- Use `@std/assert` for assertions
- Prefer `assertEquals` for value comparisons
- Test both return values and side effects

### Git and Workflow

#### Commit Messages

- Use imperative mood ("Add feature" not "Added feature")
- Start with action verb (Add, Fix, Update, Remove)
- Keep first line under 50 characters
- Add body for complex changes

#### Branching

- Use descriptive branch names (`feature/add-priority-filter`)
- Keep branches focused on single features
- Rebase on main before merging

### Performance Considerations

#### File Operations

- Minimize file reads/writes
- Cache loaded data when possible
- Use atomic operations for data integrity

#### TUI Rendering

- Batch console output when possible
- Use efficient string concatenation
- Handle terminal resizing gracefully

### Security Best Practices

#### Input Validation

- Validate user inputs (dates, enums, IDs)
- Sanitize file paths
- Use parameterized operations where available

#### File System Access

- Use Deno permissions appropriately (`--allow-read`, `--allow-write`)
- Validate file existence before operations
- Handle permission errors gracefully

### Code Quality Checks

Before committing changes, ensure:

1. `deno lint` passes
2. `deno fmt --check` passes
3. `deno test` passes
4. All imports are used
5. Types are properly defined
6. Error cases are handled</content>
   <parameter name="filePath">/home/sam/github/task-list-cli/AGENTS.md
