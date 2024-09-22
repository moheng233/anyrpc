import type { SSEMessage } from "../common/sse.js";

export type RPCModule = Record<string, RPCFunction | RPCSSEFunction>;

export type RPCFunction<P = {}, R = {}> = ((args: P) => Promise<R>) & {
	option?: DefineOption<P, R>;
};
export type RPCSSEFunction<S extends {} = object, P = {}> = ((
	args: P,
) => Promise<ReadableStream<SSEMessage<S>>>) & {
	option?: DefineSSEOption<S, P>;
};

export type DefineOption<P, R> = {
	argsStringify: (args: P) => string;
	argsPaser: (json: string) => P;

	returnStringify: (args: R) => string;
	returnPaser: (json: string) => R;
};

export type DefineSSEOption<S, P> = Omit<
	DefineOption<P, void>,
	"returnStringify" | "returnPaser"
> & {
	sseStringify: (args: S) => string;
	ssePaser: (json: string) => S;
};
