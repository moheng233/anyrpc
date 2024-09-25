import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, ViteDevServer } from "vite";

import { defu } from "defu";
import { parseQuery, parseURL } from "ufo";

import type { SSEMessage } from "../common/sse.js";
import type {
    DefineHelper,
    DefineSSEHelper,
    RPCModule,
} from "../common/types.js";

import { PluginCallError, RPCCallError, RPCMethodNotFoundError, RPCModuleNotFoundError, RPCParmasPaserError, RPCReturnStringifyError, RPCServerError, RPCSSEStringifyError } from "../common/error.js";
import { formatSSEMessage } from "../common/sse.js";
import { AnyRPCMiddlewaresOption, OBJECTS_SYMBOL, REQUEST_SYMBOL, RESPONSE_SYMBOL, RPCManifest } from "./types.js";
import { context } from "./util/context.js";
import { defaultInclude } from "./util/fs.js";

type Handle = (
    req: Connect.IncomingMessage,
    res: ServerResponse<IncomingMessage>,
) => PromiseLike<void>;

function getBody(request: Connect.IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        const bodyParts: Uint8Array[] = [];
        let body: string;
        request
            .on("data", (chunk) => {
                bodyParts.push(chunk as Uint8Array);
            })
            .on("end", () => {
                body = Buffer.concat(bodyParts).toString();
                resolve(body);
            });
    });
}

export function createMiddlewares(mode: "preview", manifest: RPCManifest): Promise<Handle>;
export function createMiddlewares(mode: "dev", server: ViteDevServer): Promise<Handle>;
/**
 * Create a generic middleware
 * @param mode Mode
 * @returns middleware function
 * @group middleware
 */
export async function createMiddlewares(
    mode: "dev" | "preview",
    server: RPCManifest | ViteDevServer,
    inputOption?: Partial<AnyRPCMiddlewaresOption>
): Promise<Handle> {
    const { plugins } = defu(inputOption, {
        include: defaultInclude,
        withoutBaseUrl: "/__rpc",
        plugins: []
    } as AnyRPCMiddlewaresOption);

    for (const plugin of plugins) {
        await plugin.setup();
    }

    return async (req, res) => {
        try {
            const { pathname, search } = parseURL(req.url);
            const { method } = parseQuery<{ method?: string }>(search);

            const body = await getBody(req);

            let module: RPCModule;

            try {
                if (mode === "dev") {
                    module = (await (server as ViteDevServer).ssrLoadModule(pathname));
                }
                else {
                    module = (await (server as RPCManifest)[pathname]);
                }
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

            let ret: ReadableStream<SSEMessage<Record<string, never>>> | void;

            try {
                ret = await context.call({
                    [REQUEST_SYMBOL]: req,
                    [RESPONSE_SYMBOL]: res,

                    [OBJECTS_SYMBOL]: new Map()
                }, async () => {
                    for (const plugin of plugins) {
                        try {
                            await plugin.preCall();
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
                        if (mode === "dev" && e instanceof Error) {
                            (server as ViteDevServer).ssrFixStacktrace(e);
                        }
                        if (e instanceof RPCCallError) {
                            throw e;
                        }
                        else {
                            throw new RPCCallError(pathname, method, e);
                        }
                    }

                    for (const plugin of plugins) {
                        try {
                            await plugin.postCall();
                        }
                        catch (e) {
                            throw new PluginCallError(pathname, method, plugin.name, e);
                        }
                    }

                    return ret;
                });
            }
            catch (e) {
                res.writeHead(500)
                    .end(JSON.stringify(e));
                return;
            }

            if (ret instanceof ReadableStream) {
                res.writeHead(200, {
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream",
                });
                res.flushHeaders();

                const transform = new TransformStream<SSEMessage<never>, string>({
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
                });
                void ret.pipeTo(transform.writable);

                void transform.readable.pipeTo(
                    new WritableStream<string>({
                        abort(error) {
                            console.log(error);
                        },
                        async close() {
                            return await new Promise<void>((done) => {
                                res.end(() => {
                                    done();
                                });
                            });
                        },
                        async write(chunk, controller) {
                            try {
                                if (!res.closed) {
                                    return await new Promise<void>((done, rej) => {
                                        res.write(chunk, (error) => {
                                            if (error !== undefined && error !== null) {
                                                rej(error);
                                            }
                                            done();
                                        });
                                    });
                                }
                                return await new Promise<void>((done) => {
                                    res.end(() => {
                                        done();
                                    });
                                });
                            }
                            catch (error) {
                                controller.error(error);
                            }
                        },
                    }),
                );
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
