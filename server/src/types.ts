// Priority weight for positive filters (4-point scoring scale)
type FilterPriority = 5 | 3 | 1; // must_have=5, prefer=3, nice_to_have=1

// Veto strength for negative filters
type VetoStrength = 'hard' | 'soft'; // hard = binary elimination, soft = -3 scoring penalty

// A vetoed genre with its strength
interface WeightedVeto {
  genreId: number;
  strength: VetoStrength; // 'hard' = eliminate before scoring, 'soft' = -3 penalty in scoring
}

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


// Movie with scoring data attached
export interface ScoredMovie extends Movie {
  score: number;      // calculated by scoring engine
}


interface Keyword {
  id: number;               // TMDB keyword ID
  name: string;
}

interface Person {
  id: number;               // TMDB person ID
  name: string;
  profile_url?: string;     // headshot image
  known_for_department: string; // "Acting", "Directing", etc. — used to auto-route to with_cast or with_crew
}
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

// v2 additions
interface MovieSubmission extends ScoredMovie {
  submitted_by: string[];     // session_ids (v3)
  submission_count: number;   // how many players submitted (v3)
  seed: number;               // bracket position (informed by match_score)
}

interface Matchup {
  matchup_id: string;
  room_id: string;
  round: string;
  bracket: 'winners' | 'losers' | 'grand_final';
  movie_a_tmdb_id: number;
  movie_b_tmdb_id: number;
  votes: Record<string, number>; // session_id → chosen tmdb_id
  winner_tmdb_id: number | null;
  is_tie: boolean;
}

// v3 additions
interface Room {
  room_id: string;
  host_session_id: string;
  status: 'lobby' | 'filtering' | 'submitting' | 'reveal' | 'tournament' | 'losers_bracket' | 'grand_final' | 'complete';
  created_at: Date;
  last_activity_at: Date;
  resolved_filters: FilterCriteria; // averaged from all players' individual FilterCriteria
}

interface Player {
  session_id: string;
  room_id: string;
  display_name: string;
  avatar: string;             // emoji identifier
  is_host: boolean;
  is_connected: boolean;
  filters: FilterCriteria;    // this player's individual weighted filters
}