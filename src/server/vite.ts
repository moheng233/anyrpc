import type { Plugin } from "vite";

import { defu } from "defu";
import path from "pathe";
import { resolveTSConfig } from "pkg-types";
import {
    ModuleKind,
    ModuleResolutionKind,
    Project,
} from "ts-morph";

import type { AnyRPCViteOption } from "./types.js";

import { createMiddlewares } from "./middlewares.js";
import { transformRPCFile } from "./transform.js";
import { defaultInclude } from "./util/fs.js";

export default function anyrpc(inputOption?: Partial<AnyRPCViteOption>): Plugin {
    let rootDir: string;
    let project: Project;

    const { include, middlewares } = defu(inputOption, {
        enableDevMiddlewares: false,
        include: defaultInclude,
        middlewares: {
            enable: false
        }
    } as AnyRPCViteOption);

    return {
        name: "vite-plugin-anyrpc",
        enforce: "pre",
        async config(config) {
            rootDir = path.normalize(config.root ?? process.cwd());

            project = new Project({
                defaultCompilerOptions: {
                    module: ModuleKind.Preserve,
                    moduleResolution: ModuleResolutionKind.Bundler,
                },
                skipAddingFilesFromTsConfig: false,
                tsConfigFilePath: await resolveTSConfig(rootDir),
            });

            return {
                build: {
                    rollupOptions: {
                        output: {
                            manualChunks: (id) => {
                                if (include(id)) {
                                    return "rpc";
                                }
                            }
                        }
                    }
                },
                optimizeDeps: {
                    include: ["@anyrpc/core/client"],
                    exclude: ["@anyrpc/core/server"]
                },
                ssr: {
                    external: ["@anyrpc/core"],
                },
            };
        },
        resolveId() {

        },
        async configureServer(server) {
            if (middlewares.enable) {
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                server.middlewares.use("/__rpc", await createMiddlewares(url => server.ssrLoadModule(url, { fixStacktrace: true }), middlewares));
            }
        },
        async transform(code, id, options) {
            const ssr = options?.ssr === true;

            if (include(id)) {
                const source = project.createSourceFile(id, code, { overwrite: true });
                await transformRPCFile(project, source, { rootDir, ssr });
                return source.getFullText();
            }
        },
    };
}
