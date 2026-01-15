import { Command } from "cliffy";
import { addCommand } from "./src/commands/add.ts";
import { dashboardCommand } from "./src/commands/dashboard.ts";
import { deleteCommand } from "./src/commands/delete.ts";
import { listCommand } from "./src/commands/list.ts";
import { markCommand } from "./src/commands/mark.ts";
import { updateCommand } from "./src/commands/update.ts";

if (import.meta.main) {
  await new Command()
    .name("lazytask")
    .version("0.2.2")
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
    .arguments("[id:number]")
    .action(async (_options, id) => {
      await updateCommand(id);
    })
    .command("delete", "Delete a task")
    .arguments("[id:number]")
    .action(async (_options, id) => {
      await deleteCommand(id);
    })
    .command("mark", "Mark task status")
    .arguments("[status:string] [id:number]")
    .action(async (_options, status, id) => {
      const validStatuses = ["todo", "in-progress", "done"];
      if (status && !validStatuses.includes(status)) {
        // If status is a number and id is missing, treat it as id
        if (!isNaN(Number(status)) && id === undefined) {
          id = Number(status);
          status = undefined;
        } else {
          console.error(`Invalid status. Use: ${validStatuses.join(", ")}`);
          return;
        }
      }
      await markCommand(status as any, id);
    })
    .parse(Deno.args);
}
