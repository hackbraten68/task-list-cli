import { assertEquals } from "jsr:@std/assert";
import { addTask, loadTasks, clearAllTasks, updateTask, listTasks } from "./main.ts"; // Adjust path as needed

// Test suite for task functionalities
Deno.test("Task management functions", async (t) => {

  // Step 1: Clear all tasks to ensure a clean state
  await t.step("clear all tasks", async () => {
    await clearAllTasks();
    const tasks = await loadTasks();
    assertEquals(tasks.length, 0);
  });

  // Step 2: Add a new task and verify it was added
  await t.step("add a task", async () => {
    const description = "Test task description";
    const details = "Some detailed information";

    await addTask(description, details);
    const tasks = await loadTasks();

    assertEquals(tasks.length, 1);  // Expect one task
    assertEquals(tasks[0].description, description);  // Check description
    assertEquals(tasks[0].details, details);  // Check details
    assertEquals(tasks[0].status, "todo");  // Check initial status
  });

  // Step 3: Update the task and verify the update
  await t.step("update task", async () => {
    const updatedDescription = "Updated task description";
    const tasks = await loadTasks();

    if (tasks.length > 0) {
      const taskId = tasks[0].id;
      await updateTask(taskId, updatedDescription);

      const updatedTasks = await loadTasks();
      assertEquals(updatedTasks[0].description, updatedDescription);  // Verify updated description
    } else {
      throw new Error("No task found to update");
    }
  });

  // Step 4: List tasks to ensure it displays them correctly
  await t.step("list tasks", async () => {
    await listTasks();
    // Since `listTasks` outputs to console, visually verify the output for now.
    // Additional tooling would be needed to capture console output in tests.
  });

  // Step 5: Clean up by clearing all tasks
  await t.step("clear tasks as final cleanup", async () => {
    await clearAllTasks();
    const tasks = await loadTasks();
    assertEquals(tasks.length, 0);  // Ensure all tasks are cleared
  });
});
