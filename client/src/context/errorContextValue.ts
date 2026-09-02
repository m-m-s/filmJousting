import { createContext } from 'react';
import type { ErrorCode } from '@/lib/errorMessages';

// Separate from the provider so neither file mixes a component export with a
// non-component one, which would stop Fast Refresh hot-swapping it.
export type ErrorContextValue = {
    showError: (code: ErrorCode | string, devDetail?: unknown) => void;
};

export const ErrorContext = createContext<ErrorContextValue | null>(null);
