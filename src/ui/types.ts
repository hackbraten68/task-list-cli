// src/ui/types.ts
export interface ModalAction {
  label: string;
  action: () => unknown | Promise<unknown>;
}

export interface ModalOptions {
  title: string;
  content: string[];
  actions: ModalAction[];
  width?: number;
  height?: number;
}

export interface UIInterface {
  header(taskCount?: number): void;
  success(text: string): void;
  error(text: string): void;
  info(text: string): void;
  statusPipe(status: TaskStatus): string;
  priorityPipe(priority: TaskPriority): string;
  statusSummary(tasks: Task[]): void;
  clearScreen(): void;
  box(
    title: string,
    lines: string[],
    width: number,
    height: number,
    focused?: boolean,
    dimmed?: boolean,
  ): string[];
  drawModal(
    title: string,
    content: string[],
    width: number,
    height: number,
  ): string[];
  renderLayout(
    panels: string[][],
    modal?: { lines: string[]; width: number; height: number },
  ): void;
  footer(
    multiSelectMode?: boolean,
    selectedCount?: number,
    statsViewMode?: boolean,
    completionRate?: number,
    overdueCount?: number,
    searchMode?: boolean,
    editMode?: "view" | "add" | "update",
    statsSidebarVisible?: boolean,
  ): void;
  renderTasks(tasks: Task[]): void;
  progressBar(value: number, max: number, width?: number): string;
  miniProgressBar(percentage: number, width?: number): string;
  renderStatsPanel(stats: TaskStats, width: number, height: number): string[];
  showModal(options: ModalOptions): Promise<unknown>;
  confirm(message: string, title?: string): Promise<boolean>;
  handleModalKey(key: string): boolean;
  isModalActive(): boolean;
}

import { Task, TaskPriority, TaskStatus } from "../types.ts";
import { TaskStats } from "../stats.ts";
