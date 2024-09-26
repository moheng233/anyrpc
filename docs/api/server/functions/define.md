[@anyrpc/core](../../modules.md) / [server](../index.md) / define

# Function: define()

> **define**\<`F`\>(`fun`, `helper`?): [`RPCFunction`](../type-aliases/RPCFunction.md)\<`Parameters`\<`F`\>, [`AsyncReturnType`](../../client/type-aliases/AsyncReturnType.md)\<`F`\>\>

## Type Parameters

• **F** *extends* (...`args`) => `Promise`\<`void` \| `object`\>

## Parameters

• **fun**: `F`

• **helper?**: [`DefineHelper`](../../client/type-aliases/DefineHelper.md)\<`Parameters`\<`F`\>, [`AsyncReturnType`](../../client/type-aliases/AsyncReturnType.md)\<`F`\>\>

## Returns

[`RPCFunction`](../type-aliases/RPCFunction.md)\<`Parameters`\<`F`\>, [`AsyncReturnType`](../../client/type-aliases/AsyncReturnType.md)\<`F`\>\>

## Defined in

server/macro.d.ts:4
