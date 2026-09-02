import { useState } from 'react'
import type { Options } from "@/types"
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption} from '@headlessui/react';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

type InputOverlayProps<T extends {id: string | number}> = {
    options: Options[];
    selected: T[];
    onChange: (id: T[]) => void;
    onQueryChange?: (value: string) => void;
    getValue: (option: Options) => T;
    placeholderText: string;
    isLoading?: boolean;
};

export const InputOverlay = <T extends {id: string | number},>({options, selected, onChange, onQueryChange, getValue, placeholderText, isLoading }: InputOverlayProps<T>) => {
    const [input, setInput] = useState<string>('');

    const matches = options.filter(
        o => o.name?.toLowerCase().includes(input.toLowerCase()) &&
        (!selected.some(s => (o.id === s.id))));

    return (
        <div className="relative my-1">
            <Combobox
                value={selected}
                onChange={onChange}
                multiple>
                <ComboboxInput 
                    className ="w-full border-black border-3 px-3 py-2 bg-white text-black focus:outline-none fous:ring-2 focus:ring-red-500"
                    placeholder= {placeholderText}
                    onChange={(e) => {
                        setInput(e.target.value);
                        onQueryChange?.(e.target.value);
                        }} />
                <ComboboxOptions
                    className ="w-full mt-1 border-3 bg-white shadow-lg max-h-60 overflow-y-auto z-60">
                    {isLoading && (
                        <div className="px-3 py-2"><LoadingAnimation /></div>
                    )}
                    {!isLoading && matches.length === 0 && (
                        <div className="px-3 py-2 text-gray-500">No results</div>
                    )}
                    {matches.map(o => 
                    <ComboboxOption 
                        key={o.id} value={getValue(o)}
                        className="px-3 py-2 cursor-pointer data-focus:bg-gray-400">
                        {o.name}
                    </ComboboxOption>
                )}
                </ComboboxOptions>
            </Combobox>
        </div>
    );
};