import { Select } from "cliffy/prompt";
import { colors, ansi } from "cliffy/ansi";
import { loadTasks, saveTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { TaskStatus } from "../types.ts";

export async function markCommand(status?: TaskStatus, id?: number, options?: { modal?: boolean, renderBackground?: () => Promise<void> }) {
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

    if (!isModal) {
        UI.clearScreen();
        UI.header();
        console.log(`  ${colors.bold.cyan("Marking Status for Task:")} ${colors.yellow(task.id.toString())}`);
        console.log(`  ${colors.bold("Description:")}   ${task.description}`);
        console.log(`  ${colors.bold("Current Status:")} ${UI.statusPipe(task.status)}`);
        console.log("");
    }

    const showModal = async (step: string) => {
        if (isModal && options.renderBackground) {
            await options.renderBackground();
            const { columns, rows } = Deno.consoleSize();
            const width = 60;
            const height = 8;
            const modalLines = ["", `  ${colors.bold.cyan(step)}`, "", "  [j/k to select]"];
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

    let newStatus = status;
    if (!newStatus) {
        const pos = await showModal("Select new status");
        newStatus = (await Select.prompt({
            message: pos ? ansi.cursorTo(pos.promptCol, pos.promptRow).toString() : "    ",
            prefix: "",
            pointer: "",
            options: [
                { name: "Todo", value: "todo" },
                { name: "In Progress", value: "in-progress" },
                { name: "Done", value: "done" },
            ],
        })) as TaskStatus;
    }

    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    await saveTasks(tasks);

    if (isModal) {
        // Show success in modal briefly
        const { rows } = Deno.consoleSize();
        console.log(ansi.cursorTo(0, rows - 1).toString() + `  ${colors.green("✔")} Status updated to ${newStatus}`);
        await new Promise(r => setTimeout(r, 600));
    } else {
        UI.success(`Task ${taskId} marked as ${newStatus}.`);
    }
}
