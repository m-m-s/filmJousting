import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button';
import { formatDate, formatMins } from '@/lib/utils';
import sword from '@/assets/sword.svg';
import { API_URL } from '@/config';

type MovieCardProps = {
    id: number;
    poster: string | null;
    title: string;
    overview: string;
    rating: number;
    voteCount?: number;
    releaseDate: number | string;
    onClick?: () => void;
    frame?: 'inset' | 'thin';
};

const MovieRuntime = ({ id }: { id: number }) => {
    const [runtime, setRuntime] = useState<number | 'unavailable' | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${API_URL}/api/tmdb/movie/${id}`, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`movie/${id} responded ${res.status}`);
                return res.json();
            })
            .then(data => setRuntime(data.runtime))
            .catch((error) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error(`[MOVIE_DETAILS_FAILED]`, error);
                setRuntime('unavailable');
            });

        return () => controller.abort();
    }, [id]);

    return <>{runtime === null ? 'Loading...' : runtime === 'unavailable' ? 'Unavailable' : formatMins(runtime)}</>;
};

export const MovieCard = ({id, poster, title, overview, rating, voteCount, releaseDate, onClick, frame = 'inset'}: MovieCardProps) => {
    const [cardState, setCardState] = useState<boolean>(false);

    return(
        <div className='flex flex-col items-center'>
            <div className={`w-full aspect-2/3 ${frame === 'inset' ? 'border-2 border-black p-1' : 'border border-black'}`}>
                <button
                    onClick={onClick ?? (() => setCardState(true))}
                    className="block w-full h-full p-0 border-0 bg-transparent cursor-pointer"
                >
                    {poster ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w185${poster}`}
                        alt={title}
                        className="w-full h-full object-cover hover:opacity-90"
                        />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center border-2 border-black p-2 text-sm text-center">{title}</div>
                    )}
                </button>
            </div>
            <div className='flex justify-end w-full'>
            {onClick && (
                <Button onClick={() => setCardState(true)} className='text-xs no-underline hover:underline p-1'>*Movie Details</Button>
            )}
            </div>

            <Modal isOpen={cardState} onClose={() => setCardState(false)} align="center" label={title}>
                <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                    <div className="flex items-center justify-center w-full gap-2">
                        <img src={sword} alt="" className="flex-1 min-w-0 w-full h-auto max-w-24 -scale-x-100" />
                        {poster ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${poster}`}
                            alt={title}
                            className="flex-[3] min-w-0 w-full h-auto max-w-72"
                        />
                        ) : (
                        <div className="flex-[3] min-w-0 w-full max-w-72 aspect-2/3 flex items-center justify-center border-2 border-black p-2 text-center">{title}</div>
                        )}
                        <img src={sword} alt="" className="flex-1 min-w-0 w-full h-auto max-w-24" />
                    </div>
                    <h1 className="text-xl font-bold">{title}</h1>
                    <div className="w-full flex flex-col items-start px-2">
                        <h2><span className="font-bold pr-1">Rating</span> {rating === 0 ? 'N/A' : rating.toFixed(1)} {voteCount !== undefined && <sub>with {voteCount} votes</sub>}</h2>
                        <h2><span className="font-bold pr-1">Length</span> <MovieRuntime key={id} id={id} /></h2>
                        <h2><span className="font-bold pr-1">Released</span> {releaseDate === '' ? 'Coming Soon...' : formatDate(String(releaseDate))}</h2>
                    </div>
                    <p className="drop-cap px-2">{overview}</p>
                </div>
                </Modal>
        </div>
    )
};