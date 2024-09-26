[@anyrpc/core](../../modules.md) / [server](../index.md) / AnyRPCMiddlewaresOption

# Interface: AnyRPCMiddlewaresOption

## Extends

- `AnyRPCBaseOption`

## Properties

### include()

> **include**: (`id`) => `boolean`

#### Parameters

• **id**: `undefined` \| `string`

#### Returns

`boolean`

#### Inherited from

`AnyRPCBaseOption.include`

#### Defined in

server/types.d.ts:8

***

### plugins

> **plugins**: [`AnyRPCPlugin`](AnyRPCPlugin.md)[]

#### Defined in

server/types.d.ts:32

***

### withoutBaseUrl

> **withoutBaseUrl**: `string`

Remove the fixed prefix for incoming requests

#### Default

```ts
"/__rpc"
```

#### Defined in

server/types.d.ts:31
