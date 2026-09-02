import { useState, useEffect, useRef, useMemo } from 'react';
import { WeightedFilterOverlay } from '@/components/filters/WeightedFilterOverlay';
import { GENRES } from '@/data/genres'
import { LANGUAGES } from '@/data/languages';
import type { SortKey, SortDirection, SelectionState, FilterCriteria, ScoredMovie } from '@/types';
import { InputOverlay } from '@/components/filters/InputOverlay';
import { SliderOverlay } from '@/components/filters/SliderOverlay';
import { Button } from '@/components/ui/Button';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { Modal } from '@/components/ui/Modal'
import { MovieCard } from '@/components/movies/MovieCard';
import { CompactMovieList } from '@/components/movies/CompactMovieList';
import { formatMins } from '@/lib/utils'
import { makeSelectionHandler , genreSplit, sortMovies, dropMostPopular } from '@/lib/filters';
import { scoreMovies } from '@/lib/scoring';
import { Joust } from '@/components/joust/Joust';
import { FilterButton } from '@/components/filters/FilterButton';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { VineDivider } from '@/components/ui/VineDivider';
import { About } from '@/components/About';
import { MovieFetching } from '@/hooks/MovieFetching';
import joustKnight from '@/assets/joustKnight.svg';
import helmet from '@/assets/helmet.svg';
import birdEmblem from '@/assets/emblem.svg';
import discoverBorder from '@/assets/discoverBorder.svg';
import joustBorder from '@/assets/joustBorder.svg';

function App() {
  const [listUrls, setListUrls] = useState<string[]>(['']);
  const [genreSelect, setGenreSelect] = useState<Record<number, SelectionState>>({});
  const [languageSelect, setLanguageSelect] = useState<({ id: string; name: string }[])>([]);
  const [peopleSelect, setPeopleSelect] = useState<({ id: number; department: string, name: string }[])>([]);
  const [peopleQuery, setPeopleQuery] = useState<string>('');
  const [keywordSelect, setKeywordSelect] = useState<({ id: number; name: string }[])>([]);
  const [keywordQuery, setKeywordQuery] = useState<string>('');
  const [ratingRange, setRatingRange] = useState<[number, number]>([6,10])
  const [runtimeRange, setRuntimeRange] = useState<[number, number]>([90,180]);
  const [releaseDateRange, setReleaseDateRange] = useState<[number, number]>([1950,new Date().getFullYear()]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [joustInProgress, setJoustInProgress] = useState<boolean>(false);
  const [advFilterState, setAdvFilterState] = useState<boolean>(false);
  const [obscure, setObscure] = useState<boolean>(false);
  const [excludePopular, setExcludePopular] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending');
  const [sortOverlay, setSortOverlay] = useState<boolean>(false);
  const [compactView, setCompactView] = useState<boolean>(false);
  const [pinnedMovies, setPinnedMovies] = useState<ScoredMovie[] | null>(null);
  const [pinnedLabel, setPinnedLabel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { options: peopleOptionsRaw, isLoading: peopleLoading } = useDebouncedSearch(peopleQuery, 'person');
  const peopleOptions = (peopleOptionsRaw.map(p => ({
        ...p,
        department: p.known_for_department})));

  const { options: keywordOptions, isLoading: keywordLoading } = useDebouncedSearch(keywordQuery, 'keyword');

  // Memoized: scoring reads this during render, so it needs a stable identity
  // for the dependency comparison below to work.
  const discoverParameters: FilterCriteria = useMemo(() => ({
    ...genreSplit(genreSelect),
    languages: languageSelect.map(String),
    keywords: keywordSelect.map(k => k.id),
    people: peopleSelect,
    minRating : ratingRange[0],
    maxRating: ratingRange[1],
    runtimeRange: {min: runtimeRange[0], max: runtimeRange[1] >= 300 ? undefined : runtimeRange[1]},
    releaseYearRange: { from: releaseDateRange[0], to: releaseDateRange[1] },
    obscure,
    sortBy: 'popularity.desc'
  }), [genreSelect, languageSelect, keywordSelect, peopleSelect, ratingRange, runtimeRange, releaseDateRange, obscure]);

  const {movies, isLoading, discover, listScraping, source} = MovieFetching({listUrls, discoverParameters});

  const updateListUrl = (index: number, value: string) =>
    setListUrls(prev => prev.map((url, i) => (i === index ? value : url)));
  const addListUrl = () => setListUrls(prev => [...prev, '']);
  const removeListUrl = (index: number) =>
    setListUrls(prev => prev.filter((_, i) => i !== index));
  const hasListUrl = listUrls.some(url => url.trim());
  const [loadingDismissed, setLoadingDismissed] = useState(false);

  const resetFilters = () => {
    setGenreSelect({});
    setLanguageSelect([]);
    setKeywordSelect([]);
    setKeywordQuery('');
    setPeopleSelect([]);
    setPeopleQuery('');
    setRatingRange([6, 10]);
    setRuntimeRange([90, 180]);
    setReleaseDateRange([1950, new Date().getFullYear()]);
    setObscure(false);
    setExcludePopular(false);
};

const sortOptions: {key: SortKey, label: string}[] =[
  { key: 'score', label: 'Recommended' },
  { key: 'vote_average', label: 'Rating' },
  { key: 'popularity', label: 'Popularity' },
  { key: 'release_date', label: 'Year' },
  { key: 'title', label: 'Title' },
];

const resultsTopRef = useRef<HTMLDivElement>(null);
const scrollSpacerRef = useRef<HTMLDivElement>(null);

// Discovering again on unchanged filters walks forward a page; changing any
// filter starts over at page 1.
const lastDiscoverRef = useRef<string | null>(null);
const discoverPageRef = useRef(1);

const runDiscover = () => {
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

// Discovering throws away a Letterboxd list that took a while to build, so
// check first rather than silently replacing it.
const handleDiscover = () => {
  if (source === 'letterboxd' && movies.length > 0) {
    setActiveModal('discoverConfirm');
    return;
  }
  runDiscover();
};

const goToPage = (page: number) => {
  setCurrentPage(page);
  setSortOverlay(false);
};

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

// Client-side so a toggle re-ranks without a re-fetch.
const resultPool = useMemo(() => {
  const scored = scoreMovies(movies, discoverParameters);
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
      <div className="flex items-center justify-center gap-0 sm:gap-2 m-2">
        <img src={joustKnight} alt="" className="h-44 w-auto -my-8 -mr-10 -scale-x-100" />
        <h1 className="text-black-500 text-3xl sm:text-4xl font-bold text-center -mb-10">Film Jousting</h1>
        <img src={joustKnight} alt="" className="h-44 w-auto -my-8 -ml-10" />
      </div>
      <VineDivider className="mt-0 mb-2" />
      <div className="flex flex-col items-center gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-10 gap-y-2 mx-5 md:mb-2 sm:gap-x-8 sm:gap-y-3">
        <FilterButton name={'Genres'} isOpen={activeModal === 'genre'} clickAction={() => setActiveModal('genre')} onClose={() => setActiveModal(null)} align={'center'}
        info={
              Object.keys(genreSelect).length === 0
                ? <p className='text-sm'>Select Genre(s)</p>
                : Object.keys(genreSelect).map(id => {
                    const genre = GENRES.find(g => g.id === Number(id));
                    return (
                      <Button key={id} variant='selected' className={genreSelect[Number(id)] === 'veto' ? 'line-through' : ''} onClick={() => makeSelectionHandler(setGenreSelect)(Number(id), undefined)}>
                        {genre?.name}
                      </Button>
                    );
                  })
            }
                childern={<WeightedFilterOverlay options={GENRES} selected={genreSelect} onSelect={makeSelectionHandler(setGenreSelect)}/>}/>

       <FilterButton name={'Rating'} isOpen={activeModal === 'rating'} clickAction={() => setActiveModal('rating')} onClose={() => setActiveModal(null)}
          info={<span className="text-sm">{ratingRange[0]} - {ratingRange[1]}</span>}
          childern={
            <div>
            <h1 className='text-center text-lg font-bold underline underline-offset-6'>Rating</h1>
            <SliderOverlay value={ratingRange} onValueChange={setRatingRange} min={0} max={10} step={.5} />
            </div>
          }
       />

        <FilterButton name={'Runtime'} isOpen={activeModal === 'runtime'} clickAction={() => setActiveModal('runtime')} onClose={() => setActiveModal(null)}
          info={<span className="text-sm">{formatMins(runtimeRange[0])} - {runtimeRange[1] >= 300 ? '5hr+' : formatMins(runtimeRange[1])}</span>}
          childern={
            <div>
            <h1 className='text-center text-lg font-bold underline underline-offset-5'>Runtime</h1>
            <SliderOverlay value={runtimeRange} onValueChange={setRuntimeRange} min={0} max={300} step={15} formatValue={(n) => (n >= 300 ? '5hr+' : formatMins(n))}/>
            </div>
          }
        />

        <FilterButton name={'Released'} isOpen={activeModal === 'releaseDate'} clickAction={() => setActiveModal('releaseDate')} onClose={() => setActiveModal(null)} buttonClassName="max-w-28 sm:max-w-none"
          info={<span className="text-sm">{releaseDateRange[0]} - {releaseDateRange[1]}</span>}
          childern={
            <div>
            <h1 className='text-center text-lg font-bold underline underline-offset-5'>Release Date</h1>
            <SliderOverlay value={releaseDateRange} onValueChange={setReleaseDateRange} min={1900} max={new Date().getFullYear()} step={10} />
            </div>}
        />

        <div className="flex flex-col items-center mt-4">
          <div className="group relative flex items-center w-min mx-auto">
            <img src={helmet} alt="" className="absolute right-full mr-0.5 h-6 w-auto -scale-x-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Button onClick={resetFilters} className='text-sm no-underline hover:underline'>Reset Filters</Button>
            <img src={helmet} alt="" className="absolute left-full ml-0.5 h-6 w-auto opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
        <div className="flex flex-col items-center mt-4">
          <div className="group relative flex items-center w-min mx-auto">
            <img src={helmet} alt="" className="absolute right-full mr-0.5 h-6 w-auto -scale-x-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Button onClick={() => setAdvFilterState(!advFilterState)} className={`text-sm no-underline hover:underline ${advFilterState ? 'underline' : ''}`}>Advanced Filters</Button>
            <img src={helmet} alt="" className="absolute left-full ml-0.5 h-6 w-auto opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
        </div>
        </div>

  <div className="mb-2 flex flex-wrap justify-center gap-3 md:mt-2">
  {advFilterState &&
  <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
    <FilterButton name={'Languages'} isOpen={activeModal === 'language'} clickAction={() => setActiveModal('language')} onClose={() => setActiveModal(null)} buttonClassName="text-sm sm:text-lg"
      info={languageSelect.length > 0 && (
        <span className="text-md">
          {languageSelect.map(
            l => <Button key={l.id} variant='selected' onClick={()=>setLanguageSelect(languageSelect.filter(f => f.id !== l.id))}>{l.name}</Button>
          )}
        </span>
      )}
      childern={
        <>
          <span className="text-md sm:text-sm">Languages:</span>
          <InputOverlay
            options={LANGUAGES}
            selected={languageSelect}
            onChange={setLanguageSelect}
            placeholderText='English'
            getValue= {(o) => ({ id: String(o.id), name: o.name ?? 'unknown' })}
          />
          <p className='text-sm'>*selecting a language limits the results to only the languages selected</p>
        </>
      }
    />

    <FilterButton name={'Keywords'} isOpen={activeModal === 'keyword'} clickAction={() => setActiveModal('keyword')} onClose={() => setActiveModal(null)} buttonClassName="text-sm sm:text-lg"
      info={keywordSelect.length > 0 && (
        <span className="text-md">
          {keywordSelect.map(k =>
            <Button variant='selected' key={k.id} onClick={()=>setKeywordSelect(keywordSelect.filter(f=> f.id !== k.id))}>{k.name}</Button>)}
        </span>
      )}
      childern={
        <>
          <span className="text-md">Keyword:</span>
          <InputOverlay
            options={keywordOptions}
            selected={keywordSelect}
            onChange={setKeywordSelect}
            onQueryChange={setKeywordQuery}
            getValue={(o) => ({id: Number(o.id), name: o.name ?? 'unknown' })}
            placeholderText='Dragons'
            isLoading={keywordLoading} />
        </>
      }
    />

    <FilterButton name={'People'} isOpen={activeModal === 'people'} clickAction={() => setActiveModal('people')} onClose={() => setActiveModal(null)} buttonClassName="text-sm sm:text-lg"
      info={peopleSelect.length > 0 && (
        <span className="text-md">
          {peopleSelect.map(p =>
            <Button key={p.id} variant='selected' onClick={()=>setPeopleSelect(peopleSelect.filter(f=> f.id !== p.id))}>{p.name}</Button>)}
        </span>
      )}
      childern={
        <>
          <span className="text-md">People:</span>
          <InputOverlay
            options={peopleOptions}
            selected={peopleSelect}
            onChange={setPeopleSelect}
            onQueryChange={setPeopleQuery}
            getValue= {(o) => ({ id: Number(o.id), department: o.department ?? 'unknown', name: o.name ?? 'unknown' })}
            placeholderText='Drew Barrymore'
            isLoading={peopleLoading} />
        </>
      }
    />

    <label className="flex items-center gap-2 text-sm sm:text-lg cursor-pointer mb-3 sm:mb-0">
      <input
        type="checkbox"
        checked={obscure}
        onChange={(e) => setObscure(e.target.checked)}
        className={`appearance-none w-4 h-4 rounded-full bg-[#FCF8F9] bg-contain bg-no-repeat bg-center cursor-pointer ${obscure ? '' : 'border-2 border-black'}`}
        style={{ backgroundImage: obscure ? `url(${birdEmblem})` : 'none' }}
      />
      Include extremely obscure / hidden gems
    </label>

    <label className="flex items-center gap-2 text-sm sm:text-lg cursor-pointer mb-3 sm:mb-0">
      <input
        type="checkbox"
        checked={excludePopular}
        onChange={(e) => setExcludePopular(e.target.checked)}
        className={`appearance-none w-4 h-4 rounded-full bg-[#FCF8F9] bg-contain bg-no-repeat bg-center cursor-pointer ${excludePopular ? '' : 'border-2 border-black'}`}
        style={{ backgroundImage: excludePopular ? `url(${birdEmblem})` : 'none' }}
      />
      Exclude the most popular films
    </label>

  </div>
  }
  </div>

  <VineDivider className="mt-0 mb-4" />

    <div className='flex flex-col items-center md:flex-row md:items-baseline'>
      <span className="flex items-center whitespace-nowrap">
        Search within Letterboxd
        <Button variant="sort" onClick={() => setActiveModal('letterboxdHelp')} aria-label="About Letterboxd list search" className="font-bold w-7.5 h-7.5 p-0 -mr-7.5 md:mr-0">?</Button>
      </span>
      <div className="flex flex-col w-full max-w-sm sm:max-w-lg">
        {listUrls.map((url, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            className = "flex-1 min-w-0 border-3 border-black my-2 px-2 py-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500"
            value = {url}
            onChange={(e) => updateListUrl(index, e.target.value)}
            aria-label={`Letterboxd list URL or username ${index + 1}`}
            placeholder="List URL or Username"
          />
          {index === 0 ? (
          <>
            <Button variant="search" onClick={addListUrl} aria-label="Add another list" className="font-bold -mx-1 px-2">+</Button>
            <Button variant="search" onClick={() => { setCurrentPage(1); setLoadingDismissed(false); listScraping(); }} disabled={!hasListUrl || discoverParameters.genres.length === 0} disabledReason={!hasListUrl ? 'LETTERBOXD_MISSING_PARAMS' : 'SEARCH_MISSING_GENRES'}>Search</Button>
          </>
          ) : (
            <Button variant="sort" onClick={() => removeListUrl(index)} aria-label="Remove this list">×</Button>
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
      Discover
    </Button>
    <Button variant='primary' onClick={() => setActiveModal('joust')} disabled={movies.length <= 0} disabledReason="JOUST_NO_MOVIES" className='joust-border'>
      JOUST!
    </Button>
    </div>
    <Modal
      isOpen={activeModal === 'joust'}
      onClose={() => { setActiveModal(null); setJoustInProgress(false); }}
      align="center"
      maxHeightClass="max-h-[92dvh]"
      label="Joust"
      confirmCloseMessage={joustInProgress ? 'Leaving now loses your bracket!' : undefined}>
      <Joust movies={resultPool} onInProgressChange={setJoustInProgress}/>
    </Modal>
    <Modal isOpen={activeModal === 'discoverConfirm'} onClose={() => setActiveModal(null)} align="center" label="Replace your Letterboxd results?">
      <div className="flex flex-col items-center gap-3 text-start m-5">
        <p className="text-center">Discovering now will pull movies from a TMDB search and replace your Letterboxd search.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="search" onClick={() => setActiveModal(null)}>Keep my list</Button>
          <Button variant="search" onClick={() => { setActiveModal(null); runDiscover(); }}>Discover anyway</Button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={isLoading && !loadingDismissed} onClose={() => setLoadingDismissed(true)} align="center" label="Finding films" historyEntry={false}>
      <LoadingAnimation />
    </Modal>

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
        <span className="ml-auto self-end p-2 text-xs whitespace-nowrap">Discover again to go deeper</span>
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

        {/* DEV is inlined as false in production, so this branch is dropped from
            the bundle rather than just being unreachable. */}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 sm:gap-y-5 mx-2">
          {visibleMovies.map(m=> <MovieCard key={m.id} id={m.id} poster={m.poster_path} title={m.title} overview={m.overview} rating={m.vote_average} voteCount={m.vote_count} releaseDate={m.release_date}/>)}
        </div>

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