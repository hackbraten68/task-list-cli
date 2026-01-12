import { Select } from "cliffy/prompt";
import { colors, ansi } from "cliffy/ansi";
import { loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { TaskStatus } from "../types.ts";

export async function markCommand(status: TaskStatus, id?: number, options?: { modal?: boolean, renderBackground?: () => Promise<void> }) {
    const isModal = options?.modal;
    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks available.");
        return;
    }

    let taskId = id;
    if (taskId === undefined) {
        taskId = parseInt(await Select.prompt({
            message: "Select task to mark",
            options: tasks.map(t => ({ name: `${t.id}: ${t.description}`, value: t.id.toString() })),
        }));
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        UI.error(`Task with ID ${taskId} not found.`);
        return;
    }

    const showModal = async (step: string) => {
        if (isModal && options.renderBackground) {
            await options.renderBackground();
            const { columns, rows } = Deno.consoleSize();
            const width = 60;
            const height = 6;
            const modalLines = ["", `  ${colors.bold.cyan(step)}`, "", "  Status updated!"];
            const modal = UI.drawModal("Mark Status", modalLines, width, height);

            const startRow = Math.floor((rows - height) / 2) - 4;
            const startCol = Math.floor((columns - width) / 2);
            const modalY = Math.max(0, startRow + 8);

            modal.forEach((line, i) => {
                console.log(ansi.cursorTo(startCol, modalY + i).toString() + line);
            });
            console.log(ansi.cursorTo(0, rows - 1).toString());
        } else {
            UI.header();
        }
    };

    task.status = status;
    task.updatedAt = new Date().toISOString();

    await saveTasks(tasks);
    await showModal(`Task ${taskId} -> ${status}`);

    if (isModal) {
        await new Promise(r => setTimeout(r, 800)); // Brief pause for feedback
    } else {
        UI.success(`Task ${taskId} marked as ${status}.`);
    }
}
