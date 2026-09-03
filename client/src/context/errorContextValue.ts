import { createContext } from 'react';
import type { ErrorCode } from '@/lib/errorMessages';

export type ErrorContextValue = {
    showError: (code: ErrorCode | string, devDetail?: unknown) => void;
};

export const ErrorContext = createContext<ErrorContextValue | null>(null);
