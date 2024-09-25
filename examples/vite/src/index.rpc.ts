import { define, defineSSE, type SSEMessageEmit } from "@anyrpc/core/server";

/**
 * @param start start at
 * @param end end of
 */
export const hello = defineSSE(async (ev: SSEMessageEmit<string>, start: number, end: number) => {
	console.log("test");
	let count = start;

	const interval = setInterval(async () => {
		try {
			const data = `hello world ${count}`;
			await ev.emit(data, { id: count.toString() });
			console.log(data);
			count += 1;
			if (count >= end) {
				clearInterval(interval);
				ev.close();
			}
		} catch (error) {
			clearInterval(interval);
			ev.close();

            throw error;
		}
	}, 1000);
});

export const test = define(async (e: string) => {

});
