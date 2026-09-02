import { useContext } from 'react';
import { ErrorContext } from '@/context/errorContextValue';

export const useErrorModal = () => {
    const ctx = useContext(ErrorContext);
    if (!ctx) {
        throw new Error('useErrorModal must be used within an ErrorProvider');
    }
    return ctx;
};
