import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Load .dev.vars file for local development
function loadDevVars() {
  const devVarsPath = path.resolve(process.cwd(), ".dev.vars");
  const vars = {};

  if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, "utf-8");
    content.split("\n").forEach((line) => {
      // Skip comments and empty lines
      if (line.startsWith("#") || !line.trim()) return;

      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join("=").trim();
      }
    });
  }

  return vars;
}

// Mock API plugin for local development
function mockApiPlugin() {
  const devVars = loadDevVars();

  return {
    name: "mock-api",
    configureServer(server) {
      // Mock /api/config endpoint
      server.middlewares.use("/api/config", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            gravatarClientId: devVars.GRAVATAR_CLIENT_ID || null,
          })
        );
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  // Optimize lucide-react to avoid loading entire icon library
  optimizeDeps: {
    include: ["lucide-react"],
  },
});
