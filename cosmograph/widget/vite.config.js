import { defineConfig } from "vite";
import anywidget from "@anywidget/vite";

export default defineConfig({
	build: {
		outDir: "cosmograph/static",
		lib: {
			entry: ["js/widget.ts"],
			formats: ["es"],
		},
		rollupOptions: {
			output: {
				// Keeps everything in one output file
				manualChunks: () => 'app',
			}
		}
	},
  plugin: [anywidget()],
});