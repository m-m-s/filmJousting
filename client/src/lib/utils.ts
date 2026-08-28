import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
};

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export function formatMins (totalMins : number): string {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    if (hours === 0){
        return `${mins}mins`
    } else if (hours === 1 && mins === 0) {
       return  `${hours}hr`;
    } else if (mins === 0) {
       return  `${hours}hrs`;
    } else if (hours === 1)
        {return `${hours}hr ${mins}mins`;
    } else {
      return `${hours}hrs ${mins}mins`;
    };
};