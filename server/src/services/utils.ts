import type { Movie, TMDBPage } from '../types'
import { AppError } from '../errors.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// Callers declare the shape they expect. TypeScript cannot verify what TMDB
// actually sends — this is a claim, not a runtime check — but it keeps every
// consumer honest about the fields it uses.
export async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY || '');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (error) {
    throw new AppError('TMDB_UNREACHABLE', 502, `Could not reach TMDB: ${error}`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AppError('TMDB_UNAUTHORIZED', 502, 'TMDB rejected the API key (401)');
    }
    if (response.status === 429) {
      throw new AppError('TMDB_RATE_LIMITED', 429, 'TMDB rate limit hit (429)');
    }
    // Carry the real upstream status through as a generic AppError so route
    // handlers can inspect `.status` (e.g. a 404 on /movie/{id}) and pick a
    // more specific user-facing code than this shared fetch helper can know.
    throw new AppError('TMDB_UNREACHABLE', response.status, `TMDB API error: ${response.status} ${response.statusText}`);
  }
    return response.json() as Promise<T>;
};

export async function fetchRandomPages<T>(endpoint: string, params: Record<string, string>, totalPages: number, count: number): Promise<T[]> {
  const pageNum = new Set<number>();
  while (pageNum.size < Math.min(count, totalPages -1)) {
    pageNum.add(Math.floor(Math.random()* (totalPages - 1))+ 2);
  }
  const pages = await Promise.all(
    [...pageNum].map(page => tmdbFetch<TMDBPage<T>>(endpoint, {...params, page: page.toString()}))
  );
  return pages.flatMap(p=>p.results);
}

export function deDuplicate(movies:Movie[]){
    const existingIds = new Set<number>();
    return movies.filter(movie => {
        if (existingIds.has(movie.id)){
            return false;
        }
        existingIds.add(movie.id);
        return true;
    })
} 
