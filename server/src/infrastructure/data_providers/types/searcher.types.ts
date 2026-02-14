/**
 * Searcher Types
 * @module types/searcher.types
 *
 * Defines all type definitions used by academic searchers.
 */

/**
 * Parsed author information from a bibliographic record.
 */
export type ParsedAuthor = {
  raw: string;
  lastName: string | null;
  initials: string | null;
};

/**
 * Parsed title information with normalization.
 */
export type ParsedTitle = {
  raw: string;
  normalized: string;
  keywords: string[];
};

/**
 * Parsed journal information.
 */
export type ParsedJournal = {
  raw: string;
  normalized: string;
};

/**
 * Publication types supported by searchers.
 */
export type PublicationType = "book" | "article" | "chapter" | "thesis" | "archival" | "conference" | "web" | "unknown";

/**
 * Parsed bibliographic record with normalized fields.
 * Fields are optional as some may not be available in the source.
 */
export type ParsedRecord = {
  author?: ParsedAuthor;
  title?: ParsedTitle;
  year?: string | null;
  publicationType?: PublicationType;
  journal?: ParsedJournal | null;
  doi?: string | null;
  isbn?: string | null;
};

/**
 * Search result from a single searcher with source attribution.
 */
export type SearchResult = {
  source: string;
  confidence: number;
  data: Record<string, unknown>;
};
