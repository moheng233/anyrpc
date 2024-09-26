[@anyrpc/core](../../modules.md) / [client](../index.md) / DefineSSEHelper

# Type Alias: DefineSSEHelper\<S, P\>

> **DefineSSEHelper**\<`S`, `P`\>: `object` & `Omit`\<[`DefineHelper`](DefineHelper.md)\<`P`, `void`\>, `"returnPaser"` \| `"returnStringify"`\>

## Type declaration

### ssePaser

> **ssePaser**: `ReturnType`\<*typeof* `createValidateParse`\>

### sseStringify

> **sseStringify**: `ReturnType`\<*typeof* `createValidateStringify`\>

## Type Parameters

• **S** = `Record`\<`string`, `never`\>

• **P** *extends* `unknown`[] = []

## Defined in

common/types.d.ts:24
