import { AsyncLocalStorage } from "node:async_hooks";
import { createContext, type UseContext } from "unctx";

import { Context } from "../types.js";

export const context: UseContext<Context> = createContext<Context>({
    asyncContext: true,
    AsyncLocalStorage
});

/**
 * @group hook
 */
export const useContext: () => Context = context.use;
