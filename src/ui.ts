import { colors, ansi } from "cliffy/ansi";
import { Table } from "cliffy/table";
import { Task, TaskPriority, TaskStatus } from "./types.ts";
import { format } from "@std/datetime";

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
        console.log((ansi.eraseScreen + ansi.cursorUp(100) + ansi.cursorTo(0, 0)).toString());
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

    footer() {
        const encoder = new TextEncoder();
        const footerStr = "  " +
            colors.bgWhite.black(" KEYS ") +
            " " +
            colors.bold("j/k") + " ↓/↑  " +
            colors.bold("a") + " Add  " +
            colors.bold("u") + " Update  " +
            colors.bold("d") + " Delete  " +
            colors.bold("m") + " Mark  " +
            colors.bold("q") + " Quit";

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
                colors.bold("Due Date"),
                colors.dim("Created"),
            ])
            .body(
                tasks.map((t) => [
                    colors.dim(t.id.toString()),
                    colors.bold(t.description),
                    this.statusPipe(t.status),
                    this.priorityPipe(t.priority),
                    t.dueDate ? colors.cyan(t.dueDate) : colors.dim("-"),
                    colors.dim(format(new Date(t.createdAt), "dd.MM")),
                ]),
            )
            .border(true)
            .padding(1)
            .indent(2);

        table.render();
    },
};
