import type { FilterCriteria, Genre, Keyword, Movie, MovieDetails, Person, TMDBPage } from '../types'
import { fetchRandomPages, tmdbFetch, withMovieDefaults } from './utils'

export async function getGenres() {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
}

export async function getMovieDetails(id: string) {
  const data = await tmdbFetch<MovieDetails>(`/movie/${id}`);
  return data;
}

type SearchResult = {
  movie: Movie;
  keyword: Keyword;
  person: Person;
};

const cache: Record<string, (Movie | Keyword | Person)[]> = {};

export async function searchTMDB<T extends keyof SearchResult>(type: T, query: string, year?: string): Promise<SearchResult[T][]> {
  const cacheKey = `${type}:${query}:${year || ''}`;
  if ( cache[cacheKey] ){
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

  if (filters.vetoedGenres.length > 0) {
    params.without_genres = filters.vetoedGenres.join(',');
  }

  params['vote_average.gte'] = filters.minRating.toString();

  if (filters.maxRating) {
    params['vote_average.lte'] = filters.maxRating.toString();
  }

  if (!filters.obscure) {
    params['vote_count.gte'] ='200';
  }

  params.sort_by = 'popularity.desc';

  if (filters.runtimeRange) {
    if (filters.runtimeRange.min !== undefined) {
      params['with_runtime.gte'] = filters.runtimeRange.min.toString();
    }
    if (filters.runtimeRange.max !== undefined) {
      params['with_runtime.lte'] = filters.runtimeRange.max.toString();
    }
  }

  if (filters.releaseYearRange) {
    if (filters.releaseYearRange.from) {
      params['primary_release_date.gte'] = `${filters.releaseYearRange.from}-01-01`;
    }
    if (filters.releaseYearRange.to) {
      params['primary_release_date.lte'] = `${filters.releaseYearRange.to}-12-31`;
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    params.with_keywords = filters.keywords.join('|');
  }

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
  const languagesToQuery = filters.languages.length > 0 ? filters.languages : [undefined];

  for (const genre of filters.genres){
    params.with_genres = genre.id.toString();

    for (const language of languagesToQuery) {
      if (language) {
        params.with_original_language = language;
      } else {
        delete params.with_original_language;
      }

      const requested = Math.max(1, filters.page ?? 1);
      let ranked = await tmdbFetch<TMDBPage<Movie>>('/discover/movie', {...params, page: String(requested)});
      const totalPages = ranked.total_pages;

      if (ranked.results.length === 0 && totalPages > 0 && requested > totalPages) {
        const wrapped = ((requested - 1) % Math.min(totalPages, 500)) + 1;
        ranked = await tmdbFetch<TMDBPage<Movie>>('/discover/movie', {...params, page: String(wrapped)});
      }
      allMovies.push(...ranked.results.map(withMovieDefaults));

      if (totalPages > 3) {
        const randomPages = await fetchRandomPages<Movie>('/discover/movie', params, totalPages, 3);
        allMovies.push(...randomPages.map(withMovieDefaults));
      }
    }
  };

return allMovies;
};

