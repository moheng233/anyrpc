import assert from "node:assert";
import { glob } from "node:fs/promises";
import path, { join } from "node:path";

import { ModuleKind, ModuleResolutionKind, Node, Project } from "ts-morph";
import { type Plugin, createFilter } from "vite";

import { assertPosixPath } from "../common/assert.js";
import { exists } from "../common/fs.js";
import { createMiddlewares } from "./middlewares.js";

const filter = createFilter("**/*.rpc.ts");

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
		async configurePreviewServer(server) {
			server.middlewares.use("/__rpc", createMiddlewares("preview", server.config.root));
		},
		async configureServer(server) {
			server.middlewares.use("/__rpc", createMiddlewares("dev", server));
		},
		async transform(code, id, options) {
			const isServer = options?.ssr === true;

			if (!filter(id)) {
				return;
			}

			const typeChecker = project.getTypeChecker();

			const source = project.createSourceFile(id, code, { overwrite: true });

			source.addImportDeclaration({
				moduleSpecifier: "anyrpc/client",
				namedImports: ["rpc", "rpcSSE"],
			});

			for (const [name, exported] of source.getExportedDeclarations()) {
				for (const declaration of exported) {
					if (Node.isVariableDeclaration(declaration)) {
						const initializer = declaration.getInitializer();
						if (Node.isCallExpression(initializer)) {
							const signature = typeChecker.getResolvedSignature(initializer);
							const signatureDeclaration = signature?.getDeclaration();

							if (Node.isFunctionDeclaration(signatureDeclaration)) {
								const declarationName = signatureDeclaration.getName();
								const declarationPath = signatureDeclaration
									.getSourceFile()
									.getFilePath();

								if (declarationPath !== undefined) {
									if (
										declarationPath.includes(
											path.join(
												"anyrpc",
												"lib",
												"dist",
												"server",
												"macro.d.ts",
											),
										)
									) {
										if (!isServer) {
											let useMacro: string | undefined = undefined;

											switch (declarationName) {
												case "define":
													useMacro = "rpc";
													break;
												case "defineSSE":
													useMacro = "rpcSSE";
													break;
											}

											if (useMacro !== undefined) {
												declaration.setInitializer(
													`${useMacro}("${path.relative(rootDir, id)}", "${name}")`,
												);
											}
										}
									}
								}
							}
						}
					}
				}
			}

			return source.getText(true);
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
