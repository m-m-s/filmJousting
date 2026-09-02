import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export const About = () => {
    const [modal, setModal] = useState<'about' | 'credits' | null>(null);

    return (
        <>
            <div className="fixed top-1 right-1 sm:top-4 sm:right-4 z-40">
                <Button variant="sort" onClick={() => setModal('about')} aria-label="About Film Jousting" className="bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] w-7.5 h-7.5 p-0 text-xl font-bold leading-none">?</Button>
            </div>
            <Modal isOpen={modal !== null} onClose={() => setModal(null)} align="center" label={modal === 'credits' ? 'Credits' : 'About'}>
                {modal === 'about' &&
                <div className="flex flex-col items-center gap-3 text-start m-5">
                    <h1 className="text-2xl font-bold">About</h1>
                    <p>Film Jousting is a site designed to help you and your friends settle the age old question of “What movie should we watch?” Set filters to search for movie recommendations from the ether (TMDB) or from within an existing Letterboxd list (this works for any person's watchlist or public list!)
                        <br></br><br></br> Still not sure which movie to watch? Run a selected top few through a head-to-head tournament bracket until one film is crowned champion!!
                        <br></br><br></br> A passion project made by your friendly neighborhood film enthusiast. The recommendations are designed to have a degree of randomness everytime you discover. Want to see different results? Discover again and again! Happy watching!</p>
                    <Button variant="sort" onClick={() => setModal('credits')}>Credits</Button>
                </div>
                }
                {modal === 'credits' &&
                <div className="flex flex-col items-center gap-3 text-center">
                    <h1 className="text-2xl font-bold">Credits</h1>
                    <p className="text-sm">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
                    <p className="text-sm">Background texture photo by Olga Thelavart on Unsplash.</p>
                    <p className="text-sm">Illustrations from Rawpixel.</p>
                </div>
                }
            </Modal>
        </>
    );
};
