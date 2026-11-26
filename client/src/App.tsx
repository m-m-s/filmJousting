import { useState, useEffect, useRef, useMemo } from 'react';
import type { SortKey, SortDirection, ScoredMovie } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal'
import { CompactMovieList } from '@/components/movies/CompactMovieList';
import { ResultsGrid } from '@/components/movies/ResultsGrid';
import { sortMovies, dropMostPopular, applyFilters } from '@/lib/filters';
import { scoreMovies } from '@/lib/scoring';
import { Joust } from '@/components/joust/Joust';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { LoadingModal } from '@/components/ui/LoadingModal';
import { VineDivider } from '@/components/ui/VineDivider';
import { About } from '@/components/About';
import { Welcome } from '@/components/Welcome';
import { MovieFetching } from '@/hooks/MovieFetching';
import { useFilters } from '@/hooks/useFilters';
import { useErrorModal } from '@/hooks/useErrorModal';
import joustKnight from '@/assets/joustKnight.svg';
import discoverBorder from '@/assets/discoverBorder.svg';
import joustBorder from '@/assets/joustBorder.svg';
import vineBlockTile from '@/assets/flowerOrnamentalBorder.svg';
import { API_URL } from '@/config';

function App() {
  const [listUrls, setListUrls] = useState<string[]>(['']);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [joustInProgress, setJoustInProgress] = useState<boolean>(false);
  const [joustUndo, setJoustUndo] = useState<(() => void) | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending');
  const [sortOverlay, setSortOverlay] = useState<boolean>(false);
  const [compactView, setCompactView] = useState<boolean>(false);
  const [pinnedMovies, setPinnedMovies] = useState<ScoredMovie[] | null>(null);
  const [pinnedLabel, setPinnedLabel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filters = useFilters();
  const { discoverParameters, excludePopular, resetFilters } = filters;

  const {movies, isLoading, discover, listScraping, source, clearMovies} = MovieFetching({listUrls, discoverParameters});
  const { showError } = useErrorModal();

  const updateListUrl = (index: number, value: string) =>
    setListUrls(prev => prev.map((url, i) => (i === index ? value : url)));
  const addListUrl = () => setListUrls(prev => [...prev, '']);
  const removeListUrl = (index: number) =>
    setListUrls(prev => prev.filter((_, i) => i !== index));
  const hasListUrl = listUrls.some(url => url.trim());
  const [loadingDismissed, setLoadingDismissed] = useState(false);

const sortOptions: {key: SortKey, label: string}[] =[
  { key: 'score', label: 'Recommended' },
  { key: 'vote_average', label: 'Rating' },
  { key: 'popularity', label: 'Popularity' },
  { key: 'release_date', label: 'Year' },
  { key: 'title', label: 'Title' },
];

const resultsTopRef = useRef<HTMLDivElement>(null);
const scrollSpacerRef = useRef<HTMLDivElement>(null);

const lastDiscoverRef = useRef<string | null>(null);
const discoverPageRef = useRef(1);

const runDiscover = () => {
  if (source === 'letterboxd') {
    setListUrls(['']);
  }
  const filterKey = JSON.stringify(discoverParameters);
  if (filterKey === lastDiscoverRef.current) {
    discoverPageRef.current += 1;
  } else {
    lastDiscoverRef.current = filterKey;
    discoverPageRef.current = 1;
  }
  setCurrentPage(1);
  setLoadingDismissed(false);
  discover(discoverPageRef.current);
};

const handleDiscover = () => {
  if (discoverParameters.genres.length === 0) {
    showError('DISCOVER_MISSING_GENRES');
    return;
  }
  if (!hasListUrl) {
    runDiscover();
    return;
  }
  lastDiscoverRef.current = null;
  discoverPageRef.current = 1;
  setCurrentPage(1);
  setLoadingDismissed(false);
  listScraping();
};

const startOver = () => {
  resetFilters();
  clearMovies();
  setListUrls(['']);
  setCurrentPage(1);
  setSortOverlay(false);
  setPinnedMovies(null);
  lastDiscoverRef.current = null;
  discoverPageRef.current = 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goToPage = (page: number) => {
  setCurrentPage(page);
  setSortOverlay(false);
};

useEffect(() => {
  fetch(`${API_URL}/api/health`).catch(()=> {});
}, []);

useEffect(() => {
  if (scrollSpacerRef.current) {
    scrollSpacerRef.current.style.height = '0px';
  }
  const rect = resultsTopRef.current?.getBoundingClientRect();
  if (rect && scrollSpacerRef.current) {
    const roomBelowTarget = document.documentElement.scrollHeight - (window.scrollY + rect.top);
    const deficit = Math.max(0, window.innerHeight - roomBelowTarget);
    scrollSpacerRef.current.style.height = `${deficit}px`;
  }
  resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const collapseSpacer = () => {
    if (scrollSpacerRef.current) scrollSpacerRef.current.style.height = '0px';
  };
  window.addEventListener('scrollend', collapseSpacer, { once: true });
  const fallback = window.setTimeout(collapseSpacer, 1000);
  return () => {
    window.removeEventListener('scrollend', collapseSpacer);
    window.clearTimeout(fallback);
  };
}, [currentPage, movies]);

const resultPool = useMemo(() => {
  const scored = scoreMovies(applyFilters(movies, discoverParameters), discoverParameters);
  return excludePopular ? dropMostPopular(scored) : scored;
}, [movies, excludePopular, discoverParameters]);

const sortedMovies = sortMovies(resultPool, sortKey, sortDirection);
const pageSize = 20;
const visibleMovies= sortedMovies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
const totalPages = Math.ceil(sortedMovies.length / pageSize);
const maxPageButtons = 5;
let pageWindowStart = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
const pageWindowEnd = Math.min(totalPages, pageWindowStart + maxPageButtons - 1);
pageWindowStart = Math.max(1, pageWindowEnd - maxPageButtons + 1);
const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_,i) => pageWindowStart + i);

  return (
    <div className={`${compactView ? 'w-full px-2' : 'w-[95%] sm:w-4/5'} mx-auto flex flex-col items-center`}>
      <link rel="preload" as="image" href={joustKnight} />
      <link rel="preload" as="image" href={discoverBorder} />
      <link rel="preload" as="image" href={joustBorder} />
      <link rel="preload" as="image" href={vineBlockTile} />
      <Welcome />
      <div className="flex items-center justify-center gap-0 sm:gap-2 m-2">
        <img src={joustKnight} alt="" className="h-44 w-auto -my-8 -mr-10 -scale-x-100" />
        <h1 className="text-black-500 text-3xl sm:text-4xl font-bold text-center -mb-10">
          <button onClick={startOver} className="p-0 cursor-pointer" aria-label="Film Jousting, start over">Film Jousting</button>
        </h1>
        <img src={joustKnight} alt="" className="h-44 w-auto -my-8 -ml-10" />
      </div>
      <VineDivider className="mt-0 mb-2" />
      <FilterPanel filters={filters} activeModal={activeModal} setActiveModal={setActiveModal} />

  <VineDivider className="mt-0 mb-4" />

    <div className='flex flex-col items-center md:flex-row md:items-baseline'>
      <span className="flex items-center whitespace-nowrap font-bold text-lg">
        Search within Letterboxd
        <Button variant="sort" onClick={() => setActiveModal('letterboxdHelp')} aria-label="About Letterboxd list search" className="font-bold w-7.5 h-7.5 p-0 -mr-7.5 md:mr-0">?</Button>
      </span>
      <div className="flex flex-col w-full max-w-sm sm:max-w-lg">
        {listUrls.map((url, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              className={`w-full border-3 border-black my-1 pl-2 py-1 text-black focus:outline-none focus:ring-2 focus:ring-[#4E3320] pr-10 ${url.trim() ? 'bg-[#FFF4D6]' : 'bg-white'}`}
              value = {url}
              onChange={(e) => updateListUrl(index, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDiscover(); }}
              aria-label={`Letterboxd list URL or username ${index + 1}`}
              placeholder="List URL or Username"
            />
            {url && (
              <button
                type="button"
                onClick={() => updateListUrl(index, '')}
                aria-label={`Clear list ${index + 1}`}
                className="absolute right-0 top-1/2 p-2 -translate-y-1/2 font-bold text-lg leading-none text-black/60 hover:text-black"
              >
                ×
              </button>
            )}
          </div>
          {index === 0 ? (
            <Button variant="search" onClick={addListUrl} aria-label="Add another list" className="font-bold -mx-1 px-2">+</Button>
          ) : (
            <Button variant="search" onClick={() => removeListUrl(index)} aria-label="Remove this list" className="font-bold -mx-1 px-2">-</Button>
          )}
        </div>
        ))}
      </div>
    </div>

    <Modal isOpen={activeModal === 'letterboxdHelp'} onClose={() => setActiveModal(null)} align="center" label="About Letterboxd list search">
      <div className="flex flex-col items-center gap-3 text-start m-5">
        <h1 className="text-2xl font-bold text-center">Letterboxd Lists</h1>
        <p>Paste a link to any Letterboxd list. A watchlist, a ranked top 100, a themed collection or more! Your filters and our custom scoring will be applied to the films on that list instead of searching all of TMDB.</p>
        <p>Or just type a Letterboxd username on its own and we'll search that person's watchlist.</p>
        <p>Add more than one list to draw from all of them at once. Built for finding a movie to watch from both your watchlist and/or a friend's.</p>
      </div>
    </Modal>
    <div className='flex flex-col items-center sm:flex-row sm:items-start justify-center mt-2 sm:gap-2'>
    <Button variant="primary" onClick={handleDiscover} disabled= {discoverParameters.genres.length === 0} disabledReason="DISCOVER_MISSING_GENRES" className='discover-border'>
      <span className='relative'>
        Discover
        {hasListUrl && <span className='absolute top-full -mt-1 left-1/2 -translate-x-1/2 text-[11px] normal-case whitespace-nowrap'>within Letterboxd {listUrls.filter(url => url.trim()).length > 1 ? 'lists' : 'list'}</span>}
      </span>
    </Button>
    <Button variant='primary' onClick={() => setActiveModal('joust')} disabled={resultPool.length <= 0} disabledReason="JOUST_NO_MOVIES" className='joust-border'>
      JOUST!
    </Button>
    </div>
    <Modal
      isOpen={activeModal === 'joust'}
      onClose={() => { setActiveModal(null); setJoustInProgress(false); }}
      align="center"
      maxHeightClass="max-h-[92dvh]"
      label="Joust"
      confirmCloseMessage={joustInProgress ? 'Leaving now loses your bracket!' : undefined}
      below={joustUndo && (
        <Button variant='search' onClick={joustUndo} className='bg-[#F6F3EF] text-sm leading-none whitespace-nowrap'><span className='font-bold text-base'>←</span> Change your mind?</Button>
      )}>
      <Joust movies={resultPool} onInProgressChange={setJoustInProgress} onUndoChange={(undo) => setJoustUndo(() => undo)}/>
    </Modal>

    {!loadingDismissed && <LoadingModal isLoading={isLoading} onDismiss={() => setLoadingDismissed(true)} />}

    <div>
    {movies.length > 0 &&
      <div className='mt-5' ref={resultsTopRef}>
        <div className="flex justify-start items-center gap-2">
        <Button variant="sort" className={sortOverlay === true ? 'underline underline-offset-5' : undefined} onClick={() => setSortOverlay(!sortOverlay)}>Sort</Button>
        {import.meta.env.DEV && (
        <Button variant="sort" className={compactView === true ? 'underline underline-offset-5' : undefined} onClick={() => setCompactView(!compactView)}>{compactView ? 'Card View' : 'Compact View'}</Button>
        )}
        {import.meta.env.DEV && compactView && (
        <Button variant="sort" onClick={() => {
          setPinnedMovies(sortedMovies);
          setPinnedLabel(`${sortOptions.find(o => o.key === sortKey)?.label ?? sortKey} ${sortDirection === 'descending' ? '↓' : '↑'}${excludePopular ? ' · no-pop' : ''}`);
        }}>Pin</Button>
        )}
        {import.meta.env.DEV && compactView && pinnedMovies && (
        <Button variant="sort" onClick={() => setPinnedMovies(null)}>Unpin</Button>
        )}
        {source === 'discover' && <span className="ml-auto self-end p-2 text-sm font-semibold text-right">Press Discover again for more obscure films!</span>}
        </div>
        {sortOverlay && <hr className="border-t-2 border-black mt-1" />}
        <div className="flex justify-center">
        {sortOverlay &&
        <div className='flex flex-wrap justify-start items-center gap-2 p-2 mt-1 mb-2'>
          {sortOptions.map(({ key, label }) => (
          <Button key={key} variant="sort" onClick={() => setSortKey(key)} className={sortKey === key ? 'bg-black text-white' : ''}>{label}</Button>
          ))}
          <Button variant="sort" aria-label={sortDirection === 'descending' ? 'Sort ascending' : 'Sort descending'} onClick={() => setSortDirection(sortDirection === 'descending' ? 'ascending' : 'descending')}>{sortDirection === 'descending' ? '↑' : '↓'}</Button>
        </div>
        }

        </div>

        <hr className="border-t-2 border-black mb-3" />

        {/* Dev only view for scoring testing */}
        {import.meta.env.DEV && compactView ? (
          pinnedMovies ? (
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-1">Pinned — {pinnedLabel}</p>
              <CompactMovieList movies={pinnedMovies} selectedGenres={discoverParameters.genres} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-1">Current — {sortOptions.find(o => o.key === sortKey)?.label ?? sortKey} {sortDirection === 'descending' ? '↓' : '↑'}{excludePopular ? ' · no-pop' : ''}</p>
              <CompactMovieList movies={sortedMovies} selectedGenres={discoverParameters.genres} />
            </div>
          </div>
          ) : (
          <CompactMovieList movies={sortedMovies} selectedGenres={discoverParameters.genres} />
          )
        ) : (
        <>
        {sortedMovies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-center my-10 px-4">
          <p className="text-xl font-bold">Not a single contender survived</p>
          <p className="text-sm">Your filters ruled out every last one. Try lifting a veto, or widening the rating, runtime or year range.</p>
        </div>
        ) : (
        <ResultsGrid key={`${currentPage}-${movies.length}-${movies[0]?.id ?? 0}`} movies={visibleMovies} />
        )}

        <hr className="border-t-2 border-black mt-3" />

          {totalPages > 1 && (
           <div className="flex gap-2 justify-center mt-5">
          <Button variant="sort" aria-label="Previous page" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>{'<'}</Button>
          {pageWindowStart > 1 && (
            <>
              <Button onClick={() => goToPage(1)} variant="sort">1</Button>
              <span className="self-end">...</span>
            </>
          )}
          {pageNumbers.map(num =>
            (<Button key= {num} onClick={()=> goToPage(num)} variant="sort" className={num === currentPage ? 'text-2xl px-3 py-1 bg-black text-white' : ''}>{num}</Button>
        ))}
          {pageWindowEnd < totalPages && (
            <>
              <span className="self-end">...</span>
              <Button onClick={() => goToPage(totalPages)} variant="sort">{totalPages}</Button>
            </>
          )}
          <Button variant="sort" aria-label="Next page" onClick={()=> goToPage(currentPage + 1)} disabled={currentPage === totalPages}>{'>'}</Button>
        </div>
        )}
        </>
        )}
      </div>
      }
      </div>
      <div ref={scrollSpacerRef} />
      <About />
    </div>
  );
};

export default App;