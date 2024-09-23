import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";

import type { SSEMessageEmit } from "../common/sse.js";

import { RPCModule } from "../common/types.js";

export type RPCManifest = Record<string, Promise<RPCModule>>;

export type RPCSSEDefineFunction<S, P> = (
    sse: SSEMessageEmit<S>,
    args: P,
) => Promise<void>;

declare module "@moheng/anyrpc/server" {
    interface Context {
        request: Connect.IncomingMessage;
        response: ServerResponse<IncomingMessage>;
    }
}
