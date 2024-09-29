import type { UseContext } from "unctx";
import type { Connect } from "vite";

import { AsyncLocalStorage } from "node:async_hooks";
import { ServerResponse } from "node:http";
import { createContext } from "unctx";

import type { Context, ContextKey } from "../types.js";

import { OBJECTS_SYMBOL, REQUEST_SYMBOL, RESPONSE_SYMBOL } from "../types.js";

export const context: UseContext<Context> = createContext<Context>({
    asyncContext: true,
    AsyncLocalStorage
});

/**
 * @group hook
 */
export const useContext: () => Context = context.use;

export function useRaw(): {
    request: Connect.IncomingMessage;
    response: ServerResponse<Connect.IncomingMessage>;
} {
    const context = useContext();

    return {
        request: context[REQUEST_SYMBOL],
        response: context[RESPONSE_SYMBOL]
    };
}

export function provide<C extends object>(key: ContextKey<C>, instance: C): void {
    const context = useContext();

    context[OBJECTS_SYMBOL].set(key, instance);
}

export function inject<C extends object>(key: ContextKey<C>, defaultValue?: C): C | undefined {
    const context = useContext();

    return (context[OBJECTS_SYMBOL].get(key) as C | undefined) ?? defaultValue;
}
