import { useState, useMemo } from 'react';
import type { SelectionState, FilterCriteria } from '@/types';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { genreSplit } from '@/lib/filters';

export const useFilters = () => {
  const [genreSelect, setGenreSelect] = useState<Record<number, SelectionState>>({});
  const [languageSelect, setLanguageSelect] = useState<({ id: string; name: string }[])>([]);
  const [peopleSelect, setPeopleSelect] = useState<({ id: number; department: string, name: string }[])>([]);
  const [peopleQuery, setPeopleQuery] = useState<string>('');
  const [keywordSelect, setKeywordSelect] = useState<({ id: number; name: string }[])>([]);
  const [keywordQuery, setKeywordQuery] = useState<string>('');
  const [ratingRange, setRatingRange] = useState<[number, number]>([6,10])
  const [runtimeRange, setRuntimeRange] = useState<[number, number]>([90,180]);
  const [releaseDateRange, setReleaseDateRange] = useState<[number, number]>([1950,new Date().getFullYear()]);
  const [obscure, setObscure] = useState<boolean>(false);
  const [excludePopular, setExcludePopular] = useState<boolean>(false);

  const { options: peopleOptionsRaw, isLoading: peopleLoading } = useDebouncedSearch(peopleQuery, 'person');
  const peopleOptions = (peopleOptionsRaw.map(p => ({
        ...p,
        department: p.known_for_department})));

  const { options: keywordOptions, isLoading: keywordLoading } = useDebouncedSearch(keywordQuery, 'keyword');

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

  return {
    genreSelect, setGenreSelect,
    languageSelect, setLanguageSelect,
    peopleSelect, setPeopleSelect, setPeopleQuery, peopleOptions, peopleLoading,
    keywordSelect, setKeywordSelect, setKeywordQuery, keywordOptions, keywordLoading,
    ratingRange, setRatingRange,
    runtimeRange, setRuntimeRange,
    releaseDateRange, setReleaseDateRange,
    obscure, setObscure,
    excludePopular, setExcludePopular,
    discoverParameters,
    resetFilters,
  };
};

export type Filters = ReturnType<typeof useFilters>;
