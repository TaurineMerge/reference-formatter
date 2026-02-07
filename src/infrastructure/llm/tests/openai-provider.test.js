import "reflect-metadata";
import { describe, it, expect, beforeEach } from "vitest";
import { OpenAIProvider } from "../openai-provider.js";
import { LLMProviderConfig } from "../../../services/llm-provider.interface.js";

describe("OpenAIProvider", () => {
  describe("Constructor", () => {
    it("should throw error when API key is missing", () => {
      expect(() => {
        new OpenAIProvider("");
      }).toThrow("OpenAI API key is required");
    });

    it("should throw error when API key is null", () => {
      expect(() => {
        new OpenAIProvider(null);
      }).toThrow("OpenAI API key is required");
    });

    it("should throw error when API key is undefined", () => {
      expect(() => {
        new OpenAIProvider(undefined);
      }).toThrow("OpenAI API key is required");
    });

    it("should set default config values when initialized with valid API key", () => {
      const provider = new OpenAIProvider("test-api-key");

      expect(provider.config.model).toBe("gpt-4o-mini");
      expect(provider.config.temperature).toBe(0.7);
      expect(provider.config.maxTokens).toBe(256);
      expect(provider.config.topP).toBe(1);
      expect(provider.config.frequencyPenalty).toBe(0);
      expect(provider.config.presencePenalty).toBe(0);
    });

    it("should accept custom LLMProviderConfig", () => {
      const config = new LLMProviderConfig({
        model: "gpt-4",
        temperature: 0.5,
        maxTokens: 512,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5,
      });

      const provider = new OpenAIProvider("api-key", config);

      expect(provider.config.model).toBe("gpt-4");
      expect(provider.config.temperature).toBe(0.5);
      expect(provider.config.maxTokens).toBe(512);
      expect(provider.config.topP).toBe(0.9);
      expect(provider.config.frequencyPenalty).toBe(0.5);
      expect(provider.config.presencePenalty).toBe(0.5);
    });

    it("should merge additional params from config", () => {
      const config = new LLMProviderConfig({
        additionalParams: {
          logprobs: true,
          top_logprobs: 2,
        },
      });

      const provider = new OpenAIProvider("api-key", config);

      expect(provider.config.logprobs).toBe(true);
      expect(provider.config.top_logprobs).toBe(2);
    });

    it("should create OpenAI client instance", () => {
      const provider = new OpenAIProvider("test-api-key");
      expect(provider.client).toBeDefined();
      expect(provider.client.chat).toBeDefined();
      expect(provider.client.chat.completions).toBeDefined();
      expect(typeof provider.client.chat.completions.create).toBe("function");
    });
  });

  describe("normalizeError", () => {
    let provider;

    beforeEach(() => {
      provider = new OpenAIProvider("test-api-key");
    });

    it("should normalize APIError with status", () => {
      const error = new Error("API Error");
      error.status = 400;
      error.name = "APIError";

      const normalized = provider.normalizeError(error);

      expect(normalized).toBeDefined();
      expect(normalized.status).toBe(400);
      expect(normalized.originalError).toBe(error);
    });

    it("should preserve status from error", () => {
      const error = new Error("Server Error");
      error.status = 500;

      const normalized = provider.normalizeError(error);

      expect(normalized.status).toBe(500);
    });

    it("should return non-API errors unchanged", () => {
      const error = new Error("Regular error");

      const normalized = provider.normalizeError(error);

      expect(normalized).toBe(error);
    });

    it("should handle 401 status", () => {
      const error = new Error("Unauthorized");
      error.status = 401;
      error.name = "APIError";

      const normalized = provider.normalizeError(error);

      expect(normalized.status).toBe(401);
    });

    it("should handle 429 status", () => {
      const error = new Error("Rate Limited");
      error.status = 429;
      error.name = "APIError";

      const normalized = provider.normalizeError(error);

      expect(normalized.status).toBe(429);
    });
  });

  describe("Config variations", () => {
    it("should work with timeout configuration", () => {
      const config = new LLMProviderConfig({
        timeout: 60000,
      });

      const provider = new OpenAIProvider("api-key", config);
      expect(provider).toBeDefined();
    });

    it("should work with maxRetries configuration", () => {
      const config = new LLMProviderConfig({
        maxRetries: 5,
      });

      const provider = new OpenAIProvider("api-key", config);
      expect(provider).toBeDefined();
    });

    it("should work with multiple advanced parameters", () => {
      const config = new LLMProviderConfig({
        model: "gpt-4-turbo",
        temperature: 0.2,
        maxTokens: 2048,
        topP: 0.95,
        frequencyPenalty: 0.2,
        presencePenalty: 0.1,
        timeout: 120000,
        maxRetries: 10,
        additionalParams: {
          seed: 42,
          logprobs: true,
        },
      });

      const provider = new OpenAIProvider("api-key", config);

      expect(provider.config.model).toBe("gpt-4-turbo");
      expect(provider.config.temperature).toBe(0.2);
      expect(provider.config.maxTokens).toBe(2048);
      expect(provider.config.topP).toBe(0.95);
      expect(provider.config.frequencyPenalty).toBe(0.2);
      expect(provider.config.presencePenalty).toBe(0.1);
      expect(provider.config.seed).toBe(42);
      expect(provider.config.logprobs).toBe(true);
    });
  });

  describe("Instance methods", () => {
    let provider;

    beforeEach(() => {
      provider = new OpenAIProvider("test-api-key");
    });

    it("should have generateCompletion method", () => {
      expect(typeof provider.generateCompletion).toBe("function");
    });

    it("should have normalizeError method", () => {
      expect(typeof provider.normalizeError).toBe("function");
    });

    it("should have client property", () => {
      expect(provider.client).toBeDefined();
    });

    it("should have config property", () => {
      expect(provider.config).toBeDefined();
      expect(typeof provider.config).toBe("object");
    });
  });
});
