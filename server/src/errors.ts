// Machine-readable error codes shared (by convention) with the client's
// errorMessages.ts. Keep this list and that one in sync when adding a code.
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
  | 'CONTACT_MISSING_MESSAGE'
  | 'CONTACT_TOO_LONG'
  | 'CONTACT_RATE_LIMITED'
  | 'CONTACT_FAILED';

// Thrown anywhere in a service to carry a specific error code up to the
// route handler. Anything else that's thrown (a raw TypeError, etc.) is
// treated as an unexpected failure and mapped to a generic *_FAILED code
// by the route's catch block.
export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, status: number, devMessage: string) {
    super(devMessage);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}
