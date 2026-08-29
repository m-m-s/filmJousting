import { useState } from 'react'
import type { FilterCriteria, SortKey, SortDirection } from "@/types";
import { sortMovies } from '@/lib/filters';
import { useErrorModal } from '../context/ErrorContext';
import { getErrorCodeFromResponse } from '../lib/errorMessages';
import { API_URL } from '../config';

type MovieFetchingProps = {
    sortKey: SortKey;
    sortDirection: SortDirection;
    searchQuery:String;
    discoverParameters:FilterCriteria;
};

export const MovieFetching = ({sortKey, sortDirection, searchQuery, discoverParameters}: MovieFetchingProps) => {
    const [movies, setMovies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { showError } = useErrorModal();

    const discover = async () => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_URL}/api/tmdb/discover`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(
            discoverParameters
        )
        });
        if (!response.ok) {
          const code = await getErrorCodeFromResponse(response);
          showError(code, `discover responded ${response.status}`);
          return;
        }
        const data = await response.json();
        if (data.length === 0) {
          showError('NO_RESULTS');
        }
        setMovies(sortMovies(data, sortKey, sortDirection));
        } catch (error) {
        showError('NETWORK_UNREACHABLE', error);
    } finally {
        setIsLoading(false);
    }
    };

    const listScraping = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/tmdb/letterboxdList`, {
          method: 'POST',
          headers: { 'Content-Type' : 'application/json' },
          body: JSON.stringify({
            listUrl: searchQuery,
            filters: discoverParameters
          })
        });
        if (!response.ok) {
          const code = await getErrorCodeFromResponse(response);
          showError(code, `letterboxdList responded ${response.status}`);
          return;
        }
        const data = await response.json();
        if (data.length === 0) {
          showError('NO_RESULTS');
        }
        setMovies(sortMovies(data, sortKey, sortDirection));
      } catch (error) {
        showError('NETWORK_UNREACHABLE', error);
      } finally {
        setIsLoading(false);
      }
    };
    return{discover, listScraping, movies, isLoading};
};
