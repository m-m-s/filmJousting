import { useState, useEffect } from 'react';
import { useErrorModal } from '../context/ErrorContext';
import { getErrorCodeFromResponse } from '../lib/errorMessages';

export const useDebouncedSearch = (query: string, subject: 'person' | 'keyword') => {
  const [options, setOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showError } = useErrorModal();

  useEffect (()=> {
      const controller = new AbortController();
      const timeoutId = setTimeout(async () => {
        if (!query) return;
        setIsLoading(true);
        try {
        const response = await fetch(
          `http://localhost:3001/api/tmdb/search/${subject}?q=${encodeURIComponent(query)}`,
          {signal: controller.signal}
        );
        if (!response.ok){
          const code = await getErrorCodeFromResponse(response);
          showError(code, `search/${subject} responded ${response.status}`);
          return;
        }

        const data = await response.json();
        setOptions(data);

      } catch (error) {
        // A cancelled request (fast typing superseding this one) isn't a
        // real failure — the AbortController rejects with this on purpose.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        showError('NETWORK_UNREACHABLE', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }, [query]);

    return { options, isLoading };
};
