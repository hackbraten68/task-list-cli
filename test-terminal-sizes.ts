// test-terminal-sizes.ts
import { ResponsiveLayout } from "./src/ui/layout.ts";

// Test different terminal sizes
const testSizes = [
  { columns: 80, rows: 24 }, // Minimum supported
  { columns: 120, rows: 30 }, // Standard size
  { columns: 200, rows: 60 }, // Large display
  { columns: 60, rows: 20 }, // Very small (should clamp to min)
];

console.log("🧪 Testing terminal size compatibility...\n");

for (const size of testSizes) {
  console.log(`Testing ${size.columns}x${size.rows}:`);

  try {
    const layout = new ResponsiveLayout();
    layout.setSize(size.columns, size.rows);

    console.log(
      `  ✅ Terminal size: ${layout.getCurrentSize().columns}x${layout.getCurrentSize().rows}`,
    );
    console.log(
      `  ✅ Size check: ${size.columns} >= 120 = ${size.columns >= 120}`,
    );
    console.log(`  ✅ Header: ${layout.header.width}x${layout.header.height}`);
    console.log(
      `  ✅ Task List: ${layout.taskList.width}x${layout.taskList.height} at (${layout.taskList.column}, ${layout.taskList.row})`,
    );

    const sidebar = layout.sidebar;
    console.log(
      `  ✅ Sidebar raw: width=${sidebar.width}, totalWidth would be ${
        Math.max(size.columns, 80)
      }`,
    );
    if (sidebar.width > 0) {
      console.log(
        `  ✅ Sidebar: ${sidebar.width}x${sidebar.height} at (${sidebar.column}, ${sidebar.row})`,
      );
    } else {
      console.log(`  ✅ Sidebar: Hidden (compact mode)`);
    }

    console.log(`  ✅ Footer: ${layout.footer.width}x${layout.footer.height}`);
    console.log(`  ✅ Is Compact: ${layout.isCompact}`);

    // Test modal positioning
    const modalPos = layout.getModalPosition(50, 10);
    console.log(
      `  ✅ Modal (50x10): positioned at (${modalPos.column}, ${modalPos.row})`,
    );
  } catch (error) {
    console.log(
      `  ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // No restore needed
  console.log("");
}

console.log("✅ Terminal compatibility test complete!");
