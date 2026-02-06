[**reference-formatter-api v1.0.0**](../../../README.md)

***

[reference-formatter-api](../../../README.md) / [services/llm-provider.interface](../README.md) / ILLMResponse

# Class: ILLMResponse

Defined in: services/llm-provider.interface.ts:33

Standardized response from an LLM provider.
Encapsulates generated text along with usage metadata and original provider response.

## Example

```ts
const response = new ILLMResponse("Hello world", { total_tokens: 5 }, rawProviderData);
console.log(response.content); // "Hello world"
```

## Constructors

### Constructor

> **new ILLMResponse**(`content`, `usage`, `rawResponse?`): `ILLMResponse`

Defined in: services/llm-provider.interface.ts:41

#### Parameters

##### content

`string`

##### usage

`Record`\<`string`, `unknown`\> | `null`

##### rawResponse?

`Record`\<`string`, `unknown`\>

#### Returns

`ILLMResponse`

## Properties

### content

> **content**: `string`

Defined in: services/llm-provider.interface.ts:35

Generated text from the model

***

### rawResponse?

> `optional` **rawResponse**: `Record`\<`string`, `unknown`\>

Defined in: services/llm-provider.interface.ts:39

Original unmodified provider response

***

### usage

> **usage**: `Record`\<`string`, `unknown`\> \| `null`

Defined in: services/llm-provider.interface.ts:37

Token usage statistics (provider-specific format)
