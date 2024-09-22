# AnyRPC

<!-- automd:badges color="yellow" license name="anyrpc" codecov bundlephobia packagephobia -->

[![npm version](https://img.shields.io/npm/v/anyrpc?color=yellow)](https://npmjs.com/package/anyrpc)
[![npm downloads](https://img.shields.io/npm/dm/anyrpc?color=yellow)](https://npmjs.com/package/anyrpc)
[![bundle size](https://img.shields.io/bundlephobia/minzip/anyrpc?color=yellow)](https://bundlephobia.com/package/anyrpc)

<!-- /automd -->

[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![Linted with Biome](https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

<!-- automd:contributors author="moheng233" github="moheng233/anyrpc" license="MIT" -->

Published under the [MIT](https://github.com/moheng233/anyrpc/blob/main/LICENSE) license.
Made by [@moheng233](https://github.com/moheng233) and [community](https://github.com/moheng233/anyrpc/graphs/contributors) 💛
<br><br>
<a href="https://github.com/moheng233/anyrpc/graphs/contributors">
<img src="https://contrib.rocks/image?repo=moheng233/anyrpc" />
</a>

<!-- /automd -->

## Install

<!-- automd:pm-install name="anyrpc" -->

```sh
# ✨ Auto-detect
npx nypm install anyrpc

# npm
npm install anyrpc

# yarn
yarn add anyrpc

# pnpm
pnpm install anyrpc

# bun
bun install anyrpc
```

<!-- /automd -->

<!-- automd:jsimport name="anyrpc/server" imports="define,defineSSE" -->

**ESM** (Node.js, Bun)

```js
import { define, defineSSE } from "anyrpc/server";
```

<!-- /automd -->

## Quick Start

<!-- automd:file src="examples/vite/hello.rpc.ts" name="hello.rpc.ts" code lang="ts" -->

```ts hello.rpc.ts
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

```

<!-- /automd -->

<!-- automd:file src="examples/vite/index.ts" name="index.ts" code lang="ts" -->

```ts index.ts
import { hello } from './hello.rpc'

const gen = await hello({})
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

### `createMiddlewares(mode, server?)`

Create a generic middleware

### `define()`

### `defineSSE()`

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
