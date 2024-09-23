import { join } from "node:path";

import anyrpc from "@moheng/anyrpc/vite";
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
        anyrpc(),
    ],
    build: { target: "esnext" },
    appType: "spa",
});
