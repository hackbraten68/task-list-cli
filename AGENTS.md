# Agent Guidelines for LazyTask CLI

Guidelines for AI agents working on the LazyTask CLI codebase (Deno-based task management app with TUI/CLI interfaces).

## Build, Test, and Lint Commands

### Running Tests

```bash
# Run all tests
deno test

# Run specific test file (e.g., main integration tests)
deno test main_test.ts

# Run bulk operations tests
deno test src/bulk_operations_test.ts

# Run tests with coverage
deno test --coverage=coverage

# Run specific test function (use --filter)
deno test --filter "Data export/import functions" main_test.ts
```

### Linting and Formatting

```bash
# Lint entire codebase
deno lint

# Format code (modifies files)
deno fmt

# Check formatting without changes
deno fmt --check


```

### Development and Build Commands

```bash
# Development server with file watching
deno task dev

# Run TUI dashboard (default interface)
deno task dashboard

# Run CLI-style dashboard (alternative interface)
LAZYTASK_UI=cliffy deno task dashboard

# Install globally (requires --allow-all flag)
deno task install
```

## Code Style Guidelines

### TypeScript and Deno Conventions

#### Imports

- Use JSR imports for Deno standard library and third-party modules
- Group imports: external libraries first, then local imports
- Use relative imports for local modules (`./`, `../`)
- Sort imports alphabetically within groups

#### Types and Interfaces

- Define interfaces in `types.ts` for shared types
- Use union types for enums (string literals)
- Use optional properties with `?` for nullable fields
- Prefer interfaces over type aliases for object shapes
- Add tags array for task categorization

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
- Handle data migration in load functions

#### Error Handling

- Use try/catch blocks for file operations and external calls
- Empty catch blocks are acceptable for optional operations (loading files that may not exist)
- Throw descriptive errors for invalid inputs
- Use early returns to avoid deep nesting
- Handle data migration in load functions

#### Control Flow and Logic

- Use switch statements for enum-based logic
- Prefer array methods (map, filter, find) over loops when possible
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safe property access
- Destructure objects and arrays for cleaner code
- Implement fuzzy search for task filtering

### CLI and TUI Patterns

#### Command Structure

- Use Cliffy for CLI argument parsing
- Define commands in `main.ts` with clear descriptions
- Use action callbacks for command execution
- Validate inputs before processing

#### Task Management Logic

- Always load/save tasks through storage functions
- Use `getNextId()` for generating new task IDs
- Update `updatedAt` timestamp on modifications
- Maintain data integrity during operations
- Implement bulk operations with rollback capability
- Support data export/import with JSON/CSV formats

#### TUI Framework Usage

- Use `https://deno.land/x/tui@2.1.11/mod.ts` for terminal UI
- Implement responsive layout system with `ResponsiveLayout` class
- Use `Signal` and `Computed` for reactive state management
- Handle terminal resize events with `ResizeHandler`
- Create modular UI components in `src/ui/components/`

#### Task Management Logic

- Always load/save tasks through storage functions
- Use `getNextId()` for generating new task IDs
- Update `updatedAt` timestamp on modifications
- Maintain data integrity during operations
- Implement bulk operations with rollback capability
- Support data export/import with JSON/CSV formats



### Testing Guidelines

#### Test Structure

- Use Deno's built-in test framework
- Group related tests with `t.step()`
- Test both success and error cases
- Clean up state between tests
- Use `@std/assert` for assertions
- Prefer `assertEquals` for value comparisons
- Test both return values and side effects





### Code Quality Checks

Before committing changes, ensure:

1. `deno lint` passes
2. `deno fmt --check` passes
3. `deno test` passes
4. All imports are used
5. Types are properly defined
6. Error cases are handled