# AnyRPC

<!-- automd:badges color="yellow" license name="@moheng/anyrpc" codecov bundlephobia packagephobia -->

[![npm version](https://img.shields.io/npm/v/@moheng/anyrpc?color=yellow)](https://npmjs.com/package/@moheng/anyrpc)
[![npm downloads](https://img.shields.io/npm/dm/@moheng/anyrpc?color=yellow)](https://npmjs.com/package/@moheng/anyrpc)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@moheng/anyrpc?color=yellow)](https://bundlephobia.com/package/@moheng/anyrpc)

<!-- /automd -->

<!-- automd:contributors author="moheng233" github="moheng233/anyrpc" license="MIT" -->

Published under the [MIT](https://github.com/moheng233/anyrpc/blob/main/LICENSE) license.
Made by [@moheng233](https://github.com/moheng233) and [community](https://github.com/moheng233/anyrpc/graphs/contributors) 💛
<br><br>
<a href="https://github.com/moheng233/anyrpc/graphs/contributors">
<img src="https://contrib.rocks/image?repo=moheng233/anyrpc" />
</a>

<!-- /automd -->

## Install

<!-- automd:pm-install name="@anyrpc/core" -->

```sh
# ✨ Auto-detect
npx nypm install @anyrpc/core

# npm
npm install @anyrpc/core

# yarn
yarn add @anyrpc/core

# pnpm
pnpm install @anyrpc/core

# bun
bun install @anyrpc/core
```

<!-- /automd -->

<!-- automd:jsimport name="@moheng/anyrpc/server" imports="define,defineSSE" -->

**ESM** (Node.js, Bun)

```js
import { define, defineSSE } from "@moheng/anyrpc/server";
```

<!-- /automd -->

## Quick Start

<!-- automd:file src="examples/vite/src/index.rpc.ts" name="index.rpc.ts" code lang="ts" -->

```ts index.rpc.ts
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
			console.error(error);
			clearInterval(interval);
			ev.close();
		}
	}, 1000);
});

export const test = define(async (e: string) => {

});

```

<!-- /automd -->

<!-- automd:file src="examples/vite/src/index.ts" name="index.ts" code lang="ts" -->

```ts index.ts
import { hello } from './index.rpc'

const gen = await hello(0, 50)
const writable = gen.pipeTo(
  new WritableStream({
    abort(reason) {
      const element = document.createElement('div')
      element.textContent = `aborted: ${reason}`
      document.querySelector('#view')?.appendChild(element)
    },
    close() {
      const element = document.createElement('div')
      element.textContent = 'closed'
      document.querySelector('#view')?.appendChild(element)
    },
    start() {
      const element = document.createElement('div')
      element.textContent = 'started'
      document.querySelector('#view')?.appendChild(element)
    },
    write(chunk) {
      const element = document.createElement('div')
      element.textContent = chunk.data
      document.querySelector('#view')?.appendChild(element)
    },
  }),
)

```

<!-- /automd -->

## Docs

<!-- automd:jsdocs src="lib/src/server/index.ts" -->

## Middleware

### `createMiddlewares(mode, server, inputOption?)`

Create a generic middleware

### `createManifest()`

### `define()`

### `defineSSE()`

### `useContext()`

### `useRaw()`

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
