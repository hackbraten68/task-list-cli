import { Input, Select } from "cliffy/prompt";
import { colors, ansi } from "cliffy/ansi";
import { saveTasks, loadTasks, getNextId } from "../storage.ts";
import { UI } from "../ui.ts";
import { Task, TaskPriority } from "../types.ts";

export async function addCommand(options?: { modal?: boolean, renderBackground?: () => Promise<void> }) {
    const isModal = options?.modal;

    const showModal = async (step: string) => {
        if (isModal && options.renderBackground) {
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
        } else {
            UI.header();
        }
    };

    await showModal("Enter Description");
    const description = await Input.prompt({
        message: "",
        suffix: "", // Remove default suffix
    });

    await showModal("Enter Details (optional)");
    const details = await Input.prompt({
        message: "",
    });

    await showModal("Select Priority");
    const priority = (await Select.prompt({
        message: "",
        options: ["low", "medium", "high", "critical"],
    })) as TaskPriority;

    await showModal("Enter Due Date (YYYY-MM-DD, optional)");
    const dueDate = await Input.prompt({
        message: "",
        validate: (value: string) => {
            if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return "Please use YYYY-MM-DD format";
            }
            return true;
        },
    });

    const tasks = await loadTasks();
    const newTask: Task = {
        id: await getNextId(),
        description,
        details,
        priority,
        dueDate: dueDate || undefined,
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
