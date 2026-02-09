/**
 * Searcher Interface
 * @module interfaces/searcher.interface
 *
 * Defines the contract for all academic searchers.
 */

import type { ParsedRecord } from "../types/searcher.types.js";

/**
 * Base interface for all academic searchers.
 *
 * Defines the contract for searching bibliographic records across different APIs.
 * All searcher implementations must follow this interface.
 *
 * @interface ISearcher
 */
export interface ISearcher {
  /**
   * Search for a parsed bibliographic record.
   * @param parsed - Parsed record with normalized fields
   * @param options - Search options (pagination, filters, etc.)
   * @returns Promise with search results
   */
  search(parsed: ParsedRecord, options?: Record<string, any>): Promise<any>;

  /**
   * Get the name/ID of this searcher.
   * @returns Unique identifier for the searcher
   */
  getName(): string;
}
