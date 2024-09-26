[@anyrpc/core](../../modules.md) / [client](../index.md) / makeRPCSSEFetch

# Function: makeRPCSSEFetch()

> **makeRPCSSEFetch**\<`F`\>(`path`, `method`, `helper`): [`RPCSSEFunction`](../../server/type-aliases/RPCSSEFunction.md)\<`Primitive`\<[`SSEExtract`](../type-aliases/SSEExtract.md)\<`F`\>\>, `Primitive`\<[`SSEParameters`](../type-aliases/SSEParameters.md)\<`F`\>\>\>

**`Internal`**

## Type Parameters

• **F** *extends* (`ev`, ...`args`) => `Promise`\<`void`\>

## Parameters

• **path**: `string`

• **method**: `string`

• **helper**: [`DefineSSEHelper`](../type-aliases/DefineSSEHelper.md)\<[`SSEExtract`](../type-aliases/SSEExtract.md)\<`F`\>, [`SSEParameters`](../type-aliases/SSEParameters.md)\<`F`\>\>

## Returns

[`RPCSSEFunction`](../../server/type-aliases/RPCSSEFunction.md)\<`Primitive`\<[`SSEExtract`](../type-aliases/SSEExtract.md)\<`F`\>\>, `Primitive`\<[`SSEParameters`](../type-aliases/SSEParameters.md)\<`F`\>\>\>

## Defined in

client/index.d.ts:13
