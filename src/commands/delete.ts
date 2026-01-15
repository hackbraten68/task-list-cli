import { Confirm } from "cliffy/prompt";
import { colors, ansi } from "cliffy/ansi";
import { loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";

export async function deleteCommand(id?: number, options?: { modal?: boolean, renderBackground?: () => Promise<void> }) {
    const isModal = options?.modal;
    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks to delete.");
        return;
    }

    let taskId = id;
    if (taskId === undefined) {
        // We'll skip Select for now in modal to keep it simple, or user can fix it
        UI.error("Please provide a task ID.");
        return;
    }

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        UI.error(`Task with ID ${taskId} not found.`);
        return;
    }

    const showModal = async (step: string) => {
        if (isModal && options.renderBackground) {
            await options.renderBackground();
            const { columns, rows } = Deno.consoleSize();
            const width = 60;
            const height = 6;
            const modalLines = ["", `  ${colors.bold.red(step)}`, "", "  [y/n]: "];
            const modal = UI.drawModal("Delete Task", modalLines, width, height);

            const startRow = Math.floor((rows - height) / 2) - 4;
            const startCol = Math.floor((columns - width) / 2);
            const modalY = Math.max(0, startRow + 8);

            modal.forEach((line, i) => {
                console.log(ansi.cursorTo(startCol, modalY + i).toString() + line);
            });
            console.log(ansi.cursorTo(startCol + 9, modalY + 3 + 1).toString());
            return { promptCol: startCol + 9, promptRow: modalY + 3 + 1 };
        } else {
            UI.header();
        }
        return null;
    };

    const pos = await showModal(`Delete task ${taskId}?`);
    const confirmed = await Confirm.prompt({
        message: pos ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString() : "",
        prefix: "",
        pointer: "",
    });

    if (confirmed) {
        tasks.splice(taskIndex, 1);
        await saveTasks(tasks);
        if (!isModal) UI.success(`Task ${taskId} deleted.`);
    } else {
        UI.info("Deletion cancelled.");
    }
}
