import { Select, Confirm, Input } from "cliffy/prompt";
import { colors } from "cliffy/ansi";
import { bulkMarkTasks, bulkDeleteTasks, bulkUpdateTasks, loadTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { Task, TaskStatus, TaskPriority } from "../types.ts";
import { prepareBulkOperation, getTaskSummaries } from "../utils/task-selection.ts";

/**
 * Bulk mark command - mark multiple tasks with a status
 */
export async function bulkMarkCommand(status?: TaskStatus, ids?: string) {
    if (!ids) {
        UI.error("Please provide task IDs. Usage: lazytask bulk-mark <status> <ids>");
        UI.info("Example: lazytask bulk-mark done \"1,2,3,5-8\"");
        return;
    }

    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks available.");
        return;
    }

    const { taskIds, errors } = prepareBulkOperation(ids, tasks);
    if (errors.length > 0) {
        UI.error(errors.join("\n"));
        return;
    }

    if (!status) {
        const statusOptions = ["todo", "in-progress", "done"];
        const selected = await Select.prompt({
            message: `Select status for ${taskIds.length} tasks`,
            options: statusOptions,
        });
        status = selected as TaskStatus;
    }

    const result = await bulkMarkTasks(taskIds, status);

    if (result.successCount > 0) {
        UI.success(`${result.successCount} tasks marked as ${status}.`);
    }
    if (result.errors.length > 0) {
        result.errors.forEach(error => {
            UI.error(`Task ${error.id}: ${error.error}`);
        });
    }
}

/**
 * Bulk delete command - delete multiple tasks
 */
export async function bulkDeleteCommand(ids?: string, options?: { force?: boolean }) {
    if (!ids) {
        UI.error("Please provide task IDs. Usage: lazytask bulk-delete <ids>");
        UI.info("Example: lazytask bulk-delete \"1,2,3,5-8\"");
        return;
    }

    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks available.");
        return;
    }

    const { taskIds, errors } = prepareBulkOperation(ids, tasks);
    if (errors.length > 0) {
        UI.error(errors.join("\n"));
        return;
    }

    // Show task summaries
    UI.clearScreen();
    UI.header();
    console.log(`  ${colors.bold.red("Deleting Multiple Tasks")}`);
    console.log(`  ${colors.dim("Tasks to delete:")}`);
    const summaries = getTaskSummaries(tasks, taskIds);
    summaries.forEach(summary => console.log(`    ${summary}`));
    console.log("");

    // Confirmation unless force flag is used
    const confirmed = options?.force || await Confirm.prompt({
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
}

/**
 * Bulk update command - update multiple tasks
 */
export async function bulkUpdateCommand(ids?: string, options?: {
    priority?: TaskPriority,
    tags?: string,
    addTags?: string,
    removeTags?: string
}) {
    if (!ids) {
        UI.error("Please provide task IDs. Usage: lazytask bulk-update <ids> [options]");
        UI.info("Example: lazytask bulk-update \"1,2,3\" --priority high --tags \"urgent\"");
        return;
    }

    const tasks = await loadTasks();
    if (tasks.length === 0) {
        UI.info("No tasks available.");
        return;
    }

    const { taskIds, errors } = prepareBulkOperation(ids, tasks);
    if (errors.length > 0) {
        UI.error(errors.join("\n"));
        return;
    }

    const changes: Partial<Task> = {};

    // Apply CLI options
    if (options?.priority) {
        changes.priority = options.priority;
    }

    if (options?.tags) {
        changes.tags = options.tags.split(",").map(t => t.trim()).filter(t => t);
    }

    // Interactive mode if no options provided
    if (Object.keys(changes).length === 0) {
        UI.clearScreen();
        UI.header();
        console.log(`  ${colors.bold.cyan("Bulk Updating Tasks")}`);
        console.log(`  ${colors.dim("Tasks to update:")}`);
        const summaries = getTaskSummaries(tasks, taskIds);
        summaries.forEach(summary => console.log(`    ${summary}`));
        console.log("");

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
            changes.tags = tagsInput.split(",").map(t => t.trim()).filter(t => t);
        }
    }

    // Apply changes
    if (Object.keys(changes).length > 0) {
        const result = await bulkUpdateTasks(taskIds, changes);

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
}