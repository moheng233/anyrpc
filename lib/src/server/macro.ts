import * as Namespace from "typia/lib/functional/Namespace/index.js";

import type {
	DefineOption,
	DefineSSEOption,
	RPCFunction,
	RPCSSEFunction,
} from "../common/types.js";
import type { RPCSSEDefineFunction } from "./types.js";
import { SSEMessageEmit } from "./util/sse.js";

function define<P, R>(
	fun: RPCFunction<P, R>,
	option?: DefineOption<P, R>,
): RPCFunction<P, R> {
	return Object.assign(fun, {
		option,
	});
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
const definePure = Object.assign<typeof define, {}, {}>(
	define,
	Namespace.json.stringify("define"),
	Namespace.assert("define")
);
export { definePure as define };

function defineSSE<S extends {}, P>(
	fun: RPCSSEDefineFunction<S, P>,
	option?: DefineSSEOption<S, P>,
): RPCSSEFunction<S, P> {
	return Object.assign(
		async (args: P) => {
			const transform = new TransformStream();

			fun(new SSEMessageEmit(transform.writable), args);

			return transform.readable;
		},
		{
			option,
		},
	);
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
const defineSSEPure = Object.assign<typeof defineSSE, {}, {}>(
	defineSSE,
	Namespace.json.stringify("defineSSE"),
	Namespace.assert("defineSSE")
);
export { defineSSEPure as defineSSE };
