import { describe, it, expect, vi, beforeEach } from "vitest";
import { Parser } from "../parser-service.js";

describe("Parser", () => {
  let llmClientServiceMock;
  let loggerMock;
  let parser;

  const PROVIDER = "test-provider";
  const SYSTEM_PROMPT = "system-prompt";
  const INPUT = "user input";

  beforeEach(() => {
    llmClientServiceMock = {
      generateCompletion: vi.fn(),
    };

    loggerMock = {
      debug: vi.fn(),
      error: vi.fn(),
    };

    parser = new Parser(
      llmClientServiceMock,
      PROVIDER,
      loggerMock,
      SYSTEM_PROMPT,
    );
  });

  it("parses valid JSON response from LLM", async () => {
    const mockResponse = {
      content: JSON.stringify({ foo: "bar" }),
    };

    llmClientServiceMock.generateCompletion.mockResolvedValue(mockResponse);

    const result = await parser.parse(INPUT);

    expect(llmClientServiceMock.generateCompletion).toHaveBeenCalledWith(
      PROVIDER,
      SYSTEM_PROMPT,
      INPUT,
      {},
    );

    expect(result).toEqual({ foo: "bar" });
  });

  it("throws error if LLM returns invalid JSON", async () => {
    llmClientServiceMock.generateCompletion.mockResolvedValue({
      content: "not-json-at-all",
    });

    await expect(parser.parse(INPUT)).rejects.toThrow();
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it("allows updating system prompt", () => {
    const newPrompt = "new-system-prompt";

    parser.setSystemPrompt(newPrompt);

    expect(parser.getSystemPrompt()).toBe(newPrompt);
  });

  it("allows updating LLM provider", () => {
    const newProvider = "new-provider";

    parser.setLLMProvider(newProvider);

    expect(parser.getLLMProvider()).toBe(newProvider);
  });

  it("allows updating LLM client service", () => {
    const newService = { generateCompletion: vi.fn() };

    parser.setLLMClientService(newService);

    expect(parser.getLLMClientService()).toBe(newService);
  });
});
