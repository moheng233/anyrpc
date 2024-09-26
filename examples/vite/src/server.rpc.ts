import { createManifest, createMiddlewares, RPCManifest } from "@anyrpc/core/server";

const manifest: RPCManifest = createManifest();

export default function () {
    return createMiddlewares((url: string) => {
        return manifest[url];
    });
}
