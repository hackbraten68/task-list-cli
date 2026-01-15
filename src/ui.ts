import { colors, ansi } from "cliffy/ansi";
import { Table } from "cliffy/table";
import { Task, TaskPriority, TaskStatus } from "./types.ts";
import { format } from "@std/datetime";
import { TaskStats } from "./stats.ts";

export const UI = {
    header() {
        const art = `
    
    ██╗      █████╗ ███████╗██╗   ██╗███████╗ █████╗  ███████╗██╗  ██╗
    ██║     ██╔══██╗╚══███╔╝╚██╗ ██╔╝╚══██╔═╝ ██╔══██╗██╔════╝██║ ██╔╝
    ██║     ███████║  ███╔╝  ╚████╔╝    ██║   ███████║███████╗█████╔╝ 
    ██║     ██╔══██║ ███╔╝    ╚██╔╝     ██║   ██╔══██║╚════██║██╔═██╗ 
    ███████╗██║  ██║███████╗   ██║      ██║   ██║  ██║███████║██║  ██╗
    ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`;
        console.log(colors.bold.cyan(art));
        console.log(colors.dim("          " + new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) + "\n");
    },

    success(text: string) {
        console.log(colors.green(`✔ ${text}`));
    },

    error(text: string) {
        console.log(colors.red(`✘ ${text}`));
    },

    info(text: string) {
        console.log(colors.blue(`ℹ ${text}`));
    },

    statusPipe(status: TaskStatus): string {
        switch (status) {
            case "todo":
                return colors.red("●") + " todo";
            case "in-progress":
                return colors.yellow("●") + " in-progress";
            case "done":
                return colors.green("✔") + " done";
        }
    },

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
    },

    statusSummary(tasks: Task[]) {
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
    },

    clearScreen() {
        console.log(`${ansi.eraseScreen}${ansi.cursorUp(100)}${ansi.cursorTo(0, 0)}`);
    },

    box(title: string, lines: string[], width: number, height: number, focused = false, dimmed = false): string[] {
        let color: (s: string) => string = (s: string) => focused ? colors.bold.cyan(s) : colors.dim.white(s);
        if (dimmed) color = (s: string) => colors.rgb24(s, { r: 100, g: 100, b: 100 });

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
        const top = color(border.tl + titleStr + border.h.repeat(Math.max(0, width - titleStr.length - 2)) + border.tr);
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
    },

    drawModal(title: string, content: string[], width: number, height: number): string[] {
        const modalBox = this.box(title, content, width, height, true, false);
        return modalBox;
    },

    renderLayout(panels: string[][], modal?: { lines: string[], width: number, height: number }): void {
        const maxHeight = Math.max(...panels.map((p) => p.length));
        const layoutLines: string[] = [];

        for (let i = 0; i < maxHeight; i++) {
            let row = "";
            for (const panel of panels) {
                row += (panel[i] || " ".repeat(panel[0]?.replace(/\u001b\[[0-9;]*m/g, "").length || 0)) + " ";
            }
            layoutLines.push(row);
        }

        if (modal) {
            // Render dimmed background first
            layoutLines.forEach(l => {
                const dimmedLine = l.replace(/\u001b\[[0-9;]*m/g, "");
                console.log(colors.rgb24(dimmedLine, { r: 60, g: 60, b: 60 }));
            });

            // Then overlay the modal on top
            const { columns, rows } = Deno.consoleSize();
            const startCol = Math.floor((columns - modal.width) / 2);
            const startRow = Math.floor((rows - modal.height) / 2);

            modal.lines.forEach((line, i) => {
                console.log(ansi.cursorTo(startCol, startRow + i).toString() + line);
            });
        } else {
            // Normal layout rendering
            layoutLines.forEach(l => console.log(l));
        }
    },

    footer(multiSelectMode: boolean = false, selectedCount: number = 0, statsViewMode: boolean = false, completionRate?: number, overdueCount?: number) {
        const encoder = new TextEncoder();

        let footerStr = "  " + colors.bgWhite.black(" KEYS ") + " ";

        if (statsViewMode) {
            footerStr +=
                colors.bold("s") + " Tasks View  " +
                colors.bold("q") + " Quit";
        } else if (multiSelectMode) {
            footerStr +=
                colors.bold("j/k") + " or " + colors.bold("↑/↓") + "  " +
                colors.bold("Space") + " Select  " +
                colors.bold("Tab") + " Exit Multi  " +
                colors.bold("Enter") + " Bulk Actions  " +
                colors.bold("q") + " Quit";

            if (selectedCount > 0) {
                footerStr += `  ${colors.bold.magenta(`[${selectedCount} selected]`)}`;
            }
        } else {
            footerStr +=
                colors.bold("j/k") + " or " + colors.bold("↑/↓") + "  " +
                colors.bold("Tab") + " Multi-Select  " +
                colors.bold("s") + " Statistics  " +
                colors.bold("a") + " Add  " +
                colors.bold("u") + " Update  " +
                colors.bold("d") + " Delete  " +
                colors.bold("m") + " Mark  " +
                colors.bold("q") + " Quit";
        }

        // Add dynamic completion status bar (if provided)
        if (completionRate !== undefined) {
            // Check terminal width - only show if we have enough space (>120 chars)
            const terminalWidth = Deno.consoleSize().columns;
            if (terminalWidth > 120) {
                if (overdueCount && overdueCount > 0) {
                    // Alert mode: show completion + overdue with red indicator
                    footerStr += `      [${completionRate}% | ${overdueCount}🔴]`;
                } else {
                    // Normal mode: show mini progress bar + percentage
                    const miniBar = this.miniProgressBar(completionRate, 8);
                    footerStr += `      ${miniBar} ${completionRate}%`;
                }
            }
        }

        // Use writeSync to avoid trailing newline
        Deno.stdout.writeSync(encoder.encode(footerStr));
    },

    renderTasks(tasks: Task[]) {
        if (tasks.length === 0) {
            this.info("No tasks found. Press [a] inside the dashboardto add your first task.");
            return;
        }

        const table = new Table()
            .header([
                colors.bold("ID"),
                colors.bold("Task"),
                colors.bold("Status"),
                colors.bold("Priority"),
                colors.bold("Tags"),
                colors.bold("Due Date"),
                colors.dim("Created"),
            ])
            .body(
                tasks.map((t) => [
                    colors.dim(t.id.toString()),
                    colors.bold(t.description),
                    this.statusPipe(t.status),
                    this.priorityPipe(t.priority),
                    t.tags && t.tags.length > 0 ? t.tags.join(", ") : colors.dim("-"),
                    t.dueDate ? colors.cyan(t.dueDate) : colors.dim("-"),
                    colors.dim(format(new Date(t.createdAt), "dd.MM")),
                ]),
            )
            .border(true)
            .padding(1)
            .indent(2);

        table.render();
    },

    progressBar(value: number, max: number, width: number = 20): string {
        const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
        const filled = Math.round((value / max) * width);
        const empty = width - filled;

        const bar = "█".repeat(filled) + "░".repeat(empty);
        return `${bar} ${percentage}%`;
    },

    miniProgressBar(percentage: number, width: number = 8): string {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;

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
    },

    renderStatsPanel(stats: TaskStats, width: number, height: number): string[] {
        const lines: string[] = [];

        lines.push("");
        lines.push(`  ${colors.bold.cyan("📊 Task Statistics")}`);
        lines.push("");

        // Total tasks
        lines.push(`  ${colors.bold.white("Total Tasks:")}     ${colors.bold(stats.total.toString())}`);
        lines.push("");

        // Completion rate with progress bar
        const completionBar = this.progressBar(stats.byStatus.done, stats.total, Math.min(width - 20, 25));
        lines.push(`  ${colors.bold.white("Completion:")}      ${colors.green(completionBar)}`);
        lines.push("");

        // Status breakdown
        lines.push(`  ${colors.bold.white("Status Breakdown:")}`);
        lines.push(`    ${colors.red("●")} Todo:         ${stats.byStatus.todo}`);
        lines.push(`    ${colors.yellow("●")} In Progress:  ${stats.byStatus["in-progress"]}`);
        lines.push(`    ${colors.green("✔")} Done:          ${stats.byStatus.done}`);
        lines.push("");

        // Priority breakdown
        lines.push(`  ${colors.bold.white("Priority Levels:")}`);
        lines.push(`    ${colors.blue("Low:")}           ${stats.byPriority.low}`);
        lines.push(`    ${colors.yellow("Medium:")}        ${stats.byPriority.medium}`);
        lines.push(`    ${colors.red("High:")}           ${stats.byPriority.high}`);
        lines.push(`    ${colors.bold.red("Critical:")}      ${stats.byPriority.critical}`);
        lines.push("");

        // Overdue tasks (if any)
        if (stats.overdue > 0) {
            lines.push(`  ${colors.bold.red("⚠️  Overdue:")}       ${colors.bold.red(stats.overdue.toString())} tasks`);
            lines.push("");
        }

        // Recent activity
        lines.push(`  ${colors.bold.white("Recent Activity:")} ${stats.recentActivity} tasks this week`);

        // Top tags
        if (stats.topTags.length > 0) {
            lines.push("");
            lines.push(`  ${colors.bold.white("Top Tags:")}`);
            stats.topTags.slice(0, 5).forEach(({ tag, count }) => {
                lines.push(`    ${colors.cyan(tag)} (${count})`);
            });
        }

        // Fill remaining height with empty lines
        while (lines.length < height - 2) {
            lines.push("");
        }

        return lines;
    },
};
