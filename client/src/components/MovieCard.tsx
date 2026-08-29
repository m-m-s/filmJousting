import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal'
import { Button } from './ui/Button';
import { formatDate, formatMins } from '../lib/utils';
import sword from '../assets/sword.svg';
import { API_URL } from '../config';

type MovieCardProps = {
    id: number;
    poster: string;
    title: string;
    overview: string;
    rating: number;
    voteCount?: number;
    releaseDate: number | string;
    onClick?: () => void;
};

export const MovieCard = ({id, poster, title, overview, rating, voteCount, releaseDate, onClick}: MovieCardProps) => {
    const [cardState, setCardState] = useState<boolean>(false);
    const [runtime, setRuntime] = useState<number | 'unavailable' | null>(null);

    useEffect(() => {
        if (!cardState) return;
        setRuntime(null);
        fetch(`${API_URL}/api/tmdb/movie/${id}`)
            .then(res => {
                if (!res.ok) throw new Error(`movie/${id} responded ${res.status}`);
                return res.json();
            })
            .then(data => setRuntime(data.runtime))
            .catch((error) => {
                // Non-critical detail failing inside an already-open modal —
                // not worth interrupting with the global error modal, so this
                // just degrades to "Unavailable" and logs for us to notice.
                console.error(`[MOVIE_DETAILS_FAILED]`, error);
                setRuntime('unavailable');
            });
    }, [cardState, id]);

    return(
        <div className='flex flex-col items-center'>
            <div className="w-full aspect-2/3 border-2 border-black p-1">
                <button
                    onClick={onClick ?? (() => setCardState(true))}
                    className="block w-full h-full p-0 border-0 bg-transparent cursor-pointer"
                >
                    <img
                        src={`https://image.tmdb.org/t/p/w185${poster}`}
                        alt={title}
                        className="w-full h-full object-cover hover:opacity-90"
                        />
                </button>
            </div>
            <div className='flex justify-end w-full -mt-1'>
            {onClick && (
                <Button onClick={() => setCardState(true)} className='text-xs item-right no-underline hover:underline p-0'>*Movie Details</Button>
            )}
            </div>

            <Modal isOpen={cardState} onClose={() => setCardState(false)} align="center">
                <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                    <div className="flex items-center justify-center w-full gap-2">
                        <img src={sword} alt="" className="flex-1 min-w-0 w-full h-auto max-w-24 -scale-x-100" />
                        <img
                            src={`https://image.tmdb.org/t/p/w500${poster}`}
                            alt={title}
                            className="flex-[3] min-w-0 w-full h-auto max-w-72"
                        />
                        <img src={sword} alt="" className="flex-1 min-w-0 w-full h-auto max-w-24" />
                    </div>
                    <h1 className="text-xl font-bold">{title}</h1>
                    <div className="w-full flex flex-col items-start px-2">
                        <h2 className="text-md"><span className="font-bold pr-1">Rating</span> {rating === 0 ? 'N/A' : rating.toFixed(1)} {voteCount !== undefined && <sub>with {voteCount} votes</sub>}</h2>
                        <h2 className="text-md"><span className="font-bold pr-1">Length</span> {runtime === null ? 'Loading...' : runtime === 'unavailable' ? 'Unavailable' : formatMins(runtime)}</h2>
                        <h2 className="text-md"><span className="font-bold pr-1">Released</span> {releaseDate === '' ? 'Coming Soon...' : formatDate(String(releaseDate))}</h2>
                    </div>
                    <p className="drop-cap px-2">{overview}</p>
                </div>
                </Modal>
        </div>
    )
};