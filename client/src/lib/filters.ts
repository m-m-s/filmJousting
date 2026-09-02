  import type { SelectionState, ScoredMovie, SortKey, SortDirection } from '../types'
  
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

  // Drops the top 20% by popularity. TMDB's discover endpoint has no popularity
  // filter, so this has to be a cut on the returned results.
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