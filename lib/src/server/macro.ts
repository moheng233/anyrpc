import * as Namespace from "typia/lib/functional/Namespace/index.js";

import type { SSEMessage } from "../common/sse.js";
import type {
	DefineOption,
	DefineSSEOption,
	RPCFunction,
	RPCSSEFunction,
} from "../common/types.js";
import { SSEMessageEmit } from "./util/sse.js";

export type Parameters<
	F extends (...args: never[]) => Promise<object | void>,
> = F extends (...args: infer P) => Promise<object | void> ? P : never;

export type AsyncReturnType<
	F extends (...args: never[]) => Promise<object | void>
> = F extends (...args: never[]) => Promise<infer R> ? R : void;

function define<F extends (...args: never[]) => Promise<object | void>>(
	fun: F,
	option?: DefineOption<Parameters<F>, AsyncReturnType<F>>,
): RPCFunction<Parameters<F>, AsyncReturnType<F>> {
	return Object.assign(
		(...args: Parameters<F>) => fun(...args) as Promise<AsyncReturnType<F>>,
		{
			option,
		},
	);
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const definePure = Object.assign<typeof define, {}, {}>(
	define,
	Namespace.json.stringify("define"),
	Namespace.assert("define"),
);
export { definePure as define };

export type SSEParameters<
	F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
> = F extends (ev: SSEMessageEmit<unknown>, ...args: infer P) => Promise<void> ? P : never;

export type SSEExtract<
	F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>
> = F extends (ev: SSEMessageEmit<infer S>, ...args: infer P) => Promise<void> ? S : never;

function defineSSE<
	F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
>(
	fun: F,
	option?: DefineSSEOption<SSEExtract<F>, SSEParameters<F>>,
): RPCSSEFunction<SSEExtract<F>, SSEParameters<F>> {
	return Object.assign(
		async (...args: SSEParameters<F>) => {
			const transform = new TransformStream<SSEMessage<SSEExtract<F>>, SSEMessage<SSEExtract<F>>>();

			await fun(new SSEMessageEmit(transform.writable), ...args);

			return transform.readable;
		},
		{
			option,
		},
	);
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const defineSSEPure = Object.assign<typeof defineSSE, {}, {}>(
	defineSSE,
	Namespace.json.stringify("defineSSE"),
	Namespace.assert("defineSSE"),
);
export { defineSSEPure as defineSSE };
