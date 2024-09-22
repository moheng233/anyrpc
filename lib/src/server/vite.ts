import assert from "node:assert";
import { glob } from "node:fs/promises";
import path, { join, resolve } from "pathe";

import {
	type CallExpression,
	ModuleKind,
	ModuleResolutionKind,
	Node,
	Project,
	type Type,
	VariableDeclarationKind,
} from "ts-morph";
import { type Plugin, createFilter } from "vite";

import { assertPosixPath } from "../common/assert.js";
import { exists } from "../common/fs.js";
import { createMiddlewares } from "./middlewares.js";
import { transformRPCFile } from "./transform.js";

const filter = createFilter("**/*.rpc.ts");

const virtualRPCManifestModuleId = "virtual:anyrpc/manifest.js";
const resolvedVirtualRPCManifestModuleId = `\0${virtualRPCManifestModuleId}`;

export default function anyrpc(): Plugin {
	let rootDir: string;
	let project: Project;

	return {
		name: "vite-plugin-anyrpc",
		enforce: "pre",
		async config(config, env) {
			rootDir = config.root ?? process.cwd();

			project = new Project({
				tsConfigFilePath: await findTsConfig(rootDir, rootDir),
				skipAddingFilesFromTsConfig: false,
				compilerOptions: {
					moduleResolution: ModuleResolutionKind.Bundler,
					module: ModuleKind.Preserve,
				},
			});

			return {
				optimizeDeps: {
					include: ["anyrpc/client", "anyrpc/server"],
				},
				ssr: {
					external: ["anyrpc"],
				},
				build: {
					rollupOptions: {
						input: config.build?.ssr
							? await Array.fromAsync(glob(join(rootDir, "**", "*.rpc.ts")))
							: undefined,
					},
				},
			};
		},
		resolveId(source, importer, options) {
			if (source === virtualRPCManifestModuleId) {
				return resolvedVirtualRPCManifestModuleId;
			}
		},
		async configurePreviewServer(server) {
			server.middlewares.use(
				"/__rpc",
				createMiddlewares("preview", server.config.root),
			);
		},
		async configureServer(server) {
			server.middlewares.use("/__rpc", createMiddlewares("dev", server));
		},
		async load(id, options) {
			const ssr = options?.ssr === true;

			if (id === resolvedVirtualRPCManifestModuleId) {
				const rpcModules = (await Array.fromAsync(glob(join(rootDir, "**", "*.rpc.ts")))).map(p => path.relative(rootDir, p));

				const source = project.createSourceFile(join(rootDir, "manifest.js"), "", { overwrite: true });

				source.addVariableStatement({
					isExported: true,
					declarationKind: VariableDeclarationKind.Const,
					declarations: [
						{
							name: "manifest",
							initializer: `{${rpcModules.map(e => `"${e}": import("../${e}"),`)}}`
						}
					]
				});

				return source.getFullText();
			}
		},
		async transform(code, id, options) {
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
		// biome-ignore lint/correctness/noConstantCondition: <explanation>
	} while (true);
}
