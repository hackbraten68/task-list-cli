// src/ui/tui-ui.ts
import { UIInterface, ModalOptions, ModalAction } from "./types.ts";
import { Task, TaskPriority, TaskStatus } from "../types.ts";
import { TaskStats } from "../stats.ts";
import { AppState } from "./state.ts";
import { ResponsiveLayout } from "./layout.ts";
import { ResizeHandler } from "./resize-handler.ts";
import { createTaskTable } from "./components/task-table.ts";
import { CliffyUI } from "./cliffy-ui.ts";
import { colors, ansi } from "cliffy/ansi";

// Full deno_tui implementation
export class TuiUI implements UIInterface {
  private state: AppState;
  private layout: ResponsiveLayout;
  private resizeHandler: ResizeHandler;
  private taskTable: any;

  constructor() {
    try {
      this.state = new AppState();
      this.layout = new ResponsiveLayout();
      this.resizeHandler = new ResizeHandler(this.layout);
      this.taskTable = createTaskTable(this.state, this.layout);

      // Start listening for resize events
      this.resizeHandler.startListening();

      console.log("✅ TuiUI initialized successfully with reactive state management");
    } catch (error) {
      console.warn("⚠️  TuiUI initialization warning:", error instanceof Error ? error.message : String(error));
      throw error; // Re-throw to trigger fallback in factory
    }
  }

  destroy() {
    this.resizeHandler.stopListening();
  }

  // Update state when tasks change
  updateTasks(tasks: Task[]) {
    this.state.updateTasks(tasks);
  }

  header(taskCount?: number): void {
    console.log(colors.bold.cyan(`
    ██╗      █████╗ ███████╗██╗   ██╗███████╗ █████╗  ███████╗██╗  ██╗
    ██║     ██╔══██╗╚══███╔╝╚██╗ ██╔╝╚══██╔═╝ ██╔══██╗██╔════╝██║ ██╔╝
    ██║     ███████║  ███╔╝  ╚████╔╝    ██║   ███████║███████╗█████╔╝
    ██║     ██╔══██║ ███╔╝    ╚██╔╝     ██║   ██╔══██║╚════██║██╔═██╗
    ███████╗██║  ██║███████╗   ██║      ██║   ██║  ██║███████║██║  ██╗
    ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`));

    if (taskCount !== undefined && taskCount > 0) {
      console.log(colors.dim(`          ${taskCount} task${taskCount !== 1 ? "s" : ""}`));
    }
    console.log("");
  }

  success(text: string): void {
    console.log(colors.green(`✔ ${text}`));
  }

  error(text: string): void {
    console.log(colors.red(`✘ ${text}`));
  }

  info(text: string): void {
    console.log(colors.blue(`ℹ ${text}`));
  }

  statusPipe(status: TaskStatus): string {
    switch (status) {
      case "todo":
        return colors.red("●") + " todo";
      case "in-progress":
        return colors.yellow("●") + " in-progress";
      case "done":
        return colors.green("✔") + " done";
    }
  }

  priorityPipe(priority: TaskPriority): string {
    switch (priority) {
      case "critical":
        return colors.bold.red("!!! CRITICAL");
      case "high":
        return colors.red("!! High");
      case "medium":
        return colors.yellow("! Medium");
      case "low":
        return colors.blue("Low");
    }
  }

  statusSummary(tasks: Task[]): void {
    const counts = tasks.reduce(
      (acc, t) => {
        acc[t.status]++;
        return acc;
      },
      { todo: 0, "in-progress": 0, done: 0 } as Record<string, number>,
    );

    console.log(
      `  ${colors.red("●")} todo: ${counts.todo}  ` +
        `${colors.yellow("●")} in-progress: ${counts["in-progress"]}  ` +
        `${colors.green("✔")} done: ${counts.done}\n`,
    );
  }

  clearScreen(): void {
    console.log(
      `${ansi.eraseScreen}${ansi.cursorUp(100)}${ansi.cursorTo(0, 0)}`,
    );
  }

  box(title: string, lines: string[], width: number, height: number, focused?: boolean, dimmed?: boolean): string[] {
    // Match the original UI.box() implementation
    let color: (s: string) => string = (s: string) =>
      focused ? colors.bold.cyan(s) : colors.dim.white(s);
    if (dimmed) {
      color = (s: string) => colors.rgb24(s, { r: 100, g: 100, b: 100 });
    }

    const border = {
      tl: "┌",
      tr: "┐",
      bl: "└",
      br: "┘",
      h: "─",
      v: "│",
    };

    const out: string[] = [];
    const titleStr = title ? ` ${title} ` : "";
    const top = color(
      border.tl + titleStr +
        border.h.repeat(Math.max(0, width - titleStr.length - 2)) + border.tr,
    );
    out.push(top);

    for (let i = 0; i < height - 2; i++) {
      let line = lines[i] || "";
      if (dimmed) {
        line = line.replace(/\u001b\[[0-9;]*m/g, "");
        line = colors.rgb24(line, { r: 100, g: 100, b: 100 });
      }

      const strippedLine = line.replace(/\u001b\[[0-9;]*m/g, "");
      const padding = " ".repeat(Math.max(0, width - strippedLine.length - 2));
      out.push(color(border.v) + line + padding + color(border.v));
    }

    const bottom = color(border.bl + border.h.repeat(width - 2) + border.br);
    out.push(bottom);
    return out;
  }

  drawModal(title: string, content: string[], width: number, height: number): string[] {
    // Use double-line borders for modal distinction
    const color = colors.bold.cyan;

    const border = {
      tl: "╔",
      tr: "╗",
      bl: "╚",
      br: "╝",
      h: "═",
      v: "║",
    };

    const out: string[] = [];
    const titleStr = title ? ` ${title} ` : "";
    const top = color(
      border.tl + titleStr +
        border.h.repeat(Math.max(0, width - titleStr.length - 2)) + border.tr,
    );
    out.push(top);

    for (let i = 0; i < height - 2; i++) {
      const line = content[i] || "";
      const strippedLine = line.replace(/\u001b\[[0-9;]*m/g, "");
      const padding = " ".repeat(Math.max(0, width - strippedLine.length - 2));
      out.push(color(border.v) + line + padding + color(border.v));
    }

    const bottom = color(border.bl + border.h.repeat(width - 2) + border.br);
    out.push(bottom);
    return out;
  }

  renderLayout(panels: string[][], modal?: { lines: string[]; width: number; height: number }): void {
    // Check if modal is active from state
    const hasModal = this.state.modalActive.value || modal;

    // Match CliffyUI renderLayout behavior
    const maxHeight = Math.max(...panels.map((p) => p.length));
    const layoutLines: string[] = [];

    for (let i = 0; i < maxHeight; i++) {
      let row = "";
      for (const panel of panels) {
        row += (panel[i] ||
          " ".repeat(
            panel[0]?.replace(/\u001b\[[0-9;]*m/g, "").length || 0,
          )) + " ";
      }
      layoutLines.push(row);
    }

    if (hasModal) {
      // Render dimmed background first
      layoutLines.forEach((l) => {
        const dimmedLine = l.replace(/\u001b\[[0-9;]*m/g, "");
        console.log(colors.rgb24(dimmedLine, { r: 40, g: 40, b: 40 }));
      });

      // Check if modal is from parameter or state
      let modalLines: string[];
      let modalWidth: number;
      let modalHeight: number;

      if (modal) {
        // Legacy modal parameter
        modalLines = modal.lines;
        modalWidth = modal.width;
        modalHeight = modal.height;
      } else {
        // State-based modal
        modalLines = this.drawModal(
          this.state.modalTitle.value,
          this.state.modalContent.value,
          50, // default width
          10  // default height
        );
        modalWidth = 50;
        modalHeight = 10;
      }

      // Then overlay the modal on top
      const { columns, rows } = Deno.consoleSize();
      const startCol = Math.floor((columns - modalWidth) / 2);
      const startRow = Math.floor((rows - modalHeight) / 2);

      modalLines.forEach((line, i) => {
        console.log(`\u001b[${startRow + i};${startCol}H${line}`);
      });
    } else {
      // Normal layout rendering
      layoutLines.forEach((l) => console.log(l));
    }
  }

  footer(multiSelectMode?: boolean, selectedCount?: number, statsViewMode?: boolean, completionRate?: number, overdueCount?: number, searchMode?: boolean): void {
    let footerStr = "  " + colors.bgWhite.black(" KEYS ") + " ";

    if (statsViewMode) {
      footerStr += colors.bold("s") + " Tasks View  " + colors.bold("q") + " Quit";
    } else if (searchMode) {
      footerStr += colors.bold("j/k") + " Navigation  " + colors.bold("ESC") + " Clear Search  " + colors.bold("q") + " Quit";
    } else if (multiSelectMode) {
      footerStr += colors.bold("j/k") + " Navigate  " + colors.bold("Space") + " Select";
      if (selectedCount && selectedCount > 0) {
        footerStr += `  ${colors.bold("b/u")} Bulk Ops  ${colors.bold.magenta(`[${selectedCount} selected]`)}`;
      }
      footerStr += "  " + colors.bold("q") + " Quit";
    } else {
      footerStr += colors.bold("j/k") + " Navigate  " + colors.bold("a") + " Add  " + colors.bold("u") + " Update  " + colors.bold("d") + " Delete  " + colors.bold("q") + " Quit";
    }

    // Completion status
    if (completionRate !== undefined) {
      const terminalWidth = Deno.consoleSize().columns;
      if (terminalWidth > 120) {
        const miniBar = this.miniProgressBar(completionRate, 8);
        footerStr += `      ${miniBar} ${completionRate}%`;
        if (overdueCount && overdueCount > 0) {
          footerStr += ` ${overdueCount}🔴`;
        }
      }
    }
    console.log(footerStr);
  }

  renderTasks(tasks: Task[]): void {
    // For now, delegate to the legacy implementation
    // TODO: Properly integrate with reactive task table
    const legacyUI = new CliffyUI();
    legacyUI.renderTasks(tasks);
  }

  progressBar(value: number, max: number, width?: number): string {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
    const filled = Math.round((value / max) * (width || 20));
    const empty = (width || 20) - filled;

    const bar = "█".repeat(filled) + "░".repeat(empty);
    return `${bar} ${percentage}%`;
  }

  miniProgressBar(percentage: number, width?: number): string {
    const filled = Math.round((percentage / 100) * (width || 8));
    const empty = (width || 8) - filled;

    let barColor: (s: string) => string;
    if (percentage >= 75) {
      barColor = colors.green;
    } else if (percentage >= 50) {
      barColor = colors.yellow;
    } else {
      barColor = colors.red;
    }

    const bar = "█".repeat(filled) + "░".repeat(empty);
    return barColor(bar);
  }

  renderStatsPanel(stats: TaskStats, width: number, height: number): string[] {
    const lines: string[] = [];

    lines.push("");
    lines.push(`  ${colors.bold.cyan("📊 Task Statistics")}`);
    lines.push("");

    lines.push(`  ${colors.bold.white("Total Tasks:")}     ${colors.bold(stats.total.toString())}`);
    lines.push("");

    const completionBar = this.progressBar(stats.byStatus.done, stats.total, Math.min(width - 20, 25));
    lines.push(`  ${colors.bold.white("Completion:")}      ${colors.green(completionBar)}`);
    lines.push("");

    lines.push(`  ${colors.bold.white("Status Breakdown:")}`);
    lines.push(`    ${colors.red("●")} Todo:         ${stats.byStatus.todo}`);
    lines.push(`    ${colors.yellow("●")} In Progress:  ${stats.byStatus["in-progress"]}`);
    lines.push(`    ${colors.green("✔")} Done:          ${stats.byStatus.done}`);
    lines.push("");

    lines.push(`  ${colors.bold.white("Priority Levels:")}`);
    lines.push(`    ${colors.blue("Low:")}           ${stats.byPriority.low}`);
    lines.push(`    ${colors.yellow("Medium:")}        ${stats.byPriority.medium}`);
    lines.push(`    ${colors.red("High:")}           ${stats.byPriority.high}`);
    lines.push(`    ${colors.bold.red("Critical:")}      ${stats.byPriority.critical}`);
    lines.push("");

    if (stats.overdue > 0) {
      lines.push(`  ${colors.bold.red("⚠️  Overdue:")}       ${colors.bold.red(stats.overdue.toString())} tasks`);
      lines.push("");
    }

    lines.push(`  ${colors.bold.white("Recent Activity:")} ${stats.recentActivity} tasks this week`);

    return lines.slice(0, height);
  }

  async showModal(options: ModalOptions): Promise<unknown> {
    const { title, content, actions, width = 50, height = 10 } = options;

    // Create modal content with actions
    const actionLabels = actions.map((a: ModalAction, i: number) => `${i + 1}. ${a.label}`);
    const modalContent = [...content, "", ...actionLabels, "", "Press ESC to cancel"];

    const modalLines = this.drawModal(title, modalContent, width, height);

    // Set modal state
    this.state.modalTitle.value = title;
    this.state.modalContent.value = modalContent;
    this.state.modalActions.value = actions;
    this.state.modalActive.value = true;

    // Return a promise that resolves when modal is dismissed
    return new Promise((resolve) => {
      this.state.modalResolve.value = resolve;
    });
  }

  async confirm(message: string, title = "Confirm"): Promise<boolean> {
    const actions: ModalAction[] = [
      { label: "Yes", action: () => true },
      { label: "No", action: () => false },
    ];

    return await this.showModal({
      title,
      content: [message],
      actions,
      width: 40,
      height: 8,
    }) as Promise<boolean>;
  }

  // Handle modal key input
  handleModalKey(key: string): boolean {
    if (!this.state.modalActive.value) return false;

    // Handle ESC to cancel
    if (key === "\u001b") {
      this.dismissModal("cancel");
      return true;
    }

    const actions = this.state.modalActions.value;
    const selectedIndex = parseInt(key) - 1;

    console.log(`Modal key: "${key}", parsed index: ${selectedIndex}, actions: ${actions.length}`);

    if (selectedIndex >= 0 && selectedIndex < actions.length) {
      console.log(`Executing action ${selectedIndex}`);
      // Execute the action and dismiss modal
      const result = actions[selectedIndex].action();
      this.dismissModal(result);
      return true;
    }

    return false;
  }

  private async dismissModal(result: unknown) {
    this.state.modalActive.value = false;
    this.state.modalTitle.value = "";
    this.state.modalContent.value = [];
    this.state.modalActions.value = [];

    const resolve = this.state.modalResolve.value;
    if (resolve) {
      this.state.modalResolve.value = null;
      resolve(result);
    }
  }

  private async readKey(): Promise<string> {
    // Read single bytes in raw mode
    const buffer = new Uint8Array(1);
    const bytesRead = await Deno.stdin.read(buffer);
    if (bytesRead === 0) return "";
    return String.fromCharCode(buffer[0]);
  }
}