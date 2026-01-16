import { assertEquals } from "jsr:@std/assert";
import { loadTasks, saveTasks, exportTasks, importTasks } from "./src/storage.ts";

// Test data
const testTasks = [
  {
    id: 1,
    description: "Test task 1",
    details: "Details for task 1",
    status: "todo" as const,
    priority: "high" as const,
    dueDate: "2024-12-31",
    tags: ["urgent", "work"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    description: "Test task 2",
    status: "done" as const,
    priority: "low" as const,
    tags: [],
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z"
  }
];

Deno.test("Data export/import functions", async (t) => {
  // Setup: Save test tasks
  await t.step("setup test data", async () => {
    await saveTasks(testTasks);
    const tasks = await loadTasks();
    assertEquals(tasks.length, 2);
  });

  // Test JSON export
  await t.step("export to JSON", async () => {
    const outputPath = "test-export.json";
    await exportTasks({ format: 'json', outputPath });

    // Verify file exists and content
    const content = await Deno.readTextFile(outputPath);
    const exported = JSON.parse(content);
    assertEquals(exported.length, 2);
    assertEquals(exported[0].description, "Test task 1");

    // Cleanup
    await Deno.remove(outputPath);
  });

  // Test CSV export
  await t.step("export to CSV", async () => {
    const outputPath = "test-export.csv";
    await exportTasks({ format: 'csv', outputPath });

    // Verify file exists and content
    const content = await Deno.readTextFile(outputPath);
    const lines = content.trim().split('\n');
    assertEquals(lines.length, 3); // header + 2 data rows
    assertEquals(lines[0], 'id,description,details,status,priority,dueDate,tags,createdAt,updatedAt');

    // Cleanup
    await Deno.remove(outputPath);
  });

  // Test export with filters
  await t.step("export with status filter", async () => {
    const outputPath = "test-export-filtered.json";
    await exportTasks({ format: 'json', outputPath, status: 'done' });

    const content = await Deno.readTextFile(outputPath);
    const exported = JSON.parse(content);
    assertEquals(exported.length, 1);
    assertEquals(exported[0].status, 'done');

    // Cleanup
    await Deno.remove(outputPath);
  });

  // Test JSON import (merge)
  await t.step("import JSON merge", async () => {
    const importData = [{
      description: "Imported task",
      status: "todo",
      priority: "medium"
    }];
    const importPath = "test-import.json";
    await Deno.writeTextFile(importPath, JSON.stringify(importData));

    const result = await importTasks({ format: 'json', inputPath: importPath, mode: 'merge' });
    assertEquals(result.success, true);
    assertEquals(result.importedCount, 1);

    const tasks = await loadTasks();
    assertEquals(tasks.length, 3); // original 2 + 1 imported

    // Cleanup
    await Deno.remove(importPath);
  });

  // Test CSV import
  await t.step("import CSV", async () => {
    const csvData = `description,details,status,priority,dueDate,tags
"CSV task","CSV details",todo,high,"2024-12-25","csv;test"`;
    const importPath = "test-import.csv";
    await Deno.writeTextFile(importPath, csvData);

    const result = await importTasks({ format: 'csv', inputPath: importPath, mode: 'merge' });
    assertEquals(result.success, true);
    assertEquals(result.importedCount, 1);

    const tasks = await loadTasks();
    const csvTask = tasks.find(t => t.description === "CSV task");
    assertEquals(csvTask?.tags, ["csv", "test"]);

    // Cleanup
    await Deno.remove(importPath);
  });

  // Test validation
  await t.step("import validation", async () => {
    const invalidData = [{
      description: "Invalid task",
      status: "invalid-status",
      priority: "medium"
    }];
    const importPath = "test-invalid.json";
    await Deno.writeTextFile(importPath, JSON.stringify(invalidData));

    const result = await importTasks({ format: 'json', inputPath: importPath, mode: 'merge', validateOnly: true });
    assertEquals(result.success, false);
    assertEquals(result.errors?.length, 1);

    // Cleanup
    await Deno.remove(importPath);
  });

  // Test replace mode
  await t.step("import replace mode", async () => {
    const replaceData = [{
      description: "Replaced task",
      status: "done",
      priority: "critical"
    }];
    const importPath = "test-replace.json";
    await Deno.writeTextFile(importPath, JSON.stringify(replaceData));

    const result = await importTasks({ format: 'json', inputPath: importPath, mode: 'replace' });
    assertEquals(result.success, true);
    assertEquals(result.importedCount, 1);

    const tasks = await loadTasks();
    assertEquals(tasks.length, 1);
    assertEquals(tasks[0].description, "Replaced task");

    // Cleanup
    await Deno.remove(importPath);
  });

  // Cleanup: Reset to empty
  await t.step("cleanup", async () => {
    await saveTasks([]);
    const tasks = await loadTasks();
    assertEquals(tasks.length, 0);
  });
});
