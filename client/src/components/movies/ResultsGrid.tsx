import { useEffect, useState } from 'react';
import { MovieCard } from '@/components/movies/MovieCard';
import type { ScoredMovie } from '@/types';

type ResultsGridProps = {
    movies: ScoredMovie[];
};

// Keyed by the result set in App, so a new set remounts with revealed false.
export const ResultsGrid = ({ movies }: ResultsGridProps) => {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const settle = () => setRevealed(true);
        window.addEventListener('scrollend', settle, { once: true });
        const fallback = window.setTimeout(settle, 800);
        return () => {
            window.removeEventListener('scrollend', settle);
            window.clearTimeout(fallback);
        };
    }, []);

    return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 sm:gap-y-5 mx-2 ${revealed ? 'cards-revealed' : ''}`}>
            {movies.map((m, i) => (
                <div key={m.id} className="card-in" style={{ animationDelay: `${Math.round(i / Math.max(movies.length - 1, 1) * 260)}ms` }}>
                    <MovieCard
                        id={m.id}
                        poster={m.poster_path}
                        title={m.title}
                        overview={m.overview}
                        rating={m.vote_average}
                        voteCount={m.vote_count}
                        releaseDate={m.release_date}
                    />
                </div>
            ))}
        </div>
    );
};
