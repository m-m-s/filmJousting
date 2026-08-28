import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getErrorMessage, isNoticeCode, type ErrorCode } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

type ErrorContextValue = {
    showError: (code: ErrorCode | string, devDetail?: unknown) => void;
};

const ErrorContext = createContext<ErrorContextValue | null>(null);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
    const [message, setMessage] = useState<string | null>(null);
    const [isNotice, setIsNotice] = useState(false);

    const showError = useCallback((code: ErrorCode | string, devDetail?: unknown) => {
        // The console (and eventually a bug tracker) gets the real code and
        // whatever technical detail the caller has — the modal only ever
        // gets the friendly text below.
        console.error(`[${code}]`, devDetail ?? '');
        setIsNotice(isNoticeCode(code));
        setMessage(getErrorMessage(code));
    }, []);

    return (
        <ErrorContext.Provider value={{ showError }}>
            {children}
            <Modal isOpen={message !== null} onClose={() => setMessage(null)} align="center">
                <div className={`flex flex-col items-center gap-3 ${isNotice ? 'pt-6 px-2' : ''}`}>
                    {!isNotice && <h1 className="text-2xl font-bold text-center">Something went wrong</h1>}
                    <p className={isNotice ? 'text-xl font-bold' : ''}>{message}</p>
                    <Button variant="primary" onClick={() => setMessage(null)} className="mt-2 text-center">Okay</Button>
                </div>
            </Modal>
        </ErrorContext.Provider>
    );
};

export const useErrorModal = () => {
    const ctx = useContext(ErrorContext);
    if (!ctx) {
        throw new Error('useErrorModal must be used within an ErrorProvider');
    }
    return ctx;
};
