import { Command } from "cliffy";
import { addCommand } from "./src/commands/add.ts";
import { dashboardCommand } from "./src/commands/dashboard.ts";
import { deleteCommand } from "./src/commands/delete.ts";
import { markCommand } from "./src/commands/mark.ts";
import { updateCommand } from "./src/commands/update.ts";

if (import.meta.main) {
  await new Command()
    .name("lazytask")
    .version("4.2.0")
    .description("LazyTask - A lazydocker-inspired Task Management TUI")
    .default("dashboard")
    .command("dashboard", "Open the TUI dashboard")
    .action(async () => {
      await dashboardCommand();
    })
    .command("add", "Add a new task")
    .action(async () => {
      await addCommand();
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
    .arguments("<status:string> [id:number]")
    .action(async (_options, status: string, id) => {
      const validStatuses = ["todo", "in-progress", "done"];
      if (!validStatuses.includes(status)) {
        console.error(`Invalid status. Use: ${validStatuses.join(", ")}`);
        return;
      }
      await markCommand(status as any, id);
    })
    .parse(Deno.args);
}
