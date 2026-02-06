[**reference-formatter-api v1.0.0**](../../../README.md)

***

[reference-formatter-api](../../../README.md) / [services/llm-client-service](../README.md) / LLMClientService

# Class: LLMClientService

Defined in: services/llm-client-service.ts:15

Orchestrates LLM completion requests with automatic retry logic and error handling.
Manages the communication between application code and LLM providers, handling transient failures gracefully.

## Constructors

### Constructor

> **new LLMClientService**(`logger`): `LLMClientService`

Defined in: services/llm-client-service.ts:18

#### Parameters

##### logger

`Logger`

#### Returns

`LLMClientService`

## Methods

### generateCompletion()

> **generateCompletion**(`provider`, `systemPrompt`, `userPrompt`, `options?`): `Promise`\<`string` \| [`ILLMResponse`](../../llm-provider.interface/classes/ILLMResponse.md)\>

Defined in: services/llm-client-service.ts:29

Generates a completion from an LLM provider with automatic retry on transient failures.

#### Parameters

##### provider

[`ILLMProvider`](../../llm-provider.interface/interfaces/ILLMProvider.md)

##### systemPrompt

`string`

##### userPrompt

`string`

##### options?

`GenerateCompletionOptions` = `{}`

#### Returns

`Promise`\<`string` \| [`ILLMResponse`](../../llm-provider.interface/classes/ILLMResponse.md)\>

#### Throws

"Valid LLM provider is required" - If provider is missing or invalid

#### Throws

"Invalid API key" - If provider returns 401 status

#### Throws

"Invalid request: ..." - If provider returns 400 status
