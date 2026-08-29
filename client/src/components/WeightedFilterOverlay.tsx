import { Button } from './ui/Button';
import helmet from '../assets/helmet.svg';
import type { Options, SelectionState } from '@/types';

 type WeightedFilterOverlayProps = {
    options: Options[];
    selected: Record<number, SelectionState>;
    onSelect: (value: number, state: SelectionState | undefined) => void;
};

export const WeightedFilterOverlay = ({options, selected, onSelect}:WeightedFilterOverlayProps) => {
return (
    <div className="grid gap-2 -mt-1 -mb-1 sm:mt-0 sm:mb-0 grid-cols-[repeat(auto-fit,minmax(150px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {options.map((o) => {
            const state = selected[Number(o.id)];
            return (
                <div
                    key={o.id}
                    className="flex flex-col border-3 p-3 min-h-25 group/veto cursor-pointer"
                    onClick={() => onSelect(Number(o.id), state === undefined ? 'yes' : undefined)}
                >
                    <div className="group relative flex flex-1 items-center justify-center w-min max-w-28 mx-auto">
                        <img src={helmet} alt="" className={`absolute right-full mr-0.5 h-6 w-auto transition duration-300 pointer-events-none ${state === 'veto' ? 'opacity-100 -scale-x-100' : state !== undefined ? 'opacity-100 group-hover:-scale-x-100 group-has-[.veto-trigger:hover]/veto:-scale-x-100' : 'opacity-0 group-hover:opacity-100 -scale-x-100'}`} />
                        <Button
                            className={`flex-1 flex items-center justify-center ${state === undefined ? 'no-underline' : ''}`}
                            onClick={() => onSelect(Number(o.id), state === undefined ? 'yes': undefined)}>
                                {o.name}
                            </Button>
                        <img src={helmet} alt="" className={`absolute left-full ml-0.5 h-6 w-auto transition duration-300 pointer-events-none ${state === 'veto' ? 'opacity-100' : state !== undefined ? 'opacity-100 -scale-x-100 group-hover:scale-x-100 group-has-[.veto-trigger:hover]/veto:scale-x-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                        {state !== undefined && (
                            <div className="flex justify-center lg:mx-6" onClick={(e) => e.stopPropagation()}>
                                <Button variant='weight' className={`hover:bg-black hover:text-white ${state === 'yes' ? 'bg-black text-white' : ''}`} onClick={() => onSelect(Number(o.id), 'yes')}>Yes</Button>
                                <Button variant='weight' className={`hover:bg-black hover:text-white ${state === 'maybe' ? 'bg-black text-white' : ''}`} onClick={() => onSelect(Number(o.id), 'maybe')}>maybe</Button>
                                <Button variant='weight' className={`veto-trigger hover:bg-black hover:text-white ${state === 'veto' ? 'bg-black text-white' : ''}`} onClick={() => onSelect(Number(o.id), 'veto')}>Veto</Button>
                            </div>
                        )}
                </div>
            );
        })}
    </div>
    );
};