import { useState, useEffect, useRef } from 'react';
import { WeightedFilterOverlay } from './components/WeightedFilterOverlay';
import { GENRES } from './data/genres'
import { LANGUAGES } from './data/languages';
import type { SortKey, SortDirection, SelectionState, FilterCriteria } from './types';
import { InputOverlay } from './components/InputOverlay';
import { SliderOverlay } from './components/SliderOverlay';
import { Button } from './components/ui/Button';
import { useDebouncedSearch } from './hooks/useDebouncedSearch';
import { Modal } from './components/ui/Modal'
import { MovieCard } from './components/MovieCard';
import { formatMins } from './lib/utils'
import { makeSelectionHandler , genreSplit, sortMovies } from './lib/filters';
import { JoustParams } from './components/JoustParam';
import { FilterButton } from './components/FilterButton';
import { LoadingAnimation } from './components/LoadingAnimation';
import { VineDivider } from './components/VineDivider';
import { AboutFooter } from './components/AboutFooter';
import { MovieFetching } from './hooks/MovieFetching';
import joustKnight from './assets/joustKnight.svg';
import helmet from './assets/helmet.svg';
import birdEmblem from './assets/emblem.svg';

function App() {
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [genreSelect, setGenreSelect] = useState<Record<number, SelectionState>>({});
  const [languageSelect, setLanguageSelect] = useState<({ id: string; name: string }[])>([]);;
  const [peopleSelect, setPeopleSelect] = useState<({ id: number; department: string, name: string }[])>([]);
  const [peopleQuery, setPeopleQuery] = useState<string>('');
  const [keywordSelect, setKeywordSelect] = useState<({ id: number; name: string }[])>([]);
  const [keywordQuery, setKeywordQuery] = useState<string>('');
  const [ratingRange, setRatingRange] = useState<[number, number]>([6,10])
  const [runtimeRange, setRuntimeRange] = useState<[number, number]>([90,300]);
  const [releaseDateRange, setReleaseDateRange] = useState<[number, number]>([1950,new Date().getFullYear()]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [advFilterState, setAdvFilterState] = useState<boolean>(false);
  const [obscure, setObscure] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending');
  const [sortOverlay, setSortOverlay] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { options: peopleOptionsRaw, isLoading: peopleLoading } = useDebouncedSearch(peopleQuery, 'person');
  const peopleOptions = (peopleOptionsRaw.map(p => ({
        ...p,
        department: p.known_for_department})));

  const { options: keywordOptions, isLoading: keywordLoading } = useDebouncedSearch(keywordQuery, 'keyword');

  const discoverParameters: FilterCriteria = {
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
  };

  const {movies, isLoading, discover, listScraping} = MovieFetching({searchQuery, discoverParameters, sortKey, sortDirection});
  const [loadingDismissed, setLoadingDismissed] = useState(false);

  const resetFilters = () => {
    setGenreSelect({});
    setLanguageSelect([]);
    setKeywordSelect([]);
    setKeywordQuery('');
    setPeopleSelect([]);
    setPeopleQuery('');
    setRatingRange([6, 10]);
    setRuntimeRange([90, 300]);
    setReleaseDateRange([1950, new Date().getFullYear()]);
    setObscure(false);
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
}, [currentPage, movies]);

const sortedMovies = sortMovies(movies, sortKey, sortDirection);
const pageSize = 20;
const visibleMovies= sortedMovies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
const totalPages = Math.ceil(sortedMovies.length / pageSize);
const maxPageButtons = 5;
let pageWindowStart = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
let pageWindowEnd = Math.min(totalPages, pageWindowStart + maxPageButtons - 1);
pageWindowStart = Math.max(1, pageWindowEnd - maxPageButtons + 1);
const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_,i) => pageWindowStart + i);

  return (
    <div className="w-[95%] sm:w-4/5 mx-auto flex flex-col items-center">
      <div className="flex items-center justify-center gap-0 sm:gap-2 m-2">
        <img src={joustKnight} alt="" className="h-44 w-auto -my-8 -mr-10 -scale-x-100" />
        <h1 className="text-black-500 text-3xl sm:text-4xl font-bold text-center -mb-10">Film Jousting</h1>
        <img src={joustKnight} alt="" className="h-44 w-auto -my-8 -ml-10" />
      </div>
      <VineDivider className="mt-0 mb-2" />
      <div className="flex flex-col items-center gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-x-10 gap-y-2 mx-5 md:mb-2 sm:gap-3">
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
            <h1 className='text-center text-lg font-bold underline underline-offset-5'>Rating</h1>
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
  </div>
  }
  </div>

  <VineDivider className="mt-0 mb-6" />

    <div className='flex flex-col items-center md:flex-row'>
      <span className="whitespace-nowrap">Search within a Letterboxd List: </span>
      <div className="flex items-center w-full max-w-xs sm:max-w-sm">
      <input
        className = "flex-1 min-w-0 border-3 border-black mx-2 my-2 px-2 py-1  bg-white text-black focus:outline-none fous:ring-2 focus:ring-red-500"
        value = {searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="https://letterboxd.com/official/list/letterboxds-top-500-films/"
      />
      <Button variant="search" onClick={() => { setCurrentPage(1); setLoadingDismissed(false); listScraping(); }} disabled={!searchQuery.trim()} disabledReason="SEARCH_MISSING_QUERY">Search</Button>
    </div>
    </div>
    <div className='flex flex-col items-center sm:flex-row sm:items-start justify-center mt-2 sm:gap-2'>
    <Button variant="primary" onClick={() => { setCurrentPage(1); setLoadingDismissed(false); discover(); }} disabled= {discoverParameters.genres.length === 0} disabledReason="DISCOVER_MISSING_GENRES" className='discover-border'>
      {sortedMovies.length > 0 ? 'Re-Discover' : 'Discover'}
    </Button>
    <Button variant='primary' onClick={() => setActiveModal('joust')} disabled={movies.length <= 0} disabledReason="JOUST_NO_MOVIES" className='joust-border'>
      JOUST!
    </Button>
    </div>
    <Modal isOpen={activeModal === 'joust'} onClose={() => setActiveModal(null)} align="center" maxHeightClass="max-h-[92dvh]">
      <JoustParams movies={movies}/>
    </Modal>
    <Modal isOpen={isLoading && !loadingDismissed} onClose={() => setLoadingDismissed(true)} align="center">
      <LoadingAnimation />
    </Modal>

    <div>
    {movies.length > 0 &&
      <div className='mt-5' ref={resultsTopRef}>
        <div className="flex justify-start">
        <Button variant="sort" className={sortOverlay === true ? 'underline underline-offset-5' : undefined} onClick={() => setSortOverlay(!sortOverlay)}>Sort</Button>
        </div>
        <div className="flex justify-center mb-5">
        {sortOverlay &&
        <div className='flex flex-wrap justify-start items-center gap-2 p-2 mt-2'>
          {sortOptions.map(({ key, label }) => (
          <Button key={key} variant="sort" onClick={() => setSortKey(key)} className={sortKey === key ? 'bg-black text-white' : ''}>{label}</Button>
          ))}
          <Button variant="sort" onClick={() => setSortDirection(sortDirection === 'descending' ? 'ascending' : 'descending')}>{sortDirection === 'descending' ? '↑' : '↓'}</Button>
        </div>
        }

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 sm:gap-y-5 sm:mx-2">
          {visibleMovies.map(m=> <MovieCard key={m.id} id={m.id} poster={m.poster_path} title={m.title} overview={m.overview} rating={m.vote_average} voteCount={m.vote_count} releaseDate={m.release_date}/>)}
        </div>
          {totalPages > 1 && (
           <div className="flex gap-2 justify-center mt-5">
          <Button variant="sort" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>{'<'}</Button>
          {pageWindowStart > 1 && (
            <>
              <Button onClick={() => setCurrentPage(1)} variant="sort">1</Button>
              <span className="self-end">...</span>
            </>
          )}
          {pageNumbers.map(num =>
            (<Button key= {num} onClick={()=> setCurrentPage(num)} variant="sort" className={num === currentPage ? 'text-2xl px-3 py-1 bg-black text-white' : ''}>{num}</Button>
        ))}
          {pageWindowEnd < totalPages && (
            <>
              <span className="self-end">...</span>
              <Button onClick={() => setCurrentPage(totalPages)} variant="sort">{totalPages}</Button>
            </>
          )}
          <Button variant="sort" onClick={()=> setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>{'>'}</Button>
        </div>
        )}
      </div>
      }
      </div>
      <div ref={scrollSpacerRef} />
      <AboutFooter />
    </div>
  );
};

export default App;