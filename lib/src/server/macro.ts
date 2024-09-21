import type { RPCFunction, RPCSSEFunction } from "../common/types.js";
import type { RPCSSEDefineFunction } from "./types.js";
import { SSEMessageEmit } from "./util/sse.js";

export function define<P, R>(fun: RPCFunction<P, R>): RPCFunction<P, R> {
	return fun;
}

export function defineSSE<S extends {}, P>(
	fun: RPCSSEDefineFunction<S, P>,
): RPCSSEFunction<S, P> {
	return async (args) => {
		const transform = new TransformStream();

		fun(new SSEMessageEmit(transform.writable), args);

		return transform.readable;
	};
}
