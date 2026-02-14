import { describe, it, expect, vi, beforeEach, Mocked } from "vitest";
import { MultiSearcherService } from "../multi-searcher-service.js";
import type { ISearcher } from "../../infrastructure/data_providers/interfaces/searcher.interface.js";
import type { ParsedRecord } from "../../infrastructure/data_providers/types/searcher.types.js";

type SearchResultData = Record<string, unknown>;

describe("MultiSearcherService", () => {
  let searcher1Mock: Mocked<ISearcher>;
  let searcher2Mock: Mocked<ISearcher>;
  let searcher3Mock: Mocked<ISearcher>;
  let service: MultiSearcherService;

  const mockParsedRecord: ParsedRecord = {
    author: {
      raw: "John Doe",
      lastName: "Doe",
      initials: "J.D.",
    },
    title: {
      raw: "Machine Learning Basics",
      normalized: "machine learning basics",
      keywords: ["machine", "learning"],
    },
    year: "2020",
    journal: {
      raw: "Nature",
      normalized: "nature",
    },
    doi: "10.1234/test",
  };

  beforeEach(() => {
    searcher1Mock = {
      search: vi.fn(),
      getName: vi.fn().mockReturnValue("Searcher1"),
    } as Mocked<ISearcher>;

    searcher2Mock = {
      search: vi.fn(),
      getName: vi.fn().mockReturnValue("Searcher2"),
    } as Mocked<ISearcher>;

    searcher3Mock = {
      search: vi.fn(),
      getName: vi.fn().mockReturnValue("Searcher3"),
    } as Mocked<ISearcher>;

    service = new MultiSearcherService([searcher1Mock, searcher2Mock, searcher3Mock]);

    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create service with single searcher", () => {
      const service = new MultiSearcherService([searcher1Mock]);
      expect(service).toBeDefined();
    });

    it("should create service with multiple searchers", () => {
      const service = new MultiSearcherService([searcher1Mock, searcher2Mock, searcher3Mock]);
      expect(service).toBeDefined();
    });

    it("should throw error when no searchers provided", () => {
      expect(() => new MultiSearcherService([])).toThrow("At least one searcher is required");
    });
  });

  describe("search", () => {
    beforeEach(() => {
      service = new MultiSearcherService([searcher1Mock, searcher2Mock, searcher3Mock]);
    });

    it("should return results from successful searchers", async () => {
      const mockResults1: SearchResultData = { results: [{ id: "1", title: "Paper 1" }] };
      const mockResults2: SearchResultData = { results: [{ id: "2", title: "Paper 2" }] };

      searcher1Mock.search.mockResolvedValue(mockResults1);
      searcher2Mock.search.mockResolvedValue(mockResults2);
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      expect(results).toHaveLength(3);
      expect(results[0].source).toBeDefined();
      expect(results[0].confidence).toBeDefined();
      expect(results[0].data).toBeDefined();
    });

    it("should handle single result with high confidence", async () => {
      const mockResults: SearchResultData = { results: [{ id: "1", title: "Paper 1" }] };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      const searcher1Result = results.find((r) => r.source === "Searcher1");
      expect(searcher1Result).toBeDefined();
      expect(searcher1Result?.confidence).toBe(0.9);
    });

    it("should handle 2-3 results with medium confidence", async () => {
      const mockResults: SearchResultData = {
        results: [
          { id: "1", title: "Paper 1" },
          { id: "2", title: "Paper 2" },
        ],
      };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      const searcher1Result = results.find((r) => r.source === "Searcher1");
      expect(searcher1Result?.confidence).toBe(0.7);
    });

    it("should handle >3 results with lower confidence", async () => {
      const mockResults: SearchResultData = {
        results: [
          { id: "1", title: "Paper 1" },
          { id: "2", title: "Paper 2" },
          { id: "3", title: "Paper 3" },
          { id: "4", title: "Paper 4" },
        ],
      };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      const searcher1Result = results.find((r) => r.source === "Searcher1");
      expect(searcher1Result?.confidence).toBe(0.5);
    });

    it("should sort results by confidence in descending order", async () => {
      const mockResults1: SearchResultData = { results: [{ id: "1" }] }; // 0.9 confidence
      const mockResults2: SearchResultData = {
        results: [{ id: "2" }, { id: "3" }],
      }; // 0.7 confidence
      const mockResults3: SearchResultData = {
        results: [{ id: "4" }, { id: "5" }, { id: "6" }, { id: "7" }],
      }; // 0.5 confidence

      searcher1Mock.search.mockResolvedValue(mockResults1);
      searcher2Mock.search.mockResolvedValue(mockResults2);
      searcher3Mock.search.mockResolvedValue(mockResults3);

      const results = await service.search(mockParsedRecord);

      expect(results[0].confidence).toBe(0.9);
      expect(results[1].confidence).toBe(0.7);
      expect(results[2].confidence).toBe(0.5);
    });

    it("should handle searcher errors gracefully", async () => {
      const mockResults: SearchResultData = { results: [{ id: "1" }] };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockRejectedValue(new Error("API Error"));
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      // Should have results from searcher1 and searcher3 (empty), but not searcher2
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.source)).toContain("Searcher1");
      expect(results.map((r) => r.source)).toContain("Searcher3");
      expect(results.map((r) => r.source)).not.toContain("Searcher2");
    });

    it("should handle all searchers failing", async () => {
      searcher1Mock.search.mockRejectedValue(new Error("Error 1"));
      searcher2Mock.search.mockRejectedValue(new Error("Error 2"));
      searcher3Mock.search.mockRejectedValue(new Error("Error 3"));

      const results = await service.search(mockParsedRecord);

      expect(results).toEqual([]);
    });

    it("should support search options (perPage)", async () => {
      const mockResults: SearchResultData = { results: [{ id: "1" }] };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const options = { perPage: 50 };
      await service.search(mockParsedRecord, options);

      expect(searcher1Mock.search).toHaveBeenCalledWith(mockParsedRecord, options);
      expect(searcher2Mock.search).toHaveBeenCalledWith(mockParsedRecord, options);
      expect(searcher3Mock.search).toHaveBeenCalledWith(mockParsedRecord, options);
    });

    it("should handle empty parsed record", async () => {
      const emptyRecord: ParsedRecord = {};

      searcher1Mock.search.mockResolvedValue({ results: [] });
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(emptyRecord);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.confidence === 0)).toBe(true);
    });

    it("should include source name in results", async () => {
      const mockResults1: SearchResultData = { results: [{ id: "1" }] };

      searcher1Mock.search.mockResolvedValue(mockResults1);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      const searcher1Result = results.find((r) => r.source === "Searcher1");
      expect(searcher1Result?.source).toBe("Searcher1");
    });

    it("should handle results with message.items format", async () => {
      const mockResults: SearchResultData = {
        message: {
          items: [{ id: "1" }, { id: "2" }, { id: "3" }],
        },
      };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      const searcher1Result = results.find((r) => r.source === "Searcher1");
      expect(searcher1Result?.confidence).toBe(0.7); // 3 items = 0.7 confidence
    });

    it("should preserve original data in results", async () => {
      const mockResults: SearchResultData = {
        results: [
          {
            id: "1",
            title: "Paper",
            authors: ["Doe, J.", "Smith, A."],
            publicationDate: "2020-01-15",
          },
        ],
      };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });
      searcher3Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      const searcher1Result = results.find((r) => r.source === "Searcher1");
      expect(searcher1Result?.data).toEqual(mockResults);
    });

    it("should run all searchers in parallel", async () => {
      const mockResults: SearchResultData = { results: [] };

      searcher1Mock.search.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResults), 100))
      );
      searcher2Mock.search.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResults), 100))
      );
      searcher3Mock.search.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResults), 100))
      );

      const startTime = Date.now();
      await service.search(mockParsedRecord);
      const duration = Date.now() - startTime;

      // If executed sequentially, would take 300ms+, parallel should be much less
      expect(duration).toBeLessThan(250);
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      service = new MultiSearcherService([searcher1Mock, searcher2Mock]);
    });

    it("should handle null values in search results", async () => {
      const mockResults: SearchResultData = { results: null };

      searcher1Mock.search.mockResolvedValue(mockResults);
      searcher2Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.confidence === 0)).toBe(true);
    });

    it("should handle undefined data object", async () => {
      searcher1Mock.search.mockResolvedValue(undefined as unknown as SearchResultData);
      searcher2Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      expect(results).toHaveLength(1); // Only searcher2 succeeds
      expect(results[0].source).toBe("Searcher2");
    });

    it("should handle searchers returning different result formats", async () => {
      const mockResults1: SearchResultData = { results: [{ id: "1" }] };
      const mockResults2: SearchResultData = {
        message: {
          items: [{ id: "2" }, { id: "3" }],
        },
      };

      searcher1Mock.search.mockResolvedValue(mockResults1);
      searcher2Mock.search.mockResolvedValue(mockResults2);

      const results = await service.search(mockParsedRecord);

      expect(results).toHaveLength(2);
      expect(results[0].source).toBe("Searcher1"); // 0.9 confidence > 0.7
      expect(results[0].confidence).toBe(0.9);
      expect(results[1].confidence).toBe(0.7);
    });

    it("should handle zero results with zero confidence", async () => {
      searcher1Mock.search.mockResolvedValue({ results: [] });
      searcher2Mock.search.mockResolvedValue({ results: [] });

      const results = await service.search(mockParsedRecord);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.confidence === 0)).toBe(true);
    });
  });
});
