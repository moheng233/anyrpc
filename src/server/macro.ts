import { assert } from "console";

import type { SSEMessage } from "../common/sse.js";
import type {
    AsyncReturnType,
    DefineHelper,
    DefineSSEHelper,
    RPCFunction,
    RPCSSEFunction,
    SSEExtract,
    SSEParameters,
} from "../common/types.js";
import type { RPCManifest } from "./types.js";

import { SSEMessageEmit } from "../common/sse.js";

export function define<F extends (...args: never[]) => Promise<object | void>>(
    fun: F,
    helper?: DefineHelper<Parameters<F>, AsyncReturnType<F>>,
): RPCFunction<Parameters<F>, AsyncReturnType<F>> {
    assert(helper !== undefined);

    return Object.assign(
        (...args: Parameters<F>) => {
            return fun(...args) as Promise<AsyncReturnType<F>>;
        },
        {
            helper,
        },
    );
}

export function defineSSE<
    F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
>(
    fun: F,
    helper?: DefineSSEHelper<SSEExtract<F>, SSEParameters<F>>,
): RPCSSEFunction<SSEExtract<F>, SSEParameters<F>> {
    assert(helper !== undefined);

    return Object.assign(
        async (...args: SSEParameters<F>) => {
            const transform = new TransformStream<SSEMessage<SSEExtract<F>>, SSEMessage<SSEExtract<F>>>();

            await fun(new SSEMessageEmit(transform.writable), ...args);

            return transform.readable;
        },
        {
            helper,
        },
    );
}

export function createManifest(): RPCManifest {
    assert(true);

    return {};
}
