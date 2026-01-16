import { distance, includes } from "@libn/fuzzy";
import { colors } from "cliffy/ansi";
import { Task } from "../types.ts";

export interface FuzzySearchOptions {
  threshold?: number;
  fieldWeights?: {
    description: number;
    details: number;
    tags: number;
  };
}

export interface FuzzySearchResult {
  task: Task;
  score: number;
  matches: {
    field: string;
    text: string;
    highlighted: string;
  }[];
}

const DEFAULT_OPTIONS: Required<FuzzySearchOptions> = {
  threshold: 0.7, // 70% similarity
  fieldWeights: {
    description: 1.0,
    details: 0.8,
    tags: 0.6,
  },
};

/**
 * Calculate similarity score between two strings using Levenshtein distance
 */
function calculateSimilarity(query: string, target: string): number {
  if (!query || !target) return 0;
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  const dist = distance(queryLower, targetLower);
  const maxLen = Math.max(queryLower.length, targetLower.length);
  return maxLen > 0 ? 1 - (dist / maxLen) : 1;
}

/**
 * Highlight fuzzy matches in text using colors
 */
export function highlightMatches(
  text: string,
  query: string,
  threshold = 0.7,
): string {
  if (!text || !query) return text;

  // Simple word-based highlighting for now
  // Could be improved with more sophisticated fuzzy highlighting
  const words = text.split(/\s+/);
  const highlightedWords = words.map((word) => {
    const similarity = calculateSimilarity(
      query.toLowerCase(),
      word.toLowerCase(),
    );
    if (similarity >= threshold) {
      return colors.yellow(word); // Highlight matching words
    }
    return word;
  });

  return highlightedWords.join(" ");
}

/**
 * Perform fuzzy search on tasks
 */
export function fuzzySearchTasks(
  tasks: Task[],
  query: string,
  options: FuzzySearchOptions = {},
): FuzzySearchResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: FuzzySearchResult[] = [];

  for (const task of tasks) {
    const matches: FuzzySearchResult["matches"] = [];
    let totalScore = 0;

    // Search in description
    if (task.description) {
      const descSimilarity = calculateSimilarity(query, task.description);
      if (descSimilarity >= opts.threshold) {
        totalScore += descSimilarity * opts.fieldWeights.description;
        matches.push({
          field: "description",
          text: task.description,
          highlighted: highlightMatches(
            task.description,
            query,
            opts.threshold,
          ),
        });
      }
    }

    // Search in details
    if (task.details) {
      const detailsSimilarity = calculateSimilarity(query, task.details);
      if (detailsSimilarity >= opts.threshold) {
        totalScore += detailsSimilarity * opts.fieldWeights.details;
        matches.push({
          field: "details",
          text: task.details,
          highlighted: highlightMatches(task.details, query, opts.threshold),
        });
      }
    }

    // Search in tags
    if (task.tags && task.tags.length > 0) {
      for (const tag of task.tags) {
        const tagSimilarity = calculateSimilarity(query, tag);
        if (tagSimilarity >= opts.threshold) {
          totalScore += tagSimilarity * opts.fieldWeights.tags;
          matches.push({
            field: "tags",
            text: tag,
            highlighted: highlightMatches(tag, query, opts.threshold),
          });
        }
      }
    }

    // If we have matches, add to results
    if (matches.length > 0 && totalScore > 0) {
      results.push({
        task,
        score: totalScore,
        matches,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Check if a single task matches the fuzzy query
 */
export function taskMatchesFuzzy(
  task: Task,
  query: string,
  threshold = 0.7,
): boolean {
  // Quick check using includes for performance
  if (includes(query, task.description)) return true;
  if (task.details && includes(query, task.details)) return true;
  if (task.tags && task.tags.some((tag) => includes(query, tag))) return true;

  // Fallback to similarity scoring
  const similarity = calculateSimilarity(query, task.description);
  if (similarity >= threshold) return true;

  if (task.details) {
    const detailsSimilarity = calculateSimilarity(query, task.details);
    if (detailsSimilarity >= threshold) return true;
  }

  if (task.tags) {
    for (const tag of task.tags) {
      const tagSimilarity = calculateSimilarity(query, tag);
      if (tagSimilarity >= threshold) return true;
    }
  }

  return false;
}
