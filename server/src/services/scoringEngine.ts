import { FilterCriteria, type Movie, type ScoredMovie } from "../types";
import { deDuplicate } from "./utils";

export const movieFilter = (movies: Movie[], filters: FilterCriteria): ScoredMovie[] => {
    const uniqueMovies= deDuplicate(movies);
    const scoredMovies = uniqueMovies.map(movie => {
        let score = movie.vote_average;

        for (const genreId of movie.genre_ids) {
            const matchedGenre = filters.genres.find(g => g.id === genreId);
            if (matchedGenre) {
                score *= 1 + matchedGenre.weight / 10;
            }
        }

        return { ...movie, score };
    });
    let sortedMovies = scoredMovies.toSorted((a, b) => b.score - a.score);
    return sortedMovies;
};