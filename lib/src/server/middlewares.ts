import type { IncomingMessage, ServerResponse } from "node:http";

import { parseFilename, withoutBase } from "ufo";
import type { Connect, ViteDevServer } from "vite";

import assert from "node:assert";
import { join } from "pathe";
import type { SSEMessage } from "../common/sse.js";
import type {
	DefineOption,
	DefineSSEOption,
	RPCFunction,
	RPCModule,
	RPCSSEFunction,
} from "../common/types.js";
import { formatSSEMessage } from "./util/sse.js";

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
				bodyParts.push(chunk);
			})
			.on("end", () => {
				body = Buffer.concat(bodyParts).toString();
				resolve(body);
			});
	});
}

export function createMiddlewares(mode: "preview", rootDir: string): Handle;
export function createMiddlewares(mode: "dev", server: ViteDevServer): Handle;
/**
 * Create a generic middleware
 * @param mode Mode
 * @returns middleware function
 */
export function createMiddlewares(
	mode: "preview" | "dev",
	server?: ViteDevServer | string,
): Handle {
	return async (req, res) => {
		const url = withoutBase(req.url ?? "", "/__rpc");
		const filename = parseFilename(url, { strict: true });

		const [filepath, method] = url.split("@");

		const body = await getBody(req);

		let module: RPCModule;

		try {
			if (mode === "dev") {
				module = await (server as ViteDevServer).ssrLoadModule(filepath);
			} else {
				module = await import(
					join(
						server as string,
						"dist",
						"server",
						`${filepath.replace(".rpc.ts", ".rpc.js")}`,
					)
				);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}

		let rpc: RPCFunction<object, object> | RPCSSEFunction<object, object>;
		let option:
			| DefineOption<object, object>
			| DefineSSEOption<object, object>
			| undefined;

		try {
			rpc = module[method];
			option = rpc.option;
		} catch {
			res.writeHead(404);
			res.end();
			return;
		}

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let ret: any;

		try {
			assert(option !== undefined && option.argsPaser !== undefined);

			ret = await rpc(option.argsPaser(body));
		} catch (e) {
			res.writeHead(500);
			res.end(JSON.stringify(e));
			return;
		}

		if (ret instanceof ReadableStream) {
			res.writeHead(200, {
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"Content-Type": "text/event-stream",
			});
			res.flushHeaders();

			const transform = new TransformStream<SSEMessage<object>, string>({
				transform({ data, ...sse }, controller) {
					controller.enqueue(
						formatSSEMessage({
							data:
								option !== undefined
									// biome-ignore lint/complexity/noBannedTypes: <explanation>
									? (option as DefineSSEOption<{}, {}>).sseStringify(data)
									: JSON.stringify(data),
							...sse,
						}),
					);
				},
			});
			ret.pipeTo(transform.writable);

			try {
				transform.readable.pipeTo(
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
								return await new Promise<void>((done, rej) => {
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
							return await new Promise<void>((done, rej) => {
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
