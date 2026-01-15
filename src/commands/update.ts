import { Input, Select } from "cliffy/prompt";
import { colors, ansi } from "cliffy/ansi";
import { loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { Task, TaskPriority } from "../types.ts";

export async function updateCommand(id?: number, options?: { modal?: boolean, renderBackground?: () => Promise<void> }) {
    const isModal = options?.modal;
    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks to update.");
        return;
    }

    let taskId = id;
    if (taskId === undefined) {
        taskId = parseInt(await Select.prompt({
            message: "Select task to update",
            options: tasks.map(t => ({ name: `${t.id}: ${t.description}`, value: t.id.toString() })),
        }));
    }

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        UI.error(`Task with ID ${taskId} not found.`);
        return;
    }

    const task = tasks[taskIndex];

    if (!isModal) {
        UI.clearScreen();
        UI.header();
        console.log(`  ${colors.bold.cyan("Updating Task:")} ${colors.yellow(task.id.toString())}`);
        console.log(`  ${colors.bold("Description:")} ${task.description}`);
        console.log(`  ${colors.bold("Priority:   ")} ${UI.priorityPipe(task.priority)}`);
        if (task.details) console.log(`  ${colors.bold("Details:    ")} ${task.details}`);
        if (task.dueDate) console.log(`  ${colors.bold("Due Date:   ")} ${colors.cyan(task.dueDate)}`);
        console.log("\n  " + colors.dim("Leave empty to keep current value") + "\n");
    }

    const showModal = async (step: string) => {
        if (isModal && options.renderBackground) {
            await options.renderBackground();
            const { columns, rows } = Deno.consoleSize();
            const width = 60;
            const height = 8;
            const modalLines = ["", `  ${colors.bold.cyan(step)}`, "", "  > "];
            const modal = UI.drawModal(`Update Task ${taskId}`, modalLines, width, height);

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
        message: pos1 ? ansi.cursorTo(pos1.promptCol, pos1.promptRow).toString() : "    ",
        prefix: "",
        pointer: "",
    });

    const pos2 = await showModal("New details");
    const newDetails = await Input.prompt({
        message: pos2 ? ansi.cursorTo(pos2.promptCol, pos2.promptRow).toString() : "    ",
        prefix: "",
        pointer: "",
    });

    const pos3 = await showModal("New priority");
    const newPriority = await Select.prompt({
        message: pos3 ? ansi.cursorTo(pos3.promptCol, pos3.promptRow).toString() : "    ",
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
        message: pos4 ? ansi.cursorTo(pos4.promptCol, pos4.promptRow).toString() : "    ",
        prefix: "",
        pointer: "",
        validate: (value: string) => {
            if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return "Please use YYYY-MM-DD format";
            }
            return true;
        },
    });

    if (newDescription) task.description = newDescription;
    if (newDetails) task.details = newDetails;
    if (newPriority && newPriority !== task.priority) task.priority = newPriority as TaskPriority;
    if (newDueDate) task.dueDate = newDueDate;

    task.updatedAt = new Date().toISOString();
    await saveTasks(tasks);

    if (!isModal) {
        UI.success(`Task ${taskId} updated successfully.`);
    }
}
