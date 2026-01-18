// src/ui/cliffy-ui.ts
import { UI } from "../ui.ts";
import { UIInterface } from "./types.ts";
import { Task, TaskPriority, TaskStatus } from "../types.ts";
import { TaskStats } from "../stats.ts";

export class CliffyUI implements UIInterface {
  header(taskCount?: number): void {
    UI.header(taskCount);
  }

  success(text: string): void {
    UI.success(text);
  }

  error(text: string): void {
    UI.error(text);
  }

  info(text: string): void {
    UI.info(text);
  }

  statusPipe(status: TaskStatus): string {
    return UI.statusPipe(status);
  }

  priorityPipe(priority: TaskPriority): string {
    return UI.priorityPipe(priority);
  }

  statusSummary(tasks: Task[]): void {
    UI.statusSummary(tasks);
  }

  clearScreen(): void {
    UI.clearScreen();
  }

  box(
    title: string,
    lines: string[],
    width: number,
    height: number,
    focused?: boolean,
    dimmed?: boolean,
  ): string[] {
    return UI.box(title, lines, width, height, focused, dimmed);
  }

  drawModal(
    title: string,
    content: string[],
    width: number,
    height: number,
  ): string[] {
    return UI.drawModal(title, content, width, height);
  }

  renderLayout(
    panels: string[][],
    modal?: { lines: string[]; width: number; height: number },
  ): void {
    UI.renderLayout(panels, modal);
  }

  footer(
    multiSelectMode?: boolean,
    selectedCount?: number,
    statsViewMode?: boolean,
    completionRate?: number,
    overdueCount?: number,
    searchMode?: boolean,
  ): void {
    UI.footer(
      multiSelectMode,
      selectedCount,
      statsViewMode,
      completionRate,
      overdueCount,
      searchMode,
    );
  }

  renderTasks(tasks: Task[]): void {
    UI.renderTasks(tasks);
  }

  progressBar(value: number, max: number, width?: number): string {
    return UI.progressBar(value, max, width);
  }

  miniProgressBar(percentage: number, width?: number): string {
    return UI.miniProgressBar(percentage, width);
  }

  renderStatsPanel(stats: TaskStats, width: number, height: number): string[] {
    return UI.renderStatsPanel(stats, width, height);
  }

  async showModal(
    options: import("./types.ts").ModalOptions,
  ): Promise<unknown> {
    // For legacy CLI, just log the modal content
    console.log(`\n${options.title}:`);
    options.content.forEach((line) => console.log(line));
    options.actions.forEach((action, i) =>
      console.log(`${i + 1}. ${action.label}`)
    );
    // In CLI mode, just execute first action or something simple
    if (options.actions.length > 0) {
      return await options.actions[0].action();
    }
  }

  async confirm(message: string, title?: string): Promise<boolean> {
    // For legacy CLI, use simple text confirmation
    console.log(`\n${title || "Confirm"}: ${message}`);
    console.log("1. Yes  2. No");
    // In CLI mode, default to yes for now
    return true;
  }

  handleModalKey(key: string): boolean {
    // CliffyUI doesn't support modals
    return false;
  }

  isModalActive(): boolean {
    // CliffyUI doesn't support modals
    return false;
  }
}
