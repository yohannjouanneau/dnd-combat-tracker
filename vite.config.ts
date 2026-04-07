import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/dnd-combat-tracker/",
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("react-markdown") ||
            id.includes("remark-gfm") ||
            id.includes("remark") ||
            id.includes("rehype") ||
            id.includes("hast") ||
            id.includes("mdast") ||
            id.includes("micromark") ||
            id.includes("unist")
          ) {
            return "markdown";
          }
          if (id.includes("@xyflow")) {
            return "canvas";
          }
          if (id.includes("emoji-mart") || id.includes("@emoji-mart")) {
            return "emoji";
          }
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react";
          }
          if (
            id.includes("node_modules/i18next") ||
            id.includes("node_modules/react-i18next")
          ) {
            return "i18n";
          }
        },
      },
    },
  },
});
