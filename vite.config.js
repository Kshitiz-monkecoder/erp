import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    build: {
        // Raise the warning threshold a little while we fix the real issue
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    // ── Core React runtime ──────────────────────────────────────────
                    if (id.includes("node_modules/react/") ||
                        id.includes("node_modules/react-dom/") ||
                        id.includes("node_modules/scheduler/")) {
                        return "vendor-react";
                    }
                    // ── Routing ─────────────────────────────────────────────────────
                    if (id.includes("node_modules/react-router")) {
                        return "vendor-router";
                    }
                    // ── Charts (recharts is large – isolate it) ──────────────────────
                    if (id.includes("node_modules/recharts") ||
                        id.includes("node_modules/d3") ||
                        id.includes("node_modules/victory")) {
                        return "vendor-charts";
                    }
                    // ── Spreadsheet / file export ────────────────────────────────────
                    if (id.includes("node_modules/xlsx")) {
                        return "vendor-xlsx";
                    }
                    // ── Date / utility libraries ────────────────────────────────────
                    if (id.includes("node_modules/moment") ||
                        id.includes("node_modules/lodash")) {
                        return "vendor-utils";
                    }
                    // ── Radix UI primitives ─────────────────────────────────────────
                    if (id.includes("node_modules/@radix-ui")) {
                        return "vendor-radix";
                    }
                    // ── React Aria / Internationalized date ─────────────────────────
                    if (id.includes("node_modules/react-aria") ||
                        id.includes("node_modules/@internationalized")) {
                        return "vendor-aria";
                    }
                    // ── TanStack Table ───────────────────────────────────────────────
                    if (id.includes("node_modules/@tanstack")) {
                        return "vendor-table";
                    }
                    // ── Everything else in node_modules → shared vendor chunk ────────
                    if (id.includes("node_modules/")) {
                        return "vendor-misc";
                    }
                },
            },
        },
    },
});
