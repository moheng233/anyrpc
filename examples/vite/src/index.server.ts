import { manifest } from "@moheng/anyrpc/manifest";
import { createMiddlewares } from "@moheng/anyrpc/server";
import { Express } from "express";

export default function(app: Express) {
    const anyrpc = createMiddlewares("preview", manifest);

	app.use(anyrpc);
}
