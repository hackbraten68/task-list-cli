// src/ui/factory.ts
import { UIInterface } from "./types.ts";
import { CliffyUI } from "./cliffy-ui.ts";
import { TuiUI } from "./tui-ui.ts";

export function createUI(implementation: "cliffy" | "tui" = "cliffy"): UIInterface {
  try {
    if (implementation === "tui") {
      console.log("🔄 Initializing deno_tui interface...");
      return new TuiUI();
    }
  } catch (error) {
    console.warn("⚠️  deno_tui initialization failed, falling back to Cliffy UI");
    console.warn(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  return new CliffyUI();
}

// Environment-based UI selection
export function getUIImplementation(): "cliffy" | "tui" {
  return (Deno.env.get("LAZYTASK_UI") as "cliffy" | "tui") || "cliffy";
}