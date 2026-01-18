import { loadTasks } from "../storage.ts";
import { createUI, getUIImplementation } from "../ui/factory.ts";
import { Task, TaskPriority, TaskStatus } from "../types.ts";
import { FuzzySearchOptions, fuzzySearchTasks } from "../utils/fuzzy-search.ts";

function filterTasksBySearch(tasks: Task[], searchTerm: string): Task[] {
  if (!searchTerm) return tasks;

  const term = searchTerm.toLowerCase();
  return tasks.filter((task) =>
    task.description.toLowerCase().includes(term) ||
    (task.details && task.details.toLowerCase().includes(term)) ||
    (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(term)))
  );
}

export function sortTasks(
  tasks: Task[],
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc",
): Task[] {
  if (
    !sortBy ||
    !["due-date", "priority", "status", "created", "updated", "description"]
      .includes(sortBy)
  ) {
    return tasks; // Fallback to ID order for invalid sort fields
  }

  return [...tasks].sort((a, b) => {
    const getValue = (task: Task) => {
      switch (sortBy) {
        case "due-date":
          return task.dueDate ? new Date(task.dueDate).getTime() : Infinity;
        case "priority":
          return { low: 1, medium: 2, high: 3, critical: 4 }[task.priority];
        case "status":
          return { todo: 1, "in-progress": 2, done: 3 }[task.status];
        case "created":
          return new Date(task.createdAt).getTime();
        case "updated":
          return new Date(task.updatedAt).getTime();
        case "description":
          return task.description.toLowerCase();
        default:
          return 0;
      }
    };

    const aValue = getValue(a);
    const bValue = getValue(b);

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
}

export async function listCommand(
  options: {
    status?: string;
    priority?: string;
    tags?: string;
    search?: string;
    fuzzy?: boolean;
    sortBy?: string;
    sortOrder?: string;
  },
) {
  const UI = createUI(getUIImplementation());
  const tasks = await loadTasks();

  let filteredTasks = tasks;
  if (options.status) {
    const status = options.status as TaskStatus;
    filteredTasks = filteredTasks.filter((t) => t.status === status);
  }
  if (options.priority) {
    const priority = options.priority as TaskPriority;
    filteredTasks = filteredTasks.filter((t) => t.priority === priority);
  }
  if (options.tags) {
    const tagFilter = options.tags.toLowerCase();
    filteredTasks = filteredTasks.filter((t) =>
      t.tags && t.tags.some((tag) => tag.toLowerCase().includes(tagFilter))
    );
  }
  if (options.search) {
    if (options.fuzzy) {
      const fuzzyOptions: FuzzySearchOptions = { threshold: 0.7 };
      const fuzzyResults = fuzzySearchTasks(
        filteredTasks,
        options.search,
        fuzzyOptions,
      );
      filteredTasks = fuzzyResults.map((r) => r.task);
    } else {
      filteredTasks = filterTasksBySearch(filteredTasks, options.search);
    }
  }

  // Apply sorting
  filteredTasks = sortTasks(
    filteredTasks,
    options.sortBy,
    (options.sortOrder as "asc" | "desc") || "asc",
  );

  UI.header();
  UI.statusSummary(tasks);

  // Show filtering and sorting information
  const infoParts = [];
  if (options.status || options.priority || options.tags || options.search) {
    const filters = [];
    if (options.status) filters.push(`status: ${options.status}`);
    if (options.priority) filters.push(`priority: ${options.priority}`);
    if (options.tags) filters.push(`tags: ${options.tags}`);
    if (options.search) {
      const mode = options.fuzzy ? "fuzzy search" : "search";
      filters.push(`${mode}: "${options.search}"`);
    }
    infoParts.push(`Filtering by: ${filters.join(", ")}`);
  }
  if (options.sortBy) {
    const order = options.sortOrder || "asc";
    infoParts.push(`Sorted by: ${options.sortBy} (${order})`);
  }

  if (infoParts.length > 0) {
    UI.info(infoParts.join(" | "));
  }

  UI.renderTasks(filteredTasks);
}
