import type { IncomingMessage, ServerResponse } from "node:http";

import { joinRelativeURL, parseFilename, withoutBase } from "ufo";
import type { Connect, PreviewServer, ViteDevServer } from "vite";

import type { SSEMessage } from "../common/sse.js";
import { formatSSEMessage } from "./util/sse.js";
import { join, resolve, normalize } from "node:path";

type Handle = (
	req: Connect.IncomingMessage,
	res: ServerResponse<IncomingMessage>,
) => PromiseLike<void>;

export function createMiddlewares(
	mode: "preview",
    rootDir: string
): Handle;
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

		try {
			let module: Record<string, Function>;

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

			let ret: any;

			try {
				ret = await module[method]();
			} catch (e) {
				console.error(e);
			}

			if (ret instanceof ReadableStream) {
				res.writeHead(200, {
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
					"Content-Type": "text/event-stream",
				});
				res.flushHeaders();

				const transform = new TransformStream<SSEMessage<object>, string>({
					transform({ data, ...option }, controller) {
						controller.enqueue(
							formatSSEMessage({
								data: JSON.stringify(data),
								...option,
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
		} catch (e) {
			console.error(e);

			res.writeHead(404);
			res.end();
		}
	};
}
