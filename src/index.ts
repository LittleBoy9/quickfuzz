/**
 * A key or list of keys to search in object data.
 */
type SearchKey<T> = keyof T | (keyof T)[];

/**
 * A single fuzzy search result with match metadata.
 */
export interface FuzzySearchResult<T> {
  /** The original item from the dataset. */
  item: T;
  /** Match score between 0 and 1. Higher is better. */
  score: number;
  /** Indices of matched characters in the target string. */
  matches: number[];
}

/**
 * Computes a fuzzy match score and matched character indices.
 */
function fuzzyMatch(
  query: string,
  target: string,
  caseSensitive: boolean
): { score: number; matches: number[] } {
  const q = caseSensitive ? query : query.toLowerCase();
  const t = caseSensitive ? target : target.toLowerCase();

  if (q.length === 0 || t.length === 0) return { score: 0, matches: [] };

  // Exact match
  if (q === t) {
    return { score: 1, matches: Array.from({ length: t.length }, (_, i) => i) };
  }

  // Full substring match
  if (t.includes(q)) {
    const idx = t.indexOf(q);
    const positionBonus = 1 - idx / t.length;
    const lengthRatio = q.length / t.length;
    const score = 0.8 + 0.1 * positionBonus + 0.1 * lengthRatio;
    const matches = Array.from({ length: q.length }, (_, i) => idx + i);
    return { score, matches };
  }

  // Character-by-character sequential matching
  let qIdx = 0;
  let score = 0;
  let consecutive = 0;
  let firstMatchIdx = -1;
  const matches: number[] = [];

  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      if (firstMatchIdx === -1) firstMatchIdx = tIdx;
      consecutive++;
      score += consecutive * consecutive;
      matches.push(tIdx);
      qIdx++;
    } else {
      consecutive = 0;
    }
  }

  // Not all query characters found
  if (qIdx < q.length) return { score: 0, matches: [] };

  // Normalize score
  const maxPossibleScore = q.length * q.length;
  let normalizedScore = score / maxPossibleScore;

  // Position bonus: earlier matches are better
  const positionBonus = 1 - firstMatchIdx / t.length;
  normalizedScore = normalizedScore * 0.7 + positionBonus * 0.15;

  // Length similarity bonus
  const lengthRatio = q.length / t.length;
  normalizedScore += lengthRatio * 0.15;

  return { score: Math.min(normalizedScore, 0.79), matches };
}

/**
 * Converts a threshold (1–10) to a minimum score (0–1).
 * 1 = very loose, 10 = very strict.
 */
function thresholdToMinScore(threshold: number): number {
  const clamped = Math.max(1, Math.min(10, threshold));
  return 0.05 + (clamped - 1) * (0.69 / 9);
}

/**
 * Options for configuring fuzzy search behavior.
 */
export interface FuzzySearchOptions<T> {
  /** Key(s) in the object to search. If omitted, the entire string value is searched. */
  key?: SearchKey<T>;
  /** Match tightness (1–10). Higher means stricter matches. Default is 5. */
  threshold?: number;
  /** Whether matching is case-sensitive. Default is false. */
  caseSensitive?: boolean;
  /** Maximum number of results to return. Default is unlimited. */
  maxResults?: number;
}

/**
 * Creates a fuzzy search function for strings or object arrays.
 *
 * @template T - The type of items in the array.
 * @param data - The array to search.
 * @param options - Configuration options for the search.
 *
 * @returns A function that accepts a query string and returns matching items sorted by score.
 *
 * @example
 * ```ts
 * const fruits = ["apple", "pineapple", "grape"];
 * const searchFruits = createFuzzySearch(fruits, { threshold: 7 });
 * searchFruits("appl"); // ["apple", "pineapple"]
 *
 * const users = [{ name: "Alice" }, { name: "Bob" }];
 * const searchUsers = createFuzzySearch(users, { key: "name", maxResults: 5 });
 * searchUsers("ali"); // [{ name: "Alice" }]
 * ```
 */
export function createFuzzySearch<T>(
  data: T[],
  options?: FuzzySearchOptions<T>
): {
  (query: string): T[];
  search(query: string): FuzzySearchResult<T>[];
} {
  const threshold = options?.threshold ?? 5;
  const caseSensitive = options?.caseSensitive ?? false;
  const maxResults = options?.maxResults ?? 0;
  const minScore = thresholdToMinScore(threshold);
  const keys = options?.key
    ? Array.isArray(options.key)
      ? options.key
      : [options.key]
    : null;

  function execute(query: string): FuzzySearchResult<T>[] {
    if (!query || query.trim().length === 0) return [];

    const scored: FuzzySearchResult<T>[] = [];

    for (const item of data) {
      let bestScore = 0;
      let bestMatches: number[] = [];

      if (keys) {
        for (const key of keys) {
          const value = (item as any)[key];
          if (typeof value === "string") {
            const result = fuzzyMatch(query, value, caseSensitive);
            if (result.score > bestScore) {
              bestScore = result.score;
              bestMatches = result.matches;
            }
          }
        }
      } else {
        const value = typeof item === "string" ? item : String(item);
        const result = fuzzyMatch(query, value, caseSensitive);
        bestScore = result.score;
        bestMatches = result.matches;
      }

      if (bestScore >= minScore) {
        scored.push({ item, score: bestScore, matches: bestMatches });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    if (maxResults > 0) {
      return scored.slice(0, maxResults);
    }
    return scored;
  }

  // Simple call returns just the items
  const searchFn = (query: string): T[] => {
    return execute(query).map((r) => r.item);
  };

  // .search() returns full results with score and match indices
  searchFn.search = (query: string): FuzzySearchResult<T>[] => {
    return execute(query);
  };

  return searchFn;
}
