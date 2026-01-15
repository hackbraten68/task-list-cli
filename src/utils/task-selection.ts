import { Task } from "../types.ts";

/**
 * Parse task ID ranges from string input
 * Supports formats: "1,2,3", "5-8", "1,3,5-7,9"
 */
export function parseTaskIds(input: string): number[] {
  if (!input || input.trim() === "") {
    return [];
  }

  const ids: number[] = [];
  const parts = input.split(",").map(p => p.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      // Handle ranges like "5-8"
      const [startStr, endStr] = part.split("-").map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error(`Invalid range: ${part}`);
      }

      for (let i = start; i <= end; i++) {
        if (!ids.includes(i)) {
          ids.push(i);
        }
      }
    } else {
      // Handle single IDs like "1"
      const id = parseInt(part, 10);
      if (isNaN(id)) {
        throw new Error(`Invalid ID: ${part}`);
      }
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
  }

  return ids.sort((a, b) => a - b);
}

/**
 * Validate that task IDs exist in the task list
 */
export function validateTaskIds(ids: number[], existingTasks: Task[]): { valid: number[], invalid: number[] } {
  const existingIds = new Set(existingTasks.map(t => t.id));
  const valid: number[] = [];
  const invalid: number[] = [];

  for (const id of ids) {
    if (existingIds.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

/**
 * Get task summaries for display in confirmations
 */
export function getTaskSummaries(tasks: Task[], ids: number[]): string[] {
  return ids.map(id => {
    const task = tasks.find(t => t.id === id);
    return task ? `[${id}] ${task.description}` : `[${id}] Task not found`;
  });
}

/**
 * Validate and prepare bulk operation input
 */
export function prepareBulkOperation(
  idInput: string,
  existingTasks: Task[]
): { taskIds: number[], errors: string[] } {
  const errors: string[] = [];

  try {
    const taskIds = parseTaskIds(idInput);
    const { valid, invalid } = validateTaskIds(taskIds, existingTasks);

    if (invalid.length > 0) {
      errors.push(`Invalid task IDs: ${invalid.join(", ")}`);
    }

    if (valid.length === 0) {
      errors.push("No valid task IDs provided");
    }

    return { taskIds: valid, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`ID parsing error: ${message}`);
    return { taskIds: [], errors };
  }
}