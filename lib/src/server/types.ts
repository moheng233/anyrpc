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
    include: (id: string | undefined) => boolean;
}

export interface AnyRPCViteOption extends AnyRPCBaseOption {
    /**
     * Start AnyRPCMiddlewares in vite's DevServer
     * @default false
     */
    enableDevMiddlewares: boolean;
}

export interface AnyRPCPlugin {
    name: string;

    preCall(): PromiseLike<void>;
    postCall(): PromiseLike<void>;
}

export interface AnyRPCMiddlewaresOption extends AnyRPCBaseOption {
    /**
     * Remove the fixed prefix for incoming requests
     * @default "/__rpc"
     */
    withoutBaseUrl: string;
    plugins: AnyRPCPlugin[];
}

export const REQUEST_SYMBOL: unique symbol = Symbol("request");
export const RESPONSE_SYMBOL: unique symbol = Symbol("response");

export interface Context {
    [REQUEST_SYMBOL]: Connect.IncomingMessage;
    [RESPONSE_SYMBOL]: ServerResponse<IncomingMessage>;
}
