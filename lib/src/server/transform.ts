import { glob } from "fs/promises";
import path, { join } from "pathe";
import {
    type CallExpression,
    Node,
    type Project,
    type SourceFile,
    ts,
    type Type,
    VariableDeclaration,
} from "ts-morph";

import { createTypiaProject, transformTypia } from "./util/typia.js";

const MACRO_PATH = path.join(import.meta.dirname, "macro.d.ts");

export async function transformRPCFile(
    project: Project,
    source: SourceFile,
    option: { rootDir: string; ssr: boolean },
): Promise<void> {
    const tproject = createTypiaProject(project);
    const typeChecker = project.getTypeChecker();

    const targetDeclaration: [declaration: VariableDeclaration, name: string][] = [];

    for (const declaration of source.getVariableDeclarations()) {
        const initializer = declaration.getInitializer();
        if (Node.isCallExpression(initializer)) {
            const signature = typeChecker.getResolvedSignature(initializer);
            const signatureDeclaration = signature?.getDeclaration();

            if (Node.isFunctionDeclaration(signatureDeclaration)) {
                const declarationName = signatureDeclaration.getName();
                const declarationPath = signatureDeclaration.getSourceFile().getFilePath();

                if (declarationPath === MACRO_PATH && declarationName != undefined) {
                    if (option.ssr) {
                        if (declarationName === "createManifest") {
                            const rpcModules = (
                                await Array.fromAsync(glob(join(option.rootDir, "**", "*.rpc.ts")))
                            ).map(p => path.relative(option.rootDir, p));

                            declaration.setInitializer(`{${rpcModules.map(e => `"${e}": import("${path.join(option.rootDir, e)}")`).join(",")}}`);

                            continue;
                        }
                    }

                    targetDeclaration.push([declaration, declarationName]);
                }
            }
        }
    }

    if (targetDeclaration.length > 0) {
        if (!option.ssr) {
            source.addImportDeclaration({
                moduleSpecifier: "@anyrpc/core/client",
                namedImports: ["makeRPCFetch", "makeRPCSSEFetch"],
            });
        }

        source.addImportDeclaration({
            moduleSpecifier: "@anyrpc/core/common",
            namedImports: ["typia"]
        });
    }

    for (const [declaration, declarationName] of targetDeclaration) {
        if (declaration.isExported() === true) {
            const initializer = declaration.getInitializer() as CallExpression;

            let useMacro: string | undefined = undefined;
            let sseType: Type | undefined = undefined;
            let argsType: Type | undefined = undefined;
            let retType: Type | undefined = undefined;

            switch (declarationName) {
                case "define":
                    useMacro = option.ssr ? "define" : "makeRPCFetch";
                    argsType = initializer.getType().getAliasTypeArguments()[0];
                    retType = initializer.getType().getAliasTypeArguments()[1];
                    break;
                case "defineSSE":
                    useMacro = option.ssr ? "defineSSE" : "makeRPCSSEFetch";
                    sseType = initializer.getType().getAliasTypeArguments()[0];
                    argsType = initializer.getType().getAliasTypeArguments()[1];
                    break;
            }

            if (useMacro !== undefined) {
                const a = source
                    .getImportDeclarations().find(e => e.getModuleSpecifierValue() === "@anyrpc/core/common")
                    ?.getNamedImports().find(e => e.getName() === "typia");

                const typia = transformTypia(a!.getNameNode().compilerNode, tproject, {
                    sse: sseType,
                    args: argsType,
                    ret: retType,
                });

                initializer.transform((traversal) => {
                    const node = traversal.currentNode as ts.CallExpression;

                    return traversal.factory.createCallExpression(
                        traversal.factory.createIdentifier(useMacro),
                        [],
                        [
                            ...(option.ssr
                                ? [
                                        node.arguments[0],
                                    ]
                                : [
                                        traversal.factory.createStringLiteral(path.relative(option.rootDir, source.getFilePath())),
                                        traversal.factory.createStringLiteral(declaration.getName()),
                                    ]
                            ),
                            typia
                        ]
                    );
                });
            }
        }
    }
}
