import { loadTasks } from "../storage.ts";
import { UI } from "../ui.ts";
import { TaskStatus, TaskPriority, Task } from "../types.ts";

function filterTasksBySearch(tasks: Task[], searchTerm: string): Task[] {
    if (!searchTerm) return tasks;

    const term = searchTerm.toLowerCase();
    return tasks.filter(task =>
        task.description.toLowerCase().includes(term) ||
        (task.details && task.details.toLowerCase().includes(term)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(term)))
    );
}

export async function listCommand(options: { status?: string, priority?: string, tags?: string, search?: string }) {
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
    if (options.search) {
        filteredTasks = filterTasksBySearch(filteredTasks, options.search);
    }

    UI.header();
    UI.statusSummary(tasks);

    if (options.status || options.priority || options.tags || options.search) {
        const filters = [];
        if (options.status) filters.push(`status: ${options.status}`);
        if (options.priority) filters.push(`priority: ${options.priority}`);
        if (options.tags) filters.push(`tags: ${options.tags}`);
        if (options.search) filters.push(`search: "${options.search}"`);
        UI.info(`Filtering by: ${filters.join(", ")}`);
    }

    UI.renderTasks(filteredTasks);
}
