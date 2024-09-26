import type { Primitive } from "typia";

import { ofetch } from "ofetch";
import { resolveURL, withQuery } from "ufo";

import type { SSEMessageEmit } from "../common/sse";
import type {
    AsyncReturnType,
    DefineHelper,
    DefineSSEHelper,
    RPCFunction,
    RPCSSEFunction,
    SSEExtract,
    SSEParameters,
} from "../common/types";

import { RPCParmasStringifyError, RPCReturnParserError, RPCSSEParserError } from "../common/error";
import { createSSETransformStream } from "./sse";

export type { AsyncReturnType, DefineHelper, DefineSSEHelper, SSEExtract, SSEParameters } from "../common/types.js";

export { typia } from "../common/typia.js";

/**
 * @internal
 */
export function makeRPCFetch<F extends (...args: never[]) => Promise<object | void>>(
    path: string,
    method: string,
    helper: DefineHelper<Parameters<F>, AsyncReturnType<F>>,
): RPCFunction<Parameters<F>, AsyncReturnType<F>> {
    return async (...args: Parameters<F>) => {
        const body = helper.argsStringify(args);

        if (!body.success) {
            throw new RPCParmasStringifyError(path, method, body);
        }

        return ofetch<AsyncReturnType<F>>(withQuery(resolveURL("/__rpc", `${path}`), { method }), {
            method: "POST",
            responseType: "json",
            body: body.data,
            parseResponse(responseText) {
                const response = helper.returnPaser(responseText);

                if (!response.success) {
                    throw new RPCReturnParserError(path, method, response);
                }

                return response.data;
            },
        });
    };
};

/**
 * @internal
 */
export function makeRPCSSEFetch<
    F extends (ev: SSEMessageEmit<unknown>, ...args: never[]) => Promise<void>,
>(
    path: string,
    method: string,
    helper: DefineSSEHelper<SSEExtract<F>, SSEParameters<F>>,
): RPCSSEFunction<Primitive<SSEExtract<F>>, Primitive<SSEParameters<F>>> {
    return async (...args: Primitive<SSEParameters<F>>) => {
        const body = helper.argsStringify(args);

        if (!body.success) {
            throw new RPCParmasStringifyError(path, method, body);
        }

        const stream = await ofetch(withQuery(resolveURL("/__rpc", `${path}`), { method }), {
            method: "POST",
            responseType: "stream",
            body: body.data,
        });

        return stream.pipeThrough(createSSETransformStream<Primitive<SSEExtract<F>>>((json) => {
            const response = helper.ssePaser(json);

            if (!response.success) {
                throw new RPCSSEParserError(path, method, response);
            }

            return response.data;
        }));
    };
};
