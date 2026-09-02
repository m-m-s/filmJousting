import * as Slider from '@radix-ui/react-slider';
import dragonEnd from '@/assets/dragonEnd.svg';

type SliderOverlayProps = {
    value: [number, number];
    onValueChange: (value: [number,number]) => void;
    min: number;
    max: number;
    step: number; 
    formatValue?: (n:number) => string;
};

export const SliderOverlay = ({ value, onValueChange, min, max, step, formatValue = (n) => String(n)}:SliderOverlayProps) => {

    
    return (
        <div className="w-full mt-13 px-3 md:min-w-[40vw]">
            <Slider.Root
                className="relative flex items-center w-full h-5 pt-4 touch-none"
                value={value}
                onValueChange={(v) => onValueChange(v as [number, number])}
                min = {min}
                max = {max}
                step = {step}
                minStepsBetweenThumbs={1}
            >
            <Slider.Track className="bg-white relative grow h-0.5">
                <Slider.Range className="absolute bg-black h-full" />
            </Slider.Track>
            <Slider.Thumb className="relative -top-7 -left-3 block w-14 h-14 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: `url(${dragonEnd})` }} />
            <Slider.Thumb className="relative -top-7 left-3 block w-14 h-14 bg-contain bg-no-repeat bg-center -scale-x-100" style={{ backgroundImage: `url(${dragonEnd})` }} />
            </Slider.Root>
            <div className="flex justify-between">
            <div className="text-lg font-medium">{formatValue(value[0])}</div>
            <div className="text-lg font-medium">{formatValue(value[1])}</div>
            </div>
        </div>
    );
};