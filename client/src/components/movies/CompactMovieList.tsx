import type { ScoredMovie } from '@/types';
import { GENRES } from '@/data/genres';

type CompactMovieListProps = {
    movies: ScoredMovie[];
    selectedGenres: { id: number; weight: 5 | 3 }[];
};

const genreNameById = new Map(GENRES.map(g => [Number(g.id), g.name]));

export const CompactMovieList = ({ movies, selectedGenres }: CompactMovieListProps) => {
    return (
        <div className="flex flex-row flex-wrap divide-y-1 divide-black">
            {movies.map((movie) => {
                const matched = selectedGenres
                    .filter(g => (movie.genre_ids ?? []).includes(g.id))
                    .map(g => `${genreNameById.get(g.id) ?? g.id} (${g.weight === 5 ? 'yes' : 'maybe'})`);
                const allGenres = (movie.genre_ids ?? []).map(id => genreNameById.get(id) ?? String(id));

                return (
                    <div key={movie.id} className="flex items-center gap-2 p-1">
                        {movie.poster_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                            alt=""
                            className="w-8 h-12 object-cover border border-black flex-shrink-0"
                        />
                        ) : (
                        <div className="w-8 h-12 border border-black flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 text-sm">
                            <p className="font-bold truncate">{movie.title}</p>
                            <p>Score {movie.score.toFixed(2)} · Rating {movie.vote_average.toFixed(1)} · Popularity {movie.popularity.toFixed(0)}</p>
                            <p className="truncate">{matched.length > 0 ? matched.join(', ') : 'no genre match'}</p>
                            <p className="truncate opacity-70">TMDB: {allGenres.length > 0 ? allGenres.join(', ') : 'none listed'}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
