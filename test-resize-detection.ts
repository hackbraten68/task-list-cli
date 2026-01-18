// test-resize-detection.ts
import { ResizeHandler } from "./src/ui/resize-handler.ts";
import { ResponsiveLayout } from "./src/ui/layout.ts";

// Test resize detection
async function testResizeDetection() {
  console.log("🧪 Testing resize detection...\n");

  const layout = new ResponsiveLayout();
  const resizeHandler = new ResizeHandler(layout);

  console.log("Initial size:", resizeHandler.getCurrentSize());

  // Simulate resize by calling triggerResize
  resizeHandler.triggerResize();

  console.log("After manual trigger:", resizeHandler.getCurrentSize());

  // Test periodic checking
  console.log("Starting resize listener...");
  resizeHandler.startListening();

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log("After listening period:", resizeHandler.getCurrentSize());

  resizeHandler.stopListening();

  console.log("✅ Resize detection test complete!");
}

testResizeDetection();
