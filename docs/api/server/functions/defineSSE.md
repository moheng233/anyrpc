[@anyrpc/core](../../modules.md) / [server](../index.md) / defineSSE

# Function: defineSSE()

> **defineSSE**\<`F`\>(`fun`, `helper`?): [`RPCSSEFunction`](../type-aliases/RPCSSEFunction.md)\<[`SSEExtract`](../../client/type-aliases/SSEExtract.md)\<`F`\>, [`SSEParameters`](../../client/type-aliases/SSEParameters.md)\<`F`\>\>

## Type Parameters

• **F** *extends* (`ev`, ...`args`) => `Promise`\<`void`\>

## Parameters

• **fun**: `F`

• **helper?**: [`DefineSSEHelper`](../../client/type-aliases/DefineSSEHelper.md)\<[`SSEExtract`](../../client/type-aliases/SSEExtract.md)\<`F`\>, [`SSEParameters`](../../client/type-aliases/SSEParameters.md)\<`F`\>\>

## Returns

[`RPCSSEFunction`](../type-aliases/RPCSSEFunction.md)\<[`SSEExtract`](../../client/type-aliases/SSEExtract.md)\<`F`\>, [`SSEParameters`](../../client/type-aliases/SSEParameters.md)\<`F`\>\>

## Defined in

server/macro.d.ts:5
