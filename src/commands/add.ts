import { Input, Select } from "cliffy/prompt";
import { ansi, colors } from "cliffy/ansi";
import { getNextId, loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { Task, TaskPriority } from "../types.ts";

export async function addCommand(
  descriptionArg?: string,
  options?: {
    priority?: TaskPriority;
    details?: string;
    dueDate?: string;
    tags?: string;
    modal?: boolean;
    renderBackground?: () => Promise<void>;
  },
) {
  const isModal = options?.modal;

  if (!isModal && !descriptionArg) {
    UI.clearScreen();
    UI.header();
    console.log(`  ${colors.bold.cyan("Creating New Task")}`);
    console.log("\n  " + colors.dim("Follow the prompts below") + "\n");
  }

  const showModal = async (step: string) => {
    if (isModal && options?.renderBackground) {
      await options.renderBackground();
      const { columns, rows } = Deno.consoleSize();
      const width = 60;
      const height = 8;
      const modalLines = ["", `  ${colors.bold.cyan(step)}`, "", "  > "];
      const modal = UI.drawModal("New Task", modalLines, width, height);

      const startRow = Math.floor((rows - height) / 2) - 4;
      const startCol = Math.floor((columns - width) / 2);
      const modalY = Math.max(0, startRow + 8);

      modal.forEach((line, i) => {
        console.log(ansi.cursorTo(startCol, modalY + i).toString() + line);
      });
      console.log(ansi.cursorTo(startCol + 4, modalY + 3 + 1).toString()); // Position at "> "
      return { promptCol: startCol + 4, promptRow: modalY + 3 + 1 };
    } else if (!isModal && !descriptionArg) {
      console.log(`  ${colors.bold.blue("➜")} ${colors.bold(step)}`);
    }
    return null;
  };

  let description = descriptionArg;
  if (!description) {
    const pos = await showModal("Enter Description");
    description = await Input.prompt({
      message: pos
        ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
        : "    ",
    });
  }

  let details = options?.details;
  if (details === undefined && !descriptionArg) {
    const pos = await showModal("Enter Details (optional)");
    details = await Input.prompt({
      message: pos
        ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
        : "    ",
    });
  }

  let priority = options?.priority;
  if (!priority) {
    if (descriptionArg) {
      priority = "medium"; // Default for non-interactive
    } else {
      const pos = await showModal("Select Priority");
      priority = (await Select.prompt({
        message: pos
          ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
          : "    ",
        options: ["low", "medium", "high", "critical"],
      })) as TaskPriority;
    }
  }

  let dueDate = options?.dueDate;
  if (dueDate === undefined && !descriptionArg) {
    const pos = await showModal("Enter Due Date (YYYY-MM-DD, optional)");
    dueDate = await Input.prompt({
      message: pos
        ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
        : "    ",
      validate: (value: string) => {
        if (value && !/^\d{4}-\d{2}-\d{1,2}$/.test(value)) {
          return "Please use YYYY-MM-DD format";
        }
        return true;
      },
    });
  }

  let tags: string[] = [];
  if (options?.tags) {
    tags = options.tags.split(",").map((t) => t.trim()).filter((t) => t);
  } else if (!descriptionArg) {
    const pos = await showModal("Enter Tags (comma-separated, optional)");
    const tagsInput = await Input.prompt({
      message: pos
        ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString()
        : "    ",
    });
    tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter((t) => t)
      : [];
  }

  const tasks = await loadTasks();
  const newTask: Task = {
    id: await getNextId(),
    description: description || "Untitled Task",
    details: details || "",
    priority: priority as TaskPriority,
    dueDate: dueDate || undefined,
    tags: tags,
    status: "todo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  await saveTasks(tasks);

  if (!isModal) {
    UI.success(`Task added successfully! (ID: ${newTask.id})`);
  }
}
