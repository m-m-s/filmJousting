import { useCallback, useEffect, useId, useRef, useState } from 'react';
import vineBlockTile from '@/assets/flowerOrnamentalBorder.svg';

let openModalCount = 0;

const vineTiles = Array.from({ length: 26 }).map((_, i) => (
    <img key={i} src={vineBlockTile} alt="" className="h-5 w-auto -ml-[2px] first:ml-0" />
));

const VineStripHorizontal = ({ side }: { side: 'top' | 'bottom' }) => (
    <div className={`bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] absolute left-0 right-0 h-5 overflow-hidden ${side === 'top' ? 'top-0' : 'bottom-0'}`}>
        <div className="flex">
            {vineTiles}
        </div>
    </div>
);

const VineStripVertical = ({ side }: { side: 'left' | 'right' }) => (
    <div className={`bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] absolute top-5 bottom-5 w-5 overflow-hidden ${side === 'left' ? 'left-0 -scale-x-100' : 'right-0'}`}>
        <div className="absolute top-0 left-0 flex w-max origin-top-left transform-[translateX(20px)_rotate(90deg)]">
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
    confirmCloseMessage?: string;
    label?: string;
    historyEntry?: boolean;
};

export const Modal = ({ isOpen, onClose, children, align = 'top', maxHeightClass = 'max-h-[88dvh]', topOffsetClass = 'mt-[30dvh]', confirmCloseMessage, label, historyEntry = true}: ModalProps) => {
    useEffect(() => {
        if (!isOpen) return;
        openModalCount += 1;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            openModalCount -= 1;
            if (openModalCount === 0) {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }
        };
    }, [isOpen]);

    const [confirming, setConfirming] = useState(false);
    const closedViaPopRef = useRef(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const token = useId();

    const isTopmost = useCallback(
        () => !historyEntry || (window.history.state as { modalToken?: string } | null)?.modalToken === token,
        [historyEntry, token]);

    const requestClose = () => {
        if (confirmCloseMessage) {
            setConfirming(true);
            return;
        }
        onClose();
    };

    useEffect(() => {
        if (!isOpen || !historyEntry) return;

        const handlePopState = () => {
            if ((window.history.state as { modalToken?: string } | null)?.modalToken === token) return;
            if (confirmCloseMessage) {
                window.history.pushState({ modalToken: token }, '');
                setConfirming(true);
                return;
            }
            closedViaPopRef.current = true;
            onClose();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, token, onClose, confirmCloseMessage, historyEntry]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (!isTopmost()) return;
            if (confirmCloseMessage) {
                setConfirming(true);
                return;
            }
            onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, isTopmost, onClose, confirmCloseMessage]);

    useEffect(() => {
        if (!isOpen) return;
        const openedFrom = document.activeElement as HTMLElement | null;
        const dialog = dialogRef.current;
        dialog?.focus();

        const focusable = (): HTMLElement[] => {
            if (!dialog) return [];
            const found = dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            return Array.from(found).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !dialog) return;
            if (!isTopmost()) return;
            const items = focusable();
            if (items.length === 0) return;
            const first = items[0]!;
            const last = items[items.length - 1]!;

            if (!dialog.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            if (openedFrom && document.contains(openedFrom)) openedFrom.focus();
        };
    }, [isOpen, isTopmost]);

    useEffect(() => {
        if (!isOpen || !historyEntry) return;
        closedViaPopRef.current = false;
        window.history.pushState({ modalToken: token }, '');

        return () => {
            const stillCurrent = (window.history.state as { modalToken?: string } | null)?.modalToken === token;
            if (!closedViaPopRef.current && stillCurrent) {
                window.history.back();
            }
        };
    }, [isOpen, token, historyEntry]);

    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [visibleHeight, setVisibleHeight] = useState<number | null>(null);
    const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
    useEffect(() => {
        if (!isOpen || !window.visualViewport) return;
        const vv = window.visualViewport;
        const checkKeyboard = () => {
            const open = vv.height < window.innerHeight * 0.75;
            setKeyboardOpen(open);
            setVisibleHeight(open ? vv.height : null);
            setViewportOffsetTop(open ? vv.offsetTop : 0);
        };
        checkKeyboard();
        vv.addEventListener('resize', checkKeyboard);
        vv.addEventListener('scroll', checkKeyboard);
        return () => {
            vv.removeEventListener('resize', checkKeyboard);
            vv.removeEventListener('scroll', checkKeyboard);
            setKeyboardOpen(false);
            setVisibleHeight(null);
            setViewportOffsetTop(0);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const effectiveTopOffsetClass = keyboardOpen ? 'mt-2' : topOffsetClass;
    const heightOverrideStyle = keyboardOpen && visibleHeight ? { maxHeight: `${visibleHeight * 0.85}px` } : undefined;

    return(
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={`fixed inset-0 z-50 flex ${align === 'top' ? 'items-start' : 'items-center'} justify-center bg-black/90`}
            style={keyboardOpen ? { top: viewportOffsetTop } : undefined}
            onClick={requestClose}>
            <div className={`relative ${align === 'top' ? effectiveTopOffsetClass : 'mt-4'}`}>
                <button
                    className={`bg-transparent text-[#FCF8F9] absolute right-0 -top-7.5 w-5 h-10 flex items-center justify-center text-2xl`}
                    aria-label="Close"
                    onClick={requestClose}>x</button>
                <div className={`
                    bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] border
                    w-[88vw] bg-white px-7 pt-7 pb-7 ${maxHeightClass} overflow-y-auto overflow-x-hidden scrollbar-gutter-both md:w-[55vw] lg:max-w-[50vw]`}
                style={heightOverrideStyle}
                onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
                <VineStripHorizontal side="top" />
                <VineStripHorizontal side="bottom" />
                <VineStripVertical side="left" />
                <VineStripVertical side="right" />
                {confirming && (
                    <div
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 px-6"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] border-3 bg-white p-5 text-center">
                            <p className="mb-4">{confirmCloseMessage}</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    className="border-3 px-3 py-1 hover:bg-black hover:text-white"
                                    onClick={() => setConfirming(false)}>Keep going</button>
                                <button
                                    className="border-3 px-3 py-1 hover:bg-black hover:text-white"
                                    onClick={() => { setConfirming(false); onClose(); }}>Leave</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
