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

export const JoustMatchup = ({ matchUp, currentRound, totalRounds, onPick, onUndo, canUndo }: JoustMatchupProps) => {
    const posterUrl = (movie: ScoredMovie) =>
        movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : null;

    const [imagesReady, setImagesReady] = useState<boolean>(() =>
        matchUp.every(movie => {
            const url = posterUrl(movie);
            if (!url) return true;
            const img = new Image();
            img.src = url;
            return img.complete;
        })
    );

    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        if (imagesReady) return;
        const timer = window.setTimeout(() => setShowLoader(true), 2000);
        return () => window.clearTimeout(timer);
    }, [imagesReady]);

    useEffect(() => {
        let cancelled = false;
        let settledCount = 0;

        const handleSettled = () => {
            settledCount++;
            if (settledCount === 2 && !cancelled) setImagesReady(true);
        };

        for (const movie of matchUp) {
            const url = posterUrl(movie);
            if (!url) {
                handleSettled();
                continue;
            }
            const img = new Image();
            img.onload = handleSettled;
            img.onerror = handleSettled;
            img.src = url;
        }

        return () => { cancelled = true; };
    }, [matchUp]);

    if (!imagesReady) return (
        <div className='flex items-center justify-center min-h-96'>
            {showLoader && <LoadingAnimation />}
        </div>
    );

    return (
        <>
            {canUndo && (
                <Button variant='search' onClick={onUndo} className='fixed bottom-3 left-1/2 -translate-x-1/2 z-60 bg-[#F6F3EF] text-sm leading-none'>Change your mind?</Button>
            )}
            <p className='text-base md:text-2xl font-bold text-center underline underline-offset-1 md:mb-3'>{roundName(currentRound, totalRounds)}</p>
            <div className='matchup-in flex flex-col sm:flex-row items-center gap-3 pt-1'>
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
