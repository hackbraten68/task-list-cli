import { Confirm, Select } from "cliffy/prompt";
import { colors, ansi } from "cliffy/ansi";
import { loadTasks, saveTasks, bulkDeleteTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { prepareBulkOperation, getTaskSummaries } from "../utils/task-selection.ts";

export async function deleteCommand(id?: number | string, options?: { modal?: boolean, renderBackground?: () => Promise<void>, force?: boolean }) {
    const isModal = options?.modal;
    const isForce = options?.force || false;
    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks to delete.");
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
        const taskOptions = tasks.map(t => `${t.id}: ${t.description}`);
        const selected = await Select.prompt({
            message: "Select task to delete",
            options: taskOptions,
        });
        const selectedId = parseInt(selected.split(':')[0].trim());
        taskIds = [selectedId];
    }

    // Bulk operation
    if (isBulkOperation || taskIds.length > 1) {
        const taskSummaries = getTaskSummaries(tasks, taskIds);

        if (!isModal) {
            UI.clearScreen();
            UI.header();
            console.log(`  ${colors.bold.red("Deleting Multiple Tasks")}`);
            console.log(`  ${colors.dim("Tasks to delete:")}`);
            taskSummaries.forEach(summary => console.log(`    ${summary}`));
            console.log("");
        }

        // Confirmation unless force flag is used
        let confirmed = isForce;
        if (!confirmed) {
            const confirmMessage = `Delete ${taskIds.length} tasks?`;
            confirmed = await Confirm.prompt({
                message: confirmMessage,
            });
        }

        if (confirmed) {
            const result = await bulkDeleteTasks(taskIds);

            if (result.successCount > 0) {
                UI.success(`${result.successCount} tasks deleted.`);
            }
            if (result.errors.length > 0) {
                result.errors.forEach(error => {
                    UI.error(`Task ${error.id}: ${error.error}`);
                });
            }
        } else {
            UI.info("Deletion cancelled.");
        }
        return;
    }

    // Single task operation (existing logic)
    const singleTaskId = taskIds[0];
    const singleTaskIndex = tasks.findIndex(t => t.id === singleTaskId);
    if (singleTaskIndex === -1) {
        UI.error(`Task with ID ${singleTaskId} not found.`);
        return;
    }

    const singleTask = tasks[singleTaskIndex];

    if (!isModal) {
        UI.clearScreen();
        UI.header();
        console.log(`  ${colors.bold.red("Deleting Task:")} ${colors.yellow(singleTask.id.toString())}`);
        console.log(`  ${colors.bold("Description:")}   ${singleTask.description}`);
    }

    const singleConfirmed = isForce || await Confirm.prompt({
        message: `Are you sure you want to delete this task?`,
    });

    // Handle bulk or single operation based on taskIds
    if (isBulkOperation || taskIds.length > 1) {
        const taskSummaries = getTaskSummaries(tasks, taskIds);

        if (!isModal) {
            UI.clearScreen();
            UI.header();
            console.log(`  ${colors.bold.red("Deleting Multiple Tasks")}`);
            console.log(`  ${colors.dim("Tasks to delete:")}`);
            taskSummaries.forEach(summary => console.log(`    ${summary}`));
            console.log("");
        }

        // Confirmation unless force flag is used
        const confirmed = isForce || await Confirm.prompt({
            message: `Delete ${taskIds.length} tasks?`,
        });

        if (confirmed) {
            const result = await bulkDeleteTasks(taskIds);

            if (result.successCount > 0) {
                UI.success(`${result.successCount} tasks deleted.`);
            }
            if (result.errors.length > 0) {
                result.errors.forEach(error => {
                    UI.error(`Task ${error.id}: ${error.error}`);
                });
            }
        } else {
            UI.info("Deletion cancelled.");
        }
    } else {
        // Single task operation (existing logic)
        const singleTaskId = taskIds[0];
        const singleTaskIndex = tasks.findIndex(t => t.id === singleTaskId);
        if (singleTaskIndex === -1) {
            UI.error(`Task with ID ${singleTaskId} not found.`);
            return;
        }

        const singleTask = tasks[singleTaskIndex];

        if (!isModal) {
            UI.clearScreen();
            UI.header();
            console.log(`  ${colors.bold.red("Deleting Task:")} ${colors.yellow(singleTask.id.toString())}`);
            console.log(`  ${colors.bold("Description:")}   ${singleTask.description}`);
        }

        const singleConfirmed = isForce || await Confirm.prompt({
            message: `Are you sure you want to delete this task?`,
        });

        if (singleConfirmed) {
            tasks.splice(singleTaskIndex, 1);
            await saveTasks(tasks);
            if (!isModal) UI.success(`Task ${singleTaskId} deleted.`);
        } else {
            UI.info("Deletion cancelled.");
        }
    }
}
