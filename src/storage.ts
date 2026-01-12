import { Task } from "./types.ts";

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
