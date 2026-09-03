import { useEffect, useState } from 'react';
import knight1 from '@/assets/knightOnHorse1.svg';
import knight2 from '@/assets/knightOnHorse2.svg';

const SLOW_AFTER_MS = 8000;

export const LoadingAnimation = () => {
    const [slow, setSlow] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
        return () => window.clearTimeout(timer);
    }, []);

    return (
    <div className='flex flex-col items-center gap-3 w-full'>
        <div className='flex flex-row justify-center items-center gap-2 w-full'>
            <img src={knight2} alt="" className='loading-dot loading-dot-3 h-16 w-auto' />
            <img src={knight1} alt="" className='loading-dot loading-dot-2 h-16 w-auto' />
            <img src={knight1} alt="" className='loading-dot loading-dot-1 h-16 w-auto' />
        </div>
        {slow && (
            <p className='text-sm text-center' aria-live='polite'>A large field of contenders. Mustering them all takes a moment.</p>
        )}
    </div>
    );
}
