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
        let lastY = window.scrollY;
        let stillFor = 0;

        const watch = window.setInterval(() => {
            if (window.scrollY === lastY) {
                stillFor += 50;
                if (stillFor >= 150) setRevealed(true);
            } else {
                lastY = window.scrollY;
                stillFor = 0;
            }
        }, 50);

        const fallback = window.setTimeout(() => setRevealed(true), 1500);
        return () => {
            window.clearInterval(watch);
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
