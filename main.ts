import { Command } from "cliffy";
import { addCommand } from "./src/commands/add.ts";
import { dashboardCommand } from "./src/commands/dashboard.ts";
import { deleteCommand } from "./src/commands/delete.ts";
import { listCommand } from "./src/commands/list.ts";
import { markCommand } from "./src/commands/mark.ts";
import { updateCommand } from "./src/commands/update.ts";
import { bulkMarkCommand, bulkDeleteCommand, bulkUpdateCommand } from "./src/commands/bulk.ts";
import { exportCommand } from "./src/commands/export.ts";
import { importCommand } from "./src/commands/import.ts";

if (import.meta.main) {
  await new Command()
    .name("lazytask")
    .version("0.7.0")
    .description("LazyTask - A lazydocker-inspired Task Management TUI")
    .default("dashboard")
    .command("dashboard", "Open the TUI dashboard")
    .action(async () => {
      await dashboardCommand();
    })
    .command("list", "List tasks")
    .option("-s, --status <status:string>", "Filter by status")
    .option("-p, --priority <priority:string>", "Filter by priority")
    .option("-t, --tags <tags:string>", "Filter by tags")
    .option("--search <search:string>", "Search tasks by keyword")
    .option("--sort-by <field:string>", "Sort by field (due-date, priority, status, created, updated, description)")
    .option("--sort-order <order:string>", "Sort order (asc or desc)", { default: "asc" })
    .action(async (options) => {
      await listCommand(options);
    })
    .command("add", "Add a new task")
    .arguments("[description:string]")
    .option("-p, --priority <priority:string>", "Task priority (low, medium, high, critical)")
    .option("-d, --details <details:string>", "Task details")
    .option("-u, --due-date <dueDate:string>", "Task due date (YYYY-MM-DD)")
    .option("-t, --tags <tags:string>", "Task tags (comma-separated)")
    .action(async (options, description) => {
      await addCommand(description, options as any);
    })
    .command("update", "Update a task")
    .arguments("[id:string]")
    .action(async (_options, id) => {
      await updateCommand(id);
    })
    .command("delete", "Delete a task")
    .arguments("[id:string]")
    .option("-f, --force", "Skip confirmation prompt")
    .action(async (options, id) => {
      await deleteCommand(id, options);
    })
    .command("mark", "Mark task status")
    .arguments("[status:string] [id:string]")
    .action(async (_options, status, id) => {
      const validStatuses = ["todo", "in-progress", "done"];
      if (status && !validStatuses.includes(status)) {
        // If status is a number and id is missing, treat it as id
        if (!isNaN(Number(status)) && id === undefined) {
          id = status;
          status = undefined;
        } else {
          console.error(`Invalid status. Use: ${validStatuses.join(", ")}`);
          return;
        }
      }
      await markCommand(status as any, id);
    })
    .command("bulk-mark", "Mark multiple tasks with status")
    .arguments("[status:string] [ids:string]")
    .action(async (_options, status, ids) => {
      await bulkMarkCommand(status as any, ids);
    })
    .command("bulk-delete", "Delete multiple tasks")
    .arguments("[ids:string]")
    .option("-f, --force", "Skip confirmation prompt")
    .action(async (options, ids) => {
      await bulkDeleteCommand(ids, options);
    })
    .command("bulk-update", "Update multiple tasks")
    .arguments("[ids:string]")
    .option("-p, --priority <priority:string>", "Set priority")
    .option("-t, --tags <tags:string>", "Replace all tags")
    .action(async (options, ids) => {
      await bulkUpdateCommand(ids, options as any);
    })
    .command("export", "Export tasks to JSON or CSV")
    .option("-f, --format <format:string>", "Export format (json or csv)", { default: "json" })
    .option("-o, --output <output:string>", "Output file path")
    .option("-s, --status <status:string>", "Filter by status (todo, in-progress, done)")
    .option("-p, --priority <priority:string>", "Filter by priority (low, medium, high, critical)")
    .option("-t, --tags <tags:string>", "Filter by tags (comma-separated)")
    .action(async (options) => {
      await exportCommand(options);
    })
    .command("import", "Import tasks from JSON or CSV")
    .arguments("<input:string>")
    .option("-f, --format <format:string>", "Import format (json or csv)", { default: "json" })
    .option("-m, --mode <mode:string>", "Import mode (merge or replace)", { default: "merge" })
    .option("--validate-only", "Validate without importing")
    .action(async (options, input) => {
      await importCommand({ ...options, input });
    })
    .parse(Deno.args);
}
