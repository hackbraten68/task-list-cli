// src/ui/components/task-table.ts
import { Signal, Computed } from "https://deno.land/x/tui@2.1.11/mod.ts";
import { colors } from "cliffy/ansi";
import { Task } from "../../types.ts";
import { AppState } from "../state.ts";
import { ResponsiveLayout, Rectangle } from "../layout.ts";
import { UI } from "../../ui.ts";

export class TaskTableRenderer {
  private state: AppState;
  private layout: ResponsiveLayout;

  constructor(state: AppState, layout: ResponsiveLayout) {
    this.state = state;
    this.layout = layout;
  }

  render(): string[] {
    const rect = this.layout.taskList;
    const tasks = this.state.filteredTasks.value;
    const selectedIdx = this.state.selectedIndex.value;

    const lines: string[] = [];

    if (tasks.length === 0) {
      lines.push("No tasks found. Press 'a' to add your first task.");
      return lines;
    }

    // Draw tasks
    const visibleTasks = tasks.slice(0, Math.min(tasks.length, rect.height - 1));

    for (let i = 0; i < visibleTasks.length; i++) {
      const task = visibleTasks[i];
      const isSelected = i === selectedIdx;

      const statusText = UI.statusPipe(task.status);
      const priorityText = UI.priorityPipe(task.priority);
      const description = this.layout.truncateText(
        task.description,
        rect.width - statusText.length - priorityText.length - 10
      );

      const text = `${task.id.toString().padEnd(3)} ${description} ${statusText} ${priorityText}`;

      if (isSelected) {
        lines.push(colors.bgCyan.black(text));
      } else {
        lines.push(text);
      }
    }

    return lines;
  }
}

export function createTaskTable(
  state: AppState,
  layout: ResponsiveLayout
): TaskTableRenderer {
  return new TaskTableRenderer(state, layout);
}