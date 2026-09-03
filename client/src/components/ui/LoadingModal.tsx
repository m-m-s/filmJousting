import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

const SHOW_AFTER_MS = 400;

type LoadingModalProps = {
    onDismiss: () => void;
};

export const LoadingModal = ({ onDismiss }: LoadingModalProps) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
        return () => window.clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <Modal isOpen onClose={onDismiss} align="center" label="Finding films" historyEntry={false}>
            <LoadingAnimation />
        </Modal>
    );
};
