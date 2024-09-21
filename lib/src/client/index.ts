import { ofetch } from "ofetch";
import { resolveURL, stringifyQuery } from "ufo";

import type { RPCFunction, RPCSSEFunction } from "../common/types";
import { createSSETransformStream } from "./sse";

export function rpc<P, R>(path: string, method: string): RPCFunction<P, R> {
	return async (args) => {
		return ofetch<R>(resolveURL("/__rpc", `${path}@${method}`), {
			method: "POST",
            responseType: "json",
			body: JSON.stringify(args),
		});
	};
}

export function rpcSSE<S extends {}, P>(
	path: string,
	method: string,
): RPCSSEFunction<S, P> {
	return async (args) => {
		const stream = await ofetch(resolveURL("/__rpc", `${path}@${method}`), {
			method: "POST",
			responseType: "stream",
			body: JSON.stringify(args),
		});

		return stream.pipeThrough(createSSETransformStream<S>());
	};
}
