# Aufgabenverwaltung mit Deno

In diesem Kurs lernen Sie, wie Sie eine einfache Aufgabenverwaltungsanwendung in Deno erstellen können. Die Anwendung ermöglicht das Hinzufügen, Aktualisieren, Löschen und Auflisten von Aufgaben. Wir werden den Code Schritt für Schritt durchgehen und die wichtigsten Funktionen erläutern.

## Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Installation](#installation)
3. [Codeübersicht](#codeübersicht)
   - [Globale Variablen und Typen](#globale-variablen-und-typen)
   - [Funktionen](#funktionen)
4. [Interaktive Benutzerführung](#interaktive-benutzerführung)
5. [Befehlszeilenargumente](#befehlszeilenargumente)
6. [Fazit](#fazit)

## Einführung

Diese Anwendung wird mit Deno, einer modernen JavaScript- und TypeScript-Laufzeitumgebung, entwickelt. Sie ermöglicht die Verwaltung von Aufgaben über die Kommandozeile.

## Installation

Um das Projekt auszuführen, benötigen Sie Deno. Besuchen Sie die [offizielle Deno-Website](https://deno.land/) für Anweisungen zur Installation.

## Codeübersicht

Hier ist der vollständige Code der Anwendung:

```typescript
import { parse } from "https://deno.land/std@0.177.0/flags/mod.ts";

const TASK_FILE = "tasks.json";

interface Task {
  id: number;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

### Globale Variablen und Typen

- **TASK_FILE**: Der Name der Datei, in der die Aufgaben gespeichert werden.
- **Task**: Ein Interface, das die Struktur einer Aufgabe definiert, einschließlich ihrer ID, Beschreibung, Status und Zeitstempel.

### Farben

Die Anwendung verwendet ANSI-Farbcodes, um die Konsolenausgabe farblich zu gestalten:

```typescript
const Colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};
```

### Funktionen

#### `formatDate(dateString: string): string`

Diese Funktion formatiert ein Datum im deutschen Format.

```typescript
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
```

#### `loadTasks(): Promise<Task[]>`

Lädt die Aufgaben aus der `tasks.json`-Datei. Gibt eine leere Liste zurück, wenn die Datei nicht gefunden wird.

```typescript
async function loadTasks(): Promise<Task[]> {
  try {
    const data = await Deno.readTextFile(TASK_FILE);
    return JSON.parse(data);
  } catch {
    return [];
  }
}
```

#### `saveTasks(tasks: Task[]): Promise<void>`

Speichert die übergebenen Aufgaben in der `tasks.json`-Datei.

```typescript
async function saveTasks(tasks: Task[]): Promise<void> {
  await Deno.writeTextFile(TASK_FILE, JSON.stringify(tasks, null, 2));
}
```

#### `addTask(description: string)`

Fügt eine neue Aufgabe hinzu und speichert sie.

```typescript
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
```

#### `updateTask(taskId: number, description: string)`

Aktualisiert die Beschreibung einer vorhandenen Aufgabe.

```typescript
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
```

#### `deleteTask(taskId: number)`

Löscht eine Aufgabe anhand ihrer ID.

```typescript
async function deleteTask(taskId: number) {
  let tasks = await loadTasks();
  tasks = tasks.filter((task) => task.id !== taskId);
  await saveTasks(tasks);
  console.log(`Task ${taskId} deleted successfully.`);
}
```

#### `clearAllTasks()`

Löscht alle Aufgaben.

```typescript
async function clearAllTasks() {
  await saveTasks([]);
  console.log("All tasks cleared successfully.");
}
```

#### `markTask(taskId: number, status: string)`

Markiert eine Aufgabe als „in-progress“ oder „done“.

```typescript
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
```

#### `listTasks(status?: string)`

Listet alle Aufgaben auf, optional gefiltert nach ihrem Status.

```typescript
async function listTasks(status?: string) {
  const tasks = await loadTasks();
  const filteredTasks = status ? tasks.filter((task) => task.status === status) : tasks;

  filteredTasks.forEach((task) => {
    let statusColor = Colors.reset;
    let backgroundColor = Colors.reset;

    switch (task.status) {
      case "todo":
        statusColor = Colors.white;
        backgroundColor = Colors.bgRed;
        break;
      case "in-progress":
        statusColor = Colors.white;
        backgroundColor = Colors.bgYellow;
        break;
      case "done":
        statusColor = Colors.white;
        backgroundColor = Colors.bgGreen;
        break;
      default:
        break;
    }

    console.log(`${task.id}: ${task.description} [${backgroundColor}${statusColor}${task.status}${Colors.reset}] (Created: ${formatDate(task.createdAt)}, Updated: ${formatDate(task.updatedAt)})`);
  });
}
```

### Interaktive Benutzerführung

Die Funktionen `interactiveAddTask`, `selectTask` und `interactiveUpdateTask` ermöglichen die Benutzerinteraktion über die Konsole, um Aufgaben hinzuzufügen und zu aktualisieren.

#### `interactiveAddTask()`

Fragt den Benutzer nach einer neuen Aufgabenbeschreibung und optionalen Details.

```typescript
async function interactiveAddTask() {
  const description = await promptUser("Please enter the task description: ");
  const addDetails = await promptUser("Would you like to add details to this task? (y/n): ");
  
  if (addDetails.toLowerCase() === "y") {
    const details = await promptUser("Please enter the task details: ");
    await addTask(`${description}\nDetails: ${details}`);
  } else {
    await addTask(description);
  }
}
```

#### `selectTask()`

Listet alle Aufgaben auf und ermöglicht dem Benutzer, eine Aufgabe zur Aktualisierung auszuwählen.

```typescript
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

  const selectedIndex = await promptUser("Enter the task ID you want to update: ");
  const taskId = parseInt(selectedIndex, 10);
  
  if (tasks.some((task) => task.id === taskId)) {
    return taskId;
  }

  console.log("Invalid task ID.");
  return null;
}
```

#### `interactiveUpdateTask()`

Fragt den Benutzer nach der neuen Beschreibung der ausgewählten Aufgabe.

```typescript
async function interactiveUpdateTask() {
  const taskId = await selectTask();
  if (taskId) {
    const newDescription = await promptUser("Please enter the new description for the task: ");
    await updateTask(taskId, newDescription);
  }
}
```

### Befehlszeilenargumente

Die `main`-Funktion verarbeitet die Befeh

lszeilenargumente und führt die entsprechenden Funktionen aus:

```typescript
async function main() {
  const args = parse(Deno.args);
  const command = args._[0] as string;
  const id = Number(args._[1]);

  // ... (Befehlsverarbeitung)
}
```

### Fazit

In diesem Kurs haben wir eine einfache Aufgabenverwaltungsanwendung in Deno erstellt. Sie können diese Anwendung erweitern, um zusätzliche Funktionen hinzuzufügen oder die Benutzeroberfläche zu verbessern. Viel Spaß beim Programmieren!

Fühle dich frei, Anpassungen vorzunehmen oder zusätzliche Abschnitte hinzuzufügen, um den Kurs weiter zu verbessern!