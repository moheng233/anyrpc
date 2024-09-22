import { defineSSE } from "@moheng/anyrpc/server";

export const hello = defineSSE<string, {}>(async (ev, args) => {
	console.log("test");
	let count = 0;

	const interval = setInterval(async () => {
		try {
			const data = `hello world ${count}`;
			await ev.emit(data, { id: count.toString() });
			console.log(data);
			count += 1;
			if (count > 20) {
				clearInterval(interval);
				ev.close();
			}
		} catch (error) {
			console.error(error);
			clearInterval(interval);
			ev.close();
		}
	}, 1000);
});
