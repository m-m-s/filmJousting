import { Router, type Response } from 'express';
import { getGenres, searchTMDB, discoverMovies, getMovieDetails } from '../services/tmdbService.js';
import { scrapeLetterboxd, scrapedMovieDetail } from '../services/letterboxdService.js';
import { deDuplicate } from '../services/utils.js';
import { AppError, type ErrorCode } from '../errors.js';
import type { ListMovie } from '../types.js';

const router = Router();

function sendError(res: Response, error: unknown, fallbackCode: ErrorCode, logLabel: string) {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${logLabel}:`, error.message);
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  console.error(`[${fallbackCode}] ${logLabel}:`, error);
  res.status(500).json({ error: { code: fallbackCode, message: 'Unexpected server error' } });
}

router.get('/genres', async (_req, res) => {
  try {
    const genres = await getGenres();
    res.json(genres);
  } catch (error) {
    sendError(res, error, 'GENRES_FAILED', 'Failed to fetch genres');
  }
});

router.get('/search/:type', async (req, res) => {
  try {
    const validTypes = ['movie', 'keyword', 'person'];
    const type = req.params.type as 'movie' | 'keyword' | 'person';
    const query = req.query.q as string;
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: { code: 'SEARCH_INVALID_TYPE', message: `Invalid search type: ${type}` } });
      return;
    }
    if (!query) {
      res.status(400).json({ error: { code: 'SEARCH_MISSING_QUERY', message: 'Query parameter "q" is required' } });
      return;
    }
    const results = await searchTMDB(type, query);
    res.json(results);
  } catch (error) {
    sendError(res, error, 'SEARCH_FAILED', `Failed to search ${req.params.type}`);
  }
});

router.get('/movie/:id', async (req, res) => {
  try {
    const details = await getMovieDetails(req.params.id);
    res.json(details);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      sendError(res, new AppError('MOVIE_DETAILS_NOT_FOUND', 404, error.message), 'MOVIE_DETAILS_FAILED', `Movie ${req.params.id} not found`);
      return;
    }
    sendError(res, error, 'MOVIE_DETAILS_FAILED', `Failed to fetch movie ${req.params.id}`);
  }
});

router.post('/discover', async (req, res) => {
  try {
    const filters = req.body;
    if (!filters.genres || filters.genres.length === 0) {
      res.status(400).json({ error: { code: 'DISCOVER_MISSING_GENRES', message: 'At least one genre is required' } });
      return;
    }
    const results = await discoverMovies(filters);
    res.json(deDuplicate(results));
  } catch (error) {
    sendError(res, error, 'DISCOVER_FAILED', 'Failed to discover movies');
  }
});

router.post('/letterboxdList', async (req, res) => {
  try {
    const { listUrl, listUrls } = req.body;
    const urls: string[] = (Array.isArray(listUrls) ? listUrls : [listUrl])
      .filter((url): url is string => typeof url === 'string' && url.trim().length > 0);

    if (urls.length === 0) {
      res.status(400).json({ error: { code: 'LETTERBOXD_MISSING_PARAMS', message: 'At least one list URL is required' } });
      return;
    }

    const scraped = await Promise.all(urls.map(url => scrapeLetterboxd(url)));
    const titles = [...new Set(scraped.flat())];
    const byTitle = await scrapedMovieDetail(titles);
    if (byTitle.size === 0) {
      res.status(404).json({ error: { code: 'LETTERBOXD_NO_MATCHES', message: `Found ${titles.length} titles on the list but none matched a TMDB movie` } });
      return;
    }

    const listMatches = new Map<number, number>();
    for (const listTitles of scraped) {
      const idsOnThisList = new Set<number>();
      for (const title of listTitles) {
        const movie = byTitle.get(title);
        if (movie) idsOnThisList.add(movie.id);
      }
      for (const id of idsOnThisList) {
        listMatches.set(id, (listMatches.get(id) ?? 0) + 1);
      }
    }

    const movieList: ListMovie[] = deDuplicate([...byTitle.values()])
      .map(movie => ({ ...movie, listMatches: listMatches.get(movie.id) ?? 1 }));
    res.json(movieList);
  } catch (error) {
    sendError(res, error, 'LETTERBOXD_FAILED', 'Failed to scrape Letterboxd list');
  }
});

export default router;
