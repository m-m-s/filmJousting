import type { FilterCriteria, Genre, Keyword, Movie, MovieDetails, Person, TMDBPage } from '../types'
import { fetchRandomPages, tmdbFetch } from './utils'


export async function getGenres() {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
}

export async function getMovieDetails(id: string) {
  const data = await tmdbFetch<MovieDetails>(`/movie/${id}`);
  return data;
}

// Lets the return type follow the type argument, so searchTMDB('movie', ...)
// hands back Movie[] rather than a union every caller has to narrow.
type SearchResult = {
  movie: Movie;
  keyword: Keyword;
  person: Person;
};

const cache: Record<string, (Movie | Keyword | Person)[]> = {};

export async function searchTMDB<T extends keyof SearchResult>(type: T, query: string, year?: string): Promise<SearchResult[T][]> {
  const cacheKey = `${type}:${query}:${year || ''}`;
  if ( cache[cacheKey] ){
    // The key encodes the search type, but only at runtime — TypeScript can't
    // follow that back to T, so the read needs asserting.
    return cache[cacheKey] as SearchResult[T][];
  } else {
  const params: Record<string, string> = { query };
  if (year) {
    params.year = year;
  }
  const data = await tmdbFetch<TMDBPage<SearchResult[T]>>(`/search/${type}`, params);
  cache[cacheKey] = data.results;
  return data.results;
}};

export async function discoverMovies(filters: FilterCriteria) {
  const params: Record<string, string> = {};
  const allMovies: Movie[] = [];

  // Vetoed genres — exclude all (commas = AND for exclusion)
  if (filters.vetoedGenres.length > 0) {
    params.without_genres = filters.vetoedGenres.join(',');
  }

  // Minimum rating — always present, defaults to 6
  params['vote_average.gte'] = filters.minRating.toString();

  // Maximum rating — optional
  if (filters.maxRating) {
    params['vote_average.lte'] = filters.maxRating.toString();
  }

  // Indie/hidden gems toggle — cap vote count
  if (!filters.obscure) {
    params['vote_count.gte'] ='200';
  }

  // Sort order
  params.sort_by = 'popularity.desc';

  // Runtime range
  if (filters.runtimeRange) {
    if (filters.runtimeRange.min !== undefined) {
      params['with_runtime.gte'] = filters.runtimeRange.min.toString();
    }
    if (filters.runtimeRange.max !== undefined) {
      params['with_runtime.lte'] = filters.runtimeRange.max.toString();
    }
  }

  // Release year range — TMDB needs full date format
  if (filters.releaseYearRange) {
    if (filters.releaseYearRange.from) {
      params['primary_release_date.gte'] = `${filters.releaseYearRange.from}-01-01`;
    }
    if (filters.releaseYearRange.to) {
      params['primary_release_date.lte'] = `${filters.releaseYearRange.to}-12-31`;
    }
  }

  // Keywords — OR logic with pipes
  if (filters.keywords && filters.keywords.length > 0) {
    params.with_keywords = filters.keywords.join('|');
  }

  // People — split actors and crew into separate params
  if (filters.people && filters.people.length > 0) {
  const actors = filters.people
    .filter(p => p.department === 'Acting')
    .map(p => p.id);
  const crew = filters.people
    .filter(p => p.department !== 'Acting')
    .map(p => p.id);

  if (actors.length > 0) {
    params.with_cast = actors.join('|');
  }
  if (crew.length > 0) {
    params.with_crew = crew.join('|');
  }
}
  // TMDB only accepts one with_original_language value per request, so multiple
  // selected languages mean one extra query per language, same as genres below.
  const languagesToQuery = filters.languages.length > 0 ? filters.languages : [undefined];

  for (const genre of filters.genres){
    params.with_genres = genre.id.toString();

    for (const language of languagesToQuery) {
      if (language) {
        params.with_original_language = language;
      } else {
        delete params.with_original_language;
      }

      // Discovering again with unchanged filters walks the ranked pages forward
      // instead of returning page 1 every time.
      const requested = Math.max(1, filters.page ?? 1);
      let ranked = await tmdbFetch<TMDBPage<Movie>>('/discover/movie', {...params, page: String(requested)});
      const totalPages = ranked.total_pages;

      // Past the end, wrap around rather than returning nothing.
      if (ranked.results.length === 0 && totalPages > 0 && requested > totalPages) {
        const wrapped = ((requested - 1) % Math.min(totalPages, 500)) + 1;
        ranked = await tmdbFetch<TMDBPage<Movie>>('/discover/movie', {...params, page: String(wrapped)});
      }
      allMovies.push(...ranked.results);

      if (totalPages > 3) {
        const randomPages = await fetchRandomPages<Movie>('/discover/movie', params, totalPages, 3);
        allMovies.push(...randomPages);
      }
    }
  };

return allMovies;
};

