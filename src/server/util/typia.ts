import type { Project, Type } from "ts-morph";
import type { IProject } from "typia/lib/transformers/IProject.js";

import ts from "typescript";
import { JsonValidateParseProgrammer } from "typia/lib/programmers/json/JsonValidateParseProgrammer.js";
import { JsonValidateStringifyProgrammer } from "typia/lib/programmers/json/JsonValidateStringifyProgrammer.js";

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
    return JsonValidateStringifyProgrammer.write(tproject)(expression)(
        type.compilerType as ts.Type,
    );
}

function createTypiaPaser(
    tproject: IProject,
    expression: ts.LeftHandSideExpression,
    type: Type,
) {
    return JsonValidateParseProgrammer.write(tproject)(expression)(
        type.compilerType as ts.Type,
    );
}

export function transformTypia(
    typia: ts.LeftHandSideExpression,
    tproject: IProject,
    types: {
        args?: Type;
        ret?: Type;
        sse?: Type;
    },
): ts.ObjectLiteralExpression {
    return ts.factory.createObjectLiteralExpression(
        [
            ...(types.sse !== undefined
                ? [
                        ts.factory.createPropertyAssignment(
                            "sseStringify",
                            createTypiaStringify(tproject, typia, types.sse),
                        ),
                        ts.factory.createPropertyAssignment(
                            "ssePaser",
                            createTypiaPaser(tproject, typia, types.sse),
                        ),
                    ]
                : []),
            ...(types.args !== undefined
                ? [
                        ts.factory.createPropertyAssignment(
                            "argsStringify",
                            createTypiaStringify(tproject, typia, types.args),
                        ),
                        ts.factory.createPropertyAssignment(
                            "argsPaser",
                            createTypiaPaser(tproject, typia, types.args),
                        ),
                    ]
                : []),
            ...(types.ret !== undefined
                ? [
                        ts.factory.createPropertyAssignment(
                            "returnStringify",
                            createTypiaStringify(tproject, typia, types.ret),
                        ),
                        ts.factory.createPropertyAssignment(
                            "returnPaser",
                            createTypiaPaser(tproject, typia, types.ret),
                        ),
                    ]
                : []),
        ],
        true,
    );
}
