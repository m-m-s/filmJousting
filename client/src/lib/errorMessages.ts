// Mirrors server/src/errors.ts's ErrorCode union, plus a couple of codes
// that only ever happen client-side (the fetch call itself never reached
// the server at all). Keep this list in sync with the server's when adding
// a new code there.
export type ErrorCode =
  | 'DISCOVER_MISSING_GENRES'
  | 'DISCOVER_FAILED'
  | 'SEARCH_INVALID_TYPE'
  | 'SEARCH_MISSING_QUERY'
  | 'SEARCH_FAILED'
  | 'MOVIE_DETAILS_NOT_FOUND'
  | 'MOVIE_DETAILS_FAILED'
  | 'LETTERBOXD_MISSING_PARAMS'
  | 'LETTERBOXD_INVALID_URL'
  | 'LETTERBOXD_FETCH_FAILED'
  | 'LETTERBOXD_EMPTY_LIST'
  | 'LETTERBOXD_NO_MATCHES'
  | 'LETTERBOXD_FAILED'
  | 'GENRES_FAILED'
  | 'TMDB_UNAUTHORIZED'
  | 'TMDB_RATE_LIMITED'
  | 'TMDB_UNREACHABLE'
    | 'NETWORK_UNREACHABLE'
      | 'JOUST_NO_MOVIES'
        | 'JOUST_NOT_ENOUGH_MOVIES'
          | 'NO_RESULTS'
          | 'UNKNOWN';

// User-facing copy only. No status codes, endpoint names, or stack traces —
// those go to console.error (and eventually a bug tracker) instead, never here.
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  DISCOVER_MISSING_GENRES: 'Pick at least one genre before discovering!',
  DISCOVER_FAILED: "We couldn't load movies for those filters. Please try again.",
  SEARCH_INVALID_TYPE: 'Something went wrong with that search. Please try again.',
  SEARCH_MISSING_QUERY: 'Search Input Required',
  SEARCH_FAILED: "Search isn't working right now. Please try again in a moment.",
  MOVIE_DETAILS_NOT_FOUND: "We couldn't find details for that movie.",
  MOVIE_DETAILS_FAILED: "We couldn't load that movie's details right now.",
  LETTERBOXD_MISSING_PARAMS: 'Enter a Letterboxd list URL before searching.',
  LETTERBOXD_INVALID_URL: "That doesn't look like a valid Letterboxd list URL.",
  LETTERBOXD_FETCH_FAILED: "We couldn't reach that Letterboxd list. Make sure it exists or try again.",
  LETTERBOXD_EMPTY_LIST: "That Letterboxd list doesn't seem to have any films on it.",
  LETTERBOXD_NO_MATCHES: "We found that list, but couldn't match any of its films to a movie in our database.",
  LETTERBOXD_FAILED: "We couldn't load that Letterboxd list right now. Please try again.",
  GENRES_FAILED: "We couldn't load genres. Try refreshing the page.",
  TMDB_UNAUTHORIZED: "Something's misconfigured on our end. We're on it — please try again later.",
  TMDB_RATE_LIMITED: "We're getting a lot of requests right now. Please wait a moment and try again.",
  TMDB_UNREACHABLE: "We couldn't reach our movie database. Please try again in a moment.",
  NETWORK_UNREACHABLE: "We couldn't connect. Check your internet connection and try again.",
  JOUST_NO_MOVIES: 'Discover some movies before starting a joust.',
  JOUST_NOT_ENOUGH_MOVIES: "You don't have enough movies for that bracket size. Discover more or choose a smaller bracket.",
  NO_RESULTS: 'No movies found — try broadening your selection.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

// Codes that aren't really "errors" — nothing failed, they're just guidance
// (e.g. why a disabled button won't do anything yet). The modal skips the
// "Something went wrong" heading for these and shows the message alone.
const NOTICE_CODES = new Set<ErrorCode>(['JOUST_NO_MOVIES', 'JOUST_NOT_ENOUGH_MOVIES', 'DISCOVER_MISSING_GENRES', 'SEARCH_MISSING_QUERY', 'NO_RESULTS']);

export function isNoticeCode(code: ErrorCode | string | undefined): boolean {
  return !!code && NOTICE_CODES.has(code as ErrorCode);
}

export function getErrorMessage(code: ErrorCode | string | undefined): string {
  if (code && code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as ErrorCode];
  }
  return ERROR_MESSAGES.UNKNOWN;
}

// Pulls the {code, message} our server routes always respond with out of a
// failed Response, falling back gracefully if the body isn't in that shape
// (e.g. a proxy/host returning its own HTML error page instead of JSON).
export async function getErrorCodeFromResponse(response: Response): Promise<ErrorCode> {
  try {
    const data = await response.json();
    if (data?.error?.code) {
      return data.error.code as ErrorCode;
    }
  } catch {
    // response body wasn't JSON — fall through to UNKNOWN
  }
  return 'UNKNOWN';
}
