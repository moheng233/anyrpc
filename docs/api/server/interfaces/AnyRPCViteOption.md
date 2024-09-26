[@anyrpc/core](../../modules.md) / [server](../index.md) / AnyRPCViteOption

# Interface: AnyRPCViteOption

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

### middlewares

> **middlewares**: `object` & `Partial`\<[`AnyRPCMiddlewaresOption`](AnyRPCMiddlewaresOption.md)\>

Start AnyRPCMiddlewares in vite's DevServer

#### Type declaration

##### enable

> **enable**: `boolean`

#### Default

```ts
false
```

#### Defined in

server/types.d.ts:15
