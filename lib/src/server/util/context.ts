import { AsyncLocalStorage } from "node:async_hooks";
import { ServerResponse } from "node:http";
import { createContext, type UseContext } from "unctx";
import { Connect } from "vite";

import { Context, REQUEST_SYMBOL, RESPONSE_SYMBOL } from "../types.js";

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
