import { join } from "node:path";

import anyrpc from "anyrpc/vite";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
	plugins: [
		anyrpc(),
		inspect(),
		{
			name: "splie",
			configResolved(config) {
				const outputDir = config.build?.outDir;

				config.build.outDir = config.build.ssr
					? join(outputDir, "server")
					: join(outputDir, "client");
			},
		},
	],
	build: { target: "esnext" },
	appType: "spa",
});
