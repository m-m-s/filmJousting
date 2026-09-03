import * as cheerio from 'cheerio';
import { searchTMDB, getMovieDetails } from './tmdbService';
import { AppError } from '../errors.js';
import type { ListMovie } from '../types';

export async function scrapeLetterboxd(url: string) {
    const trimmed = url.trim();
    if (/^[A-Za-z0-9_]+$/.test(trimmed)) {
        url = `https://letterboxd.com/${trimmed}/watchlist/`;
    } else if (!/^https?:\/\//i.test(trimmed)) {
        url = `https://${trimmed}`;
    } else {
        url = trimmed;
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new AppError('LETTERBOXD_INVALID_URL', 400, `Not a valid URL: ${url}`);
    }

    if (parsed.hostname === 'boxd.it' || parsed.hostname === 'www.boxd.it') {
        let location: string | null;
        try {
            const shortLink = await fetch(parsed.toString(), { redirect: 'manual' });
            location = shortLink.headers.get('location');
        } catch (error) {
            throw new AppError('LETTERBOXD_FETCH_FAILED', 502, `Could not resolve short link ${url}: ${error}`);
        }
        if (!location) {
            throw new AppError('LETTERBOXD_INVALID_URL', 400, `Short link led nowhere: ${url}`);
        }
        try {
            parsed = new URL(location);
        } catch {
            throw new AppError('LETTERBOXD_INVALID_URL', 400, `Short link resolved to an invalid URL: ${location}`);
        }
    }

    if (!parsed.hostname.endsWith('letterboxd.com')) {
        throw new AppError('LETTERBOXD_INVALID_URL', 400, `Not a letterboxd.com URL: ${parsed.toString()}`);
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const listIndex = segments.indexOf('list');
    const watchlistIndex = segments.indexOf('watchlist');
    if (listIndex !== -1 && segments.length > listIndex + 2) {
        parsed.pathname = `/${segments.slice(0, listIndex + 2).join('/')}/`;
    } else if (watchlistIndex !== -1 && segments.length > watchlistIndex + 1) {
        parsed.pathname = `/${segments.slice(0, watchlistIndex + 1).join('/')}/`;
    }
    url = parsed.toString();

    let currentUrl: string | null = url;
    const titles: string [] = [];
while (currentUrl) {
    let response: Response;
    try {
        response = await fetch(currentUrl);
    } catch (error) {
        throw new AppError('LETTERBOXD_FETCH_FAILED', 502, `Could not reach Letterboxd: ${error}`);
    }
    if (!response.ok) {
        throw new AppError('LETTERBOXD_FETCH_FAILED', 502, `Letterboxd returned ${response.status} for ${currentUrl}`);
    }
    const baseUrl = new URL(url).origin;
    const html = await response.text();
    const $ = cheerio.load(html);
    const nextLink = $('a.next').attr('href');
    const nextUrl=`${baseUrl}${nextLink}`;

    $('div.react-component').each((index, element) => {
        const title = $(element).attr('data-item-name');
        if (title) {
            titles.push(title);
        }
        });
    if (nextLink) {
        currentUrl = nextUrl
    } else {
        currentUrl = null
    }
    };
    if (titles.length === 0) {
        throw new AppError('LETTERBOXD_EMPTY_LIST', 404, `No movie entries found on page for ${url}`);
    }
    return titles;
}

const LOOKUP_CONCURRENCY = 16;

export async function scrapedMovieDetail(titles:string[]){
    const byTitle = new Map<string, ListMovie>();

    const lookUp = async (title: string) => {
        const parts = title.split('(');
        const movieName = parts[0]!.trim();
        const year = parts[1]?.replace (')','').trim();
        const results = await searchTMDB('movie', movieName, year);
        const topResult = results[0];
        if (!topResult) return;

        const runtime = await getMovieDetails(String(topResult.id))
            .then(details => details.runtime)
            .catch(() => null);
        byTitle.set(title, { ...topResult, runtime, listMatches: 1 });
    };

    for (let i = 0; i < titles.length; i += LOOKUP_CONCURRENCY) {
        await Promise.all(titles.slice(i, i + LOOKUP_CONCURRENCY).map(lookUp));
    }
    return byTitle;
}