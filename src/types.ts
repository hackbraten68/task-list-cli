export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
    id: number;
    description: string;
    details?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
}
