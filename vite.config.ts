import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"], // 🔥 important
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },

  build: {
    chunkSizeWarningLimit: 600,

    commonjsOptions: {
      transformMixedEsModules: true,
    },

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ✅ Keep React isolated (safe)
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          // ✅ Router
          if (id.includes("node_modules/react-router")) {
            return "vendor-router";
          }

          // ✅ Charts
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3")
          ) {
            return "vendor-charts";
          }

          // ✅ XLSX
          if (id.includes("node_modules/xlsx")) {
            return "vendor-xlsx";
          }

          // ✅ Utils
          if (
            id.includes("node_modules/moment") ||
            id.includes("node_modules/lodash")
          ) {
            return "vendor-utils";
          }

          // ❌ REMOVE RADIX SPLIT (critical fix)

          // ✅ Aria
          if (
            id.includes("node_modules/react-aria") ||
            id.includes("node_modules/@internationalized")
          ) {
            return "vendor-aria";
          }

          // ✅ Table
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-table";
          }

          // ✅ Everything else
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
});