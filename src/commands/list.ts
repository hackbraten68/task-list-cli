import { loadTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { TaskStatus, TaskPriority } from "../types.ts";

export async function listCommand(options: { status?: string, priority?: string, tags?: string }) {
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
    if (options.tags) {
        const tagFilter = options.tags.toLowerCase();
        filteredTasks = filteredTasks.filter(t => t.tags && t.tags.some(tag => tag.toLowerCase().includes(tagFilter)));
    }

    UI.header();
    UI.statusSummary(tasks);

    if (options.status || options.priority || options.tags) {
        const filters = [];
        if (options.status) filters.push(`status: ${options.status}`);
        if (options.priority) filters.push(`priority: ${options.priority}`);
        if (options.tags) filters.push(`tags: ${options.tags}`);
        UI.info(`Filtering by: ${filters.join(", ")}`);
    }

    UI.renderTasks(filteredTasks);
}
