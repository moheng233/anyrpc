import { createMiddlewares, createManifest } from "@anyrpc/core/server";

const manifest = createManifest(); 

export default function() {
    return createMiddlewares("preview", manifest);
}
