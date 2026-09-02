// Exactly what TMDB's /discover and /search return. Detail-only fields
// (runtime, genre objects, countries, certification) come from /movie/{id}
// and are deliberately absent rather than promised and never delivered.
export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;      // '' when TMDB has no release date yet
  poster_path: string | null; // null when the film has no artwork
  genre_ids: number[];
  original_language: string; // ISO 639-1 language code
  popularity: number;        // TMDB's trending metric, unbounded
  vote_average: number;
  vote_count: number;
}

export interface ScoredMovie extends Movie {
  score: number;      // calculated by scoring engine
}

export type Options = {
    id: string | number;
    name?: string;
    department?: string;
};

export type SelectionState = 
'yes' | 'maybe' | 'veto';



type PreferenceWeight = 5 | 3; // yes=5, maybe=3

interface WeightedFilter<T> {
  id: T;
  weight: PreferenceWeight;
}

export interface FilterCriteria {
  // Required — Yes/Maybe weighted, sent to TMDB with OR logic
  genres: WeightedFilter<number>[];

  // Required — hard filter, no weight
  vetoedGenres: number[];
  languages: string[];
  minRating: number;          // default: 6
  maxRating?: number;

  // Optional — hard filters
  keywords?: number[];
  people?: {
    id: number;
    department: string;
  }[];
  obscure?: boolean;        // when true, vote_count.lte = 200

  // Optional — scoring only, not sent to TMDB
  runtimeRange?: { min?: number; max?: number };
  releaseYearRange?: { from?: number; to?: number };

  // Controls
  sortBy: 'popularity.desc' | 'vote_average.desc';
  // Which ranked page to draw from; advances when Discover is pressed again
  // with unchanged filters.
  page?: number;
  filterForMe?: boolean;
}

export type SortKey = 'score' | 'vote_average' | 'popularity' | 'release_date' | 'title';

export type SortDirection = 'ascending' | 'descending';