import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const SEEN_KEY = 'filmJousting.welcomeSeen';

const hasVisited = () => {
    try {
        return localStorage.getItem(SEEN_KEY) === 'true';
    } catch {
        return false;
    }
};

export const Welcome = () => {
    const [open, setOpen] = useState(() => !hasVisited());

    const dismiss = () => {
        try {
            localStorage.setItem(SEEN_KEY, 'true');
        } catch {
            setOpen(false);
            return;
        }
        setOpen(false);
    };

    return (
        <Modal isOpen={open} onClose={dismiss} align="center" label="Welcome to Film Jousting" historyEntry={false}>
            <div className="flex flex-col items-center gap-3 text-start">
                <h1 className="text-2xl font-bold text-center">Greetings!</h1>
                <p>Need help deciding what to watch? Film Jousting is a site dedicated to film discovery!</p>
                <p>Set your filters and search across TMDB, or narrow the field to any Letterboxd list or watchlist. A custom search and scoring algorithm recommends movies based on what you pick.</p>
                <p>With your list of movies, lead a Jousting tournament: choose between two movies at a time, and each winner moves on to the next round until one is crowned champion.</p>
                <Button variant="search" onClick={dismiss} className="mt-2">Begin Journey</Button>
            </div>
        </Modal>
    );
};
