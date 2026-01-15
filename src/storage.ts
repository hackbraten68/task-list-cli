import { Task, BulkResult } from "./types.ts";

const TASK_FILE = "tasks.json";

export async function loadTasks(): Promise<Task[]> {
    try {
        const data = await Deno.readTextFile(TASK_FILE);
        const tasks = JSON.parse(data);

        // Migration: ensure all tasks have required fields
        return tasks.map((t: any) => ({
            ...t,
            priority: t.priority || "medium",
            status: t.status || "todo",
            tags: t.tags || [],
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || new Date().toISOString(),
        }));
    } catch {
        return [];
    }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
    await Deno.writeTextFile(TASK_FILE, JSON.stringify(tasks, null, 2));
}

export async function getNextId(): Promise<number> {
    const tasks = await loadTasks();
    return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
}

/**
 * Bulk mark multiple tasks with a status
 */
export async function bulkMarkTasks(ids: number[], status: string): Promise<BulkResult> {
    try {
        const tasks = await loadTasks();
        const errors: Array<{id: number, error: string}> = [];
        let successCount = 0;

        // Validate status
        const validStatuses = ["todo", "in-progress", "done"];
        if (!validStatuses.includes(status)) {
            return {
                successCount: 0,
                failedCount: ids.length,
                errors: ids.map(id => ({ id, error: `Invalid status: ${status}` })),
                rolledBack: false
            };
        }

        // Apply changes
        const updatedTasks = tasks.map(task => {
            if (ids.includes(task.id)) {
                if (task.status === status) {
                    errors.push({ id: task.id, error: `Task already has status: ${status}` });
                    return task;
                } else {
                    successCount++;
                    return {
                        ...task,
                        status: status as any,
                        updatedAt: new Date().toISOString()
                    };
                }
            }
            return task;
        });

        // Save if any changes were made
        if (successCount > 0) {
            await saveTasks(updatedTasks);
        }

        return {
            successCount,
            failedCount: ids.length - successCount,
            errors,
            rolledBack: false
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            successCount: 0,
            failedCount: ids.length,
            errors: ids.map(id => ({ id, error: `Storage error: ${message}` })),
            rolledBack: true
        };
    }
}

/**
 * Bulk delete multiple tasks
 */
export async function bulkDeleteTasks(ids: number[]): Promise<BulkResult> {
    try {
        const tasks = await loadTasks();
        const originalTasks = [...tasks];
        let successCount = 0;
        const errors: Array<{id: number, error: string}> = [];

        // Filter out tasks to delete
        const remainingTasks = tasks.filter(task => {
            if (ids.includes(task.id)) {
                successCount++;
                return false; // Remove this task
            }
            return true; // Keep this task
        });

        // Check if all requested tasks were found
        const foundIds = new Set(tasks.map(t => t.id));
        const notFoundIds = ids.filter(id => !foundIds.has(id));

        notFoundIds.forEach(id => {
            errors.push({ id, error: "Task not found" });
        });

        const actualSuccessCount = successCount - notFoundIds.length;

        // Save if any tasks were actually deleted
        if (actualSuccessCount > 0) {
            await saveTasks(remainingTasks);
        }

        return {
            successCount: actualSuccessCount,
            failedCount: notFoundIds.length,
            errors,
            rolledBack: false
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            successCount: 0,
            failedCount: ids.length,
            errors: ids.map(id => ({ id, error: `Storage error: ${message}` })),
            rolledBack: true
        };
    }
}

/**
 * Bulk update multiple tasks with property changes
 */
export async function bulkUpdateTasks(ids: number[], changes: Partial<Task>): Promise<BulkResult> {
    try {
        const tasks = await loadTasks();
        const errors: Array<{id: number, error: string}> = [];
        let successCount = 0;

        // Apply changes
        const updatedTasks = tasks.map(task => {
            if (ids.includes(task.id)) {
                try {
                    const updatedTask = { ...task };

                    // Apply each change
                    if (changes.priority !== undefined) {
                        const validPriorities = ["low", "medium", "high", "critical"];
                        if (!validPriorities.includes(changes.priority)) {
                            errors.push({ id: task.id, error: `Invalid priority: ${changes.priority}` });
                            return task;
                        }
                        updatedTask.priority = changes.priority;
                    }

                    if (changes.status !== undefined) {
                        const validStatuses = ["todo", "in-progress", "done"];
                        if (!validStatuses.includes(changes.status)) {
                            errors.push({ id: task.id, error: `Invalid status: ${changes.status}` });
                            return task;
                        }
                        updatedTask.status = changes.status;
                    }

                    if (changes.tags !== undefined) {
                        updatedTask.tags = changes.tags;
                    }

                    if (changes.description !== undefined) {
                        updatedTask.description = changes.description;
                    }

                    if (changes.details !== undefined) {
                        updatedTask.details = changes.details;
                    }

                    if (changes.dueDate !== undefined) {
                        updatedTask.dueDate = changes.dueDate;
                    }

                    updatedTask.updatedAt = new Date().toISOString();
                    successCount++;

                    return updatedTask;
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    errors.push({ id: task.id, error: `Update error: ${message}` });
                    return task;
                }
            }
            return task;
        });

        // Save if any changes were made
        if (successCount > 0) {
            await saveTasks(updatedTasks);
        }

        return {
            successCount,
            failedCount: ids.length - successCount,
            errors,
            rolledBack: false
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            successCount: 0,
            failedCount: ids.length,
            errors: ids.map(id => ({ id, error: `Storage error: ${message}` })),
            rolledBack: true
        };
    }
}
