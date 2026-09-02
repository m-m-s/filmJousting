import { useState, useEffect } from 'react';
import { MovieCard } from '@/components/movies/MovieCard';
import { Button } from '@/components/ui/Button';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { roundName } from '@/lib/joust';
import type { ScoredMovie } from '@/types';

type JoustMatchupProps = {
    matchUp: [ScoredMovie, ScoredMovie];
    currentRound: number;
    totalRounds: number;
    onPick: (winner: ScoredMovie) => void;
    onUndo: () => void;
    canUndo: boolean;
};

// Keyed by the pairing in Joust, so each matchup mounts fresh.
export const JoustMatchup = ({ matchUp, currentRound, totalRounds, onPick, onUndo, canUndo }: JoustMatchupProps) => {
    const [imagesReady, setImagesReady] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        let settledCount = 0;

        // A failed poster counts as settled, or the joust hangs forever.
        const handleSettled = () => {
            settledCount++;
            if (settledCount === 2 && !cancelled) setImagesReady(true);
        };

        for (const movie of matchUp) {
            if (!movie.poster_path) {
                handleSettled();
                continue;
            }
            const img = new Image();
            img.onload = handleSettled;
            img.onerror = handleSettled;
            img.src = `https://image.tmdb.org/t/p/w185${movie.poster_path}`;
        }

        return () => { cancelled = true; };
    }, [matchUp]);

    if (!imagesReady) return <LoadingAnimation />;

    return (
        <>
            {canUndo && (
                <Button variant='search' onClick={onUndo} className='fixed bottom-3 left-1/2 -translate-x-1/2 z-60 bg-[#F6F3EF] text-sm leading-none'>Change your mind?</Button>
            )}
            <p className='text-md font-bold text-center underline underline-offset-1'>{roundName(currentRound, totalRounds)}</p>
            <div className='flex flex-col sm:flex-row items-center gap-3 pt-1'>
                <div className='w-full max-w-40 sm:max-w-none sm:flex-1 sm:min-w-0 -mb-6 sm:mb-0'>
                    <MovieCard
                        id={matchUp[0].id}
                        poster={matchUp[0].poster_path}
                        title={matchUp[0].title}
                        overview={matchUp[0].overview}
                        rating={matchUp[0].vote_average}
                        voteCount={matchUp[0].vote_count}
                        releaseDate={matchUp[0].release_date}
                        onClick={() => onPick(matchUp[0])}
                        frame="thin"
                    />
                </div>
                <p className='text-2xl sm:text-5xl leading-none my-2' aria-label="versus">vs</p>
                <div className='w-full max-w-40 sm:max-w-none sm:flex-1 sm:min-w-0 -mt-4 sm:mt-0'>
                    <MovieCard
                        id={matchUp[1].id}
                        poster={matchUp[1].poster_path}
                        title={matchUp[1].title}
                        overview={matchUp[1].overview}
                        rating={matchUp[1].vote_average}
                        voteCount={matchUp[1].vote_count}
                        releaseDate={matchUp[1].release_date}
                        onClick={() => onPick(matchUp[1])}
                        frame="thin"
                    />
                </div>
            </div>
        </>
    );
};
