import { colors } from "cliffy/ansi";
import { Select } from "cliffy/prompt";
import { loadTasks, bulkMarkTasks, bulkDeleteTasks, bulkUpdateTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { addCommand } from "./add.ts";
import { updateCommand } from "./update.ts";
import { deleteCommand } from "./delete.ts";
import { markCommand } from "./mark.ts";
import { Task, TaskStatus, TaskPriority } from "../types.ts";
import { getTaskSummaries } from "../utils/task-selection.ts";

export async function dashboardCommand() {
    let selectedIndex = 0;
    let selectedTasks = new Set<number>(); // Multi-selection state
    let multiSelectMode = false;
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
            const isCurrent = i === selectedIndex;
            const isMultiSelected = selectedTasks.has(t.id);

            let prefix = "  ";
            if (isCurrent && multiSelectMode) {
                prefix = colors.bold.magenta("❯ ");
            } else if (isCurrent) {
                prefix = colors.bold.cyan("❯ ");
            }

            const statusIcon = t.status === "done" ? colors.green("✔") : t.status === "in-progress" ? colors.yellow("●") : colors.red("●");

            // Add selection indicator for multi-selected tasks
            const selectIndicator = isMultiSelected ? colors.bold.blue("[✓] ") : "    ";
            const line = `${selectIndicator}${prefix}${statusIcon} ${t.description}`;

            // Highlight current selection or multi-selected tasks
            if (isCurrent && !multiSelectMode) {
                return colors.bgRgb24(line, { r: 50, g: 50, b: 50 });
            } else if (isMultiSelected) {
                return colors.bgRgb24(line, { r: 30, g: 30, b: 60 });
            }
            return line;
        });

        const sidebar = UI.box("Tasks", taskLines, sidebarWidth, height, !isDimmed, isDimmed);

        const selectedTask = tasks[selectedIndex];
        const detailLines: string[] = [];

        if (multiSelectMode && selectedTasks.size > 0) {
            // Show multi-selection summary
            const selectedTaskList = Array.from(selectedTasks).map(id =>
                tasks.find(t => t.id === id)
            ).filter(Boolean) as Task[];

            detailLines.push("");
            detailLines.push(`  ${colors.bold.magenta("Multi-Selection Mode")}`);
            detailLines.push(`  ${colors.bold.white("Selected:")}     ${selectedTasks.size} tasks`);
            detailLines.push("");
            detailLines.push(`  ${colors.bold.white("Selected Tasks:")}`);

            const summaries = selectedTaskList.slice(0, 10).map(task =>
                `    ${task.id}: ${task.description.substring(0, 40)}${task.description.length > 40 ? '...' : ''}`
            );
            detailLines.push(...summaries);

            if (selectedTaskList.length > 10) {
                detailLines.push(`    ... and ${selectedTaskList.length - 10} more`);
            }

            detailLines.push("");
            detailLines.push(`  ${colors.dim("Press Enter for bulk actions")}`);
            detailLines.push(`  ${colors.dim("Press Tab to exit multi-select mode")}`);

        } else if (selectedTask) {
            // Show single task details
            detailLines.push("");
            detailLines.push(`  ${colors.bold.white("ID:")}          ${colors.dim(selectedTask.id.toString())}`);
            detailLines.push(`  ${colors.bold.white("Title:")}       ${selectedTask.description}`);
            detailLines.push(`  ${colors.bold.white("Status:")}      ${UI.statusPipe(selectedTask.status)}`);
            detailLines.push(`  ${colors.bold.white("Priority:")}    ${UI.priorityPipe(selectedTask.priority)}`);
            detailLines.push(`  ${colors.bold.white("Tags:")}        ${selectedTask.tags && selectedTask.tags.length > 0 ? selectedTask.tags.join(", ") : colors.dim("-")}`);
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
        UI.footer(multiSelectMode, selectedTasks.size);
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
                case "\t": // Tab - Toggle multi-select mode
                    multiSelectMode = !multiSelectMode;
                    if (!multiSelectMode) {
                        selectedTasks.clear(); // Clear selections when exiting multi-select
                    }
                    break;
                case " ": // Space - Select/deselect current task (multi-select mode)
                    if (multiSelectMode && tasks[selectedIndex]) {
                        const taskId = tasks[selectedIndex].id;
                        if (selectedTasks.has(taskId)) {
                            selectedTasks.delete(taskId);
                        } else {
                            selectedTasks.add(taskId);
                        }
                    }
                    break;
                case "u":
                case "\r": // Enter
                    if (multiSelectMode && selectedTasks.size > 0) {
                        // Show bulk actions menu
                        cleanup();
                        await showBulkActionsMenu(tasks, Array.from(selectedTasks));
                        Deno.stdin.setRaw(true);
                    } else if (!multiSelectMode && tasks[selectedIndex]) {
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

/**
 * Show bulk actions menu for selected tasks
 */
async function showBulkActionsMenu(tasks: Task[], selectedIds: number[]) {
    const taskSummaries = getTaskSummaries(tasks, selectedIds);

    console.clear();
    UI.header();

    console.log(`  ${colors.bold.magenta("Bulk Actions Menu")}`);
    console.log(`  ${colors.dim("Selected tasks:")}`);
    taskSummaries.forEach(summary => console.log(`    ${summary}`));
    console.log("");

    const action = await Select.prompt({
        message: "Choose bulk action:",
        options: [
            { name: "Mark as...", value: "mark" },
            { name: "Update properties", value: "update" },
            { name: "Delete selected", value: "delete" },
            { name: "Cancel", value: "cancel" }
        ]
    });

    if (action === "cancel") {
        return;
    }

    try {
        if (action === "mark") {
            const statusOptions = ["todo", "in-progress", "done"];
            const selectedStatus = await Select.prompt({
                message: `Mark ${selectedIds.length} tasks as:`,
                options: statusOptions
            });

            const result = await bulkMarkTasks(selectedIds, selectedStatus);
            console.log("");
            if (result.successCount > 0) {
                UI.success(`${result.successCount} tasks marked as ${selectedStatus}.`);
            }
            if (result.errors.length > 0) {
                result.errors.forEach(error => {
                    UI.error(`Task ${error.id}: ${error.error}`);
                });
            }

        } else if (action === "update") {
            console.log("");
            console.log("Update properties for selected tasks:");

            const changes: Partial<Task> = {};

            // Priority update
            const priorityOptions = ["skip", "low", "medium", "high", "critical"];
            const prioritySelection = await Select.prompt({
                message: "Update priority:",
                options: [
                    { name: "Skip - keep current", value: "skip" },
                    { name: "Low", value: "low" },
                    { name: "Medium", value: "medium" },
                    { name: "High", value: "high" },
                    { name: "Critical", value: "critical" }
                ]
            });

            if (prioritySelection !== "skip") {
                changes.priority = prioritySelection as TaskPriority;
            }

            // Tags update (simplified for TUI)
            const tagsOptions = ["skip", "clear", "urgent", "work", "personal"];
            const tagsSelection = await Select.prompt({
                message: "Update tags:",
                options: [
                    { name: "Skip - keep current", value: "skip" },
                    { name: "Clear all tags", value: "clear" },
                    { name: "Add 'urgent' tag", value: "urgent" },
                    { name: "Add 'work' tag", value: "work" },
                    { name: "Add 'personal' tag", value: "personal" }
                ]
            });

            if (tagsSelection === "clear") {
                changes.tags = [];
            } else if (tagsSelection !== "skip") {
                changes.tags = [tagsSelection];
            }

            if (Object.keys(changes).length > 0) {
                const result = await bulkUpdateTasks(selectedIds, changes);
                if (result.successCount > 0) {
                    UI.success(`${result.successCount} tasks updated.`);
                }
                if (result.errors.length > 0) {
                    result.errors.forEach(error => {
                        UI.error(`Task ${error.id}: ${error.error}`);
                    });
                }
            } else {
                UI.info("No changes made.");
            }

        } else if (action === "delete") {
            const confirmOptions = ["no", "yes"];
            const confirmed = await Select.prompt({
                message: `Delete ${selectedIds.length} selected tasks?`,
                options: [
                    { name: "No, cancel", value: "no" },
                    { name: "Yes, delete them", value: "yes" }
                ]
            });

            if (confirmed === "yes") {
                const result = await bulkDeleteTasks(selectedIds);
                if (result.successCount > 0) {
                    UI.success(`${result.successCount} tasks deleted.`);
                }
                if (result.errors.length > 0) {
                    result.errors.forEach(error => {
                        UI.error(`Task ${error.id}: ${error.error}`);
                    });
                }
            }
        }

        // Wait for user to see results
        console.log("");
        console.log("Press any key to continue...");
        // Simple timeout for TUI - user can press any key to continue
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        UI.error(`Bulk operation failed: ${message}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
