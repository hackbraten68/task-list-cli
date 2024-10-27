import { parse } from "https://deno.land/std@0.177.0/flags/mod.ts";
import Table from "npm:cli-table3";
import chalk from "@nothing628/chalk";

const TASK_FILE = "tasks.json";

interface Task {
  id: number;
  description: string;
  details: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export async function loadTasks(): Promise<Task[]> {
  try {
    const data = await Deno.readTextFile(TASK_FILE);
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await Deno.writeTextFile(TASK_FILE, JSON.stringify(tasks, null, 2));
}

export async function addTask(description: string, details: string = "") {
  const tasks = await loadTasks();
  const now = new Date().toISOString();

  const newTask: Task = {
    id: tasks.length + 1,
    description,
    details,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(newTask);
  await saveTasks(tasks);
  console.log(
    `Task added successfully (ID: ${newTask.id}) (Task: ${newTask.description}) (Details: ${newTask.details})`,
  );
}

export async function updateTask(taskId: number, description: string) {
  const tasks = await loadTasks();
  const task = tasks.find((task) => task.id === taskId);
  if (task) {
    task.description = description;
    task.updatedAt = new Date().toISOString();
    await saveTasks(tasks);
    console.log(`Task ${taskId} updated successfully.`);
  } else {
    console.log(`Task with ID ${taskId} not found.`);
  }
}

export async function deleteTask(taskId: number) {
  let tasks = await loadTasks();
  tasks = tasks.filter((task) => task.id !== taskId);
  await saveTasks(tasks);
  console.log(`Task ${taskId} deleted successfully.`);
}

export async function clearAllTasks() {
  await saveTasks([]);
  console.log("All tasks cleared successfully.");
}

export async function markTask(taskId: number, status: string) {
  const tasks = await loadTasks();
  const task = tasks.find((task) => task.id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
    await saveTasks(tasks);
    console.log(`Task ${taskId} marked as ${status}.`);
  } else {
    console.log(`Task with ID ${taskId} not found.`);
  }
}

export async function listTasks(status?: string) {
  const tasks = await loadTasks();
  const filteredTasks = status
    ? tasks.filter((task) => task.status === status)
    : tasks;

  const table = new Table({
    head: ["ID", "Task", "Details", "Status", "Created At", "Updated At"],
    style: {
      head: [],
      border: [],
    },
    colWidths: [5, 30, 30, 13, 12, 12],
    wordWrap: true,
  });

  filteredTasks.forEach((task) => {
    let statusColor: string;
    switch (task.status) {
      case "todo":
        statusColor = chalk.white.bgRed(task.status);
        break;
      case "in-progress":
        statusColor = chalk.white.bgYellow(task.status);
        break;
      case "done":
        statusColor = chalk.white.bgGreen(task.status);
        break;
      default:
        statusColor = task.status;
    }

    table.push([
      String(task.id),
      task.description,
      task.details,
      statusColor,
      formatDate(task.createdAt),
      formatDate(task.updatedAt),
    ]);
  });

  console.log(table.toString());
}

async function promptUser(question: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  console.log(question);
  const input = new Uint8Array(1024);
  const n = await Deno.stdin.read(input);

  if (n === null) {
    return "";
  }

  return decoder.decode(input.subarray(0, n)).trim();
}

async function interactiveAddTask() {
  const description = await promptUser("Please enter the task description: ");
  const addDetails = await promptUser(
    "Would you like to add details to this task? (y/n): ",
  );

  let details = "";
  if (addDetails.toLowerCase() === "y") {
    details = await promptUser("Please enter the task details: ");
  }

  await addTask(description, details);
}

async function selectTask(): Promise<number | null> {
  const tasks = await loadTasks();

  if (tasks.length === 0) {
    console.log("No tasks available to update.");
    return null;
  }

  console.log("Select a task to update:");
  tasks.forEach((task) => {
    console.log(`${task.id}: ${task.description}`);
  });

  const selectedIndex = await promptUser(
    "Enter the task ID you want to update: ",
  );
  const taskId = parseInt(selectedIndex, 10);

  if (tasks.some((task) => task.id === taskId)) {
    return taskId;
  }

  console.log("Invalid task ID.");
  return null;
}

async function interactiveUpdateTask() {
  const taskId = await selectTask();
  if (taskId) {
    const newDescription = await promptUser(
      "Please enter the new description for the task: ",
    );
    await updateTask(taskId, newDescription);
  }
}

async function printCommand(command: string, description: string, id?: number) {
  const commandText = `${command} ${id ? id : ""} ${description ? description : ""}`;
  console.log(`Running command: ${commandText}`);
}

async function main() {
  const args = parse(Deno.args);
  const command = args._[0] as string;
  const id = Number(args._[1]);

  if (command === "add") {
    await interactiveAddTask();
    return;
  }

  if (command === "update" || command === "u") {
    await interactiveUpdateTask();
    return;
  }

  switch (command) {
    case "delete":
      await deleteTask(id);
      break;
    case "clear-all":
      await clearAllTasks();
      break;
    case "mark-in-progress":
      await markTask(id, "in-progress");
      break;
    case "mark-done":
      await markTask(id, "done");
      break;
    case "list":
      await listTasks(args._[1] as string);
      break;
    default:
      console.log(
        "Unknown command. Available commands: add, update, delete, clear-all, mark-in-progress, mark-done, list"
      );
  }
}

main();
