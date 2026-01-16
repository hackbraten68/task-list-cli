import { exportTasks } from "../storage.ts";
import { ExportOptions, TaskPriority, TaskStatus } from "../types.ts";

export async function exportCommand(options: {
  format?: string;
  output?: string;
  status?: string;
  priority?: string;
  tags?: string;
}) {
  try {
    const exportOptions: ExportOptions = {
      format: (options.format === "csv" ? "csv" : "json") as "json" | "csv",
      outputPath: options.output,
      status: options.status as TaskStatus,
      priority: options.priority as TaskPriority,
      tags: options.tags,
    };

    await exportTasks(exportOptions);

    const outputPath = exportOptions.outputPath ||
      `lazytask-export-${
        new Date().toISOString().split("T")[0]
      }.${exportOptions.format}`;
    console.log(`✅ Tasks exported successfully to ${outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Export failed: ${message}`);
    Deno.exit(1);
  }
}
