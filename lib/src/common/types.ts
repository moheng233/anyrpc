import type { SSEMessage } from "../common/sse.js";

export type RPCFunction<P, R> = (args: P) => Promise<R>;
export type RPCSSEFunction<S extends {}, P> = (
	args: P,
) => Promise<ReadableStream<SSEMessage<S>>>;
