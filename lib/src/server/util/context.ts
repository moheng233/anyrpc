import type { Context } from "@moheng/anyrpc/server";

import { AsyncLocalStorage } from "node:async_hooks";
import { createContext } from "unctx";

export const context = createContext<Context>({
	asyncContext: true,
	AsyncLocalStorage
});

export const useContext = context.use;
