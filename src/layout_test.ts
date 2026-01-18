import { assertEquals } from "@std/assert";
import { ResponsiveLayout } from "./ui/layout.ts";

Deno.test("ResponsiveLayout - Stats Sidebar Layout Calculations", async (t) => {
  const layout = new ResponsiveLayout();

  await t.step("narrow terminal (80 cols) - stats sidebar bounds", () => {
    layout.setSize(80, 24);
    const sidebar = layout.statsSidebar;
    const taskList = layout.taskListWithStats;

    // Calculation: totalWidth = max(80-4, 80-4) = 76
    // sidebarWidth = max(25, min(35, 76-45)) = max(25, min(35, 31)) = max(25, 31) = 31
    assertEquals(sidebar.width, 31);

    // Task list should fit remaining space: total - margins - sidebar - spacing = 80 - 4 - 31 - 2 = 43
    assertEquals(taskList.width, 43);
    assertEquals(taskList.column, 31 + 3); // sidebar width + spacing = 34
  });

  await t.step("wide terminal (120 cols) - proportional sizing", () => {
    layout.setSize(120, 24);
    const sidebar = layout.statsSidebar;
    const taskList = layout.taskListWithStats;

    // Sidebar should be properly calculated: Math.min(50, 120-45=75) = 50
    assertEquals(sidebar.width, 50);

    // Task list should take remaining space
    assertEquals(taskList.width, 120 - 4 - 50 - 2); // 64
    assertEquals(taskList.column, 50 + 3); // 53
  });

  await t.step("very wide terminal (200 cols) - max sidebar width", () => {
    layout.setSize(200, 24);
    const sidebar = layout.statsSidebar;

    // Sidebar should be capped at 50
    assertEquals(sidebar.width, 50);
  });

  await t.step("text truncation utility", () => {
    const shortText = "Hello";
    const longText = "This is a very long text that should be truncated";

    assertEquals(layout.truncateText(shortText, 10), "Hello");
    assertEquals(layout.truncateText(longText, 20), "This is a very lo...");
  });

  await t.step("shouldShowElement utility", () => {
    layout.setSize(80, 24);
    assertEquals(layout.shouldShowElement(100), false);
    assertEquals(layout.shouldShowElement(60), true);

    layout.setSize(120, 24);
    assertEquals(layout.shouldShowElement(100), true);
  });
});

Deno.test("ResponsiveLayout - Regular Sidebar vs Stats Sidebar", async (t) => {
  const layout = new ResponsiveLayout();

  await t.step("wide screen - both sidebars should work", () => {
    layout.setSize(120, 24);

    const regularSidebar = layout.sidebar;
    const statsSidebar = layout.statsSidebar;

    // Both should be visible on wide screens
    assertEquals(regularSidebar.width > 0, true);
    assertEquals(statsSidebar.width > 0, true);

    // Stats sidebar can be wider than regular sidebar for better information display
    assertEquals(statsSidebar.width >= regularSidebar.width, true);
  });

  await t.step("narrow screen - stats sidebar bounds checking", () => {
    layout.setSize(60, 24);

    const statsSidebar = layout.statsSidebar;

    // Should still provide reasonable minimum width
    assertEquals(statsSidebar.width >= 25, true);
  });
});

Deno.test("Combined Panel Layout Rendering", async (t) => {
  await t.step("creates proper combined layout dimensions", () => {
    const layout = new ResponsiveLayout();
    layout.setSize(120, 24);

    const taskRect = layout.taskListWithStats;
    const sidebarRect = layout.statsSidebar;

    // Verify the layout calculations work correctly
    // taskWidth + sidebarWidth + spacing should equal available width
    const availableWidth = 120 - 4; // terminal - margins
    const totalContentWidth = taskRect.width + sidebarRect.width + 2; // + spacing

    assertEquals(totalContentWidth, availableWidth);

    // Combined display width (with borders) would be content + borders + spacing
    const displayWidth = taskRect.width + sidebarRect.width + 4; // + borders + spacing
    // Note: actual display width is content width + borders + spacing, may be less than terminal width
  });

  await t.step("handles edge case terminal sizes", () => {
    const layout = new ResponsiveLayout();

    // Very narrow terminal
    layout.setSize(60, 24);
    const narrowTask = layout.taskListWithStats;
    const narrowSidebar = layout.statsSidebar;

    // Should still provide reasonable sizes
    assertEquals(narrowSidebar.width >= 25, true);
    assertEquals(narrowTask.width >= 20, true); // Some minimum width

    // Very wide terminal
    layout.setSize(300, 24);
    const wideTask = layout.taskListWithStats;
    const wideSidebar = layout.statsSidebar;

    // Sidebar should be capped
    assertEquals(wideSidebar.width, 50);
    assertEquals(wideTask.width, 300 - 4 - 50 - 2); // terminal - margins - sidebar - spacing
  });
});
