/**
 * Data Providers - Barrel Export
 * @module data_providers
 *
 * Centralized exports for all searcher implementations and types.
 */

// Types
export type {
  ParsedAuthor,
  ParsedTitle,
  ParsedJournal,
  ParsedRecord,
  SearchResult,
  PublicationType,
} from "./types/searcher.types.js";

// Interfaces
export type { ISearcher } from "./interfaces/searcher.interface.js";

// Searchers
export { OpenAlexSearcher } from "./searchers/openalex-searcher.js";
export { CrossrefSearcher } from "./searchers/crossref-searcher.js";
export { CyberLeninkaSearcher } from "./searchers/cyberleninka-searcher.js";
export { SemanticScholarSearcher } from "./searchers/semantic-scholar-searcher.js";
