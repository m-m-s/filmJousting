import { useState } from 'react'
import type { FilterCriteria, Movie } from "@/types";
import { useErrorModal } from '@/hooks/useErrorModal';
import { getErrorCodeFromResponse } from '../lib/errorMessages';
import { API_URL } from '../config';

type MovieFetchingProps = {
    listUrls: string[];
    discoverParameters:FilterCriteria;
};

// Returns raw movies; scoring and sorting happen downstream.
export const MovieFetching = ({listUrls, discoverParameters}: MovieFetchingProps) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { showError } = useErrorModal();

    const discover = async (page = 1) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_URL}/api/tmdb/discover`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(
            { ...discoverParameters, page }
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
        setMovies(data);
        } catch (error) {
        showError('NETWORK_UNREACHABLE', error);
    } finally {
        setIsLoading(false);
    }
    };

    const listScraping = async () => {
      setIsLoading(true);
      try {
        const urls = listUrls.filter(url => url.trim());
        const response = await fetch(`${API_URL}/api/tmdb/letterboxdList`, {
          method: 'POST',
          headers: { 'Content-Type' : 'application/json' },
          body: JSON.stringify({ listUrls: urls })
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
        setMovies(data);
      } catch (error) {
        showError('NETWORK_UNREACHABLE', error);
      } finally {
        setIsLoading(false);
      }
    };
    return{discover, listScraping, movies, isLoading};
};
