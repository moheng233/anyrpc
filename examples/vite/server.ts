/// <reference types="vite/client" />

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

import { createServer as createViteServer } from "vite";
import { createMiddlewares } from "@moheng/anyrpc/server";
import { manifest } from "@moheng/anyrpc/manifest";

const isProduction = process.env.NODE_ENV === 'production'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
	const app = express();

	if (!import.meta.env.PROD) {
		const vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "custom",
		});
		app.use(vite.middlewares);

		app.use("*", async (req, res, next) => {
			const url = req.originalUrl;

			try {
				let template = fs.readFileSync(
					path.resolve(__dirname, "index.html"),
					"utf-8",
				);

				template = await vite.transformIndexHtml(url, template);

				res.status(200).set({ "Content-Type": "text/html" }).end(template);
			} catch (e) {
				vite.ssrFixStacktrace(e);
				next(e);
			}
		});
	} else {
		
	}

	app.listen(5173);
}

createServer();
