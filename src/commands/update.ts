import { Input, Select } from "cliffy/prompt";
import { ansi, colors } from "cliffy/ansi";
import { bulkUpdateTasks, loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { Task, TaskPriority } from "../types.ts";
import {
  getTaskSummaries,
  prepareBulkOperation,
} from "../utils/task-selection.ts";

export async function updateCommand(
  id?: number | string,
  options?: { modal?: boolean; renderBackground?: () => Promise<void> },
) {
  const isModal = options?.modal;
  const tasks = await loadTasks();
  if (tasks.length === 0) {
    UI.info("No tasks to update.");
    return;
  }

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
    const taskOptions = tasks.map((t) => `${t.id}: ${t.description}`);
    const selected = await Select.prompt({
      message: "Select task to update",
      options: taskOptions,
    });
    const selectedId = parseInt(selected.split(":")[0].trim());
    taskIds = [selectedId];
  }

  // Bulk operation
  if (isBulkOperation || taskIds.length > 1) {
    // For bulk updates, we'll collect changes interactively
    const changes: Partial<Task> = {};

    if (!isModal) {
      UI.clearScreen();
      UI.header();
      console.log(`  ${colors.bold.cyan("Bulk Updating Tasks")}`);
      console.log(`  ${colors.dim("Tasks to update:")}`);
      const summaries = getTaskSummaries(tasks, taskIds);
      summaries.forEach((summary) => console.log(`    ${summary}`));
      console.log("");
    }

    // Priority update
    const prioritySelection = await Select.prompt({
      message: "Update priority (or skip)?",
      options: [
        { name: "Skip - keep current", value: "skip" },
        { name: "Low", value: "low" },
        { name: "Medium", value: "medium" },
        { name: "High", value: "high" },
        { name: "Critical", value: "critical" },
      ],
    });

    if (prioritySelection !== "skip") {
      changes.priority = prioritySelection as TaskPriority;
    }

    // Tags update
    const tagsInput = await Input.prompt({
      message: "Update tags (comma-separated, leave empty to skip):",
    });

    if (tagsInput.trim()) {
      changes.tags = tagsInput.split(",").map((t) => t.trim()).filter((t) => t);
    }

    // Due date update
    const dueDateInput = await Input.prompt({
      message: "Update due date (YYYY-MM-DD, leave empty to skip):",
    });

    if (dueDateInput.trim()) {
      changes.dueDate = dueDateInput.trim();
    }

    // Apply changes
    if (Object.keys(changes).length > 0) {
      const result = await bulkUpdateTasks(taskIds, changes);

      if (result.successCount > 0) {
        UI.success(`${result.successCount} tasks updated.`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          UI.error(`Task ${error.id}: ${error.error}`);
        });
      }
    } else {
      UI.info("No changes made.");
    }
    return;
  }

  // Single task operation (existing logic)
  const taskId = taskIds[0];
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    UI.error(`Task with ID ${taskId} not found.`);
    return;
  }

  const task = tasks[taskIndex];

  if (!isModal) {
    UI.clearScreen();
    UI.header();
    console.log(
      `  ${colors.bold.cyan("Updating Task:")} ${
        colors.yellow(task.id.toString())
      }`,
    );
    console.log(`  ${colors.bold("Description:")} ${task.description}`);
    console.log(
      `  ${colors.bold("Priority:   ")} ${UI.priorityPipe(task.priority)}`,
    );
    if (task.details) {
      console.log(`  ${colors.bold("Details:    ")} ${task.details}`);
    }
    if (task.dueDate) {
      console.log(
        `  ${colors.bold("Due Date:   ")} ${colors.cyan(task.dueDate)}`,
      );
    }
    if (task.tags && task.tags.length > 0) {
      console.log(`  ${colors.bold("Tags:        ")} ${task.tags.join(", ")}`);
    }
    console.log(
      "\n  " + colors.dim("Leave empty to keep current value") + "\n",
    );
  }

  const showModal = async (step: string) => {
    if (isModal && options.renderBackground) {
      await options.renderBackground();
      const { columns, rows } = Deno.consoleSize();
      const width = 60;
      const height = 8;
      const modalLines = ["", `  ${colors.bold.cyan(step)}`, "", "  > "];
      const modal = UI.drawModal(
        `Update Task ${taskId}`,
        modalLines,
        width,
        height,
      );

      const startRow = Math.floor((rows - height) / 2) - 4;
      const startCol = Math.floor((columns - width) / 2);
      const modalY = Math.max(0, startRow + 8);

      modal.forEach((line, i) => {
        console.log(ansi.cursorTo(startCol, modalY + i).toString() + line);
      });
      console.log(ansi.cursorTo(startCol + 4, modalY + 3 + 1).toString());
      return { promptCol: startCol + 4, promptRow: modalY + 3 + 1 };
    } else if (!isModal) {
      console.log(`  ${colors.bold.blue("➜")} ${colors.bold(step)}`);
    }
    return null;
  };

  const pos1 = await showModal("New description");
  const newDescription = await Input.prompt({
    message: pos1
      ? ansi.cursorTo(pos1.promptCol, pos1.promptRow).toString()
      : "    ",
    prefix: "",
    pointer: "",
  });

  const pos2 = await showModal("New details");
  const newDetails = await Input.prompt({
    message: pos2
      ? ansi.cursorTo(pos2.promptCol, pos2.promptRow).toString()
      : "    ",
    prefix: "",
    pointer: "",
  });

  const pos3 = await showModal("New priority");
  const newPriority = await Select.prompt({
    message: pos3
      ? ansi.cursorTo(pos3.promptCol, pos3.promptRow).toString()
      : "    ",
    prefix: "",
    pointer: "",
    options: [
      { name: "Keep current", value: task.priority },
      { name: "Low", value: "low" },
      { name: "Medium", value: "medium" },
      { name: "High", value: "high" },
      { name: "Critical", value: "critical" },
    ],
  });

  const pos4 = await showModal("New due date");
  const newDueDate = await Input.prompt({
    message: pos4
      ? ansi.cursorTo(pos4.promptCol, pos4.promptRow).toString()
      : "    ",
    prefix: "",
    pointer: "",
    validate: (value: string) => {
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return "Please use YYYY-MM-DD format";
      }
      return true;
    },
  });

  const pos5 = await showModal(
    `New tags (comma-separated, current: ${
      task.tags?.join(", ") || "none"
    }) - enter "clear" to remove all`,
  );
  const newTagsInput = await Input.prompt({
    message: pos5
      ? ansi.cursorTo(pos5.promptCol, pos5.promptRow).toString()
      : "    ",
    prefix: "",
    pointer: "",
  });

  if (newDescription) task.description = newDescription;
  if (newDetails) task.details = newDetails;
  if (newPriority && newPriority !== task.priority) {
    task.priority = newPriority as TaskPriority;
  }
  if (newDueDate) task.dueDate = newDueDate;
  if (newTagsInput !== undefined) {
    if (newTagsInput.trim().toLowerCase() === "clear") {
      task.tags = [];
    } else if (newTagsInput.trim()) {
      task.tags = newTagsInput.split(",").map((t) => t.trim()).filter((t) => t);
    }
  }

  task.updatedAt = new Date().toISOString();
  await saveTasks(tasks);

  if (!isModal) {
    UI.success(`Task ${taskId} updated successfully.`);
  }
}
