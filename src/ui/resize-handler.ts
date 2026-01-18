// src/ui/resize-handler.ts
import { ResponsiveLayout } from "./layout.ts";

export class ResizeHandler {
  private layout: ResponsiveLayout;
  private currentSize = { columns: 80, rows: 24 };
  private resizeTimeout: number | null = null;

  constructor(layout: ResponsiveLayout) {
    this.layout = layout;
    this.updateSize();
  }

  private updateSize() {
    try {
      const size = Deno.consoleSize();
      if (size.columns !== this.currentSize.columns || size.rows !== this.currentSize.rows) {
        this.currentSize = size;
        this.layout.updateSize();
        // Trigger re-render if needed (will be implemented when TuiUI is fully integrated)
      }
    } catch (error) {
      // Fallback for environments without console size access
      console.warn("Could not get console size:", error instanceof Error ? error.message : String(error));
    }
  }

  startListening() {
    // Listen for SIGWINCH signal (window resize on Unix-like systems)
    try {
      Deno.addSignalListener("SIGWINCH", () => {
        // Debounce resize events to avoid excessive updates
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          this.updateSize();
        }, 100); // 100ms debounce
      });
    } catch (error) {
      // SIGWINCH not available on all platforms (e.g., Windows)
      console.warn("Resize listening not available:", error instanceof Error ? error.message : String(error));
    }
  }

  stopListening() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    // Note: Deno doesn't provide a way to remove signal listeners
  }

  // Manual trigger for testing
  triggerResize() {
    this.updateSize();
  }

  getCurrentSize() {
    return { ...this.currentSize };
  }
}