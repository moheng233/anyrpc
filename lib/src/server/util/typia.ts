import type { CallExpression, Project, Type } from "ts-morph";
import type { IProject } from "typia/lib/transformers/IProject.js";

import ts from "typescript";
import { JsonAssertParseProgrammer } from "typia/lib/programmers/json/JsonAssertParseProgrammer.js";
import { JsonAssertStringifyProgrammer } from "typia/lib/programmers/json/JsonAssertStringifyProgrammer.js";

export function createTypiaProject(project: Project): IProject {
    const program = project.getProgram().compilerObject as ts.Program;
    const printer = ts.createPrinter();
    return {
        checker: program.getTypeChecker(),
        compilerOptions: project.getCompilerOptions(),
        context: {} as ts.TransformationContext,
        extras: {
            addDiagnostic(diag: ts.Diagnostic) {
                return 0;
            },
        },
        options: {},
        printer,
        program,
    };
}

function createTypiaStringify(
    tproject: IProject,
    expression: ts.LeftHandSideExpression,
    type: Type,
) {
    return JsonAssertStringifyProgrammer.write(tproject)(expression)(
        type.compilerType as ts.Type,
    );
}

function createTypiaPaser(
    tproject: IProject,
    expression: ts.LeftHandSideExpression,
    type: Type,
) {
    return JsonAssertParseProgrammer.write(tproject)(expression)(
        type.compilerType as ts.Type,
    );
}

export function transformTypia(
    initializer: CallExpression,
    tproject: IProject,
    types: {
        args?: Type;
        ret?: Type;
        sse?: Type;
    },
): void {
    initializer.transform((traversal) => {
        const node = traversal.currentNode as ts.CallExpression;

        return traversal.factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            [
                ...node.arguments,
                traversal.factory.createObjectLiteralExpression(
                    [
                        ...(types.sse !== undefined
                            ? [
                                    traversal.factory.createPropertyAssignment(
                                        "sseStringify",
                                        createTypiaStringify(tproject, node.expression, types.sse),
                                    ),
                                    traversal.factory.createPropertyAssignment(
                                        "ssePaser",
                                        createTypiaPaser(tproject, node.expression, types.sse),
                                    ),
                                ]
                            : []),
                        ...(types.args !== undefined
                            ? [
                                    traversal.factory.createPropertyAssignment(
                                        "argsStringify",
                                        createTypiaStringify(tproject, node.expression, types.args),
                                    ),
                                    traversal.factory.createPropertyAssignment(
                                        "argsPaser",
                                        createTypiaPaser(tproject, node.expression, types.args),
                                    ),
                                ]
                            : []),
                        ...(types.ret !== undefined
                            ? [
                                    traversal.factory.createPropertyAssignment(
                                        "retStringify",
                                        createTypiaStringify(tproject, node.expression, types.ret),
                                    ),
                                    traversal.factory.createPropertyAssignment(
                                        "retPaser",
                                        createTypiaPaser(tproject, node.expression, types.ret),
                                    ),
                                ]
                            : []),
                    ],
                    true,
                ),
            ],
        );
    });
}
