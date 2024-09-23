import type { SSEMessage, SSEMessageEmit } from "../common/sse.js";

export type RPCModule = Record<string, RPCFunction | RPCSSEFunction>;

export type Parameters<
    F extends (...args: never[]) => Promise<object | void>,
> = F extends (...args: infer P) => Promise<object | void> ? P : never;

export type AsyncReturnType<
    F extends (...args: never[]) => Promise<object | void>
> = F extends (...args: never[]) => Promise<infer R> ? R : void;

export type SSEParameters<
    F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
> = F extends (ev: SSEMessageEmit<unknown>, ...args: infer P) => Promise<void> ? P : never;

export type SSEExtract<
    F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>
> = F extends (ev: SSEMessageEmit<infer S>, ...args: infer P) => Promise<void> ? S : never;

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
export type DefineSSEOption<S = Record<string, never>, P extends any[] = []> = {
    sseStringify: (args: S) => string;
    ssePaser: (json: string) => S;
} & Omit<DefineOption<P, void>, "returnPaser" | "returnStringify">;
