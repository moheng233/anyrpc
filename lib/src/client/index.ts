import { ofetch } from "ofetch";
import * as Namespace from "typia/lib/functional/Namespace";
import { resolveURL, withQuery } from "ufo";

import type { SSEMessageEmit } from "../common/sse";
import type {
    AsyncReturnType,
    DefineOption,
    DefineSSEOption,
    RPCFunction,
    RPCSSEFunction,
    SSEExtract,
    SSEParameters,
} from "../common/types";

import { createSSETransformStream } from "./sse";

export const rpc: <F extends (...args: never[]) => Promise<object | void>>(path: string, method: string, option?: DefineOption<Parameters<F>, AsyncReturnType<F>>) => RPCFunction<Parameters<F>, AsyncReturnType<F>>
    = Object.assign(function rpc<F extends (...args: never[]) => Promise<object | void>>(
        path: string,
        method: string,
        option?: DefineOption<Parameters<F>, AsyncReturnType<F>>,
    ): RPCFunction<Parameters<F>, AsyncReturnType<F>> {
        return Object.assign(
            async (...args: Parameters<F>) => {
                return ofetch<AsyncReturnType<F>>(withQuery(resolveURL("/__rpc", `${path}`), { method }), {
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
    }, Namespace.json.stringify("rpc") as unknown, Namespace.assert("rpc") as unknown);

export const rpcSSE: <F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>>(path: string, method: string, option?: DefineSSEOption<SSEExtract<F>, SSEParameters<F>>) => RPCSSEFunction<SSEExtract<F>, SSEParameters<F>>
    = Object.assign(function rpcSSE<
        F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
    >(
        path: string,
        method: string,
        option?: DefineSSEOption<SSEExtract<F>, SSEParameters<F>>,
    ): RPCSSEFunction<SSEExtract<F>, SSEParameters<F>> {
        return Object.assign(
            async (...args: SSEParameters<F>) => {
                const stream = await ofetch(withQuery(resolveURL("/__rpc", `${path}`), { method }), {
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
    }, Namespace.json.stringify("rpcSSE") as unknown, Namespace.assert("rpcSSE") as unknown);
