// src/ui/state.ts
import { Signal, Computed } from "https://deno.land/x/tui@2.1.11/mod.ts";
import { Task } from "../types.ts";
import { ModalAction } from "./types.ts";

export class AppState {
  // Core data signals
  tasks = new Signal<Task[]>([]);
  selectedIndex = new Signal(0);
  multiSelectMode = new Signal(false);
  selectedTasks = new Signal(new Set<number>());
  searchTerm = new Signal("");
  currentSortField = new Signal<"id" | "description" | "status" | "priority" | "dueDate" | "createdAt">("id");
  currentSortOrder = new Signal<"asc" | "desc">("asc");

  // UI state signals
  editMode = new Signal<"view" | "add" | "update">("view");
  currentField = new Signal<"description" | "priority" | "status" | "details" | "dueDate" | "tags">("description");

  // Modal state
  modalActive = new Signal(false);
  modalTitle = new Signal("");
  modalContent = new Signal<string[]>([]);
  modalActions = new Signal<ModalAction[]>([]);
  modalResolve = new Signal<((value: unknown) => void) | null>(null);

  // Computed values
  filteredTasks = new Computed(() => {
    let filtered = this.tasks.value;

    // Apply search filter
    if (this.searchTerm.value.trim()) {
      const term = this.searchTerm.value.toLowerCase();
      filtered = filtered.filter((task: Task) =>
        task.description.toLowerCase().includes(term) ||
        (task.details && task.details.toLowerCase().includes(term)) ||
        (task.tags && task.tags.some((tag: string) => tag.toLowerCase().includes(term)))
      );
    }

    // Apply sorting
    filtered.sort((a: Task, b: Task) => {
      const aVal = a[this.currentSortField.value as keyof Task] ?? "";
      const bVal = b[this.currentSortField.value as keyof Task] ?? "";

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;

      return this.currentSortOrder.value === "asc" ? comparison : -comparison;
    });

    return filtered;
  });

  selectedTask = new Computed(() => {
    const tasks = this.filteredTasks.value;
    const index = this.selectedIndex.value;
    return index >= 0 && index < tasks.length ? tasks[index] : null;
  });

  // Helper methods
  setSelectedIndex(index: number) {
    const maxIndex = Math.max(0, this.filteredTasks.value.length - 1);
    this.selectedIndex.value = Math.max(0, Math.min(index, maxIndex));
  }

  moveSelection(delta: number) {
    this.setSelectedIndex(this.selectedIndex.value + delta);
  }

  toggleMultiSelect() {
    this.multiSelectMode.value = !this.multiSelectMode.value;
    if (!this.multiSelectMode.value) {
      this.selectedTasks.value.clear();
    }
  }

  toggleTaskSelection(taskId: number) {
    const selected = new Set(this.selectedTasks.value);
    if (selected.has(taskId)) {
      selected.delete(taskId);
    } else {
      selected.add(taskId);
    }
    this.selectedTasks.value = selected;
  }

  updateTasks(newTasks: Task[]) {
    this.tasks.value = newTasks;
    // Adjust selection if needed
    this.setSelectedIndex(this.selectedIndex.value);
  }
}