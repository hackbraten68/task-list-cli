// test-navigation.ts
import { createUI } from "./src/ui/factory.ts";
import { loadTasks } from "./src/storage.ts";

async function testNavigation() {
  const ui = createUI("tui");
  const tasks = await loadTasks();

  if (tasks.length === 0) {
    console.log("No tasks to test navigation with");
    return;
  }

  console.log(`Testing navigation with ${tasks.length} tasks...\n`);

  // Simulate navigating through first 5 tasks
  for (let i = 0; i < Math.min(5, tasks.length); i++) {
    const task = tasks[i];
    console.log(`Task ${i + 1}: ${task.description}`);
    console.log(`  ID: ${task.id}`);
    console.log(`  Status: ${ui.statusPipe(task.status)}`);
    console.log(`  Priority: ${ui.priorityPipe(task.priority)}`);
    console.log(`  Tags: ${task.tags?.join(", ") || "-"}`);
    console.log("");
  }
}

testNavigation();