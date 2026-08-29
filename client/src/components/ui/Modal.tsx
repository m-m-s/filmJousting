import { useEffect, useRef, useState } from 'react';
import vineBlockTile from '../../assets/flowerOrnamentalBorder.svg';

let openModalCount = 0;
let modalStack: symbol[] = [];

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
    maxHeightClass?: string;
    topOffsetClass?: string;
};

export const Modal = ({ isOpen, onClose, children, align = 'top', maxHeightClass = 'max-h-[88dvh]', topOffsetClass = 'mt-[30dvh]'}: ModalProps) => {
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

    // Mobile "back" should close the topmost modal instead of leaving the
    // page — push a history entry while open, and close on popstate, but
    // only if this modal is actually the topmost one open (so a stack of
    // nested modals closes one at a time, not all at once). If the modal
    // gets closed some other way (X, backdrop), consume that pushed entry
    // ourselves so back-button history doesn't accumulate phantom steps.
    const closedViaPopRef = useRef(false);
    const idRef = useRef<symbol | null>(null);
    if (idRef.current === null) idRef.current = Symbol('modal');

    useEffect(() => {
        if (!isOpen) return;
        const id = idRef.current!;
        modalStack.push(id);
        closedViaPopRef.current = false;
        window.history.pushState({ modalOpen: true }, '');

        const handlePopState = () => {
            if (modalStack[modalStack.length - 1] !== id) return;
            closedViaPopRef.current = true;
            onClose();
        };
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            modalStack = modalStack.filter((x) => x !== id);
            if (!closedViaPopRef.current) {
                window.history.back();
            }
        };
    }, [isOpen]);

    // On-screen keyboards don't reliably shrink CSS viewport units (dvh) —
    // iOS Safari in particular overlays the keyboard rather than resizing
    // the CSS viewport. window.visualViewport is the one thing every mobile
    // browser actually updates when the keyboard opens, so that's what we
    // watch to detect it and pull the modal up near the top while it's up.
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [visibleHeight, setVisibleHeight] = useState<number | null>(null);
    useEffect(() => {
        if (!isOpen || !window.visualViewport) return;
        const vv = window.visualViewport;
        const checkKeyboard = () => {
            const open = vv.height < window.innerHeight * 0.75;
            setKeyboardOpen(open);
            setVisibleHeight(open ? vv.height : null);
        };
        checkKeyboard();
        vv.addEventListener('resize', checkKeyboard);
        return () => {
            vv.removeEventListener('resize', checkKeyboard);
            setKeyboardOpen(false);
            setVisibleHeight(null);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const effectiveTopOffsetClass = keyboardOpen ? 'mt-2' : topOffsetClass;
    const heightOverrideStyle = keyboardOpen && visibleHeight ? { maxHeight: `${visibleHeight * 0.85}px` } : undefined;

    return(
        <div
            className={`fixed inset-0 z-50 flex ${align === 'top' ? 'items-start' : 'items-center'} justify-center bg-black/90`}
            onClick={onClose}>
            <div className={`relative ${align === 'top' ? effectiveTopOffsetClass : ''}`}>
                <button
                    className={`bg-transparent text-[#FCF8F9] absolute right-0 -top-9 w-10 h-10 flex items-center justify-center text-2xl`}
                    onClick={onClose}>x</button>
                <div className={`
                    bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] border-3
                    w-[88vw] bg-white px-8 pt-9 pb-9 ${maxHeightClass} overflow-y-auto overflow-x-hidden scrollbar-gutter-both md:w-[55vw] lg:max-w-[50vw]`}
                style={heightOverrideStyle}
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
