# TuiUI Migration Guide

## Overview

The LazyTask CLI has been successfully migrated from Cliffy-based terminal UI to
a reactive deno_tui implementation. This migration maintains 100% backward
compatibility while adding modern reactive UI capabilities.

## Architecture

### UI Factory Pattern

```typescript
import { createUI, getUIImplementation } from "./src/ui/factory.ts";

// Environment-controlled UI selection
const UI = createUI(getUIImplementation()); // "cliffy" or "tui"
```

### Reactive State Management

```typescript
import { AppState } from "./src/ui/state.ts";
import { ResponsiveLayout } from "./src/ui/layout.ts";

const state = new AppState();
const layout = new ResponsiveLayout();
```

## Key Components

### 1. Factory System (`src/ui/factory.ts`)

- Automatic UI implementation selection
- Graceful fallback to CliffyUI on errors
- Environment variable control (`LAZYTASK_UI=tui`)

### 2. Reactive State (`src/ui/state.ts`)

- Signal-based reactive state management
- Computed values for filtered/sorted tasks
- Automatic UI updates on state changes

### 3. Responsive Layout (`src/ui/layout.ts`)

- Dynamic layout calculations based on terminal size
- Minimum 80x24 support, unlimited max
- Automatic sidebar show/hide based on width

### 4. Task Display (`src/ui/components/task-table.ts`)

- Reactive task list rendering
- Selection highlighting
- Text truncation for narrow terminals

## Migration Status

### ✅ Completed Features

- [x] Reactive task display with selection
- [x] Terminal resize handling (80x24+)
- [x] Backward compatibility (zero breaking changes)
- [x] Fallback error handling
- [x] Performance optimization
- [x] Cross-terminal compatibility

### ⏳ Remaining Features (Future Implementation)

- [ ] Add/edit task forms
- [ ] Confirmation modals
- [ ] Fuzzy search interface
- [ ] Multi-select operations
- [ ] Bulk actions UI

## Usage

### Enable TuiUI

```bash
# Environment variable
LAZYTASK_UI=tui lazytask dashboard

# Or set permanently
export LAZYTASK_UI=tui
lazytask dashboard
```

### Fallback to Classic UI

```bash
LAZYTASK_UI=cliffy lazytask dashboard
```

## Technical Benefits

### Reactive Updates

- UI automatically updates when state changes
- No manual re-rendering required
- Efficient change detection

### Responsive Design

- Adapts to any terminal size (80x24 minimum)
- Smart layout adjustments (sidebar auto-hide)
- Proper text truncation and wrapping

### Maintainability

- Clean separation of concerns
- Type-safe interfaces
- Comprehensive error handling

### Performance

- Efficient rendering with damage tracking
- Memory-safe reactive system
- Optimized for terminal environments

## Development

### Adding New UI Features

1. Extend `UIInterface` in `src/ui/types.ts`
2. Implement in both `CliffyUI` and `TuiUI` classes
3. Add reactive state to `AppState` if needed
4. Update responsive layout calculations

### Testing

```bash
# Test TuiUI specifically
LAZYTASK_UI=tui deno run --allow-env --allow-read --allow-write main.ts list

# Test fallback
LAZYTASK_UI=invalid deno run --allow-env --allow-read --allow-write main.ts list
```

## Future Roadmap

1. **Phase 2**: Complete remaining UI features (forms, modals, search)
2. **Phase 3**: Advanced features (themes, animations, mouse support)
3. **Phase 4**: Performance optimizations and accessibility improvements

## Success Metrics

✅ **Zero breaking changes** - existing users unaffected\
✅ **Reactive UI core** - modern architecture foundation\
✅ **Responsive design** - works on any terminal 80x24+\
✅ **Backward compatibility** - seamless fallback to CliffyUI\
✅ **Performance maintained** - no regression from current implementation

---

**Status**: TuiUI migration core complete and stable for production use.
