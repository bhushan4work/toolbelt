import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = { "@": fileURLToPath(new URL(".", import.meta.url)) };

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    projects: [
      {
        resolve: {
          alias,
        },
        test: {
          name: "lib",
          environment: "node",
          include: ["lib/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias,
        },
        test: {
          name: "components",
          environment: "happy-dom",
          include: ["components/**/*.test.tsx", "app/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});