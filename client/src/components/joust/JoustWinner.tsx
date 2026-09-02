import { MovieCard } from '@/components/movies/MovieCard';
import crown from '@/assets/crown.svg';
import type { ScoredMovie } from '@/types';

type JoustWinnerProps = {
    winner: ScoredMovie;
};

export const JoustWinner = ({ winner }: JoustWinnerProps) => (
    <div className='flex flex-col items-center mt-16'>
        <div className='relative'>
            <img src={crown} alt="" className="crown-float absolute left-1/2 -top-16 -translate-x-1/2 h-18 w-auto z-10" />
            <MovieCard
                id={winner.id}
                poster={winner.poster_path}
                title={winner.title}
                overview={winner.overview}
                rating={winner.vote_average}
                voteCount={winner.vote_count}
                releaseDate={winner.release_date}
            />
        </div>
        <h2 className='text-xl font-bold mt-5 mb-2 underline underline-offset-5'>The Champion!</h2>
        <p className='text-xl text-center mb-3'>{winner.title}</p>
    </div>
);
