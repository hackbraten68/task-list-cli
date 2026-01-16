import { colors } from "cliffy/ansi";
import { Input, Select } from "cliffy/prompt";
import {
  bulkDeleteTasks,
  bulkMarkTasks,
  bulkUpdateTasks,
  exportTasks,
  importTasks,
  loadTasks,
  saveTasks,
} from "../storage.ts";
import { UI } from "../ui.ts";
import { calculateStats, TaskStats } from "../stats.ts";
import { addCommand } from "./add.ts";
import { updateCommand } from "./update.ts";
import { deleteCommand } from "./delete.ts";
import { markCommand } from "./mark.ts";
import { sortTasks } from "./list.ts";
import { ExportOptions, ImportOptions, Task, TaskPriority, TaskStatus } from "../types.ts";
import { getTaskSummaries } from "../utils/task-selection.ts";
import { FuzzySearchOptions, fuzzySearchTasks } from "../utils/fuzzy-search.ts";

function filterTasksBySearch(tasks: Task[], searchTerm: string): Task[] {
  if (!searchTerm) return tasks;

  const term = searchTerm.toLowerCase();
  return tasks.filter((task) =>
    task.description.toLowerCase().includes(term) ||
    (task.details && task.details.toLowerCase().includes(term)) ||
    (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(term)))
  );
}

// Menu system functions
async function showMainMenu(): Promise<void> {
  console.clear();
  UI.header();

  const choice = await Select.prompt({
    message: "LazyTask Menu:",
    options: [
      { name: "[DATA] Data Management", value: "data" },
      { name: "[SETTINGS] Settings", value: "settings" },
      { name: "[HELP] Help & Info", value: "help" },
      { name: "[BACK] Back to Dashboard", value: "back" },
    ],
  });

  switch (choice) {
    case "data":
      await showDataManagementMenu();
      break;
    case "settings":
      await showSettingsMenu();
      break;
    case "help":
      await showHelpMenu();
      break;
    case "back":
      // Just return to dashboard
      break;
  }
}

async function showDataManagementMenu(): Promise<void> {
  const choice = await Select.prompt({
    message: "Data Management:",
    options: [
      { name: "[EXPORT] Export Tasks", value: "export" },
      { name: "[IMPORT] Import Tasks", value: "import" },
      { name: "[BACKUP] Manual Backup", value: "backup" },
      { name: "[CLEAR] Clear All Tasks", value: "clear" },
      { name: "[BACK] Back to Menu", value: "back" },
    ],
  });

  switch (choice) {
    case "export":
      await handleExport();
      break;
    case "import":
      await handleImport();
      break;
    case "backup":
      await handleBackup();
      break;
    case "clear":
      await handleClearAllTasks();
      break;
    case "back":
      await showMainMenu();
      break;
  }
}

async function showSettingsMenu(): Promise<void> {
  // Future: Theme selection, UI preferences, etc.
  console.clear();
  UI.header();
  UI.info("Settings menu coming soon!");
  console.log("Future features:");
  console.log("- Theme selection");
  console.log("- UI preferences");
  console.log("- Keyboard shortcuts");
  await Input.prompt("Press Enter to continue...");
}

async function showHelpMenu(): Promise<void> {
  console.clear();
  UI.header();
  console.log("Help & Info");
  console.log("===========");
  console.log("");
  console.log("Keyboard Shortcuts:");
  console.log("j/k or ↑/↓    - Navigate tasks");
  console.log("Tab           - Multi-select mode");
  console.log("Space         - Select/deselect task (multi-select)");
  console.log("Enter         - Update task / Bulk actions");
  console.log("d             - Delete task");
  console.log("m             - Mark task status");
  console.log("a             - Add new task");
  console.log("u             - Update selected task");
  console.log("d             - Delete selected task");
  console.log("m             - Mark task status");
  console.log("o             - Cycle sort field");
  console.log("r             - Reverse sort order");
  console.log("h             - Help & Settings menu");
  console.log("q or Ctrl+C   - Quit");
  console.log("");
  await Input.prompt("Press Enter to continue...");
}

async function handleExport(): Promise<void> {
  console.clear();
  UI.header();

  const format = await Select.prompt({
    message: "Export format:",
    options: [
      { name: "JSON - Complete data structure", value: "json" },
      { name: "CSV - Spreadsheet compatible", value: "csv" },
    ],
  });

  const outputPath = await Input.prompt({
    message: "Output file path:",
    default: `lazytask-export-${
      new Date().toISOString().split("T")[0]
    }.${format}`,
  });

  try {
    const options: ExportOptions = {
      format: format as "json" | "csv",
      outputPath,
    };

    await exportTasks(options);
    UI.success(`[SUCCESS] Tasks exported to ${outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    UI.error(`[ERROR] Export failed: ${message}`);
  }

  await Input.prompt("Press Enter to continue...");
}

async function handleImport(): Promise<void> {
  console.clear();
  UI.header();

  const format = await Select.prompt({
    message: "Import format:",
    options: [
      { name: "JSON - Complete data structure", value: "json" },
      { name: "CSV - Spreadsheet compatible", value: "csv" },
    ],
  });

  const inputPath = await Input.prompt({
    message: "Input file path:",
    default: `lazytask-import.${format}`,
  });

  const mode = await Select.prompt({
    message: "Import mode:",
    options: [
      { name: "Merge - Add to existing tasks", value: "merge" },
      { name: "Replace - Replace all tasks", value: "replace" },
      { name: "Validate - Check data only", value: "validate" },
    ],
  });

  try {
    const options: ImportOptions = {
      format: format as "json" | "csv",
      inputPath,
      mode: mode === "validate" ? "merge" : mode as "merge" | "replace",
      validateOnly: mode === "validate",
    };

    const result = await importTasks(options);

    if (result.success) {
      UI.success(`[SUCCESS] ${result.message}`);
      if (result.importedCount !== undefined) {
        console.log(`[INFO] ${result.importedCount} tasks processed`);
      }
    } else {
      UI.error(`[ERROR] ${result.message}`);
      if (result.errors) {
        result.errors.forEach((error) => console.log(`   - ${error}`));
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    UI.error(`[ERROR] Import failed: ${message}`);
  }

  await Input.prompt("Press Enter to continue...");
}

async function handleBackup(): Promise<void> {
  console.clear();
  UI.header();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupPath = `lazytask-backup-${timestamp}.json`;

  try {
    await exportTasks({
      format: "json",
      outputPath: backupPath,
    });

    UI.success(`[SUCCESS] Backup created: ${backupPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    UI.error(`[ERROR] Backup failed: ${message}`);
  }

  await Input.prompt("Press Enter to continue...");
}

async function handleClearAllTasks(): Promise<void> {
  console.clear();
  UI.header();

  UI.error("⚠️  WARNING: This will permanently delete ALL tasks!");
  console.log("This action cannot be undone.");
  console.log("");

  const confirm = await Select.prompt({
    message: "Are you sure you want to clear all tasks?",
    options: [
      { name: "No, cancel", value: "cancel" },
      { name: "Yes, clear all tasks", value: "confirm" },
    ],
  });

  if (confirm === "confirm") {
    await saveTasks([]);
    UI.success("[SUCCESS] All tasks have been cleared.");
    console.log("You can now add new tasks or import from backup.");
  } else {
    UI.info("[CANCELLED] Operation cancelled - no tasks were deleted.");
  }

  console.log("");
  await Input.prompt("Press Enter to return to dashboard...");

  // Return to dashboard (don't call showDataManagementMenu)
}

export async function dashboardCommand() {
  let selectedIndex = 0;
  let selectedTasks = new Set<number>(); // Multi-selection state
  let multiSelectMode = false;
  let statsViewMode = false; // Toggle between tasks and stats view
  let searchTerm = ""; // Current search term
  let searchMode = false; // Whether search is active
  let fuzzyMode = false; // Whether fuzzy search is active
   let currentSortField = "id"; // Current sort field
   let currentSortOrder: "asc" | "desc" = "asc"; // Current sort order
   let editMode: "view" | "add" | "update" | "delete" = "view"; // Current edit mode
   let editData: Partial<Task> = {}; // Data for editing/adding
    let currentField: keyof Pick<Task, "description" | "priority" | "status" | "details" | "dueDate" | "tags"> = "description"; // Current form field
   let running = true;

  // Set stdin to raw mode
  Deno.stdin.setRaw(true);

    const cleanup = () => {
        try {
            Deno.stdin.setRaw(false);
        } catch {
            // Ignore cleanup errors
        }
    };

    const appendToCurrentField = (char: string) => {
      if (editMode === "add" || editMode === "update") {
        if (currentField === "description") {
          editData.description = (editData.description || "") + char;
        } else if (currentField === "details") {
          editData.details = (editData.details || "") + char;
        } else if (currentField === "dueDate") {
          editData.dueDate = (editData.dueDate || "") + char;
        } else if (currentField === "tags") {
          // For tags, append to first tag
          const currentTags = editData.tags || [];
          const currentTag = currentTags[0] || "";
          editData.tags = [currentTag + char];
        }
      }
    };

  async function performSearch() {
    // Enter search mode with footer replacement
    try {
      // Save current cursor position
      console.log("\u001b[s");

      // Move cursor to last line (footer position)
      const { rows } = Deno.consoleSize();
      console.log(`\u001b[${rows};1H`);

      // Clear current line and show prompt
      const modeText = fuzzyMode ? "Fuzzy search" : "Search";
      console.log(`\u001b[2K${modeText} tasks: `);

      // Exit raw mode for input
      Deno.stdin.setRaw(false);

      const newSearchTerm = await Input.prompt("");
      searchTerm = newSearchTerm.trim();
      searchMode = searchTerm.length > 0;

      // Reset selection when entering search mode
      selectedIndex = 0;
      selectedTasks.clear();
      multiSelectMode = false;

      // Return to raw mode
      Deno.stdin.setRaw(true);

      // Restore cursor position
      console.log("\u001b[u");
    } catch {
      // User cancelled search - restore cursor
      console.log("\u001b[u");
      searchTerm = "";
      searchMode = false;
      fuzzyMode = false;
    }
  }

  // Cleanup on exit/crash
  Deno.addSignalListener("SIGINT", () => {
    cleanup();
    Deno.exit();
  });

  async function render(
    tasks: Task[],
    modal?: { lines: string[]; width: number; height: number },
    stats?: TaskStats,
  ) {
    UI.clearScreen();
    UI.header(tasks.length);

    // Show search status if active
    if (searchMode) {
      const modeText = fuzzyMode ? "Fuzzy search" : "Search";
      console.log(`  ${modeText}: "${searchTerm}" (${tasks.length} matches)`);
    }

    // Show sort status if active (not default id order)
    if (currentSortField !== "id") {
      console.log(`  Sorted: ${currentSortField} (${currentSortOrder})`);
    }

    const { columns, rows } = Deno.consoleSize();
    const terminalWidth = Math.max(80, columns - 4);
    const height = Math.max(10, rows - 12);
    const isDimmed = !!modal;

    // Create sidebar
    const sidebarWidth = (editMode === "add" || editMode === "update") ? Math.floor(terminalWidth * 0.2) : Math.floor(terminalWidth * 0.35);
    let sidebarTitle: string;
    let sidebarLines: string[];
    let mainPanelTitle: string;
    let detailLines: string[];

    if (statsViewMode) {
      // Stats view: show statistics in sidebar
      const stats = calculateStats(tasks);
      sidebarTitle = "Statistics";
      sidebarLines = UI.renderStatsPanel(stats, sidebarWidth, height);
    } else {
      // Tasks view: show task list in sidebar
      sidebarTitle = "Tasks";
      sidebarLines = tasks.map((t, i) => {
        const isCurrent = i === selectedIndex;
        const isMultiSelected = selectedTasks.has(t.id);

        let prefix = "  ";
        if (isCurrent && multiSelectMode) {
          prefix = colors.bold.magenta("❯ ");
        } else if (isCurrent) {
          prefix = colors.bold.cyan("❯ ");
        }

        const statusIcon = t.status === "done"
          ? colors.green("✔")
          : t.status === "in-progress"
          ? colors.yellow("●")
          : colors.red("●");

        // Add selection indicator for multi-selected tasks
        const selectIndicator = isMultiSelected
          ? colors.bold.blue("[✓] ")
          : "    ";
        const line =
          `${selectIndicator}${prefix}${statusIcon} ${t.description}`;

        // Highlight current selection or multi-selected tasks
        if (isCurrent && !multiSelectMode) {
          return colors.bgRgb24(line, { r: 50, g: 50, b: 50 });
        } else if (isMultiSelected) {
          return colors.bgRgb24(line, { r: 30, g: 30, b: 60 });
        }
        return line;
      });
    }

    const sidebar = UI.box(
      sidebarTitle,
      sidebarLines,
      sidebarWidth,
      height,
      !isDimmed,
      isDimmed,
    );

    // Build detail lines for main panel
    const selectedTask = tasks[selectedIndex];
    detailLines = [];

    if (multiSelectMode && selectedTasks.size > 0) {
      // Show multi-selection summary
      const selectedTaskList = Array.from(selectedTasks).map((id) =>
        tasks.find((t) => t.id === id)
      ).filter(Boolean) as Task[];

      detailLines.push("");
      detailLines.push(`  ${colors.bold.magenta("Multi-Selection Mode")}`);
      detailLines.push(
        `  ${colors.bold.white("Selected:")}     ${selectedTasks.size} tasks`,
      );
      detailLines.push("");
      detailLines.push(`  ${colors.bold.white("Selected Tasks:")}`);

      const summaries = selectedTaskList.slice(0, 10).map((task) =>
        `    ${task.id}: ${task.description.substring(0, 40)}${
          task.description.length > 40 ? "..." : ""
        }`
      );
      detailLines.push(...summaries);

      if (selectedTaskList.length > 10) {
        detailLines.push(`    ... and ${selectedTaskList.length - 10} more`);
      }

      detailLines.push("");
      detailLines.push(`  ${colors.dim("Press Enter for bulk actions")}`);
      detailLines.push(
        `  ${colors.dim("Press Tab to exit multi-select mode")}`,
      );
      mainPanelTitle = "Details";
    } else if (selectedTask) {
      // Show single task details
      detailLines.push("");
      detailLines.push(
        `  ${colors.bold.white("ID:")}          ${
          colors.dim(selectedTask.id.toString())
        }`,
      );
      detailLines.push(
        `  ${colors.bold.white("Title:")}       ${selectedTask.description}`,
      );
      detailLines.push(
        `  ${colors.bold.white("Status:")}      ${
          UI.statusPipe(selectedTask.status)
        }`,
      );
      detailLines.push(
        `  ${colors.bold.white("Priority:")}    ${
          UI.priorityPipe(selectedTask.priority)
        }`,
      );
      detailLines.push(
        `  ${colors.bold.white("Tags:")}        ${
          selectedTask.tags && selectedTask.tags.length > 0
            ? selectedTask.tags.join(", ")
            : colors.dim("-")
        }`,
      );
      detailLines.push(
        `  ${colors.bold.white("Due Date:")}    ${
          selectedTask.dueDate
            ? colors.cyan(selectedTask.dueDate)
            : colors.dim("-")
        }`,
      );
      detailLines.push("");
      detailLines.push(
        `  ${colors.dim("Created at: " + selectedTask.createdAt)}`,
      );
      detailLines.push(
        `  ${colors.dim("Updated at: " + selectedTask.updatedAt)}`,
      );
      detailLines.push("");
      detailLines.push(`  ${colors.bold.white("Details:")}`);
      detailLines.push(
        `  ${selectedTask.details || colors.dim("No details provided.")}`,
      );
      mainPanelTitle = "Details";
    } else {
      detailLines.push("\n  No tasks available.");
      mainPanelTitle = "Details";
    }

    let panels: string[][];

    if (editMode === "add") {
      // Two-panel layout with stacked form/preview in main
      const mainWidth = terminalWidth - sidebarWidth - 2;

      // Build stacked detail lines: form on top, preview on bottom
      const halfHeight = Math.floor(height / 2);
      const formLines: string[] = [];
      formLines.push("");
      formLines.push(`  ${colors.bold.cyan("Add New Task")}`);
      formLines.push("");
      formLines.push(`${currentField === "description" ? colors.bold.yellow("➜") : "  "} Description: ${editData.description || colors.dim("(required)")}`);
      formLines.push(`${currentField === "priority" ? colors.bold.yellow("➜") : "  "} Priority:    ${editData.priority ? UI.priorityPipe(editData.priority) : colors.dim("medium")}`);
      formLines.push(`${currentField === "details" ? colors.bold.yellow("➜") : "  "} Details:     ${editData.details || colors.dim("(optional)")}`);
      formLines.push(`${currentField === "dueDate" ? colors.bold.yellow("➜") : "  "} Due Date:   ${editData.dueDate || colors.dim("(optional)")}`);
      formLines.push(`${currentField === "tags" ? colors.bold.yellow("➜") : "  "} Tags:        ${editData.tags ? editData.tags.join(", ") : colors.dim("(optional)")}`);
      formLines.push("");
      formLines.push(`  ${colors.dim("Tab: Next • Enter: Save • Esc: Cancel")}`);

      const previewLines: string[] = [];
      previewLines.push("");
      previewLines.push(`  ${colors.bold.white("Preview")}`);
      previewLines.push("");
      previewLines.push(`  ${colors.bold.white("Title:")} ${editData.description || colors.dim("...")}`);
      previewLines.push(`  ${colors.bold.white("Priority:")} ${editData.priority ? UI.priorityPipe(editData.priority) : colors.dim("Medium")}`);
      if (editData.details) {
        previewLines.push(`  ${colors.bold.white("Details:")} ${editData.details}`);
      }
      if (editData.dueDate) {
        previewLines.push(`  ${colors.bold.white("Due:")} ${editData.dueDate}`);
      }
      if (editData.tags && editData.tags.length > 0) {
        previewLines.push(`  ${colors.bold.white("Tags:")} ${editData.tags.join(", ")}`);
      }

      // Combine form and preview with separator
      const detailLines: string[] = [];
      detailLines.push(...formLines);
      detailLines.push(`  ${colors.dim("─".repeat(mainWidth - 4))}`); // Separator
      detailLines.push(...previewLines);

      // Fill to height
      while (detailLines.length < height - 2) {
        detailLines.push("");
      }

      const mainPanel = UI.box(
        "Add Task",
        detailLines,
        mainWidth,
        height,
        false,
        isDimmed,
      );
      panels = [sidebar, mainPanel];
    } else if (editMode === "update") {
      // Two-panel layout with stacked form/preview in main
      const mainWidth = terminalWidth - sidebarWidth - 2;

      // Build stacked detail lines: form on top, preview on bottom
      const halfHeight = Math.floor(height / 2);
      const formLines: string[] = [];
      formLines.push("");
      formLines.push(`  ${colors.bold.cyan("Update Task")}`);
      formLines.push("");
      formLines.push(`${currentField === "description" ? colors.bold.yellow("➜") : "  "} Description: ${editData.description || colors.dim("(required)")}`);
      formLines.push(`${currentField === "priority" ? colors.bold.yellow("➜") : "  "} Priority:    ${editData.priority ? UI.priorityPipe(editData.priority) : colors.dim("medium")}`);
      formLines.push(`${currentField === "status" ? colors.bold.yellow("➜") : "  "} Status:      ${editData.status ? UI.statusPipe(editData.status) : colors.dim("todo")}`);
      formLines.push(`${currentField === "details" ? colors.bold.yellow("➜") : "  "} Details:     ${editData.details || colors.dim("(optional)")}`);
      formLines.push(`${currentField === "dueDate" ? colors.bold.yellow("➜") : "  "} Due Date:   ${editData.dueDate || colors.dim("(optional)")}`);
      formLines.push(`${currentField === "tags" ? colors.bold.yellow("➜") : "  "} Tags:        ${editData.tags ? editData.tags.join(", ") : colors.dim("(optional)")}`);
      formLines.push("");
      formLines.push(`  ${colors.dim("Tab: Next • Enter: Save • Esc: Cancel")}`);

      const previewLines: string[] = [];
      previewLines.push("");
      previewLines.push(`  ${colors.bold.white("Preview")}`);
      previewLines.push("");
      previewLines.push(`  ${colors.bold.white("Title:")} ${editData.description || colors.dim("...")}`);
      previewLines.push(`  ${colors.bold.white("Priority:")} ${editData.priority ? UI.priorityPipe(editData.priority) : colors.dim("Medium")}`);
      previewLines.push(`  ${colors.bold.white("Status:")} ${editData.status ? UI.statusPipe(editData.status) : colors.dim("Todo")}`);
      if (editData.details) {
        previewLines.push(`  ${colors.bold.white("Details:")} ${editData.details}`);
      }
      if (editData.dueDate) {
        previewLines.push(`  ${colors.bold.white("Due:")} ${editData.dueDate}`);
      }
      if (editData.tags && editData.tags.length > 0) {
        previewLines.push(`  ${colors.bold.white("Tags:")} ${editData.tags.join(", ")}`);
      }

      // Combine form and preview with separator
      const detailLines: string[] = [];
      detailLines.push(...formLines);
      detailLines.push(`  ${colors.dim("─".repeat(mainWidth - 4))}`); // Separator
      detailLines.push(...previewLines);

      // Fill to height
      while (detailLines.length < height - 2) {
        detailLines.push("");
      }

      const mainPanel = UI.box(
        "Update Task",
        detailLines,
        mainWidth,
        height,
        false,
        isDimmed,
      );
      panels = [sidebar, mainPanel];
    } else if (editMode === "delete") {
      // Two-panel layout with delete confirmation in main
      const mainWidth = terminalWidth - sidebarWidth - 2;

      const selectedTask = tasks[selectedIndex];
      const confirmLines: string[] = [];
      confirmLines.push("");
      confirmLines.push(`  ${colors.bold.red("🗑️  Delete Task Confirmation")}`);
      confirmLines.push("");

      if (selectedTask) {
        confirmLines.push(`  ${colors.bold.white("Task:")} ${selectedTask.description}`);
        confirmLines.push(`  ${colors.bold.white("ID:")} ${selectedTask.id}`);
        confirmLines.push("");
        confirmLines.push(`  ${colors.bold.red("⚠️  This action cannot be undone!")}`);
        confirmLines.push("");
        confirmLines.push(`  ${colors.dim("Delete this task?")}`);
        confirmLines.push("");
        confirmLines.push(`  ${colors.bold.green("Y")}es  ${colors.bold.red("N")}o  ${colors.dim("Esc")} Cancel`);
      }

      // Fill to height
      while (confirmLines.length < height - 2) {
        confirmLines.push("");
      }

      const mainPanel = UI.box(
        "Confirm Delete",
        confirmLines,
        mainWidth,
        height,
        false,
        isDimmed,
      );
      panels = [sidebar, mainPanel];
    } else {
      // Two-panel layout: sidebar, details
      const mainWidth = terminalWidth - sidebarWidth - 2;
      const mainPanel = UI.box(
        mainPanelTitle,
        detailLines,
        mainWidth,
        height,
        false,
        isDimmed,
      );
      panels = [sidebar, mainPanel];
    }

    UI.renderLayout(panels, modal);
    UI.footer(
      multiSelectMode,
      selectedTasks.size,
      statsViewMode,
      stats?.completionRate,
      stats?.overdue,
      searchMode,
    );
  }

  try {
    while (running) {
      let tasks = await loadTasks();

      // Apply search filter if active
      let processedTasks: Task[];
      if (searchMode) {
        if (fuzzyMode) {
          const fuzzyOptions: FuzzySearchOptions = { threshold: 0.7 };
          const fuzzyResults = fuzzySearchTasks(
            tasks,
            searchTerm,
            fuzzyOptions,
          );
          processedTasks = fuzzyResults.map((r) => r.task);
        } else {
          processedTasks = filterTasksBySearch(tasks, searchTerm);
        }
      } else {
        processedTasks = tasks;
      }

      // Apply sorting
      processedTasks = sortTasks(
        processedTasks,
        currentSortField,
        currentSortOrder,
      );

      if (processedTasks.length > 0 && selectedIndex >= processedTasks.length) {
        selectedIndex = processedTasks.length - 1;
      }

      // Calculate stats for footer status bar (use original tasks for stats)
      const stats = calculateStats(tasks);

      await render(processedTasks, undefined, stats);

      const reader = Deno.stdin.readable.getReader();
      const { value, done } = await reader.read();
      reader.releaseLock();

      if (done) break;

      const keys = new TextDecoder().decode(value);

            switch (keys) {
                case "j":
                    if (editMode === "add" || editMode === "update") {
                        // Append 'j' to current field in add/update mode
                        appendToCurrentField("j");
                    } else {
                        selectedIndex = Math.min(tasks.length - 1, selectedIndex + 1);
                    }
                    break;
                case "\u001b[B": // Down arrow
                    if (editMode === "add" || editMode === "update") {
                        if (currentField === "priority") {
                            // Cycle priority down
                            const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];
                            const currentIndex = priorities.indexOf(editData.priority || "medium");
                            editData.priority = priorities[(currentIndex + 1) % priorities.length];
                        } else if (currentField === "status") {
                            // Cycle status down
                            const statuses: TaskStatus[] = ["todo", "in-progress", "done"];
                            const currentIndex = statuses.indexOf(editData.status || "todo");
                            editData.status = statuses[(currentIndex + 1) % statuses.length];
                        }
                        // Ignore other navigation in add/update mode
                    } else {
                        selectedIndex = Math.min(tasks.length - 1, selectedIndex + 1);
                    }
                    break;
                case "k":
                    if (editMode === "add" || editMode === "update") {
                        // Append 'k' to current field in add/update mode
                        appendToCurrentField("k");
                    } else {
                        selectedIndex = Math.max(0, selectedIndex - 1);
                    }
                    break;
                case "\u001b[A": // Up arrow
                    if (editMode === "add" || editMode === "update") {
                        if (currentField === "priority") {
                            // Cycle priority up
                            const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];
                            const currentIndex = priorities.indexOf(editData.priority || "medium");
                            editData.priority = priorities[(currentIndex - 1 + priorities.length) % priorities.length];
                        } else if (currentField === "status") {
                            // Cycle status up
                            const statuses: TaskStatus[] = ["todo", "in-progress", "done"];
                            const currentIndex = statuses.indexOf(editData.status || "todo");
                            editData.status = statuses[(currentIndex - 1 + statuses.length) % statuses.length];
                        }
                        // Ignore other navigation in add/update mode
                    } else {
                        selectedIndex = Math.max(0, selectedIndex - 1);
                    }
                    break;
        case "a":
          if (editMode === "add" || editMode === "update") {
            // Append 'a' to current field in add/update mode
            appendToCurrentField("a");
          } else if (editMode === "view") {
            // Enter add mode
            editMode = "add";
            editData = {
              description: "",
              priority: "medium",
              status: "todo",
              details: "",
              dueDate: "",
              tags: [],
            };
            currentField = "description";
          }
          break;
        case "\t": // Tab - navigate to next field or toggle multi-select
          if (editMode === "add" || editMode === "update") {
            const fields: (keyof Pick<Task, "description" | "priority" | "status" | "details" | "dueDate" | "tags">)[] = ["description", "priority", "status", "details", "dueDate", "tags"];
            const currentIndex = fields.indexOf(currentField);
            currentField = fields[(currentIndex + 1) % fields.length];
          } else {
            // Original Tab behavior for multi-select
            multiSelectMode = !multiSelectMode;
            if (!multiSelectMode) {
              selectedTasks.clear(); // Clear selections when exiting multi-select
            }
          }
          break;
        case " ": // Space - Select/deselect current task (multi-select mode) or text input (edit mode)
          if (editMode === "add" || editMode === "update") {
            // Append space to current field in add/update mode
            appendToCurrentField(" ");
          } else if (multiSelectMode && tasks[selectedIndex]) {
            const taskId = tasks[selectedIndex].id;
            if (selectedTasks.has(taskId)) {
              selectedTasks.delete(taskId);
            } else {
              selectedTasks.add(taskId);
            }
          }
          break;
        case "u":
          if (editMode === "add" || editMode === "update") {
            // Append 'u' to current field in add/update mode
            appendToCurrentField("u");
            break;
          }
          if (editMode === "view") {
            if (multiSelectMode && selectedTasks.size > 0) {
              // Show bulk actions menu
              cleanup();
              const updatedSelection = await showBulkActionsMenu(
                tasks,
                Array.from(selectedTasks),
              );
              // Update the selectedTasks set with the returned selection
              selectedTasks.clear();
              updatedSelection.forEach((id) => selectedTasks.add(id));
              Deno.stdin.setRaw(true);
            } else if (!multiSelectMode && tasks[selectedIndex]) {
              // Enter inline update mode
              const selectedTask = tasks[selectedIndex];
              editMode = "update";
              editData = {
                description: selectedTask.description,
                priority: selectedTask.priority,
                status: selectedTask.status,
                details: selectedTask.details || "",
                dueDate: selectedTask.dueDate || "",
                tags: selectedTask.tags || [],
              };
              currentField = "description";
            }
          }
          break;
        case "\r": // Enter
          if (editMode === "add") {
            // Save the task
            if (editData.description && editData.description.trim()) {
              const tasks = await loadTasks();
              const newTask: Task = {
                id: Math.max(0, ...tasks.map(t => t.id)) + 1,
                description: editData.description.trim(),
                details: editData.details?.trim() || "",
                priority: editData.priority || "medium",
                dueDate: editData.dueDate?.trim() || undefined,
                tags: editData.tags || [],
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              tasks.push(newTask);
              await saveTasks(tasks);
              UI.success(`Task added successfully! (ID: ${newTask.id})`);
            } else {
              UI.error("Description is required");
            }
            editMode = "view";
            editData = {};
          } else if (editMode === "update") {
            // Update the task
            if (editData.description && editData.description.trim()) {
              const taskId = tasks[selectedIndex].id;
              const changes: Partial<Task> = {
                description: editData.description.trim(),
                priority: editData.priority,
                status: editData.status,
                details: editData.details?.trim() || undefined,
                dueDate: editData.dueDate?.trim() || undefined,
                tags: editData.tags,
              };

              const result = await bulkUpdateTasks([taskId], changes);
              if (result.successCount > 0) {
                UI.success(`Task updated successfully! (ID: ${taskId})`);
              } else if (result.errors.length > 0) {
                UI.error(`Update failed: ${result.errors[0].error}`);
              }
            } else {
              UI.error("Description is required");
            }
            editMode = "view";
            editData = {};
          }
          break;
        case "d":
          if (editMode === "add" || editMode === "update") {
            // Append 'd' to current field in add/update mode
            appendToCurrentField("d");
            break;
          }
          if (editMode === "view") {
            if (multiSelectMode && selectedTasks.size > 0) {
              // Show bulk actions menu for multi-select (preserve existing functionality)
              cleanup();
              const updatedSelection = await showBulkActionsMenu(
                tasks,
                Array.from(selectedTasks),
              );
              selectedTasks.clear();
              updatedSelection.forEach((id) => selectedTasks.add(id));
              Deno.stdin.setRaw(true);
            } else if (!multiSelectMode && tasks[selectedIndex]) {
              // Enter inline delete confirmation mode
              editMode = "delete";
            }
          }
          break;
        case "m":
          if (editMode === "add" || editMode === "update") {
            // Append 'm' to current field in add/update mode
            appendToCurrentField("m");
            break;
          }
          if (tasks[selectedIndex]) {
            cleanup();
            await markCommand(undefined, tasks[selectedIndex].id, {
              modal: true,
              renderBackground: () =>
                render(tasks, { lines: [], width: 60, height: 8 }),
            });
            Deno.stdin.setRaw(true);
          }
          break;
        case "s":
          if (editMode === "add" || editMode === "update") {
            // Append 's' to current field in add/update mode
            appendToCurrentField("s");
            break;
          }
          statsViewMode = !statsViewMode;
          // Reset selection when switching to stats mode
          if (statsViewMode) {
            selectedIndex = 0;
            selectedTasks.clear();
            multiSelectMode = false;
          }
          break;
        case "/":
          if (editMode === "add" || editMode === "update") {
            // Append '/' to current field in add/update mode
            appendToCurrentField("/");
            break;
          }
          // Enter exact search mode
        case "r":
          if (editMode === "add" || editMode === "update") {
            // Append 'r' to current field in add/update mode
            appendToCurrentField("r");
            break;
          }
          currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
          break;
        case "o":
          if (editMode === "add" || editMode === "update") {
            // Append 'o' to current field in add/update mode
            appendToCurrentField("o");
            break;
          }
          const sortFields = [
            "id",
            "due-date",
            "priority",
            "status",
            "created",
            "updated",
            "description",
          ];
          const currentIndex = sortFields.indexOf(currentSortField);
          currentSortField = sortFields[(currentIndex + 1) % sortFields.length];
          break;
        case "h":
          if (editMode === "add" || editMode === "update") {
            // Append 'h' to current field in add/update mode
            appendToCurrentField("h");
            break;
          }
          cleanup();
          await showMainMenu();
          Deno.stdin.setRaw(true);
          break;
          fuzzyMode = false;
          await performSearch();
          break;
        case "?":
          if (editMode === "add" || editMode === "update") {
            // Append '?' to current field in add/update mode
            appendToCurrentField("?");
            break;
          }
          // Enter fuzzy search mode
          fuzzyMode = true;
          await performSearch();
          break;
        case "\u001b": // ESC key
          if (editMode === "add" || editMode === "update" || editMode === "delete") {
            // Cancel add/update/delete mode
            editMode = "view";
            editData = {};
          } else if (searchMode) {
            // Clear search
            searchTerm = "";
            searchMode = false;
            fuzzyMode = false;
            selectedIndex = 0;
            selectedTasks.clear();
            multiSelectMode = false;
          }
          break;
        case "h": // Help/Settings menu
          cleanup();
          await showMainMenu();
          Deno.stdin.setRaw(true);
          break;
        case "o": { // Cycle sort field
          const sortFields = [
            "id",
            "due-date",
            "priority",
            "status",
            "created",
            "updated",
            "description",
          ];
          const currentIndex = sortFields.indexOf(currentSortField);
          currentSortField = sortFields[(currentIndex + 1) % sortFields.length];
          break;
        }
        case "r": { // Reverse sort order
          currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
          break;
        }


                case "\u007f": // Backspace
                    if (editMode === "add" || editMode === "update") {
                        if (currentField === "description" && editData.description) {
                            editData.description = editData.description.slice(0, -1);
                        } else if (currentField === "details" && editData.details) {
                            editData.details = editData.details.slice(0, -1);
                        } else if (currentField === "dueDate" && editData.dueDate) {
                            editData.dueDate = editData.dueDate.slice(0, -1);
                        } else if (currentField === "tags" && editData.tags && editData.tags[0]) {
                            const currentTag = editData.tags[0];
                            editData.tags = [currentTag.slice(0, -1)];
                        }
                    }
                    break;

                case "y":
                case "Y":
                    if (editMode === "delete") {
                        // Confirm deletion
                        const taskId = tasks[selectedIndex].id;
                        const result = await bulkDeleteTasks([taskId]);
                        if (result.successCount > 0) {
                            UI.success(`Task deleted successfully! (ID: ${taskId})`);
                            // Adjust selection after deletion
                            if (selectedIndex >= tasks.length - 1) {
                                selectedIndex = Math.max(0, tasks.length - 2);
                            }
                        } else if (result.errors.length > 0) {
                            UI.error(`Delete failed: ${result.errors[0].error}`);
                        }
                        editMode = "view";
                        break;
                    }
                    // Fall through to other handling if not in delete mode
                    break;
                case "n":
                case "N":
                    if (editMode === "delete") {
                        // Cancel deletion
                        editMode = "view";
                        break;
                    }
                    // Fall through to other handling if not in delete mode
                    break;
                case "q":
                case "\u0003": // Ctrl+C
                    running = false;
                    break;
                default:
                    // Handle text input when in add mode
                    if ((editMode === "add" || editMode === "update") && keys && keys.length === 1 && keys >= ' ' && keys <= '~') {
                        if (currentField === "description") {
                            editData.description = (editData.description || "") + keys;
                        } else if (currentField === "details") {
                            editData.details = (editData.details || "") + keys;
                        } else if (currentField === "dueDate") {
                            editData.dueDate = (editData.dueDate || "") + keys;
                        } else if (currentField === "tags") {
                            // Simple tag input - append to first tag
                            const currentTags = editData.tags || [];
                            const currentTag = currentTags[0] || "";
                            editData.tags = [currentTag + keys];
                        }
                    }
                    break;
            }
    }
  } finally {
    cleanup();
  }

  UI.clearScreen();
  console.log("Goodbye! 👋");
}

/**
 * Show bulk actions menu for selected tasks
 * Returns the updated selected IDs after the operation
 */
async function showBulkActionsMenu(
  tasks: Task[],
  selectedIds: number[],
): Promise<number[]> {
  const taskSummaries = getTaskSummaries(tasks, selectedIds);

  console.clear();
  UI.header();

  console.log(`  ${colors.bold.magenta("Bulk Actions Menu")}`);
  console.log(`  ${colors.dim("Selected tasks:")}`);
  taskSummaries.forEach((summary) => console.log(`    ${summary}`));
  console.log("");

  const action = await Select.prompt({
    message: "Choose bulk action:",
    options: [
      { name: "Mark as...", value: "mark" },
      { name: "Update properties", value: "update" },
      { name: "Delete selected", value: "delete" },
      { name: "Cancel", value: "cancel" },
    ],
  });

  if (action === "cancel") {
    return selectedIds; // Return unchanged selection
  }

  try {
    if (action === "mark") {
      const statusOptions = ["todo", "in-progress", "done"];
      const selectedStatus = await Select.prompt({
        message: `Mark ${selectedIds.length} tasks as:`,
        options: statusOptions,
      });

      const result = await bulkMarkTasks(selectedIds, selectedStatus);
      console.log("");
      if (result.successCount > 0) {
        UI.success(`${result.successCount} tasks marked as ${selectedStatus}.`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach((error) => {
          UI.error(`Task ${error.id}: ${error.error}`);
        });
        // Return only the failed task IDs to keep them selected
        return result.errors.map((error) => error.id);
      }
      // All tasks marked successfully, return empty selection
      return [];
    } else if (action === "update") {
      console.log("");
      console.log("Update properties for selected tasks:");

      const changes: Partial<Task> = {};

      // Priority update
      const priorityOptions = ["skip", "low", "medium", "high", "critical"];
      const prioritySelection = await Select.prompt({
        message: "Update priority:",
        options: [
          { name: "Skip - keep current", value: "skip" },
          { name: "Low", value: "low" },
          { name: "Medium", value: "medium" },
          { name: "High", value: "high" },
          { name: "Critical", value: "critical" },
        ],
      });

      if (prioritySelection !== "skip") {
        changes.priority = prioritySelection as TaskPriority;
      }

      // Tags update (simplified for TUI)
      const tagsOptions = ["skip", "clear", "urgent", "work", "personal"];
      const tagsSelection = await Select.prompt({
        message: "Update tags:",
        options: [
          { name: "Skip - keep current", value: "skip" },
          { name: "Clear all tags", value: "clear" },
          { name: "Add 'urgent' tag", value: "urgent" },
          { name: "Add 'work' tag", value: "work" },
          { name: "Add 'personal' tag", value: "personal" },
        ],
      });

      if (tagsSelection === "clear") {
        changes.tags = [];
      } else if (tagsSelection !== "skip") {
        changes.tags = [tagsSelection];
      }

      if (Object.keys(changes).length > 0) {
        const result = await bulkUpdateTasks(selectedIds, changes);
        if (result.successCount > 0) {
          UI.success(`${result.successCount} tasks updated.`);
        }
        if (result.errors.length > 0) {
          result.errors.forEach((error) => {
            UI.error(`Task ${error.id}: ${error.error}`);
          });
          // Return only the failed task IDs to keep them selected
          return result.errors.map((error) => error.id);
        }
        // All tasks updated successfully, return empty selection
        return [];
      } else {
        UI.info("No changes made.");
        return selectedIds; // No changes made, keep original selection
      }
    } else if (action === "delete") {
      const confirmOptions = ["no", "yes"];
      const confirmed = await Select.prompt({
        message: `Delete ${selectedIds.length} selected tasks?`,
        options: [
          { name: "No, cancel", value: "no" },
          { name: "Yes, delete them", value: "yes" },
        ],
      });

      if (confirmed === "yes") {
        const result = await bulkDeleteTasks(selectedIds);
        if (result.successCount > 0) {
          UI.success(`${result.successCount} tasks deleted.`);
        }
        if (result.errors.length > 0) {
          result.errors.forEach((error) => {
            UI.error(`Task ${error.id}: ${error.error}`);
          });
          // Return only the failed task IDs to keep them selected
          return result.errors.map((error) => error.id);
        }
        // All tasks deleted successfully, return empty selection
        return [];
      }
      return selectedIds; // If not confirmed, keep original selection
    }

    // Wait for user to see results
    console.log("");
    console.log("Press any key to continue...");
    // Simple timeout for TUI - user can press any key to continue
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    UI.error(`Bulk operation failed: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return selectedIds; // On error, keep original selection
  }

  // Fallback return (should not be reached)
  return selectedIds;
}
