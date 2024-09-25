import { createValidateParse, createValidateStringify } from "typia/lib/json.js";

import type { SSEMessage, SSEMessageEmit } from "../common/sse.js";

export type RPCModule = Record<string, RPCFunctionWithHelper | RPCSSEFunctionWithHelper>;

export type RPCDefineFunction = (...args: never[]) => Promise<object | void>;
export type RPCSSEDefineFunction = (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>;

export type Parameters<
    F extends RPCDefineFunction,
> = F extends (...args: infer P) => Promise<infer R> ? P : never;

export type AsyncReturnType<
    F extends RPCDefineFunction
> = F extends (...args: infer P) => Promise<infer R> ? R : void;

export type SSEParameters<
    F extends RPCSSEDefineFunction,
> = F extends (ev: SSEMessageEmit<infer S>, ...args: infer P) => Promise<void> ? P : never;

export type SSEExtract<
    F extends RPCSSEDefineFunction
> = F extends (ev: SSEMessageEmit<infer S>, ...args: infer P) => Promise<void> ? S : never;

export type RPCFunction<P extends unknown[] = [], R extends object | void = void> = ((...args: P) => Promise<R>);
export type RPCSSEFunction<S = Record<string, never>, P extends unknown[] = []> = ((...args: P) => Promise<ReadableStream<SSEMessage<S>>>);

export type RPCFunctionWithHelper<P extends unknown[] = [], R extends object | void = void> = { helper: DefineHelper<P, R> } & RPCFunction<P, R>;
export type RPCSSEFunctionWithHelper<S = Record<string, never>, P extends unknown[] = []> = { helper: DefineSSEHelper<S, P> } & RPCSSEFunction<S, P>;

export type DefineHelper<P extends unknown[] = [], R = void> = {
    argsStringify: ReturnType<typeof createValidateStringify<P>>;
    argsPaser: ReturnType<typeof createValidateParse<P>>;

    returnStringify: ReturnType<typeof createValidateStringify<R>>;
    returnPaser: ReturnType<typeof createValidateParse<R>>;
};

export type DefineSSEHelper<S = Record<string, never>, P extends unknown[] = []> = {
    sseStringify: ReturnType<typeof createValidateStringify<S>>;
    ssePaser: ReturnType<typeof createValidateParse<S>>;
} & Omit<DefineHelper<P, void>, "returnPaser" | "returnStringify">;
