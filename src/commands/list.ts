import { loadTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { TaskStatus, TaskPriority } from "../types.ts";

export async function listCommand(options: { status?: string, priority?: string }) {
    const tasks = await loadTasks();

    let filteredTasks = tasks;
    if (options.status) {
        const status = options.status as TaskStatus;
        filteredTasks = filteredTasks.filter(t => t.status === status);
    }
    if (options.priority) {
        const priority = options.priority as TaskPriority;
        filteredTasks = filteredTasks.filter(t => t.priority === priority);
    }

    UI.header();
    UI.statusSummary(tasks);

    if (options.status || options.priority) {
        const filters = [];
        if (options.status) filters.push(`status: ${options.status}`);
        if (options.priority) filters.push(`priority: ${options.priority}`);
        UI.info(`Filtering by: ${filters.join(", ")}`);
    }

    UI.renderTasks(filteredTasks);
}
