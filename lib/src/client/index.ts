import { ofetch } from "ofetch";
import { resolveURL } from "ufo";
import * as Namespace from "typia/lib/functional/Namespace";

import type {
	DefineOption,
	DefineSSEOption,
	RPCFunction,
	RPCSSEFunction,
} from "../common/types";
import { createSSETransformStream } from "./sse";

function rpc<P extends [] = [], R extends {} = Record<string, never>>(
	path: string,
	method: string,
	option?: DefineOption<P, R>,
): RPCFunction<P, R> {
	return Object.assign(
		async (...args: P) => {
			return ofetch<R>(resolveURL("/__rpc", `${path}@${method}`), {
				method: "POST",
				responseType: "json",
				body:
					option !== undefined
						? option.argsStringify(args)
						: JSON.stringify(args),
				parseResponse(responseText) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return option !== undefined
						? option.returnPaser(responseText)
						: JSON.parse(responseText);
				},
			});
		},
		{
			option: option,
		},
	);
}

const rpcPure = Object.assign(rpc, Namespace.json.stringify("rpc"), Namespace.assert("rpc"));
export { rpcPure as rpc };

function rpcSSE<S extends {} = Record<string, never>, P extends [] = []>(
	path: string,
	method: string,
	option?: DefineSSEOption<S, P>,
): RPCSSEFunction<S, P> {
	return Object.assign(
		async (...args: P) => {
			const stream = await ofetch(resolveURL("/__rpc", `${path}@${method}`), {
				method: "POST",
				responseType: "stream",
				body:
					option !== undefined
						? option.argsStringify(args)
						: JSON.stringify(args),
			});

			return stream.pipeThrough(createSSETransformStream<S>(option?.ssePaser));
		},
		{
			option: option,
		},
	);
}

const rpcSSEPure = Object.assign(rpcSSE, Namespace.json.stringify("rpcSSE"), Namespace.assert("rpcSSE"));
export { rpcSSEPure as rpcSSE };
