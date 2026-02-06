export class ILLMProvider {
  async generateCompletion(params) {
    throw new Error("Method not implemented");
  }
}

export class ILLMResponse {
  constructor(content, usage, rawResponse) {
    this.content = content;
    this.usage = usage;
    this.rawResponse = rawResponse;
  }
}

export class LLMProviderConfig {
  constructor({
    model,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    timeout,
    maxRetries,
    additionalParams = {},
  }) {
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.topP = topP;
    this.frequencyPenalty = frequencyPenalty;
    this.presencePenalty = presencePenalty;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.additionalParams = additionalParams;
  }
}
