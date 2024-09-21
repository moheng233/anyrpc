import type { SSEMessageEmit } from "./util/sse.js";

export type RPCSSEDefineFunction<S extends {}, P> = (
	sse: SSEMessageEmit<S>,
	args: P,
) => Promise<void>;
