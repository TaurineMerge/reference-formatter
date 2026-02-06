[**reference-formatter-api v1.0.0**](../../../../README.md)

***

[reference-formatter-api](../../../../README.md) / [infrastructure/llm/openai-provider](../README.md) / OpenAIProvider

# Class: OpenAIProvider

Defined in: infrastructure/llm/openai-provider.ts:21

OpenAI API implementation of the LLM provider interface.
Handles chat completion requests, applies configuration defaults, and normalizes errors.

## Throws

"OpenAI API key is required" - If apiKey is null, undefined, or empty

## Example

```ts
const provider = new OpenAIProvider("sk-...", new LLMProviderConfig({
  model: "gpt-4",
  temperature: 0.5,
  maxTokens: 1000
}));
```

## Implements

- [`ILLMProvider`](../../../../services/llm-provider.interface/interfaces/ILLMProvider.md)

## Constructors

### Constructor

> **new OpenAIProvider**(`apiKey`, `config?`): `OpenAIProvider`

Defined in: infrastructure/llm/openai-provider.ts:25

#### Parameters

##### apiKey

`string`

##### config?

[`LLMProviderConfig`](../../../../services/llm-provider.interface/classes/LLMProviderConfig.md) = `...`

#### Returns

`OpenAIProvider`

## Methods

### generateCompletion()

> **generateCompletion**(`__namedParameters`): `Promise`\<[`ILLMResponse`](../../../../services/llm-provider.interface/classes/ILLMResponse.md)\>

Defined in: infrastructure/llm/openai-provider.ts:58

Generates a chat completion using OpenAI's API.

#### Parameters

##### \_\_namedParameters

###### options?

`Record`\<`string`, `unknown`\> = `{}`

###### systemPrompt

`string`

###### userPrompt

`string`

#### Returns

`Promise`\<[`ILLMResponse`](../../../../services/llm-provider.interface/classes/ILLMResponse.md)\>

#### Throws

Normalized error with `.status` and `.originalError` properties

#### Example

```ts
const response = await provider.generateCompletion({
  systemPrompt: "You are a helpful assistant",
  userPrompt: "Explain async/await",
  options: { params: { temperature: 0.3 } }
});
console.log(response.content);
```

#### Implementation of

[`ILLMProvider`](../../../../services/llm-provider.interface/interfaces/ILLMProvider.md).[`generateCompletion`](../../../../services/llm-provider.interface/interfaces/ILLMProvider.md#generatecompletion)
