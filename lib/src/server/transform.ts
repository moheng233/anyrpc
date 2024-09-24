import { glob } from "fs/promises";
import path, { join } from "pathe";
import {
    type CallExpression,
    Node,
    type Project,
    type SourceFile,
    type Type,
    VariableDeclaration,
} from "ts-morph";

import { createTypiaProject, transformTypia } from "./util/typia.js";

const INDEX_PATH = path.join(import.meta.dirname, "index.d.ts");
const MACRO_PATH = path.join(import.meta.dirname, "macro.d.ts");

export async function transformRPCFile(
    project: Project,
    source: SourceFile,
    option: { rootDir: string; ssr: boolean },
): Promise<void> {
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
                    targetDeclaration.push([declaration, declarationName]);
                }
            }
        }
    }

    if (!option.ssr) {
        source.addImportDeclaration({
            moduleSpecifier: "@anyrpc/core/client",
            namedImports: ["rpc", "rpcSSE"],
        });
    }

    for (const [declaration, declarationName] of targetDeclaration) {
        if (option.ssr) {
            if (declarationName === "createManifest") {
                const rpcModules = (
                    await Array.fromAsync(glob(join(option.rootDir, "**", "*.rpc.ts")))
                ).map(p => path.relative(option.rootDir, p));

                declaration.setInitializer(`{${rpcModules.map(e => `"${e}": import("${path.join(option.rootDir, e)}")`).join(",")}}`);

                continue;
            }
        }

        if (declaration.isExported() === true) {
            let initializer = declaration.getInitializer()!;

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
                        `${useMacro}("${path.relative(option.rootDir, source.getFilePath())}", "${declaration.getName()}")`,
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
