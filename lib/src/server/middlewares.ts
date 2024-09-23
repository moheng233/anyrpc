import type { IncomingMessage, ServerResponse } from "node:http";

import { withoutBase } from "ufo";
import type { Connect, ViteDevServer } from "vite";

import assert from "node:assert";
import type { SSEMessage } from "../common/sse.js";
import type {
	DefineOption,
	DefineSSEOption,
	RPCFunction,
	RPCModule,
	RPCSSEFunction,
} from "../common/types.js";
import { formatSSEMessage } from "./util/sse.js";
import { context } from "./util/context.js";
import { RPCManifest } from "./types.js";

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
 */
export function createMiddlewares(
	mode: "preview" | "dev",
	server?: ViteDevServer | RPCManifest,
): Handle {
	return async (req, res) => {
		const url = withoutBase(req.url ?? "", "/__rpc");

		const [filepath, method] = url.split("@");

		const body = await getBody(req);

		let module: RPCModule;

		try {
			if (mode === "dev") {
				module = (await (server as ViteDevServer).ssrLoadModule(filepath));
			} else {
				module = (await (server as RPCManifest)[filepath]);
			}
		} catch (e) {
			res.writeHead(404)
				.end(e);
			return;
		}

		let rpc: RPCFunction | RPCSSEFunction
		let option:
			| DefineOption
			| DefineSSEOption
			| undefined;

		try {
			rpc = module[method];
			option = rpc.option;
		} catch {
			res.writeHead(404)
				.end();
			return;
		}

		let ret: void | ReadableStream<SSEMessage<Record<string, never>>>;

		try {
			assert(option !== undefined && option.argsPaser !== undefined);

			ret = await context.call({
				request: req,
				response: res
			}, async () => await rpc(...option.argsPaser(body)));
		} catch (e) {
			res.writeHead(500)
				.end(JSON.stringify(e));
			return;
		}

		if (ret instanceof ReadableStream) {
			res.writeHead(200, {
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
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
							} catch (error) {
								controller.error(error);
							}
						},
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
					}),
				);
			} catch (e) {
				console.error(e);
			}
		} else {
			const content = JSON.stringify(ret);
			res
				.writeHead(200, {
					"Content-Type": "text/plain",
					"Content-Length": Buffer.byteLength(content),
				})
				.end(content);
		}
	};
}
