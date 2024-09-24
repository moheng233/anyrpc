import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";

import type { SSEMessageEmit } from "../common/sse.js";

import { RPCModule } from "../common/types.js";

export type RPCManifest = Record<string, Promise<RPCModule>>;

export type RPCSSEDefineFunction<S, P> = (
    sse: SSEMessageEmit<S>,
    args: P,
) => Promise<void>;

export interface AnyRPCBaseOption {
    include?: (id: string | undefined) => boolean;
}

export interface AnyRPCViteOption extends AnyRPCBaseOption {
    /**
     * Start AnyRPCMiddlewares in vite's DevServer
     * @default false
     */
    enableDevMiddlewares?: boolean;
}

export interface AnyRPCMiddlewaresOption extends AnyRPCBaseOption {
    /**
     * Remove the fixed prefix for incoming requests
     * @default "/__rpc"
     */
    withoutBaseUrl?: string;
}

export interface Context {
    request: Connect.IncomingMessage;
    response: ServerResponse<IncomingMessage>;
}
