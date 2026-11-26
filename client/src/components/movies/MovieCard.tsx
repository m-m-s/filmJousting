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

type MovieFactsProps = {
    id: number;
    rating: number;
    voteCount?: number;
    releaseDate: number | string;
};

type FetchedDetails = { runtime: number | null; directors: string[] };

const MovieFacts = ({ id, rating, voteCount, releaseDate }: MovieFactsProps) => {
    const [details, setDetails] = useState<FetchedDetails | 'unavailable' | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${API_URL}/api/tmdb/movie/${id}`, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error(`movie/${id} responded ${res.status}`);
                return res.json();
            })
            .then(data => setDetails({ runtime: data.runtime, directors: data.directors }))
            .catch((error) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error(`[MOVIE_DETAILS_FAILED]`, error);
                setDetails('unavailable');
            });

        return () => controller.abort();
    }, [id]);

    const fetchedText = (render: (d: FetchedDetails) => string) =>
        details === null ? 'Loading...' : details === 'unavailable' ? 'Unavailable' : render(details);

    const directorCount = details && details !== 'unavailable' ? details.directors.length : 1;

    return (
        <div className="w-full flex flex-col items-start px-2">
            {directorCount > 0 && (
            <h2><span className="font-bold pr-1">{directorCount > 1 ? 'Directors' : 'Director'}</span> {fetchedText(d => d.directors.join(', '))}</h2>
            )}
            <h2><span className="font-bold pr-1">Rating</span> {rating === 0 ? 'N/A' : rating.toFixed(1)} {voteCount !== undefined && <sub>with {voteCount.toLocaleString('en-US')} votes</sub>}</h2>
            <h2><span className="font-bold pr-1">Length</span> {fetchedText(d => d.runtime ? formatMins(d.runtime) : 'Unknown')}</h2>
            <h2><span className="font-bold pr-1">Released</span> {releaseDate === '' ? 'Coming Soon...' : formatDate(String(releaseDate))}</h2>
        </div>
    );
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
            <div className='flex justify-center w-full'>
            {onClick && (
                <Button onClick={() => setCardState(true)} className='text-sm underline underline-offset-2 p-1'>Movie Details</Button>
            )}
            </div>

            <Modal isOpen={cardState} onClose={() => setCardState(false)} align="center" label={title}>
                <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                    <div className="flex items-center justify-center w-full gap-2">
                        <img src={sword} alt="" className="flex-1 min-w-0 w-full h-auto max-w-24 -scale-x-100" />
                        {poster ? (
                        <div className="relative flex-[3] min-w-0 w-full max-w-72 aspect-2/3">
                            <img
                                src={`https://image.tmdb.org/t/p/w185${poster}`}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <img
                                src={`https://image.tmdb.org/t/p/w500${poster}`}
                                alt={title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                        ) : (
                        <div className="flex-[3] min-w-0 w-full max-w-72 aspect-2/3 flex items-center justify-center border-2 border-black p-2 text-center">{title}</div>
                        )}
                        <img src={sword} alt="" className="flex-1 min-w-0 w-full h-auto max-w-24" />
                    </div>
                    <h1 className="text-xl font-bold">{title}</h1>
                    <MovieFacts key={id} id={id} rating={rating} voteCount={voteCount} releaseDate={releaseDate} />
                    <p className="drop-cap px-2">{overview}</p>
                </div>
                </Modal>
        </div>
    )
};