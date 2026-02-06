import { PARSER_SYSTEM_PROMPT } from "../helpers/parser-llm-sys-prompt.js";

export class Parser {
  #systemPrompt;
  #llmProvider;
  #llmClientService;

  /**
   * Initializes a new instance of the Parser class.
   *
   * @param {LLMClientService} llmClientService - The LLM client service to use for generating completions.
   * @param {LLMProvider} llmProvider - The LLM provider to use for generating completions.
   * @param {Logger} logger - The logger to use for logging debug messages.
   * @param {string} [systemPrompt=PARSER_SYSTEM_PROMPT] - The system prompt to use when generating completions.
   */
  constructor(
    llmClientService,
    llmProvider,
    logger,
    systemPrompt = PARSER_SYSTEM_PROMPT,
  ) {
    this.logger = logger;
    this.#systemPrompt = systemPrompt;
    this.#llmProvider = llmProvider;
    this.#llmClientService = llmClientService;
    this.logger.debug("[Parser] Initialized");
  }

  /**
   * Parses the given input using the configured LLM provider.
   *
   * @param {string} input - The input to parse.
   *
   * @returns {Promise<object>} A promise that resolves to the parsed JSON object.
   *
   * @throws {Error} If there is an error parsing the input.
   */
  async parse(input) {
    this.logger.debug(`[Parser] Parsing input: ${input}`);
    try {
      const response = await this.#llmClientService.generateCompletion(
        this.#llmProvider,
        this.#systemPrompt,
        input,
        {},
      );
      return JSON.parse(response.content);
    } catch (error) {
      this.logger.error(`[Parser] Error parsing input: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates the system prompt used by the parser when generating completions.
   *
   * @param {string} systemPrompt - The new system prompt to use.
   */
  setSystemPrompt(systemPrompt) {
    this.#systemPrompt = systemPrompt;
    this.logger.debug(`[Parser] System prompt updated`);
  }

  /**
   * Updates the LLM provider used by the parser when generating completions.
   *
   * @param {LLMProvider} llmProvider - The new LLM provider to use.
   */
  setLLMProvider(llmProvider) {
    this.#llmProvider = llmProvider;
    this.logger.debug(`[Parser] LLM provider updated`);
  }

  /**
   * Updates the LLM client service used by the parser when generating completions.
   *
   * @param {LLMClientService} llmClientService - The new LLM client service to use.
   */
  setLLMClientService(llmClientService) {
    this.#llmClientService = llmClientService;
    this.logger.debug(`[Parser] LLM client service updated`);
  }

  /**
   * Retrieves the current system prompt used by the parser when generating completions.
   *
   * @returns {string} The current system prompt.
   */
  getSystemPrompt() {
    return this.#systemPrompt;
  }

  /**
   * Retrieves the current LLM provider used by the parser when generating completions.
   *
   * @returns {LLMProvider} The current LLM provider.
   */
  getLLMProvider() {
    return this.#llmProvider;
  }

  /**
   * Retrieves the current LLM client service used by the parser when generating completions.
   *
   * @returns {LLMClientService} The current LLM client service.
   */
  getLLMClientService() {
    return this.#llmClientService;
  }
}
