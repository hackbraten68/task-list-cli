import { parse } from "https://deno.land/std@0.177.0/flags/mod.ts";

const TASK_FILE = "tasks.json";

interface Task {
  id: number;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Datumsformatierungsfunktion
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

async function loadTasks(): Promise<Task[]> {
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

async function addTask(description: string) {
  const tasks = await loadTasks();
  const now = new Date().toISOString();
  const newTask: Task = {
    id: tasks.length + 1,
    description,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(newTask);
  await saveTasks(tasks);
  console.log(`Task added successfully (ID: ${newTask.id})`);
}

async function updateTask(taskId: number, description: string) {
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

async function deleteTask(taskId: number) {
  let tasks = await loadTasks();
  tasks = tasks.filter((task) => task.id !== taskId);
  await saveTasks(tasks);
  console.log(`Task ${taskId} deleted successfully.`);
}

async function markTask(taskId: number, status: string) {
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

async function listTasks(status?: string) {
  const tasks = await loadTasks();
  const filteredTasks = status ? tasks.filter((task) => task.status === status) : tasks;

  filteredTasks.forEach((task) => {
    let statusColor = Colors.reset; // Standardfarbe

    switch (task.status) {
      case "todo":
        statusColor = Colors.red; // Rot für "todo"
        break;
      case "in-progress":
        statusColor = Colors.yellow; // Gelb für "in-progress"
        break;
      case "done":
        statusColor = Colors.green; // Grün für "done"
        break;
      default:
        break;
    }

    console.log(`${task.id}: ${task.description} [${statusColor}${task.status}${Colors.reset}] (Erstellt: ${formatDate(task.createdAt)}, Aktualisiert: ${formatDate(task.updatedAt)})`);
  });
}

async function main() {
  const args = parse(Deno.args);
  const command = args._[0] as string;
  const id = Number(args._[1]);
  const description = args._.slice(1).join(" ");

  const commandMap = {
    add: "add",
    a: "add",
    update: "update",
    u: "update",
    delete: "delete",
    d: "delete",
    "mark-in-progress": "mark-in-progress",
    mip: "mark-in-progress",
    "mark-done": "mark-done",
    md: "mark-done",
    list: "list",
    l: "list",
  };

  const fullCommand = commandMap[command] || command;

  switch (fullCommand) {
    case "add":
      await addTask(description);
      break;
    case "update":
      await updateTask(id, description);
      break;
    case "delete":
      await deleteTask(id);
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
      console.log("Unknown command. Available commands: add (a), update (u), delete (d), mark-in-progress (mip), mark-done (md), list (l)");
  }
}

main();
