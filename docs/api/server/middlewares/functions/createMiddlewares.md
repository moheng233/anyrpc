[@anyrpc/core](../../../modules.md) / [server/middlewares](../index.md) / createMiddlewares

# Function: createMiddlewares()

> **createMiddlewares**(`loadModule`, `inputOption`?): `Promise`\<[`Handle`](../type-aliases/Handle.md)\>

Create a generic middleware

## Parameters

• **loadModule**: [`loadModule`](../type-aliases/loadModule.md)

• **inputOption?**: `Partial`\<[`AnyRPCMiddlewaresOption`](../../interfaces/AnyRPCMiddlewaresOption.md)\>

## Returns

`Promise`\<[`Handle`](../type-aliases/Handle.md)\>

middleware function

## Example

```ts
const manifest = createManifest();
export default function () {
    return createMiddlewares((url: string) => manifest[url]);
}
```

## Defined in

server/middlewares.d.ts:18
