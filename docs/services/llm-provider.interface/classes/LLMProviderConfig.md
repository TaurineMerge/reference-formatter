[**reference-formatter-api v1.0.0**](../../../README.md)

***

[reference-formatter-api](../../../README.md) / [services/llm-provider.interface](../README.md) / LLMProviderConfig

# Class: LLMProviderConfig

Defined in: services/llm-provider.interface.ts:63

Configuration object for initializing LLM providers.
Defines model parameters, sampling settings, and connection options.

## Example

```ts
const config = new LLMProviderConfig({
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1024,
});
```

## Constructors

### Constructor

> **new LLMProviderConfig**(`__namedParameters?`): `LLMProviderConfig`

Defined in: services/llm-provider.interface.ts:83

#### Parameters

##### \_\_namedParameters?

###### additionalParams?

`Record`\<`string`, `unknown`\> = `{}`

###### frequencyPenalty?

`number`

###### maxRetries?

`number`

###### maxTokens?

`number`

###### model?

`string`

###### presencePenalty?

`number`

###### temperature?

`number`

###### timeout?

`number`

###### topP?

`number`

#### Returns

`LLMProviderConfig`

## Properties

### additionalParams

> **additionalParams**: `Record`\<`string`, `unknown`\>

Defined in: services/llm-provider.interface.ts:81

Provider-specific extra parameters

***

### frequencyPenalty?

> `optional` **frequencyPenalty**: `number`

Defined in: services/llm-provider.interface.ts:73

Penalize frequent tokens (-2 to 2)

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: services/llm-provider.interface.ts:79

Maximum retry attempts on failure

***

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: services/llm-provider.interface.ts:69

Maximum tokens to generate

***

### model?

> `optional` **model**: `string`

Defined in: services/llm-provider.interface.ts:65

Model identifier (e.g., "gpt-4o-mini")

***

### presencePenalty?

> `optional` **presencePenalty**: `number`

Defined in: services/llm-provider.interface.ts:75

Penalize repeated topics (-2 to 2)

***

### temperature?

> `optional` **temperature**: `number`

Defined in: services/llm-provider.interface.ts:67

Sampling temperature (0–2, higher = more random)

***

### timeout?

> `optional` **timeout**: `number`

Defined in: services/llm-provider.interface.ts:77

Request timeout in milliseconds

***

### topP?

> `optional` **topP**: `number`

Defined in: services/llm-provider.interface.ts:71

Nucleus sampling threshold (0–1)
