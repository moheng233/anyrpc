import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, ViteDevServer } from "vite";

import { defu } from "defu";
import { parseQuery, parseURL } from "ufo";

import type { SSEMessage } from "../common/sse.js";
import type {
    DefineOption,
    DefineSSEOption,
    RPCFunction,
    RPCModule,
    RPCSSEFunction,
} from "../common/types.js";

import { formatSSEMessage } from "../common/sse.js";
import { AnyRPCMiddlewaresOption, REQUEST_SYMBOL, RESPONSE_SYMBOL, RPCManifest } from "./types.js";
import { context } from "./util/context.js";
import { PluginCallError, RPCArgsPaserError, RPCCallError, RPCError, RPCMethodNotFoundError, RPCModuleNotFoundError, RPCReturnStringifyError } from "./util/error.js";
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

export function createMiddlewares(mode: "preview", manifest: RPCManifest): Handle;
export function createMiddlewares(mode: "dev", server: ViteDevServer): Handle;
/**
 * Create a generic middleware
 * @param mode Mode
 * @returns middleware function
 * @group middleware
 */
export function createMiddlewares(
    mode: "dev" | "preview",
    server: RPCManifest | ViteDevServer,
    inputOption?: Partial<AnyRPCMiddlewaresOption>
): Handle {
    const { plugins } = defu(inputOption, {
        include: defaultInclude,
        withoutBaseUrl: "/__rpc",
        plugins: []
    } as AnyRPCMiddlewaresOption);

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

            let rpc: RPCFunction | RPCSSEFunction;
            let option:
                | DefineOption
                | DefineSSEOption
                | undefined;

            try {
                if (method === undefined) {
                    throw new Error();
                }

                rpc = module[method];

                if (rpc === undefined) {
                    throw new Error();
                }

                option = rpc.option;
            }
            catch (e) {
                throw new RPCMethodNotFoundError(pathname, method ?? "", e);
            }

            let args: Parameters<typeof rpc> = [];

            try {
                args = (option !== undefined ? option.argsPaser(body) : JSON.parse(body) as []);
            }
            catch (e) {
                if (mode === "dev" && e instanceof Error) {
                    (server as ViteDevServer).ssrFixStacktrace(e);
                }
                throw new RPCArgsPaserError(pathname, method, e);
            }

            let ret: ReadableStream<SSEMessage<Record<string, never>>> | void;

            try {
                ret = await context.call({
                    [REQUEST_SYMBOL]: req,
                    [RESPONSE_SYMBOL]: res
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
                        ret = await rpc(...args);
                    }
                    catch (e) {
                        throw new RPCCallError(pathname, method, e);
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
                        controller.enqueue(
                            formatSSEMessage({
                                data:
                                    option !== undefined
                                        ? (option as DefineSSEOption).sseStringify(data)
                                        : JSON.stringify(data),
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
                                console.log("closed");
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
                                controller.error("closed");
                                return await new Promise<void>((done) => {
                                    console.log("closed");
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
                let content: string;

                try {
                    content = (option as DefineOption).returnStringify !== undefined ? (option as DefineOption).returnStringify(ret) : JSON.stringify(ret);
                }
                catch (e) {
                    throw new RPCReturnStringifyError(pathname, method, e);
                }

                /// TODO: return is undefined
                res
                    .writeHead(200, {
                        "Content-Length": Buffer.byteLength(content),
                        "Content-Type": "text/plain",
                    })
                    .end(content);
            }
        }
        catch (e) {
            if (e instanceof RPCError) {
                res
                    .writeHead(e.status)
                    .end(JSON.stringify(e));
                return;
            }
            throw e;
        }
    };
}
