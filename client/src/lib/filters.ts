  import type { SelectionState, ScoredMovie, SortKey, SortDirection, FilterCriteria, Movie } from '../types'

  export const applyFilters = <T extends Movie>(movies: T[], filters: FilterCriteria): T[] =>
    movies.filter(movie => {
      if (filters.vetoedGenres.some(id => movie.genre_ids.includes(id))) return false;
      if (movie.vote_average < filters.minRating) return false;
      if (filters.maxRating !== undefined && movie.vote_average > filters.maxRating) return false;
      if (filters.languages.length > 0 && !filters.languages.includes(movie.original_language)) return false;

      const runtime = (movie as { runtime?: number | null }).runtime;
      if (filters.runtimeRange && typeof runtime === 'number') {
        const { min, max } = filters.runtimeRange;
        if (min !== undefined && runtime < min) return false;
        if (max !== undefined && runtime > max) return false;
      }

      const year = movie.release_date ? Number(movie.release_date.slice(0, 4)) : NaN;
      if (filters.releaseYearRange && Number.isFinite(year)) {
        const { from, to } = filters.releaseYearRange;
        if (from !== undefined && year < from) return false;
        if (to !== undefined && year > to) return false;
      }
      return true;
    });
  
  export function makeSelectionHandler (setState: React.Dispatch<React.SetStateAction<Record<number,SelectionState>>>) {
    function selectFilter(value:number, state: SelectionState | undefined) {
      setState(prev => {
        const next = {...prev};
        if (state === undefined) {
          delete next[value];
        } else {
          next[value] = state;
        }
        return next;
      });
    };
    return selectFilter;
  };

  export const genreSplit = (genreSelect: Record<number, SelectionState>): {genres: {id: number, weight: 5 | 3}[], vetoedGenres: number[]} => {
    const genres: {id: number, weight: 5 | 3}[] = [];
    const vetoedGenres: number[] = [];
    for (const [id, weight] of Object.entries(genreSelect)) {
      if (weight === 'veto'){
        vetoedGenres.push(Number(id))
      } else if (weight === 'yes') {
        genres.push({id: Number(id) , weight: 5})
      } else {
        genres.push({id: Number(id), weight: 3})
      }
    };
    return {genres , vetoedGenres};
  }

  export const median = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  export const dropMostPopular = <T extends { popularity: number }>(pool: T[]): T[] => {
    if (pool.length === 0) return pool;
    const cutoff = pool.map(m => m.popularity).sort((a, b) => a - b)[Math.floor(pool.length * 0.8)];
    return pool.filter(m => m.popularity <= cutoff);
  };

   export const sortMovies = (movies:ScoredMovie[], key: SortKey, direction: SortDirection): ScoredMovie[] => {
    return movies.toSorted((a,b) => {
      if (key === 'title') {
        return direction === 'ascending' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (key === 'release_date') {
        const aTime = new Date(a.release_date).getTime();
        const bTime = new Date(b.release_date).getTime();
        return direction === 'ascending' ? aTime - bTime : bTime - aTime;
      } else {
        return direction === 'ascending' ? a[key] - b[key] : b[key] - a [key];
      }
    });
  };