[@anyrpc/core](../../modules.md) / [server](../index.md) / SSEMessageEmit

# Class: SSEMessageEmit\<O\>

## Type Parameters

• **O**

## Constructors

### new SSEMessageEmit()

> **new SSEMessageEmit**\<`O`\>(`_stream`): [`SSEMessageEmit`](SSEMessageEmit.md)\<`O`\>

#### Parameters

• **\_stream**: `WritableStream`\<[`SSEMessage`](../interfaces/SSEMessage.md)\<`O`\>\>

#### Returns

[`SSEMessageEmit`](SSEMessageEmit.md)\<`O`\>

#### Defined in

common/sse.d.ts:12

## Methods

### abort()

> **abort**(`message`): `Promise`\<`void`\>

#### Parameters

• **message**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

common/sse.d.ts:13

***

### close()

> **close**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

common/sse.d.ts:14

***

### emit()

> **emit**(`data`, `opt`?): `Promise`\<`void`\>

#### Parameters

• **data**: `O`

• **opt?**: [`SSEMessageOption`](../interfaces/SSEMessageOption.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

common/sse.d.ts:15
