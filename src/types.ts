export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
    id: number;
    description: string;
    details?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface BulkOperation {
    operation: 'mark' | 'delete' | 'update';
    taskIds: number[];
    changes?: Partial<Task>;
}

export interface BulkResult {
    successCount: number;
    failedCount: number;
    errors: Array<{id: number, error: string}>;
    rolledBack: boolean;
}
