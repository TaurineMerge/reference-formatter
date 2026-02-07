import { injectable } from "tsyringe";
import OpenAI from "openai";
import {
  ILLMProvider,
  ILLMResponse,
  LLMProviderConfig,
} from "../../services/llm-provider.interface.js";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import "dotenv/config";

/**
 * OpenAI API implementation of the LLM provider interface.
 * Handles chat completion requests, applies configuration defaults, and normalizes errors.
 *
 * @throws {Error} "OpenAI API key is required" - If apiKey is null, undefined, or empty
 *
 * @example
 * const provider = new OpenAIProvider("sk-...", new LLMProviderConfig({
 *   model: "gpt-4",
 *   temperature: 0.5,
 *   maxTokens: 1000
 * }));
 */
@injectable()
export class OpenAIProvider implements ILLMProvider {
  private client: OpenAI;
  private config: Record<string, unknown>;

  constructor(apiKey: string, config: LLMProviderConfig = new LLMProviderConfig({})) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    setGlobalDispatcher(new ProxyAgent(process.env.HTTP_PROXY || process.env.HTTPS_PROXY || ""));
    this.client = new OpenAI({
      apiKey,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
        });
      },
    });

    this.config = {
      model: config.model || "gpt-4o-mini",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 256,
      topP: config.topP || 1,
      frequencyPenalty: config.frequencyPenalty || 0,
      presencePenalty: config.presencePenalty || 0,
      ...config.additionalParams,
    };
  }

  /**
   * Generates a chat completion using OpenAI's API.
   * @throws {Error} Normalized error with `.status` and `.originalError` properties
   * @example
   * const response = await provider.generateCompletion({
   *   systemPrompt: "You are a helpful assistant",
   *   userPrompt: "Explain async/await",
   *   options: { params: { temperature: 0.3 } }
   * });
   * console.log(response.content);
   */
  async generateCompletion({
    systemPrompt,
    userPrompt,
    options = {},
  }: {
    systemPrompt: string;
    userPrompt: string;
    options?: Record<string, unknown>;
  }): Promise<ILLMResponse> {
    const params = {
      ...this.config,
      ...(typeof options.params === "object" && options.params ? options.params : {}),
    };

    try {
      const response = await this.client.chat.completions.create({
        model: params.model as string,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: params.temperature as number,
        max_tokens: params.maxTokens as number,
        top_p: params.topP as number,
        frequency_penalty: params.frequencyPenalty as number,
        presence_penalty: params.presencePenalty as number,
        ...(typeof params.additionalParams === "object" && params.additionalParams
          ? params.additionalParams
          : {}),
      });
      console.log("OpenAI response:", response);
      return new ILLMResponse(
        response.choices[0].message.content ?? "",
        response.usage ? (response.usage as unknown as Record<string, unknown>) : null,
        response as unknown as Record<string, unknown>
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Normalizes OpenAI SDK errors into a consistent format for upstream handling.
   * Adds `.status` and `.originalError` properties to facilitate uniform error handling.
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      const apiError = error as unknown as Record<string, unknown>;
      if (apiError.name === "APIError" || apiError.status) {
        const normalized = new Error(error.message);
        (normalized as unknown as Record<string, unknown>).status = apiError.status;
        (normalized as unknown as Record<string, unknown>).originalError = error;
        return normalized;
      }
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
