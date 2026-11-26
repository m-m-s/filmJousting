import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

const SHOW_AFTER_MS = 1000;
const SHOW_AT_LEAST_MS = 500;

type LoadingModalProps = {
    isLoading: boolean;
    onDismiss: () => void;
};

export const LoadingModal = ({ isLoading, onDismiss }: LoadingModalProps) => {
    const [shownAt, setShownAt] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading) return;
        const timer = window.setTimeout(() => setShownAt(Date.now()), SHOW_AFTER_MS);
        return () => window.clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        if (isLoading || shownAt === null) return;
        const remaining = SHOW_AT_LEAST_MS - (Date.now() - shownAt);
        const timer = window.setTimeout(() => setShownAt(null), Math.max(0, remaining));
        return () => window.clearTimeout(timer);
    }, [isLoading, shownAt]);

    if (shownAt === null) return null;

    return (
        <Modal isOpen onClose={onDismiss} align="center" label="Finding films" historyEntry={false}>
            <div className='py-4 md:min-w-80'>
                <LoadingAnimation />
            </div>
        </Modal>
    );
};
