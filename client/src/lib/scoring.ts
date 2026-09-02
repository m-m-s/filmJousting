import type { FilterCriteria, Movie, ScoredMovie } from '../types';

// On the client so a settings change re-scores instantly. The server keeps what
// needs it: the TMDB calls, the scrape, and de-duplicating the multi-page fetch.
export const scoreMovies = (movies: Movie[], filters: FilterCriteria): ScoredMovie[] =>
    movies.map(movie => {
        let score = movie.vote_average;

        for (const genreId of movie.genre_ids) {
            const matchedGenre = filters.genres.find(g => g.id === genreId);
            if (matchedGenre) {
                score *= 1 + matchedGenre.weight / 10;
            }
        }

        return { ...movie, score };
    });
