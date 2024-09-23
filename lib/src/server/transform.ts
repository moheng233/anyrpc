import path from "pathe";
import {
	type CallExpression,
	Node,
	type Project,
	type SourceFile,
	type Type,
	VariableDeclaration,
	VariableDeclarationKind,
} from "ts-morph";

import { createTypiaProject, transformTypia } from "./util/typia.js";

export function transformRPCFile(
	project: Project,
	source: SourceFile,
	option: { rootDir: string; ssr: boolean },
) {
	const typeChecker = project.getTypeChecker();

	source.addImportDeclaration({
		moduleSpecifier: "@moheng/anyrpc/client",
		namedImports: ["rpc", "rpcSSE"],
	});

	const methods: VariableDeclaration[] = [];

	for (const [name, exported] of source.getExportedDeclarations()) {
		for (const declaration of exported) {
			if (Node.isVariableDeclaration(declaration)) {
				let initializer = declaration.getInitializer();
				if (Node.isCallExpression(initializer)) {
					const signature = typeChecker.getResolvedSignature(initializer);
					const signatureDeclaration = signature?.getDeclaration();

					if (Node.isFunctionDeclaration(signatureDeclaration)) {
						const declarationName = signatureDeclaration.getName();
						const declarationPath = signatureDeclaration.getSourceFile().getFilePath();

						if (declarationPath !== undefined) {
							if (
								declarationPath.includes(
									path.join("anyrpc", "lib", "dist", "server", "macro.d.ts"),
								)
							) {
								methods.push(declaration);

								let useMacro: string | undefined = undefined;
								let sseType: Type | undefined = undefined;
								let argsType: Type | undefined = undefined;
								let retType: Type | undefined = undefined;

								switch (declarationName) {
									case "define":
										useMacro = "rpc";
										argsType = initializer.getType().getAliasTypeArguments()[0];
										retType = initializer.getType().getAliasTypeArguments()[1];
										break;
									case "defineSSE":
										useMacro = "rpcSSE";
										sseType = initializer.getType().getAliasTypeArguments()[0];
										argsType = initializer.getType().getAliasTypeArguments()[1];
										break;
								}

								if (!option.ssr) {
									if (useMacro !== undefined) {
										declaration.setInitializer(
											`${useMacro}("${path.relative(option.rootDir, source.getFilePath())}", "${name}")`,
										);
										initializer = declaration.getInitializer() as CallExpression;
									}
								}

								const tproject = createTypiaProject(project);
								transformTypia(initializer as CallExpression, tproject, {
									sse: sseType,
									args: argsType,
									ret: retType,
								});
							}
						}
					}
				}
			}
		}
	}

	source.addVariableStatement({
		isExported: true,
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			{
				name: "methods",
				initializer: `{${methods.map((e) => `"${e.getName()}": ${e.getName()}`).join(",")}}`,
			},
		]
	});
}
