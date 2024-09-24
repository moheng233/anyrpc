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
import { AnyRPCMiddlewaresOption, RPCManifest } from "./types.js";
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
    inputOption?: AnyRPCMiddlewaresOption
): Handle {
    const { withoutBaseUrl } = defu(inputOption, {
        include: defaultInclude,
        withoutBaseUrl: "/__rpc"
    } satisfies AnyRPCMiddlewaresOption);

    return async (req, res) => {
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
        catch {
            res.writeHead(404)
                .end(`not found ${pathname} module`);
            return;
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
            option = rpc.option;
        }
        catch {
            res.writeHead(404)
                .end(`not found ${pathname}#${method} method`);
            return;
        }

        let ret: ReadableStream<SSEMessage<Record<string, never>>> | void;

        try {
            ret = await context.call({
                request: req,
                response: res
            }, async () => await rpc(...(option !== undefined ? option.argsPaser(body) : JSON.parse(body) as [])));
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

            try {
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
            catch (e) {
                console.error(e);
            }
        }
        else {
            const content = JSON.stringify(ret);
            res
                .writeHead(200, {
                    "Content-Length": Buffer.byteLength(content),
                    "Content-Type": "text/plain",
                })
                .end(content);
        }
    };
}
