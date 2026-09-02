import * as cheerio from 'cheerio';
import { searchTMDB } from './tmdbService';
import { AppError } from '../errors.js';
import type { Movie } from '../types';

export async function scrapeLetterboxd(url: string) {
    // A bare username means that person's watchlist, which is otherwise a URL
    // nobody can guess. A scheme-less paste is the other common shape, and
    // neither survives new URL() on its own.
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

    // Sharing a list from the Letterboxd app gives a boxd.it short link. Only
    // the Location header is wanted, so the redirect isn't followed.
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

    // People copy the URL of whatever view they were looking at, but Letterboxd
    // serves 403 for page 2+ of any sorted or detail view (/by/popular/,
    // /detail/, ...). Trimming back to the canonical list path keeps pagination
    // working; the sort order doesn't matter since we rank the films ourselves.
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

// Keyed by the scraped title rather than returned flat, so the caller can still
// tell which list each film came from once the titles have become movies.
export async function scrapedMovieDetail(titles:string[]){
    const byTitle = new Map<string, Movie>();
    for (const title of titles){
        const parts = title.split('(');
        const movieName = parts[0]!.trim();
        const year = parts[1]?.replace (')','').trim();
        const results = await searchTMDB('movie', movieName, year);
        const topResult = results[0];
        if (topResult){
        byTitle.set(title, topResult)
        }
    }
    return byTitle;
}