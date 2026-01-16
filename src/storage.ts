import {
  BulkResult,
  ExportOptions,
  ImportOptions,
  ImportResult,
  Task,
} from "./types.ts";

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
export async function bulkMarkTasks(
  ids: number[],
  status: string,
): Promise<BulkResult> {
  try {
    const tasks = await loadTasks();
    const errors: Array<{ id: number; error: string }> = [];
    let successCount = 0;

    // Validate status
    const validStatuses = ["todo", "in-progress", "done"];
    if (!validStatuses.includes(status)) {
      return {
        successCount: 0,
        failedCount: ids.length,
        errors: ids.map((id) => ({ id, error: `Invalid status: ${status}` })),
        rolledBack: false,
      };
    }

    // Apply changes
    const updatedTasks = tasks.map((task) => {
      if (ids.includes(task.id)) {
        if (task.status === status) {
          errors.push({
            id: task.id,
            error: `Task already has status: ${status}`,
          });
          return task;
        } else {
          successCount++;
          return {
            ...task,
            status: status as any,
            updatedAt: new Date().toISOString(),
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
      rolledBack: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      successCount: 0,
      failedCount: ids.length,
      errors: ids.map((id) => ({ id, error: `Storage error: ${message}` })),
      rolledBack: true,
    };
  }
}

/**
 * Bulk delete multiple tasks
 */
export async function bulkDeleteTasks(ids: number[]): Promise<BulkResult> {
  try {
    const tasks = await loadTasks();
    const _originalTasks = [...tasks];
    let successCount = 0;
    const errors: Array<{ id: number; error: string }> = [];

    // Filter out tasks to delete
    const remainingTasks = tasks.filter((task) => {
      if (ids.includes(task.id)) {
        successCount++;
        return false; // Remove this task
      }
      return true; // Keep this task
    });

    // Check if all requested tasks were found
    const foundIds = new Set(tasks.map((t) => t.id));
    const notFoundIds = ids.filter((id) => !foundIds.has(id));

    notFoundIds.forEach((id) => {
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
      rolledBack: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      successCount: 0,
      failedCount: ids.length,
      errors: ids.map((id) => ({ id, error: `Storage error: ${message}` })),
      rolledBack: true,
    };
  }
}

/**
 * Bulk update multiple tasks with property changes
 */
export async function bulkUpdateTasks(
  ids: number[],
  changes: Partial<Task>,
): Promise<BulkResult> {
  try {
    const tasks = await loadTasks();
    const errors: Array<{ id: number; error: string }> = [];
    let successCount = 0;

    // Apply changes
    const updatedTasks = tasks.map((task) => {
      if (ids.includes(task.id)) {
        try {
          const updatedTask = { ...task };

          // Apply each change
          if (changes.priority !== undefined) {
            const validPriorities = ["low", "medium", "high", "critical"];
            if (!validPriorities.includes(changes.priority)) {
              errors.push({
                id: task.id,
                error: `Invalid priority: ${changes.priority}`,
              });
              return task;
            }
            updatedTask.priority = changes.priority;
          }

          if (changes.status !== undefined) {
            const validStatuses = ["todo", "in-progress", "done"];
            if (!validStatuses.includes(changes.status)) {
              errors.push({
                id: task.id,
                error: `Invalid status: ${changes.status}`,
              });
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
          const message = error instanceof Error
            ? error.message
            : String(error);
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
      rolledBack: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      successCount: 0,
      failedCount: ids.length,
      errors: ids.map((id) => ({ id, error: `Storage error: ${message}` })),
      rolledBack: true,
    };
  }
}

/**
 * Export tasks to JSON or CSV format
 */
export async function exportTasks(options: ExportOptions): Promise<void> {
  const tasks = await loadTasks();

  // Apply filters
  let filteredTasks = tasks;
  if (options.status) {
    filteredTasks = filteredTasks.filter((t) => t.status === options.status);
  }
  if (options.priority) {
    filteredTasks = filteredTasks.filter((t) =>
      t.priority === options.priority
    );
  }
  if (options.tags) {
    const tagFilter = options.tags.split(",").map((t) => t.trim());
    filteredTasks = filteredTasks.filter((t) =>
      t.tags && tagFilter.some((tag) => t.tags!.includes(tag))
    );
  }

  // Generate output path if not provided
  const outputPath = options.outputPath ||
    `lazytask-export-${
      new Date().toISOString().split("T")[0]
    }.${options.format}`;

  // Format data
  let content: string;
  if (options.format === "json") {
    content = JSON.stringify(filteredTasks, null, 2);
  } else {
    // CSV format
    const headers = [
      "id",
      "description",
      "details",
      "status",
      "priority",
      "dueDate",
      "tags",
      "createdAt",
      "updatedAt",
    ];
    const rows = filteredTasks.map((task) => [
      task.id.toString(),
      `"${task.description.replace(/"/g, '""')}"`, // Escape quotes
      task.details ? `"${task.details.replace(/"/g, '""')}"` : "",
      task.status,
      task.priority,
      task.dueDate || "",
      task.tags ? task.tags.join(";") : "",
      task.createdAt,
      task.updatedAt,
    ]);
    content = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
  }

  // Write to file
  await Deno.writeTextFile(outputPath, content);
}

/**
 * Import tasks from JSON or CSV format
 */
export async function importTasks(
  options: ImportOptions,
): Promise<ImportResult> {
  try {
    // Read input file
    const content = await Deno.readTextFile(options.inputPath);

    // Parse data
    let importedTasks: any[];
    if (options.format === "json") {
      importedTasks = JSON.parse(content);
      if (!Array.isArray(importedTasks)) {
        return {
          success: false,
          message: "JSON file must contain an array of tasks",
        };
      }
    } else {
      // CSV parsing
      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        return {
          success: false,
          message: "CSV file must have at least a header row and one data row",
        };
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const expectedHeaders = [
        "id",
        "description",
        "details",
        "status",
        "priority",
        "dueDate",
        "tags",
        "createdAt",
        "updatedAt",
      ];

      // Check headers (case insensitive)
      const headerMap = new Map<string, number>();
      for (let i = 0; i < headers.length; i++) {
        headerMap.set(headers[i].toLowerCase(), i);
      }

      importedTasks = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i]);
        const task: any = {};

        for (const expected of expectedHeaders) {
          const index = headerMap.get(expected);
          if (index !== undefined) {
            task[expected] = cells[index]?.trim() || undefined;
          }
        }

        importedTasks.push(task);
      }
    }

    // Validate and migrate tasks
    const errors: string[] = [];
    const validTasks: Task[] = [];

    for (let i = 0; i < importedTasks.length; i++) {
      const rawTask = importedTasks[i];
      const validation = validateTask(rawTask, i + 1);
      if (validation.valid) {
        validTasks.push(validation.task!);
      } else {
        errors.push(validation.error!);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Validation failed for ${errors.length} task(s)`,
        errors,
      };
    }

    if (options.validateOnly) {
      return {
        success: true,
        message:
          `Validation successful. ${validTasks.length} tasks would be imported.`,
        importedCount: validTasks.length,
      };
    }

    // Apply import mode
    if (options.mode === "replace") {
      await saveTasks(validTasks);
      return {
        success: true,
        message:
          `Successfully replaced all tasks with ${validTasks.length} imported tasks.`,
        importedCount: validTasks.length,
      };
    } else {
      // Merge mode
      const existingTasks = await loadTasks();
      const maxId = existingTasks.length > 0
        ? Math.max(...existingTasks.map((t) => t.id))
        : 0;

      // Assign new IDs
      const mergedTasks = validTasks.map((task, index) => ({
        ...task,
        id: maxId + index + 1,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const allTasks = [...existingTasks, ...mergedTasks];
      await saveTasks(allTasks);

      return {
        success: true,
        message: `Successfully merged ${mergedTasks.length} tasks.`,
        importedCount: mergedTasks.length,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Import failed: ${message}` };
  }
}

/**
 * Parse a CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate and migrate a task
 */
function validateTask(
  rawTask: any,
  lineNumber: number,
): { valid: boolean; task?: Task; error?: string } {
  const errors: string[] = [];

  // Required fields
  if (!rawTask.description || typeof rawTask.description !== "string") {
    errors.push("description is required and must be a string");
  }

  if (
    !rawTask.status || !["todo", "in-progress", "done"].includes(rawTask.status)
  ) {
    errors.push(
      "status is required and must be one of: todo, in-progress, done",
    );
  }

  if (
    !rawTask.priority ||
    !["low", "medium", "high", "critical"].includes(rawTask.priority)
  ) {
    errors.push(
      "priority is required and must be one of: low, medium, high, critical",
    );
  }

  // Optional fields
  if (rawTask.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(rawTask.dueDate)) {
    errors.push("dueDate must be in YYYY-MM-DD format");
  }

  if (rawTask.tags && typeof rawTask.tags === "string") {
    // Split CSV tags
    rawTask.tags = rawTask.tags.split(";").map((t: string) => t.trim()).filter((
      t: string,
    ) => t.length > 0);
  }

  if (errors.length > 0) {
    return { valid: false, error: `Line ${lineNumber}: ${errors.join(", ")}` };
  }

  // Create valid task with defaults
  const task: Task = {
    id: rawTask.id || 0, // Will be reassigned
    description: rawTask.description!,
    details: rawTask.details,
    status: rawTask.status as any,
    priority: rawTask.priority as any,
    dueDate: rawTask.dueDate,
    tags: rawTask.tags,
    createdAt: rawTask.createdAt || new Date().toISOString(),
    updatedAt: rawTask.updatedAt || new Date().toISOString(),
  };

  return { valid: true, task };
}
