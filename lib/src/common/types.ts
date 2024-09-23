import type { SSEMessage } from "../common/sse.js";

export type RPCModule = Record<string, RPCFunction | RPCSSEFunction>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RPCFunction<P extends any[] = [], R extends object | void = void> = ((...args: P) => Promise<R>) & {
	option?: DefineOption<P, R>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RPCSSEFunction<S = Record<string, never>, P extends any[] = []> = ((
	...args: P
) => Promise<ReadableStream<SSEMessage<S>>>) & {
	option?: DefineSSEOption<S, P>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefineOption<P extends any[] = [], R = void> = {
	argsStringify: (args: P) => string;
	argsPaser: (json: string) => P;

	returnStringify: (args: R) => string;
	returnPaser: (json: string) => R;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefineSSEOption<S = Record<string, never>, P extends any[] = []> = Omit<
	DefineOption<P, void>,
	"returnStringify" | "returnPaser"
> & {
	sseStringify: (args: S) => string;
	ssePaser: (json: string) => S;
};
