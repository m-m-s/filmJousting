import { useState, useEffect } from 'react'
import { JoustSetup } from './JoustSetup';
import { roundsFor } from '@/lib/joust';
import { JoustMatchup } from './JoustMatchup';
import { JoustWinner } from './JoustWinner';
import type { ScoredMovie } from '@/types';

type JoustSnapshot = {
    bracketedMovies: [ScoredMovie, ScoredMovie][] | null | undefined;
    winners: ScoredMovie[];
    currentRound: number;
    rounds: number;
    finalWinner: ScoredMovie | null;
};

const bracketing = (movies: ScoredMovie[]) => {
    const bracketedMovies: [ScoredMovie, ScoredMovie][] = []
    for (let i=0; i < movies.length /2; i++){
        const pair: [ScoredMovie, ScoredMovie] = [movies[i], movies[movies.length -1 - i]];
        bracketedMovies.push(pair);
    }
    return bracketedMovies;
};

type JoustProps = {
    movies: ScoredMovie[];
    onInProgressChange?: (inProgress: boolean) => void;
};

export const Joust = ({ movies, onInProgressChange }: JoustProps) => {
    const [bracketedMovies, setBracketedMovies] = useState<[ScoredMovie, ScoredMovie][]|null>();
    const [rounds, setRounds] = useState<number>(0);
    const [currentRound, setCurrentRound] = useState<number>(0);
    const [winners, setWinners] = useState<ScoredMovie[]>([]);
    const [finalWinner, setFinalWinner] = useState<ScoredMovie | null>(null);
    const [bracketSize, setBracketSize] = useState<number>(0);
    const [history, setHistory] = useState<JoustSnapshot[]>([]);

    const matchUp = bracketedMovies ? bracketedMovies[winners.length] : null;

    const startJoust = (contenders: ScoredMovie[]) => {
        setHistory([]);
        setRounds(roundsFor(contenders.length));
        setBracketSize(contenders.length);
        setCurrentRound(1);
        setBracketedMovies(bracketing(contenders));
    };

    const joust = (winner:ScoredMovie) => {
        setHistory(prev => [...prev, { bracketedMovies, winners, currentRound, rounds, finalWinner }]);
        if (currentRound === rounds) {
            setFinalWinner(winner);
            setRounds(0);
            setWinners([]);
            setCurrentRound(0);
        } else if (bracketedMovies && winners.length === bracketedMovies.length - 1) {
            const updatedWinners = [...winners, winner];
            setWinners([]);
            setCurrentRound(prev => prev + 1);
            setBracketedMovies(bracketing(updatedWinners));
        } else {
            setWinners([...winners, winner]);
        }};

    const undoJoust = () => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            setBracketedMovies(last.bracketedMovies);
            setWinners(last.winners);
            setCurrentRound(last.currentRound);
            setRounds(last.rounds);
            setFinalWinner(last.finalWinner);
            return prev.slice(0, -1);
        });
    };

    const joustInProgress = currentRound > 0 && !finalWinner;
    useEffect(() => {
        onInProgressChange?.(joustInProgress);
    }, [joustInProgress, onInProgressChange]);

    return (
        <div className='flex flex-col items-center'>
            {currentRound === 0 && !finalWinner && (
                <JoustSetup movies={movies} onStart={startJoust} />
            )}
            {currentRound > 0 && matchUp && (
                <JoustMatchup
                    key={`${matchUp[0].id}-${matchUp[1].id}`}
                    matchUp={matchUp}
                    currentRound={currentRound}
                    totalRounds={rounds}
                    onPick={joust}
                    onUndo={undoJoust}
                    canUndo={history.length > 0}
                />
            )}
            {finalWinner && <JoustWinner winner={finalWinner} beaten={bracketSize - 1} />}
        </div>
    );
};
