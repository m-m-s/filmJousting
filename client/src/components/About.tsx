import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useErrorModal } from '@/hooks/useErrorModal';
import { getErrorCodeFromResponse } from '@/lib/errorMessages';
import { API_URL } from '@/config';

const ContactForm = () => {
    const [message, setMessage] = useState('');
    const [contact, setContact] = useState('');
    const [website, setWebsite] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const { showError } = useErrorModal();

    const send = async () => {
        if (!message.trim()) {
            showError('CONTACT_MISSING_MESSAGE');
            return;
        }
        setSending(true);
        try {
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, contact, website }),
            });
            if (!response.ok) {
                showError(await getErrorCodeFromResponse(response), `contact responded ${response.status}`);
                return;
            }
            setSent(true);
            setMessage('');
            setContact('');
        } catch (error) {
            showError('NETWORK_UNREACHABLE', error);
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-2xl font-bold">Thank you!</h1>
                <p>Your message is on its way. If you left a way to reach you, you may hear back.</p>
                <Button variant="sort" onClick={() => setSent(false)}>Send another</Button>
            </div>
        );
    }

    const inputStyle = 'w-full border-3 border-black px-2 py-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-red-500';

    return (
        <div className="flex flex-col items-center gap-3 text-start">
            <h1 className="text-2xl font-bold">Get in Touch</h1>
            <p className="text-sm text-center">Suggestions, questions, or a bug to report? Send it over.</p>
            <label className="w-full text-sm">
                Your message
                <textarea
                    className={`${inputStyle} h-32 resize-none mt-1`}
                    value={message}
                    maxLength={2000}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </label>
            <label className="w-full text-sm">
                How to reach you <span className="opacity-70">(optional)</span>
                <input
                    className={`${inputStyle} mt-1`}
                    value={contact}
                    maxLength={200}
                    onChange={(e) => setContact(e.target.value)}
                />
            </label>
            {/* Bots fill in every field they find; people never see this one. */}
            <input
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
            />
            <Button variant="search" onClick={send} disabled={sending}>{sending ? 'Sending...' : 'Send'}</Button>
        </div>
    );
};

export const About = () => {
    const [modal, setModal] = useState<'about' | 'credits' | 'contact' | null>(null);

    const label = modal === 'credits' ? 'Credits' : modal === 'contact' ? 'Get in touch' : 'About';

    return (
        <>
            <div className="fixed top-1 right-1 sm:top-4 sm:right-4 z-40">
                <Button variant="sort" onClick={() => setModal('about')} aria-label="About Film Jousting" className="bg-[url('/olga-thelavart-vS3idIiYxX0-unsplash.jpg')] w-7.5 h-7.5 p-0 text-xl font-bold leading-none">?</Button>
            </div>
            <Modal isOpen={modal !== null} onClose={() => setModal(null)} align="center" label={label}>
                {modal === 'about' &&
                <div className="flex flex-col items-center gap-3 text-start m-5">
                    <h1 className="text-2xl font-bold">About</h1>
                    <p>Film Jousting is a site designed to help you and your friends settle the age old question of “What movie should we watch?” Set filters to search for movie recommendations from the ether (TMDB) or from within an existing Letterboxd list (this works for any person's watchlist or public list!)
                        <br></br><br></br> Still not sure which movie to watch? Run a selected top few through a head-to-head tournament bracket until one film is crowned champion!!
                        <br></br><br></br> A passion project made by your friendly neighborhood film enthusiast. The recommendations are designed to have a degree of randomness everytime you discover. Want to see different results? Discover again and again! Happy watching!</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button variant="sort" onClick={() => setModal('contact')}>Get in Touch</Button>
                        <Button variant="sort" onClick={() => setModal('credits')}>Credits</Button>
                    </div>
                </div>
                }
                {modal === 'contact' && <ContactForm />}
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
