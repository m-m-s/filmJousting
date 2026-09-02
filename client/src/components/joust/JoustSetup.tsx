import { useState } from 'react';
import { sortMovies, median, dropMostPopular } from '@/lib/filters';
import { roundsFor } from '@/lib/joust';
import { Button } from '@/components/ui/Button';
import crossedSwords from '@/assets/crossedSwords.svg';
import birdEmblem from '@/assets/emblem.svg';
import type { SortKey, ScoredMovie } from '@/types';

const bracketOptions: {value: number, label: string}[]= [
    {value: 8, label: 'Small'},
    {value: 16, label: 'Medium'},
    {value: 32, label: 'Large'}
];

const sortOptions: {key: SortKey, label: string}[] =[
    { key: 'score', label: 'Recommended' },
    { key: 'vote_average', label: 'Rating' },
    { key: 'popularity', label: 'Popularity' },
];


type JoustToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: React.ReactNode;
};

const JoustToggle = ({ checked, onChange, children }: JoustToggleProps) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={`appearance-none w-4 h-4 shrink-0 rounded-full bg-[#FCF8F9] bg-contain bg-no-repeat bg-center cursor-pointer ${checked ? '' : 'border-2 border-black'}`}
            style={{ backgroundImage: checked ? `url(${birdEmblem})` : 'none' }}
        />
        {children}
    </label>
);

type JoustSetupProps = {
    movies: ScoredMovie[];
    onStart: (contenders: ScoredMovie[]) => void;
};

export const JoustSetup = ({ movies, onStart }: JoustSetupProps) => {
    const [bracketSize, setBracketSize] = useState<number>(8);
    const [sortKey, setSortKey] = useState<SortKey>('score');
    const [advFilterOpen, setAdvFilterOpen] = useState<boolean>(false);
    const [excludePopular, setExcludePopular] = useState<boolean>(false);
    const [hiddenGems, setHiddenGems] = useState<boolean>(false);
    const [randomize, setRandomize] = useState<boolean>(false);

    const sortDirection = 'descending';

    let eligibleMovies = movies;

    if (excludePopular) {
        eligibleMovies = dropMostPopular(eligibleMovies);
    }

    if (hiddenGems) {
        const medianRating = median(eligibleMovies.map(m => m.vote_average));
        const medianVotes = median(eligibleMovies.map(m => m.vote_count));
        eligibleMovies = eligibleMovies.filter(m => m.vote_average >= medianRating && m.vote_count <= medianVotes);
    }

    const sortedMovies = sortMovies(eligibleMovies, sortKey, sortDirection);
    const notEnoughMovies = sortedMovies.length < bracketSize;

    const startJoust = () => {
        let contenders = sortedMovies.slice(0, bracketSize);

        if (randomize) {
            const shuffled = [...sortedMovies];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            contenders = sortMovies(shuffled.slice(0, bracketSize), sortKey, sortDirection);
        }

        onStart(contenders);
    };

    return (
        <div className='flex flex-col p-2'>
            <h2 className='text-center text-2xl font-bold mb-3'>Build Your Tournament</h2>
            <p className='text-sm text-left mb-3 max-w-xs mx-auto'>Pit your discovered movies in head-to-head matchups until one is crowned the movie to watch!</p>
            <div className='flex items-baseline gap-2 mb-2'>
                <p className='text-md font-bold underline-offset-6 underline'>Bracket Size</p>
                <span className='text-sm'>— {roundsFor(bracketSize)} rounds</span>
            </div>
            <div className='flex flex-wrap justify-center gap-2 mb-2'>
                {bracketOptions.map(({value, label}) => (
                    <Button key={label} variant='weight' onClick={() => setBracketSize(value)} disabled={sortedMovies.length < value} disabledReason="JOUST_NOT_ENOUGH_MOVIES" aria-pressed={bracketSize === value} className={`hover:bg-black hover:text-white ${bracketSize === value ? 'bg-black text-white' : ''}`}>
                        {label}
                    </Button>
                ))}
            </div>
            {notEnoughMovies && (
                <p className='text-sm mb-3 max-w-xs mx-auto'>Not enough movies for this bracket size — try discovering more movies, or turning off some advanced filters.</p>
            )}
            <div className='my-2'>
                <p className='mb-2 text-md font-bold underline-offset-6 underline'>Sort by</p>
                    <div className='flex flex-wrap justify-center'>
                    {sortOptions.map(({ key, label }) => (
                    <Button key={key} variant='weight' onClick={() => setSortKey(key)} aria-pressed={sortKey === key} className={`hover:bg-black hover:text-white ${sortKey === key ? 'bg-black text-white' : ''}`}>{label}</Button>
                    ))}
                    </div>
            </div>

            <div className='my-2'>
                <button onClick={() => setAdvFilterOpen(!advFilterOpen)} className='mb-2 text-md font-bold underline-offset-6 underline'>
                    Advanced Filters {advFilterOpen ? '▲' : '▼'}
                </button>
                {advFilterOpen && (
                <div className='flex flex-col items-start max-w-xs mx-auto'>
                    <JoustToggle checked={hiddenGems} onChange={setHiddenGems}>
                        Hidden gems
                    </JoustToggle>
                    <JoustToggle checked={excludePopular} onChange={setExcludePopular}>
                        Exclude the most popular films
                    </JoustToggle>
                    <JoustToggle checked={randomize} onChange={setRandomize}>
                        Random!
                    </JoustToggle>
                </div>
                )}
            </div>

            <img src={crossedSwords} alt="" className="h-8 w-auto mx-auto mt-3" />
            <div className='flex justify-center mt-1'>
                <Button variant='search' onClick={startJoust} disabled={notEnoughMovies} disabledReason="JOUST_NOT_ENOUGH_MOVIES" className='border-3 p-2 px-4 m-0 text-center text-xl font-bold'>Joust!</Button>
            </div>
        </div>
    );
};
