// src/ui/layout.ts
import { Signal } from "https://deno.land/x/tui@2.1.11/mod.ts";

export interface Rectangle {
  column: number;
  row: number;
  width: number;
  height: number;
}

export class ResponsiveLayout {
  private size = new Signal({ columns: 80, rows: 24 });

  // Minimum supported dimensions
  private readonly minWidth = 80;
  private readonly minHeight = 24;

  // Update terminal size
  updateSize(): void {
    try {
      const size = Deno.consoleSize();
      this.size.value = {
        columns: Math.max(this.minWidth, size.columns),
        rows: Math.max(this.minHeight, size.rows)
      };
    } catch (error) {
      // Fallback for environments without console size access
      this.size.value = { columns: this.minWidth, rows: this.minHeight };
      console.warn("Could not get console size:", error instanceof Error ? error.message : String(error));
    }
  }

  // For testing: directly set size
  setSize(columns: number, rows: number): void {
    this.size.value = {
      columns: Math.max(this.minWidth, columns),
      rows: Math.max(this.minHeight, rows)
    };
  }

  // Header area (fixed)
  get header(): Rectangle {
    return {
      column: 1,
      row: 1,
      width: this.size.value.columns,
      height: 1
    };
  }

  // Task list area (main content)
  get taskList(): Rectangle {
    const totalWidth = Math.max(this.size.value.columns, this.minWidth);
    const totalHeight = Math.max(this.size.value.rows, this.minHeight);
    const availableHeight = Math.max(10, totalHeight - 2);

    if (totalWidth >= 120) {
      // Wide screen: sidebar + main panel
      const sidebarWidth = this.sidebar.width;
      return {
        column: sidebarWidth + 2,
        row: 2,
        width: Math.max(40, totalWidth - sidebarWidth - 2),
        height: availableHeight
      };
    } else {
      // Narrow screen: full width task list
      return {
        column: 1,
        row: 2,
        width: totalWidth,
        height: availableHeight
      };
    }
  }

  // Sidebar area (stats/tags)
  get sidebar(): Rectangle {
    const totalWidth = Math.max(this.size.value.columns, this.minWidth);
    const totalHeight = Math.max(this.size.value.rows, this.minHeight);
    const availableHeight = Math.max(10, totalHeight - 2);

    if (totalWidth >= 120) {
      // Show sidebar on wide screens
      return {
        column: 1,
        row: 2,
        width: Math.max(25, Math.floor(totalWidth * 0.35)),
        height: availableHeight
      };
    } else {
      // Hide sidebar on narrow screens
      return {
        column: 1,
        row: 1,
        width: 0,
        height: 0
      };
    }
  }

  // Stats sidebar area (hacker stats panel)
  get statsSidebar(): Rectangle {
    const totalWidth = Math.max(this.size.value.columns - 4, this.minWidth - 4); // Account for margins
    const totalHeight = Math.max(this.size.value.rows, this.minHeight);
    const availableHeight = Math.max(10, totalHeight - 2);

    // Dynamic width calculation with bounds checking - increased max width for better balance
    const sidebarWidth = Math.max(25, Math.min(50, totalWidth - 45));

    return {
      column: 1,
      row: 2,
      width: sidebarWidth,
      height: availableHeight
    };
  }

  // Task list area when stats sidebar is visible
  get taskListWithStats(): Rectangle {
    const totalWidth = Math.max(this.size.value.columns - 4, this.minWidth - 4); // Account for margins
    const totalHeight = Math.max(this.size.value.rows, this.minHeight);
    const availableHeight = Math.max(10, totalHeight - 2);

    const sidebarWidth = this.statsSidebar.width;
    const taskWidth = Math.max(40, totalWidth - sidebarWidth - 2); // 2-character spacing

    return {
      column: sidebarWidth + 3, // Account for spacing
      row: 2,
      width: taskWidth,
      height: availableHeight
    };
  }

  // Footer area (fixed)
  get footer(): Rectangle {
    return {
      column: 1,
      row: Math.max(this.size.value.rows, this.minHeight),
      width: Math.max(this.size.value.columns, this.minWidth),
      height: 1
    };
  }

  // Modal positioning (centered)
  getModalPosition(width: number, height: number): Rectangle {
    const screenWidth = this.size.value.columns;
    const screenHeight = this.size.value.rows;

    return {
      column: Math.max(1, Math.floor((screenWidth - width) / 2)),
      row: Math.max(2, Math.floor((screenHeight - height) / 2)),
      width: Math.min(width, screenWidth - 2),
      height: Math.min(height, screenHeight - 2)
    };
  }

  // Check if we're in compact mode
  get isCompact(): boolean {
    return this.size.value.columns < 100;
  }

  // Utility: truncate text for small screens
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  // Utility: check if element should be visible
  shouldShowElement(minWidth: number, minHeight: number = this.minHeight): boolean {
    return this.size.value.columns >= minWidth && this.size.value.rows >= minHeight;
  }

  // Get current terminal size
  getCurrentSize() {
    return { ...this.size.value };
  }
}
