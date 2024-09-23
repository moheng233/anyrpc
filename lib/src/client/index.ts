import { ofetch } from "ofetch";
import * as Namespace from "typia/lib/functional/Namespace";
import { resolveURL } from "ufo";

import type {
    AsyncReturnType,
    DefineOption,
    DefineSSEOption,
    RPCFunction,
    RPCSSEFunction,
    SSEExtract,
    SSEParameters,
} from "../common/types";

import { SSEMessageEmit } from "../common/sse";
import { createSSETransformStream } from "./sse";

function rpc<F extends (...args: never[]) => Promise<object | void>>(
    path: string,
    method: string,
    option?: DefineOption<Parameters<F>, AsyncReturnType<F>>,
): RPCFunction<Parameters<F>, AsyncReturnType<F>> {
    return Object.assign(
        async (...args: Parameters<F>) => {
            return ofetch<AsyncReturnType<F>>(resolveURL("/__rpc", `${path}@${method}`), {
                method: "POST",
                responseType: "json",
                body:
                    option !== undefined
                        ? option.argsStringify(args)
                        : JSON.stringify(args),
                parseResponse(responseText) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return option !== undefined
                        ? option.returnPaser(responseText)
                        : JSON.parse(responseText);
                },
            });
        },
        {
            option: option,
        },
    );
}

const rpcPure = Object.assign(rpc, Namespace.json.stringify("rpc"), Namespace.assert("rpc"));
export { rpcPure as rpc };

function rpcSSE<
    F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
>(
    path: string,
    method: string,
    option?: DefineSSEOption<SSEExtract<F>, SSEParameters<F>>,
): RPCSSEFunction<SSEExtract<F>, SSEParameters<F>> {
    return Object.assign(
        async (...args: SSEParameters<F>) => {
            const stream = await ofetch(resolveURL("/__rpc", `${path}@${method}`), {
                method: "POST",
                responseType: "stream",
                body:
                    option !== undefined
                        ? option.argsStringify(args)
                        : JSON.stringify(args),
            });

            return stream.pipeThrough(createSSETransformStream<SSEExtract<F>>(option?.ssePaser));
        },
        {
            option: option,
        },
    );
}

const rpcSSEPure = Object.assign(rpcSSE, Namespace.json.stringify("rpcSSE"), Namespace.assert("rpcSSE"));
export { rpcSSEPure as rpcSSE };
