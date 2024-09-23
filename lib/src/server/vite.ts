import assert from "node:assert";
import { glob } from "node:fs/promises";
import path, { join } from "pathe";

import {
	ModuleKind,
	ModuleResolutionKind,
	Project,
	VariableDeclarationKind,
} from "ts-morph";
import { type Plugin, createFilter } from "vite";

import { assertPosixPath } from "../common/assert.js";
import { exists } from "../common/fs.js";
import { createMiddlewares } from "./middlewares.js";
import { transformRPCFile } from "./transform.js";

const filter = createFilter("**/*.rpc.ts");

const virtualRPCManifestModuleId = "@moheng/anyrpc/manifest";
const resolvedVirtualRPCManifestModuleId = `\0${virtualRPCManifestModuleId}`;

export default function anyrpc(): Plugin {
	let rootDir: string;
	let project: Project;

	return {
		name: "vite-plugin-anyrpc",
		enforce: "pre",
		async config(config) {
			rootDir = config.root ?? process.cwd();

			project = new Project({
				tsConfigFilePath: await findTsConfig(path.normalize(rootDir), path.normalize(rootDir)),
				skipAddingFilesFromTsConfig: false,
				compilerOptions: {
					moduleResolution: ModuleResolutionKind.Bundler,
					module: ModuleKind.Preserve,
				},
			});

			return {
				optimizeDeps: {
					include: ["@moheng/anyrpc/client"],
				},
				build: {
					rollupOptions: {
						output: {
							manualChunks: (id) => {
								if (filter(id)) {
									return "rpc";
								}
							}
						}
					}
				},
				ssr: {
					external: ["@moheng/anyrpc/server"],
					noExternal: ["@moheng/anyrpc/manifest"]
				},
			};
		},
		resolveId(source) {
			if (source === virtualRPCManifestModuleId) {
				return resolvedVirtualRPCManifestModuleId;
			}
		},
		configureServer(server) {
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			server.middlewares.use("/__rpc", createMiddlewares("dev", server));
		},
		async load(id, options) {
			const ssr = options?.ssr === true;

			if (id === resolvedVirtualRPCManifestModuleId) {
				const rpcModules = (
					await Array.fromAsync(glob(join(rootDir, "**", "*.rpc.ts")))
				).map((p) => path.relative(rootDir, p));

				const source = project.createSourceFile(
					join(rootDir, "manifest.js"),
					"",
					{ overwrite: true },
				);

				source.addVariableStatement({
					isExported: true,
					declarationKind: VariableDeclarationKind.Const,
					declarations: [
						{
							name: "manifest",
							initializer: `{${rpcModules.map((e) => `"${e}": import("${path.join(rootDir, e)}")`).join(",")}}`,
						},
					],
				});

				return source.getFullText();
			}
		},
		transform(code, id, options) {
			const ssr = options?.ssr === true;

			if (filter(id)) {
				const source = project.createSourceFile(id, code, { overwrite: true });
				transformRPCFile(project, source, { rootDir, ssr });
				return source.getFullText();
			}
		},
	};
}

async function findTsConfig(
	telefuncFilePath: string,
	appRootDir: string,
): Promise<string | undefined> {
	assert(await exists(telefuncFilePath));
	assertPosixPath(telefuncFilePath);
	assertPosixPath(appRootDir);
	assert(telefuncFilePath.startsWith(appRootDir));
	let curr = telefuncFilePath;
	do {
		const dir = path.dirname(curr);
		if (dir === curr) {
			return undefined;
		}
		if (!dir.startsWith(appRootDir)) {
			return undefined;
		}
		const tsConfigFilePath = path.join(dir, "tsconfig.json");
		if (await exists(tsConfigFilePath)) {
			return tsConfigFilePath;
		}
		curr = dir;

		// eslint-disable-next-line no-constant-condition
	} while (true);
}
