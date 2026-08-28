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