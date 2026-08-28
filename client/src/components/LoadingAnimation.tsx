import knight1 from '../assets/knightOnHorse1.svg';
import knight2 from '../assets/knightOnHorse2.svg';

export const LoadingAnimation = () => {
    return (
    <div className='flex flex-row justify-center items-center gap-2 w-full min-w-xs'>
        <img src={knight2} className='loading-dot loading-dot-3 h-16 w-auto' />
        <img src={knight1} className='loading-dot loading-dot-2 h-16 w-auto' />
        <img src={knight1} className='loading-dot loading-dot-1 h-16 w-auto' />
    </div>
    );
}
  