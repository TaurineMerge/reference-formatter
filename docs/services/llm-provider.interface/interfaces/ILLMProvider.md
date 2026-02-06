[**reference-formatter-api v1.0.0**](../../../README.md)

***

[reference-formatter-api](../../../README.md) / [services/llm-provider.interface](../README.md) / ILLMProvider

# Interface: ILLMProvider

Defined in: services/llm-provider.interface.ts:12

Base interface that all LLM providers must implement.
Defines the contract for generating completions from language models.

## Example

```ts
class OpenAIProvider implements ILLMProvider {
  async generateCompletion({ systemPrompt, userPrompt, options }) {
    // implementation
  }
}
```

## Methods

### generateCompletion()

> **generateCompletion**(`params`): `Promise`\<[`ILLMResponse`](../classes/ILLMResponse.md)\>

Defined in: services/llm-provider.interface.ts:18

Generates a completion from the LLM based on system and user prompts.

#### Parameters

##### params

Parameters for generation

###### options?

`Record`\<`string`, `unknown`\>

###### systemPrompt

`string`

###### userPrompt

`string`

#### Returns

`Promise`\<[`ILLMResponse`](../classes/ILLMResponse.md)\>

#### Throws

Throws if method is not implemented in provider
