/**
 * Multi-Searcher Service
 * @module services/multi-searcher-service
 *
 * Orchestrates multiple searchers with fallback strategy.
 *
 * **Strategy:**
 * 1. Run all searchers in parallel
 * 2. Return results from first successful searcher
 * 3. Fallback to next if first returns 0 results
 * 4. Merge results if multiple searchers succeed
 *
 * **Recommended order for Russian works:**
 * 1. eLibrary.ru (best Russian coverage)
 * 2. OpenAlex (good international + some Russian)
 * 3. Crossref (fallback for DOI-indexed works)
 */

import type { ParsedRecord, SearchResult } from "../infrastructure/data_providers/types/searcher.types.js";
import type { ISearcher } from "../infrastructure/data_providers/interfaces/searcher.interface.js";

export class MultiSearcherService {
  constructor(private searchers: ISearcher[]) {
    if (searchers.length === 0) {
      throw new Error("At least one searcher is required");
    }
  }

  /**
   * Search using all configured searchers with intelligent fallback.
   *
   * **Strategy:**
   * - Parallel execution for speed
   * - First non-empty result wins
   * - All errors logged but don't fail entire search
   *
   * @param parsed - Parsed bibliographic record
   * @param options - Search options
   * @returns Combined results with source attribution, sorted by confidence
   */
  async search(parsed: ParsedRecord, options: { perPage?: number } = {}): Promise<SearchResult[]> {
    const results = await Promise.allSettled(
      this.searchers.map(async (searcher) => {
        try {
          const data = await searcher.search(parsed, options);
          return {
            source: searcher.getName(),
            confidence: this.calculateConfidence(data),
            data,
          };
        } catch (error) {
          console.warn(`${searcher.getName()} failed:`, error);
          return null;
        }
      })
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<SearchResult> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value)
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  }

  /**
   * Calculate confidence score for search results.
   *
   * **Factors:**
   * - Number of results (more = lower confidence)
   * - Exact title match
   * - Year match
   * - Author match
   *
   * @param data - Search results from API
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(data: Record<string, unknown>): number {
    // TODO: Implement confidence calculation based on result quality
    // For now, return dummy score based on result count
    let resultCount = 0;

    // Try results array
    if (Array.isArray(data.results)) {
      resultCount = (data.results as unknown[]).length;
    } else if (data.message && typeof data.message === 'object' && 'items' in data.message) {
      // Try message.items array
      const items = (data.message as Record<string, unknown>).items;
      if (Array.isArray(items)) {
        resultCount = items.length;
      }
    }

    if (resultCount === 0) return 0;
    if (resultCount === 1) return 0.9;
    if (resultCount <= 3) return 0.7;
    return 0.5;
  }
}
