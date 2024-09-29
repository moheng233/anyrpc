import anyrpc from "@anyrpc/core/vite";
import { join } from "node:path";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
    plugins: [
        {
            name: "splie",
            configResolved(config) {
                const outputDir = config.build?.outDir;

                config.build.outDir = config.build.ssr
                    ? join(outputDir, "server")
                    : join(outputDir, "client");
            },
        },
        inspect(),
        anyrpc({
            middlewares: {
                enable: true
            }
        }),
    ],
    build: { target: "esnext" },
    appType: "spa",
});
