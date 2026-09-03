import type { FilterCriteria, Movie, ScoredMovie } from '../types';

export const scoreMovies = (movies: (Movie & { listMatches?: number })[], filters: FilterCriteria): ScoredMovie[] =>
    movies.map(movie => {
        let score = movie.vote_average;

        for (const genreId of movie.genre_ids) {
            const matchedGenre = filters.genres.find(g => g.id === genreId);
            if (matchedGenre) {
                score *= 1 + matchedGenre.weight / 10;
            }
        }

        const listMatches = movie.listMatches ?? 1;
        if (listMatches > 1) {
            score *= 1 + 0.5 * (listMatches - 1);
        }

        return { ...movie, score };
    });
