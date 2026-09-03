import { MovieCard } from '@/components/movies/MovieCard';
import crown from '@/assets/crown.svg';
import type { ScoredMovie } from '@/types';

type JoustWinnerProps = {
    winner: ScoredMovie;
    beaten: number;
};

export const JoustWinner = ({ winner, beaten }: JoustWinnerProps) => (
    <div className='flex flex-col items-center mt-16'>
        <div className='relative champion-card'>
            <img src={crown} alt="" className="champion-crown absolute left-1/2 -top-16 -translate-x-1/2 h-18 w-auto z-10" />
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
        <h2 className='champion-line text-xl font-bold mt-5 mb-2 underline underline-offset-5' style={{ animationDelay: '320ms' }}>The Champion!</h2>
        <p className='champion-line text-xl text-center mb-1' style={{ animationDelay: '400ms' }}>{winner.title}</p>
        <p className='champion-line text-sm text-center mb-3' style={{ animationDelay: '480ms' }}>
            {beaten === 1 ? 'Bested its lone challenger.' : `Bested all ${beaten} challengers.`}
        </p>
    </div>
);
