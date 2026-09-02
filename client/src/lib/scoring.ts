import type { FilterCriteria, Movie, ScoredMovie } from '../types';

// On the client so a settings change re-scores instantly. The server keeps what
// needs it: the TMDB calls, the scrape, and de-duplicating the multi-page fetch.
export const scoreMovies = (movies: (Movie & { listMatches?: number })[], filters: FilterCriteria): ScoredMovie[] =>
    movies.map(movie => {
        let score = movie.vote_average;

        for (const genreId of movie.genre_ids) {
            const matchedGenre = filters.genres.find(g => g.id === genreId);
            if (matchedGenre) {
                score *= 1 + matchedGenre.weight / 10;
            }
        }

        // A film on more than one of the searched Letterboxd lists is the whole
        // point of searching several, so each extra list is worth as much as a
        // must-have genre. Only set by the Letterboxd search.
        const listMatches = movie.listMatches ?? 1;
        if (listMatches > 1) {
            score *= 1 + 0.5 * (listMatches - 1);
        }

        return { ...movie, score };
    });
