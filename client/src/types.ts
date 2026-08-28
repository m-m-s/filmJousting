interface Genre {
  id: number;               // TMDB genre ID
  name: string;
}

export interface Movie {
  id: number;
  genre_ids: number[];
  title: string;
  release_date: string;
  poster_path: string;
  genres: Genre[];
  runtime: number;          // minutes
  country: string[];        // origin countries (ISO codes)
  original_language: string; // ISO 639-1 language code
  rating: number;           // TMDB vote_average
  vote_count: number;       // number of TMDB votes
  vote_average: number;    
  popularity: number;       // TMDB popularity score
  overview: string;
  certification?: string;   // MPAA rating (G, PG, PG-13, R, NC-17)
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
  filterForMe?: boolean;
}

export type SortKey = 'score' | 'vote_average' | 'popularity' | 'release_date' | 'title';

export type SortDirection = 'ascending' | 'descending';