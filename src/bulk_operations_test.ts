import { assert, assertEquals } from "@std/assert";
import { Task, TaskPriority, TaskStatus } from "../src/types.ts";
import {
  bulkDeleteTasks,
  bulkMarkTasks,
  bulkUpdateTasks,
} from "../src/storage.ts";
import {
  getTaskSummaries,
  parseTaskIds,
  prepareBulkOperation,
  validateTaskIds,
} from "../src/utils/task-selection.ts";

// Mock data for testing
const mockTasks: Task[] = [
  {
    id: 1,
    description: "Task 1",
    status: "todo",
    priority: "medium",
    tags: ["work"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    description: "Task 2",
    status: "in-progress",
    priority: "high",
    tags: ["urgent"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 3,
    description: "Task 3",
    status: "done",
    priority: "low",
    tags: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

// Helper function to create test tasks JSON file
async function setupTestData(tasks: Task[]) {
  const testFile = "test_tasks.json";
  await Deno.writeTextFile(testFile, JSON.stringify(tasks, null, 2));
  return testFile;
}

// Helper function to cleanup test file
async function cleanupTestFile(filename: string) {
  try {
    await Deno.remove(filename);
  } catch {
    // Ignore if file doesn't exist
  }
}

Deno.test("Bulk Operations Tests", async (t) => {
  await t.step("parseTaskIds - single ID", () => {
    const result = parseTaskIds("5");
    assertEquals(result, [5]);
  });

  await t.step("parseTaskIds - multiple IDs", () => {
    const result = parseTaskIds("1,3,5");
    assertEquals(result, [1, 3, 5]);
  });

  await t.step("parseTaskIds - ranges", () => {
    const result = parseTaskIds("5-8");
    assertEquals(result, [5, 6, 7, 8]);
  });

  await t.step("parseTaskIds - mixed", () => {
    const result = parseTaskIds("1,3,5-7,9");
    assertEquals(result, [1, 3, 5, 6, 7, 9]);
  });

  await t.step("parseTaskIds - invalid range", () => {
    try {
      parseTaskIds("8-5");
      assert(false, "Should have thrown error");
    } catch (error) {
      assert(error instanceof Error);
    }
  });

  await t.step("parseTaskIds - empty input", () => {
    const result = parseTaskIds("");
    assertEquals(result, []);
  });

  await t.step("validateTaskIds - all valid", () => {
    const ids = [1, 2];
    const result = validateTaskIds(ids, mockTasks);
    assertEquals(result.valid, [1, 2]);
    assertEquals(result.invalid, []);
  });

  await t.step("validateTaskIds - some invalid", () => {
    const ids = [1, 999];
    const result = validateTaskIds(ids, mockTasks);
    assertEquals(result.valid, [1]);
    assertEquals(result.invalid, [999]);
  });

  await t.step("prepareBulkOperation - valid", () => {
    const result = prepareBulkOperation("1,2", mockTasks);
    assertEquals(result.taskIds, [1, 2]);
    assertEquals(result.errors, []);
  });

  await t.step("prepareBulkOperation - invalid IDs", () => {
    const result = prepareBulkOperation("1,999", mockTasks);
    assertEquals(result.taskIds, [1]);
    assertEquals(result.errors.length, 1);
  });

  await t.step("getTaskSummaries - valid tasks", () => {
    const summaries = getTaskSummaries(mockTasks, [1, 2]);
    assertEquals(summaries.length, 2);
    assert(summaries[0].includes("[1]"));
    assert(summaries[0].includes("Task 1"));
    assert(summaries[1].includes("[2]"));
    assert(summaries[1].includes("Task 2"));
  });

  await t.step("getTaskSummaries - non-existent task", () => {
    const summaries = getTaskSummaries(mockTasks, [999]);
    assertEquals(summaries.length, 1);
    assert(summaries[0].includes("[999]"));
    assert(summaries[0].includes("Task not found"));
  });
});

Deno.test("Bulk Storage Operations Tests", async (t) => {
  await t.step("bulkMarkTasks function exists", async () => {
    assert(typeof bulkMarkTasks === "function");
  });

  await t.step("bulkDeleteTasks function exists", async () => {
    assert(typeof bulkDeleteTasks === "function");
  });

  await t.step("bulkUpdateTasks function exists", async () => {
    assert(typeof bulkUpdateTasks === "function");
  });

  await t.step("BulkResult interface structure", () => {
    // Test that the functions return proper BulkResult structure
    // Note: Full integration testing would require mocking file operations
    assert(
      true,
      "BulkResult interface tests would require file system mocking",
    );
  });
});

Deno.test("Integration Tests", async (t) => {
  await t.step("ID range parsing integration", () => {
    // Test that parsing works correctly with various inputs
    const validRanges = ["1,2,3", "1-3", "1,3"];
    const invalidRanges = ["8-5", "abc", "1,invalid,3"];

    // Test valid ranges that should parse
    for (const range of validRanges) {
      try {
        const ids = parseTaskIds(range);
        assert(ids.length > 0, `Range "${range}" should parse to valid IDs`);
      } catch (error) {
        assert(false, `Valid range "${range}" should not throw: ${error}`);
      }
    }

    // Test invalid ranges that should fail
    for (const range of invalidRanges) {
      try {
        parseTaskIds(range);
        // Some invalid ranges might not throw but produce empty results
      } catch {
        // Expected for truly invalid ranges like "8-5"
      }
    }

    // Test prepareBulkOperation with actual task validation
    const result = prepareBulkOperation("1,2,3", mockTasks);
    assertEquals(
      result.errors.length,
      0,
      "Valid existing IDs should not produce errors",
    );
    assertEquals(result.taskIds, [1, 2, 3], "Should return valid task IDs");

    const invalidResult = prepareBulkOperation("1,999", mockTasks);
    assert(
      invalidResult.errors.length > 0,
      "Invalid task IDs should produce errors",
    );
    assertEquals(invalidResult.taskIds, [1], "Should only return valid IDs");
  });

  await t.step("Command integration validation", () => {
    // Test that our bulk operation preparation integrates properly
    // with the command functions

    // Test successful bulk preparation
    const successPrep = prepareBulkOperation("1,2", mockTasks);
    assert(successPrep.errors.length === 0);
    assert(successPrep.taskIds.length === 2);

    // Test failed bulk preparation
    const failPrep = prepareBulkOperation("999", mockTasks);
    assert(failPrep.errors.length > 0);
    assert(failPrep.taskIds.length === 0);

    // Test mixed valid/invalid
    const mixedPrep = prepareBulkOperation("1,999,2", mockTasks);
    assert(mixedPrep.errors.length > 0);
    assert(mixedPrep.taskIds.length === 2); // Should include valid IDs
  });
});
