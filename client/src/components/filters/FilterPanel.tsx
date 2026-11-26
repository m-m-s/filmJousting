import { useState } from 'react';
import { WeightedFilterOverlay } from '@/components/filters/WeightedFilterOverlay';
import { InputOverlay } from '@/components/filters/InputOverlay';
import { SliderOverlay } from '@/components/filters/SliderOverlay';
import { FilterButton } from '@/components/filters/FilterButton';
import { Button } from '@/components/ui/Button';
import { GENRES } from '@/data/genres'
import { LANGUAGES } from '@/data/languages';
import { formatMins } from '@/lib/utils'
import { makeSelectionHandler } from '@/lib/filters';
import type { Filters } from '@/hooks/useFilters';
import helmet from '@/assets/helmet.webp';
import birdEmblem from '@/assets/emblem.svg';

type FilterPanelProps = {
  filters: Filters;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
};

export const FilterPanel = ({ filters, activeModal, setActiveModal }: FilterPanelProps) => {
  const [advFilterState, setAdvFilterState] = useState<boolean>(false);
  const {
    genreSelect, setGenreSelect,
    languageSelect, setLanguageSelect,
    peopleSelect, setPeopleSelect, setPeopleQuery, peopleOptions, peopleLoading,
    keywordSelect, setKeywordSelect, setKeywordQuery, keywordOptions, keywordLoading,
    ratingRange, setRatingRange,
    runtimeRange, setRuntimeRange,
    releaseDateRange, setReleaseDateRange,
    obscure, setObscure,
    excludePopular, setExcludePopular,
    resetFilters,
  } = filters;

  return (
    <>
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
                children={
                  <div>
                    <h1 className="text-center text-lg font-bold">Genres</h1>
                    <p className="text-left text-sm pb-2">Selected genres will be used in movie discovery. “Maybe" genres are weighted less and “Veto" excludes them completely.</p>
                  <WeightedFilterOverlay options={GENRES} selected={genreSelect} onSelect={makeSelectionHandler(setGenreSelect)}
                  />
                  </div>
                }/>

       <FilterButton name={'Rating'} isOpen={activeModal === 'rating'} clickAction={() => setActiveModal('rating')} onClose={() => setActiveModal(null)}
          info={<span className="text-sm">{ratingRange[0]} - {ratingRange[1]}</span>}
          children={
            <div>
            <h1 className='text-center text-lg font-bold'>Rating</h1>
            <SliderOverlay value={ratingRange} onValueChange={setRatingRange} min={0} max={10} step={.5} />
            </div>
          }
       />

        <FilterButton name={'Runtime'} isOpen={activeModal === 'runtime'} clickAction={() => setActiveModal('runtime')} onClose={() => setActiveModal(null)}
          info={<span className="text-sm">{formatMins(runtimeRange[0])} - {runtimeRange[1] >= 300 ? '5hr+' : formatMins(runtimeRange[1])}</span>}
          children={
            <div>
            <h1 className='text-center text-lg font-bold'>Runtime</h1>
            <SliderOverlay value={runtimeRange} onValueChange={setRuntimeRange} min={0} max={300} step={15} formatValue={(n) => (n >= 300 ? '5hr+' : formatMins(n))}/>
            </div>
          }
        />

        <FilterButton name={'Released'} isOpen={activeModal === 'releaseDate'} clickAction={() => setActiveModal('releaseDate')} onClose={() => setActiveModal(null)} buttonClassName="max-w-28 sm:max-w-none"
          info={<span className="text-sm">{releaseDateRange[0]} - {releaseDateRange[1]}</span>}
          children={
            <div>
            <h1 className='text-center text-lg font-bold'>Release Date</h1>
            <SliderOverlay value={releaseDateRange} onValueChange={setReleaseDateRange} min={1900} max={new Date().getFullYear()} step={1} />
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
            <img src={helmet} alt="" className={`absolute right-full mr-0.5 h-6 w-auto transition duration-300 pointer-events-none ${advFilterState ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 -scale-x-100'}`} />
            <Button onClick={() => setAdvFilterState(!advFilterState)} aria-expanded={advFilterState} className='text-sm no-underline hover:underline'>Advanced Filters</Button>
            <img src={helmet} alt="" className={`absolute left-full ml-0.5 h-6 w-auto transition duration-300 pointer-events-none ${advFilterState ? 'opacity-100 -scale-x-100' : 'opacity-0 group-hover:opacity-100'}`} />
          </div>
        </div>
        </div>
        </div>

  <div className="mb-2 flex flex-wrap justify-center gap-3 md:mt-2">
  {advFilterState &&
  <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
    <FilterButton name={'Languages'} isOpen={activeModal === 'language'} clickAction={() => setActiveModal('language')} onClose={() => setActiveModal(null)} buttonClassName="text-sm sm:text-lg"
      info={languageSelect.length > 0 && (
        <span>
          {languageSelect.map(
            l => <Button key={l.id} variant='selected' onClick={()=>setLanguageSelect(languageSelect.filter(f => f.id !== l.id))}>{l.name}</Button>
          )}
        </span>
      )}
      children={
        <>
          <span className="sm:text-sm">Languages:</span>
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
        <span>
          {keywordSelect.map(k =>
            <Button variant='selected' key={k.id} onClick={()=>setKeywordSelect(keywordSelect.filter(f=> f.id !== k.id))}>{k.name}</Button>)}
        </span>
      )}
      children={
        <>
          <span>Keyword:</span>
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
        <span>
          {peopleSelect.map(p =>
            <Button key={p.id} variant='selected' onClick={()=>setPeopleSelect(peopleSelect.filter(f=> f.id !== p.id))}>{p.name}</Button>)}
        </span>
      )}
      children={
        <>
          <span>People:</span>
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

    <label className="flex items-center text-sm sm:text-lg cursor-pointer mb-3 sm:mb-0">
      <input
        type="checkbox"
        checked={obscure}
        onChange={(e) => setObscure(e.target.checked)}
        className={`appearance-none w-4 h-4 rounded-full bg-[#FCF8F9] bg-contain bg-no-repeat bg-center cursor-pointer ${obscure ? '' : 'border-2 border-black'}`}
        style={{ backgroundImage: obscure ? `url(${birdEmblem})` : 'none' }}
      />
      <span className='pl-2'>Include <span className='font-bold '> EXTREMELY </span> obscure films</span>
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
    </>
  );
};
