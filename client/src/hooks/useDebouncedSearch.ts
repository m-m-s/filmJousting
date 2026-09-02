import { useState, useEffect } from 'react';
import { useErrorModal } from '@/hooks/useErrorModal';
import { getErrorCodeFromResponse } from '../lib/errorMessages';
import { API_URL } from '../config';

// Person and keyword results share id/name; only people carry a department.
type SearchResult = {
  id: number;
  name: string;
  known_for_department?: string;
};

export const useDebouncedSearch = (query: string, subject: 'person' | 'keyword') => {
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showError } = useErrorModal();

  useEffect (()=> {
      const controller = new AbortController();
      const timeoutId = setTimeout(async () => {
        if (!query) return;
        setIsLoading(true);
        try {
        const response = await fetch(
          `${API_URL}/api/tmdb/search/${subject}?q=${encodeURIComponent(query)}`,
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
      // showError is useCallback'd in the provider, so listing it is safe.
    }, [query, subject, showError]);

    return { options, isLoading };
};
