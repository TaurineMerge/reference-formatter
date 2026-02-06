[**reference-formatter-api v1.0.0**](../../../README.md)

***

[reference-formatter-api](../../../README.md) / [services/parser-service](../README.md) / Parser

# Class: Parser

Defined in: services/parser-service.ts:24

Orchestrates parsing of unstructured text into structured JSON using an LLM.
Handles system prompts, provider selection, and client service orchestration.

## Param

Service to manage LLM completion requests

## Param

LLM provider instance (e.g., OpenAIProvider)

## Param

Logger instance for debug and error tracking

## Param

Instructions guiding parsing behavior

## Example

```ts
const parser = new Parser(
  clientService,
  openaiProvider,
  #logger,
  "You are a JSON parser. Extract structured data from raw text."
);
```

## Constructors

### Constructor

> **new Parser**(`llmClientService`, `llmProvider`, `logger`, `systemPrompt?`): `Parser`

Defined in: services/parser-service.ts:30

#### Parameters

##### llmClientService

[`LLMClientService`](../../llm-client-service/classes/LLMClientService.md)

##### llmProvider

[`ILLMProvider`](../../llm-provider.interface/interfaces/ILLMProvider.md)

##### logger

`Logger`

##### systemPrompt?

`string` = `PARSER_SYSTEM_PROMPT`

#### Returns

`Parser`

## Methods

### getLLMClientService()

> **getLLMClientService**(): [`LLMClientService`](../../llm-client-service/classes/LLMClientService.md)

Defined in: services/parser-service.ts:131

Returns the current LLM client service.

#### Returns

[`LLMClientService`](../../llm-client-service/classes/LLMClientService.md)

Current client service instance

***

### getLLMProvider()

> **getLLMProvider**(): [`ILLMProvider`](../../llm-provider.interface/interfaces/ILLMProvider.md)

Defined in: services/parser-service.ts:122

Returns the current LLM provider.

#### Returns

[`ILLMProvider`](../../llm-provider.interface/interfaces/ILLMProvider.md)

Current provider instance

***

### getSystemPrompt()

> **getSystemPrompt**(): `string`

Defined in: services/parser-service.ts:113

Returns the current system prompt.

#### Returns

`string`

Current system prompt

***

### parse()

> **parse**(`input`): `Promise`\<`object`\>

Defined in: services/parser-service.ts:57

Parses raw text into a structured JSON object using the configured LLM provider.
Retries and error handling are delegated to the LLM client service.

#### Parameters

##### input

`string`

Raw text input to parse

#### Returns

`Promise`\<`object`\>

Parsed JSON object

#### Throws

If the LLM response is not valid JSON

#### Throws

If LLM request fails (network errors, API errors, or provider errors)

#### Example

```ts
const result = await parser.parse("John Doe, age 30, lives in New York");
// Returns: { name: "John Doe", age: 30, city: "New York" }
```

***

### setLLMClientService()

> **setLLMClientService**(`llmClientService`): `void`

Defined in: services/parser-service.ts:103

Updates the LLM client service instance used for managing requests.

#### Parameters

##### llmClientService

[`LLMClientService`](../../llm-client-service/classes/LLMClientService.md)

New client service instance

#### Returns

`void`

***

### setLLMProvider()

> **setLLMProvider**(`llmProvider`): `void`

Defined in: services/parser-service.ts:93

Updates the LLM provider instance used for parsing.

#### Parameters

##### llmProvider

[`ILLMProvider`](../../llm-provider.interface/interfaces/ILLMProvider.md)

New LLM provider

#### Returns

`void`

***

### setSystemPrompt()

> **setSystemPrompt**(`systemPrompt`): `void`

Defined in: services/parser-service.ts:83

Updates the system prompt guiding the parsing behavior.

#### Parameters

##### systemPrompt

`string`

New system prompt

#### Returns

`void`
