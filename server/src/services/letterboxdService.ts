import * as cheerio from 'cheerio';
import { searchTMDB } from './tmdbService';
import { AppError } from '../errors.js';

export async function scrapeLetterboxd(url: string) {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new AppError('LETTERBOXD_INVALID_URL', 400, `Not a valid URL: ${url}`);
    }
    if (!parsed.hostname.endsWith('letterboxd.com')) {
        throw new AppError('LETTERBOXD_INVALID_URL', 400, `Not a letterboxd.com URL: ${url}`);
    }

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

export async function scrapedMovieDetail(titles:string[]){
    let movieList = []
    for (const title of titles){
        const parts = title.split('(');
        const movieName = parts[0]!.trim();
        const year = parts[1]?.replace (')','').trim();
        const results = await searchTMDB('movie', movieName, year);
        const topResult = results[0];
        if (topResult){
        movieList.push(topResult)
        }
    }
    return movieList;
}