import { Select } from "cliffy/prompt";
import { ansi, colors } from "cliffy/ansi";
import { bulkMarkTasks, loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { TaskStatus } from "../types.ts";
import {
  getTaskSummaries,
  prepareBulkOperation,
} from "../utils/task-selection.ts";

export async function markCommand(
  status?: TaskStatus,
  id?: number | string,
  options?: { modal?: boolean; renderBackground?: () => Promise<void> },
) {
  const isModal = options?.modal;
  const tasks = await loadTasks();
  if (tasks.length === 0) {
    UI.info("No tasks available.");
    return;
  }

  const showModal = async (step: string) => {
    if (isModal && options.renderBackground) {
      await options.renderBackground();
      const { columns, rows } = Deno.consoleSize();
      const width = 60;
      const height = 8;
      const modalLines = [
        "",
        `  ${colors.bold.cyan(step)}`,
        "",
        "  [j/k to select]",
      ];
      const modal = UI.drawModal("Mark Status", modalLines, width, height);

      const startRow = Math.floor((rows - height) / 2) - 4;
      const startCol = Math.floor((columns - width) / 2);
      const modalY = Math.max(0, startRow + 8);

      modal.forEach((line, i) => {
        console.log(ansi.cursorTo(startCol, modalY + i).toString() + line);
      });
      return { promptCol: startCol + 4, promptRow: modalY + 3 + 1 };
    } else if (!isModal) {
      console.log(`  ${colors.bold.blue("➜")} ${colors.bold(step)}`);
    }
    return null;
  };

  // Check if id is a range (string) or single ID (number)
  let taskIds: number[] = [];
  let isBulkOperation = false;

  if (typeof id === "string") {
    // Handle ID ranges like "1,2,3,5-8"
    const { taskIds: parsedIds, errors } = prepareBulkOperation(id, tasks);
    if (errors.length > 0) {
      UI.error(errors.join("\n"));
      return;
    }
    taskIds = parsedIds;
    isBulkOperation = true;
  } else if (id !== undefined) {
    // Single task ID
    taskIds = [id];
  } else {
    // Interactive selection
    const options = tasks.map((t) => `${t.id}: ${t.description}`);
    const selected = await Select.prompt({
      message: "Select task to mark",
      options: options,
    });
    const selectedId = parseInt(selected.split(":")[0].trim());
    taskIds = [selectedId];
  }

  // Bulk operation
  if (isBulkOperation || taskIds.length > 1) {
    let newStatus = status;
    if (!newStatus) {
      if (isModal) {
        // In modal, show status selection
        const pos = await showModal("Select new status");
        const statusSelection = await Select.prompt({
          message: pos
            ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
            : "    ",
          prefix: "",
          pointer: "",
          options: [
            { name: "Todo", value: "todo" },
            { name: "In Progress", value: "in-progress" },
            { name: "Done", value: "done" },
          ],
        });
        newStatus = statusSelection as TaskStatus;
      } else {
        // CLI prompt for status
        const statusOptions = ["todo", "in-progress", "done"];
        const selected = await Select.prompt({
          message: `Select status for ${taskIds.length} tasks`,
          options: statusOptions,
        });
        newStatus = selected as TaskStatus;
      }
    }

    const result = await bulkMarkTasks(taskIds, newStatus);

    if (isModal) {
      const { rows } = Deno.consoleSize();
      const statusMsg = result.successCount > 0
        ? `${result.successCount} tasks marked as ${newStatus}`
        : "No tasks were updated";
      console.log(
        ansi.cursorTo(0, rows - 1).toString() +
          `  ${colors.green("✔")} ${statusMsg}`,
      );
      await new Promise((r) => setTimeout(r, 800));
    } else {
      if (result.successCount > 0) {
        UI.success(`${result.successCount} tasks marked as ${newStatus}.`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          UI.error(`Task ${error.id}: ${error.error}`);
        });
      }
    }
    return;
  }

  // Single task operation (existing logic)
  const taskId = taskIds[0];
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    UI.error(`Task with ID ${taskId} not found.`);
    return;
  }

  // Single task operation (existing logic)
  const singleTask = tasks.find((t) => t.id === taskIds[0]);
  if (!singleTask) {
    UI.error(`Task with ID ${taskIds[0]} not found.`);
    return;
  }

  if (!isModal) {
    UI.clearScreen();
    UI.header();
    console.log(
      `  ${colors.bold.cyan("Marking Status for Task:")} ${
        colors.yellow(singleTask.id.toString())
      }`,
    );
    console.log(`  ${colors.bold("Description:")}   ${singleTask.description}`);
    console.log(
      `  ${colors.bold("Current Status:")} ${UI.statusPipe(singleTask.status)}`,
    );
    console.log("");
  }

  let newStatus = status;
  if (!newStatus) {
    const pos = await showModal("Select new status");
    const statusSelection = await Select.prompt({
      message: pos
        ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
        : "    ",
      prefix: "",
      pointer: "",
      options: [
        { name: "Todo", value: "todo" },
        { name: "In Progress", value: "in-progress" },
        { name: "Done", value: "done" },
      ],
    });
    newStatus = statusSelection as TaskStatus;
  }

  singleTask.status = newStatus;
  singleTask.updatedAt = new Date().toISOString();

  await saveTasks(tasks);

  if (isModal) {
    // Show success in modal briefly
    const { rows } = Deno.consoleSize();
    console.log(
      ansi.cursorTo(0, rows - 1).toString() +
        `  ${colors.green("✔")} Status updated to ${newStatus}`,
    );
    await new Promise((r) => setTimeout(r, 600));
  } else {
    UI.success(`Task ${taskIds[0]} marked as ${newStatus}.`);
  }
}
