[@anyrpc/core](../../modules.md) / [client](../index.md) / makeRPCFetch

# Function: makeRPCFetch()

> **makeRPCFetch**\<`F`\>(`path`, `method`, `helper`): [`RPCFunction`](../../server/type-aliases/RPCFunction.md)\<`Parameters`\<`F`\>, [`AsyncReturnType`](../type-aliases/AsyncReturnType.md)\<`F`\>\>

**`Internal`**

## Type Parameters

• **F** *extends* (...`args`) => `Promise`\<`void` \| `object`\>

## Parameters

• **path**: `string`

• **method**: `string`

• **helper**: [`DefineHelper`](../type-aliases/DefineHelper.md)\<`Parameters`\<`F`\>, [`AsyncReturnType`](../type-aliases/AsyncReturnType.md)\<`F`\>\>

## Returns

[`RPCFunction`](../../server/type-aliases/RPCFunction.md)\<`Parameters`\<`F`\>, [`AsyncReturnType`](../type-aliases/AsyncReturnType.md)\<`F`\>\>

## Defined in

client/index.d.ts:9
