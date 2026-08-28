import { useEffect } from 'react';
import vineBlockTile from '../../assets/flowerOrnamentalBorder.svg';

let openModalCount = 0;

const vineTiles = Array.from({ length: 20 }).map((_, i) => (
    <img key={i} src={vineBlockTile} alt="" className="h-6 w-auto -ml-[2px] first:ml-0" />
));

const VineStripHorizontal = ({ side }: { side: 'top' | 'bottom' }) => (
    <div className={`bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] absolute left-0 right-0 h-6 overflow-hidden ${side === 'top' ? 'top-0' : 'bottom-0'}`}>
        <div className="flex">
            {vineTiles}
        </div>
    </div>
);

const VineStripVertical = ({ side }: { side: 'left' | 'right' }) => (
    <div className={`bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] absolute top-6 bottom-6 w-6 overflow-hidden ${side === 'left' ? 'left-0' : 'right-0'}`}>
        <div className="absolute top-1/2 left-1/2 flex w-max -translate-x-1/2 -translate-y-1/2 rotate-90">
            {vineTiles}
        </div>
    </div>
);

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    align?: 'center' | 'top';
};

export const Modal = ({ isOpen, onClose, children, align = 'top'}: ModalProps) => {
    useEffect(() => {
        if (!isOpen) return;
        openModalCount += 1;
        document.body.style.overflow = 'hidden';
        return () => {
            openModalCount -= 1;
            if (openModalCount === 0) {
                document.body.style.overflow = '';
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return(
        <div 
            className={`fixed inset-0 z-50 flex ${align === 'top' ? 'items-start' : 'items-center'} justify-center bg-black/90`}
            onClick={onClose}>
            <div className={`relative ${align === 'top' ? 'mt-[30vh]': ''}`}>
                <button
                    className={`bg-transparent text-[#FCF8F9] absolute right-0 -top-9 w-10 h-10 flex items-center justify-center text-2xl`}
                    onClick={onClose}>x</button>
                <div className={`
                    bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] border-3
                    w-[88vw] bg-white px-6 pt-9 pb-9 max-h-[88vh] overflow-y-auto overflow-x-hidden scrollbar-gutter-both md:w-[55vw] lg:max-w-[50vw]`}
                onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
                <VineStripHorizontal side="top" />
                <VineStripHorizontal side="bottom" />
                <VineStripVertical side="left" />
                <VineStripVertical side="right" />
            </div>
        </div>
    );
};
