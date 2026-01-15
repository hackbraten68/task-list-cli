import { colors } from "cliffy/ansi";
import { loadTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { addCommand } from "./add.ts";
import { updateCommand } from "./update.ts";
import { deleteCommand } from "./delete.ts";
import { markCommand } from "./mark.ts";
import { Task } from "../types.ts";

export async function dashboardCommand() {
    let selectedIndex = 0;
    let running = true;

    // Set stdin to raw mode
    Deno.stdin.setRaw(true);

    const cleanup = () => {
        try {
            Deno.stdin.setRaw(false);
        } catch { }
    };

    // Cleanup on exit/crash
    Deno.addSignalListener("SIGINT", () => {
        cleanup();
        Deno.exit();
    });

    async function render(tasks: Task[], modal?: { lines: string[], width: number, height: number }) {
        UI.clearScreen();
        UI.header();

        const { columns, rows } = Deno.consoleSize();
        const terminalWidth = Math.max(80, columns - 4);
        const sidebarWidth = Math.floor(terminalWidth * 0.35);
        const mainWidth = terminalWidth - sidebarWidth - 2;
        const height = Math.max(10, rows - 12);
        const isDimmed = !!modal;

        const taskLines = tasks.map((t, i) => {
            const isSelected = i === selectedIndex;
            const prefix = isSelected ? colors.bold.cyan("❯ ") : "  ";
            const statusIcon = t.status === "done" ? colors.green("✔") : t.status === "in-progress" ? colors.yellow("●") : colors.red("●");
            const line = `${prefix}${statusIcon} ${t.description}`;
            return isSelected ? colors.bgRgb24(line, { r: 50, g: 50, b: 50 }) : line;
        });

        const sidebar = UI.box("Tasks", taskLines, sidebarWidth, height, !isDimmed, isDimmed);

        const selectedTask = tasks[selectedIndex];
        const detailLines: string[] = [];
        if (selectedTask) {
            detailLines.push("");
            detailLines.push(`  ${colors.bold.white("ID:")}          ${colors.dim(selectedTask.id.toString())}`);
            detailLines.push(`  ${colors.bold.white("Title:")}       ${selectedTask.description}`);
            detailLines.push(`  ${colors.bold.white("Status:")}      ${UI.statusPipe(selectedTask.status)}`);
            detailLines.push(`  ${colors.bold.white("Priority:")}    ${UI.priorityPipe(selectedTask.priority)}`);
            detailLines.push(`  ${colors.bold.white("Due Date:")}    ${selectedTask.dueDate ? colors.cyan(selectedTask.dueDate) : colors.dim("-")}`);
            detailLines.push("");
            detailLines.push(`  ${colors.dim("Created at: " + selectedTask.createdAt)}`);
            detailLines.push(`  ${colors.dim("Updated at: " + selectedTask.updatedAt)}`);
            detailLines.push("");
            detailLines.push(`  ${colors.bold.white("Details:")}`);
            detailLines.push(`  ${selectedTask.details || colors.dim("No details provided.")}`);
        } else {
            detailLines.push("\n  No tasks available.");
        }

        const mainPanel = UI.box("Details", detailLines, mainWidth, height, false, isDimmed);

        UI.renderLayout([sidebar, mainPanel], modal);
        UI.footer();
    }

    try {
        while (running) {
            const tasks = await loadTasks();
            if (tasks.length > 0 && selectedIndex >= tasks.length) {
                selectedIndex = tasks.length - 1;
            }

            await render(tasks);

            const reader = Deno.stdin.readable.getReader();
            const { value, done } = await reader.read();
            reader.releaseLock();

            if (done) break;

            const keys = new TextDecoder().decode(value);

            switch (keys) {
                case "j":
                case "\u001b[B": // Down arrow
                    selectedIndex = Math.min(tasks.length - 1, selectedIndex + 1);
                    break;
                case "k":
                case "\u001b[A": // Up arrow
                    selectedIndex = Math.max(0, selectedIndex - 1);
                    break;
                case "a":
                    cleanup();
                    await addCommand(undefined, {
                        modal: true,
                        renderBackground: () => render(tasks)
                    });
                    Deno.stdin.setRaw(true);
                    break;
                case "u":
                case "\r": // Enter
                    if (tasks[selectedIndex]) {
                        cleanup();
                        await updateCommand(tasks[selectedIndex].id, {
                            modal: true,
                            renderBackground: () => render(tasks, { lines: [], width: 60, height: 8 })
                        });
                        Deno.stdin.setRaw(true);
                    }
                    break;
                case "d":
                    if (tasks[selectedIndex]) {
                        cleanup();
                        await deleteCommand(tasks[selectedIndex].id, {
                            modal: true,
                            renderBackground: () => render(tasks, { lines: [], width: 60, height: 6 })
                        });
                        Deno.stdin.setRaw(true);
                    }
                    break;
                case "m":
                    if (tasks[selectedIndex]) {
                        cleanup();
                        await markCommand(undefined, tasks[selectedIndex].id, {
                            modal: true,
                            renderBackground: () => render(tasks, { lines: [], width: 60, height: 8 })
                        });
                        Deno.stdin.setRaw(true);
                    }
                    break;
                case "q":
                case "\u0003": // Ctrl+C
                    running = false;
                    break;
            }
        }
    } finally {
        cleanup();
    }

    UI.clearScreen();
    console.log("Goodbye! 👋");
}
