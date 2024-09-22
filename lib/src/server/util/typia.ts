import type { CallExpression, Project, Type } from "ts-morph";
import ts from "typescript";
import type { IProject } from "typia/lib/transformers/IProject.js";
import { FunctionImporter } from "typia/lib/programmers/helpers/FunctionImporter.js";
import { JsonAssertStringifyProgrammer } from "typia/lib/programmers/json/JsonAssertStringifyProgrammer.js";
import { JsonAssertParseProgrammer } from "typia/lib/programmers/json/JsonAssertParseProgrammer.js";

export function createTypiaProject(project: Project): IProject {
	const program = project.getProgram().compilerObject as ts.Program;
	const printer = ts.createPrinter();
	return {
		program,
		compilerOptions: project.getCompilerOptions(),
		checker: program.getTypeChecker(),
		printer,
		options: {},
		context: {} as ts.TransformationContext,
		extras: {
			addDiagnostic(diag: ts.Diagnostic) {
				return 0;
			},
		},
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
		sse?: Type;
		args?: Type;
		ret?: Type;
	},
) {
	initializer.transform((traversal) => {
		const node = traversal.currentNode as ts.CallExpression;
		const importer = new FunctionImporter("test");

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
