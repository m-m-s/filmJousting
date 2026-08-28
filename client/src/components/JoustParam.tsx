import { useState, useEffect } from 'react'
import { sortMovies } from '@/lib/filters';
import { MovieCard } from './MovieCard';
import { Button } from './ui/Button';
import { LoadingAnimation } from './LoadingAnimation';
import crossedSwords from '../assets/crossedSwords.svg';
import crown from '../assets/crown.svg';
import type { SortKey, ScoredMovie } from '@/types';

const bracketOptions: {value: number, label: string}[]= [
    {value: 8, label: 'Small'},
    {value: 16, label: 'Medium'},
    {value: 32, label: 'Large'}
];

type JoustParamProps = {
    movies: ScoredMovie[];
};

export const JoustParams = ({ movies }: JoustParamProps) => {
    const [bracketSize, setBracketSize] = useState<number>(8);
    const [bracketedMovies, setBracketedMovies] = useState<[ScoredMovie, ScoredMovie][]|null>();
    const [sortKey, setSortKey] = useState<SortKey>('score');
    const [rounds, setRounds] = useState<number>(4);
    const [currentRound, setCurrentRound] = useState<number>(0);
    const [winners, setWinners] = useState<ScoredMovie[]>([]);
    const [finalWinner, setFinalWinner] = useState<ScoredMovie | null>(null);
    
    const sortOptions: {key: SortKey, label: string}[] =[
        { key: 'score', label: 'Recommended' },
        { key: 'vote_average', label: 'Rating' },
        { key: 'popularity', label: 'Popularity' },
    ];

    const sortDirection = 'descending';
    const sortedMovies = sortMovies(movies, sortKey, sortDirection);
    const toBracketMovies = sortedMovies.slice(0, bracketSize);

    const bracketing = (movies: ScoredMovie[]) => {
        let bracketedMovies: [ScoredMovie, ScoredMovie][] = []
        for (let i=0; i < movies.length /2; i++){
            const pair: [ScoredMovie, ScoredMovie] = [movies[i], movies[movies.length -1 - i]];
            bracketedMovies.push(pair);
        }
        return bracketedMovies;
    };

    const startJoust = () => {
        setRounds(Math.log2(bracketSize));
        setCurrentRound(1);
        const bracketMovies:[ScoredMovie, ScoredMovie][] = bracketing(toBracketMovies);
        setBracketedMovies(bracketMovies);
    };

    const matchUp = bracketedMovies ? bracketedMovies[winners.length] : null;
    const [imagesReady, setImagesReady] = useState<boolean>(false);
    const [hoveredCard, setHoveredCard] = useState<0 | 1 | null>(null);

    useEffect(() => {
        if (!matchUp) return;
        setImagesReady(false);
        let loadedCount = 0;
        const handleLoad = () => {
            loadedCount++;
            if (loadedCount === 2) setImagesReady(true);
        };
        const img1 = new Image();
        img1.onload = handleLoad;
        img1.src = `https://image.tmdb.org/t/p/w185${matchUp[0].poster_path}`;
        const img2 = new Image();
        img2.onload = handleLoad;
        img2.src = `https://image.tmdb.org/t/p/w185${matchUp[1].poster_path}`;
    }, [matchUp]);

    const joust = (winner:ScoredMovie) => {
        if (currentRound === rounds) {
            setFinalWinner(winner);
            setRounds(0);
            setWinners([]);
            setCurrentRound(0);
        } else if (bracketedMovies && winners.length === bracketedMovies.length - 1) {
            const updatedWinners = [...winners, winner]; 
            setWinners([]);
            setCurrentRound(prev => prev + 1);
            const bracketMovies:[ScoredMovie, ScoredMovie][] = bracketing(updatedWinners);
            setBracketedMovies(bracketMovies);
        } else {
            setWinners([...winners, winner]);
        }};
            

    return (
        <div className='flex flex-col items-center'>
        {currentRound === 0 && !finalWinner &&
        <div className='flex flex-col p-2'>
            <h2 className='text-center text-2xl font-bold mb-3'>Build Your Tournament</h2>
            <p className='mb-2 text-lg underline-offset-6 underline'>Bracket Size</p>
            <div className='flex flex-wrap justify-center gap-2 mb-2'>
                {bracketOptions.map(({value, label}) => (
                    <Button key={label} variant='weight' onClick={() => setBracketSize(value)} disabled={sortedMovies.length < value} disabledReason="JOUST_NOT_ENOUGH_MOVIES" aria-pressed={bracketSize === value} className={`hover:bg-black hover:text-white ${bracketSize === value ? 'bg-black text-white' : ''}`}>
                        {label}
                    </Button>
                ))}
            </div>
            {sortedMovies.length < bracketSize && (
                <p className='text-sm mb-3 max-w-xs mx-auto'>Not enough movies for this bracket size — try discovering more movies first.</p>
            )}
            <div className='my-2'>
                <p className='mb-2 text-lg underline-offset-6 underline'>Sort by</p>
                    <div className='flex flex-wrap justify-center'>
                    {sortOptions.map(({ key, label }) => (
                    <Button key={key} variant='weight' onClick={() => setSortKey(key)} aria-pressed={sortKey === key} className={`hover:bg-black hover:text-white ${sortKey === key ? 'bg-black text-white' : ''}`}>{label}</Button>
                    ))}
                    </div>
            </div>

            <img src={crossedSwords} alt="" className="h-8 w-auto mx-auto mt-3" />
            <div className='flex justify-center mt-1'>
                <Button variant='search' onClick={() => startJoust()} disabled={sortedMovies.length < bracketSize} disabledReason="JOUST_NOT_ENOUGH_MOVIES" className='border-3 p-2 px-4 m-0 text-center text-xl font-bold'>Joust!</Button>
            </div>
        </div>
        }
        {currentRound > 0 && matchUp && !imagesReady && (
            <LoadingAnimation />
        )}
        {currentRound > 0 && matchUp && imagesReady && (
        <div className='flex flex-col sm:flex-row items-center gap-3 px-4 pt-2'>
            <div className='relative w-full max-w-44 sm:max-w-none sm:flex-1 sm:min-w-0 -mb-4 sm:mb-0' onMouseEnter={() => setHoveredCard(0)} onMouseLeave={() => setHoveredCard(null)}>
                <MovieCard
                    id={matchUp[0].id}
                    poster={matchUp[0].poster_path}
                    title={matchUp[0].title}
                    overview={matchUp[0].overview}
                    rating={matchUp[0].vote_average}
                    releaseDate={matchUp[0].release_date}
                    onClick={() => joust(matchUp[0])}
                />
                {hoveredCard === 1 && (
                    <div className="absolute top-0 left-0 w-full aspect-2/3 flex items-center justify-center text-9xl text-black pointer-events-none">x</div>
                )}
            </div>
            <p className='text-2xl sm:text-5xl leading-none' aria-label="versus">vs</p>
            <div className='relative w-full max-w-44 sm:max-w-none sm:flex-1 sm:min-w-0 -mt-2 sm:mt-0' onMouseEnter={() => setHoveredCard(1)} onMouseLeave={() => setHoveredCard(null)}>
                <MovieCard
                    id={matchUp[1].id}
                    poster={matchUp[1].poster_path}
                    title={matchUp[1].title}
                    overview={matchUp[1].overview}
                    rating={matchUp[1].vote_average}
                    releaseDate={matchUp[1].release_date}
                    onClick={() => joust(matchUp[1])}
                />
                {hoveredCard === 0 && (
                    <div className="absolute top-0 left-0 w-full aspect-2/3 flex items-center justify-center text-9xl text-black pointer-events-none">x</div>
                )}
            </div>
        </div>
        )}
        {finalWinner &&
        <div className='flex flex-col items-center mt-16'>
            <div className='relative'>
                <img src={crown} alt="" className="absolute left-1/2 -top-16 -translate-x-1/2 h-18 w-auto z-10" />
                <MovieCard
                    id={finalWinner.id}
                    poster={finalWinner.poster_path}
                    title={finalWinner.title}
                    overview={finalWinner.overview}
                    rating={finalWinner.vote_average}
                    releaseDate={finalWinner.release_date}
                />
            </div>
            <h2 className='text-2xl mt-5 underline underline-offset-5'>The Champion!</h2>
            <p className='text-3xl mb-3'>{finalWinner.title}</p>

        </div>
        }
    </div>
    )
};