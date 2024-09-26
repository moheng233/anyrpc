import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect } from "vite";

import { defu } from "defu";
import { Writable } from "node:stream";
import { parseQuery, parseURL } from "ufo";

import type { SSEMessage } from "../common/sse.js";
import type {
    DefineHelper,
    DefineSSEHelper,
    RPCFunctionWithHelper,
    RPCModule,
    RPCSSEFunctionWithHelper,
} from "../common/types.js";
import type { AnyRPCMiddlewaresOption } from "./types.js";

import { PluginCallError, RPCCallError, RPCMethodNotFoundError, RPCModuleNotFoundError, RPCParmasPaserError, RPCReturnStringifyError, RPCServerError, RPCSSEStringifyError } from "../common/error.js";
import { formatSSEMessage } from "../common/sse.js";
import { OBJECTS_SYMBOL, REQUEST_SYMBOL, RESPONSE_SYMBOL } from "./types.js";
import { context } from "./util/context.js";
import { defaultInclude } from "./util/fs.js";

export type Handle = (
    req: Connect.IncomingMessage,
    res: ServerResponse<IncomingMessage>,
) => PromiseLike<void>;

export type loadModule = (url: string) => Promise<Record<string, RPCFunctionWithHelper | RPCSSEFunctionWithHelper>>;

function getBody(request: Connect.IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        const bodyParts: Uint8Array[] = [];
        request
            .on("data", (chunk) => {
                bodyParts.push(chunk as Uint8Array);
            })
            .on("end", () => {
                resolve(Buffer.concat(bodyParts).toString());
            });
    });
}

/**
 * Create a generic middleware
 * @returns middleware function
 * @example
 * ```ts
 * const manifest = createManifest();
 * export default function () {
 *     return createMiddlewares((url: string) => manifest[url]);
 * }
 * ```
 */
export async function createMiddlewares(
    loadModule: loadModule,
    inputOption?: Partial<AnyRPCMiddlewaresOption>
): Promise<Handle> {
    const { plugins } = defu(inputOption, {
        include: defaultInclude,
        withoutBaseUrl: "/__rpc",
        plugins: []
    } as AnyRPCMiddlewaresOption);

    for (const plugin of plugins) {
        await plugin["setup"]?.call(undefined);
    }

    return async (req, res) => {
        try {
            const { pathname, search } = parseURL(req.url);
            const { method } = parseQuery<{ method?: string }>(search);

            const body = await getBody(req);

            let module: RPCModule;

            try {
                module = await loadModule(pathname);
            }
            catch (e) {
                throw new RPCModuleNotFoundError(pathname, method ?? "", e);
            }

            if (method === undefined) {
                throw new RPCMethodNotFoundError(pathname, method ?? "", null);
            }

            const rpc = module[method];

            if (rpc === undefined) {
                throw new RPCMethodNotFoundError(pathname, method ?? "", null);
            }

            const helper = rpc.helper;

            const args = helper.argsPaser(body);
            if (!args.success) {
                throw new RPCParmasPaserError(pathname, method, args);
            }

            const ret = await context.call({
                [REQUEST_SYMBOL]: req,
                [RESPONSE_SYMBOL]: res,

                [OBJECTS_SYMBOL]: new Map()
            }, async () => {
                for (const plugin of plugins) {
                    try {
                        await plugin["preCall"]?.call(undefined);
                    }
                    catch (e) {
                        throw new PluginCallError(pathname, method, plugin.name, e);
                    }
                }

                let ret: Awaited<ReturnType<typeof rpc>> = void 0;

                try {
                    ret = await rpc(...args.data);
                }
                catch (e) {
                    if (e instanceof RPCCallError) {
                        throw e;
                    }
                    else {
                        throw new RPCCallError(pathname, method, e);
                    }
                }

                for (const plugin of plugins) {
                    try {
                        await plugin["postCall"]?.call(undefined);
                    }
                    catch (e) {
                        throw new PluginCallError(pathname, method, plugin.name, e);
                    }
                }

                return ret;
            });

            if (ret instanceof ReadableStream) {
                res.writeHead(200, {
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream",
                });
                res.flushHeaders();

                void ret.pipeThrough(new TransformStream<SSEMessage<never>, string>({
                    transform({ data, ...sse }, controller) {
                        const conetnt = (helper as DefineSSEHelper).sseStringify(data);

                        if (!conetnt.success) {
                            throw new RPCSSEStringifyError(pathname, method, data);
                        }

                        controller.enqueue(
                            formatSSEMessage({
                                data: conetnt.data,
                                ...sse,
                            }),
                        );
                    },
                })).pipeTo(Writable.toWeb(res));
            }
            else {
                const content = (helper as DefineHelper).returnStringify(ret);

                if (!content.success) {
                    throw new RPCReturnStringifyError(pathname, method, content);
                }

                /// TODO: return is undefined
                res
                    .writeHead(200, {
                        "Content-Length": Buffer.byteLength(content.data),
                        "Content-Type": "text/plain",
                    })
                    .end(content.data);
            }
        }
        catch (e) {
            if (e instanceof RPCServerError) {
                res
                    .writeHead(e.status)
                    .end(JSON.stringify(e));
                return;
            }
            throw e;
        }
    };
}
