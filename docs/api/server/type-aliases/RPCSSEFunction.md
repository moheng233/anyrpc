[@anyrpc/core](../../modules.md) / [server](../index.md) / RPCSSEFunction

# Type Alias: RPCSSEFunction()\<S, P\>

> **RPCSSEFunction**\<`S`, `P`\>: (...`args`) => `Promise`\<`ReadableStream`\<[`SSEMessage`](../interfaces/SSEMessage.md)\<`S`\>\>\>

## Type Parameters

• **S** = `Record`\<`string`, `never`\>

• **P** *extends* `unknown`[] = []

## Parameters

• ...**args**: `P`

## Returns

`Promise`\<`ReadableStream`\<[`SSEMessage`](../interfaces/SSEMessage.md)\<`S`\>\>\>

## Defined in

common/types.d.ts:11
