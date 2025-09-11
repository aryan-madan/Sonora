import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { gsap } from 'gsap';
import { Song, YouTubeSearchResult } from '../types';
import { useMusic } from '../contexts/Music';
import { searchYouTube } from '../services/youtube';
import { PiMagnifyingGlass, PiSpinnerGap, PiX, PiYoutubeLogo } from 'react-icons/pi';

interface CommandMenuProps {
    isVisible: boolean;
    onClose: () => void;
}

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

export default function Command({ isVisible, onClose }: CommandMenuProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[]>([]);

    const { allSongs, playSong, showAddSongModal } = useMusic();
    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        setPortalElement(document.body);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isVisible) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, onClose]);

    const libraryResults = useMemo(() => {
        if (!query) return [];
        const lowerCaseQuery = query.toLowerCase();
        return allSongs.filter(song =>
            song.title.toLowerCase().includes(lowerCaseQuery) ||
            song.artist.toLowerCase().includes(lowerCaseQuery)
        );
    }, [query, allSongs]);

    const resetState = useCallback(() => {
        setQuery('');
        setYoutubeResults([]);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isMobile) {
            const panel = panelRef.current;
            const backdrop = backdropRef.current;
            if (!panel || !backdrop) return;
            const portalContainer = panel.parentElement;
            if (!portalContainer) return;
            
            if (isVisible) {
                portalContainer.style.display = 'block';
                gsap.to(backdrop, { opacity: 1, duration: 0.5 });
                gsap.fromTo(panel, { y: '100%' }, { y: '0%', duration: 0.5, ease: 'power3.out', onStart: () => setTimeout(() => inputRef.current?.focus(), 100) });
            } else {
                gsap.to(backdrop, { opacity: 0, duration: 0.4 });
                gsap.to(panel, { y: '100%', duration: 0.4, ease: 'power3.in', onComplete: () => {
                    portalContainer.style.display = 'none';
                    resetState();
                }});
            }
        } else {
            const modal = modalRef.current;
            if (!modal) return;
            if (isVisible) {
                gsap.fromTo(modal, { y: -50, opacity: 0 }, { display: 'flex', y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', onStart: () => setTimeout(() => inputRef.current?.focus(), 100) });
            } else {
                gsap.to(modal, { y: -50, opacity: 0, duration: 0.3, ease: 'power3.in', onComplete: () => {
                    if (modal) modal.style.display = 'none';
                    resetState();
                }});
            }
        }
    }, [isVisible, isMobile, resetState]);


    useEffect(() => {
        if (debouncedQuery.trim().length > 2) {
            const performSearch = async () => {
                setIsLoading(true);
                setYoutubeResults([]);
                const results = await searchYouTube(debouncedQuery);
                setYoutubeResults(results);
                setIsLoading(false);
            };
            performSearch();
        } else {
            setYoutubeResults([]);
        }
    }, [debouncedQuery]);

    const handlePlaySong = (song: Song) => {
        playSong(song, allSongs);
        onClose();
    };

    const handleAddSong = (ytResult: YouTubeSearchResult) => {
        showAddSongModal(ytResult);
        onClose();
    };
    
    const hasLibraryResults = libraryResults.length > 0;
    const hasYoutubeResults = youtubeResults.length > 0;
    const hasQuery = query.trim().length > 0;
    const hasDebouncedQuery = debouncedQuery.trim().length > 2;

    const commandContent = (
        <>
            <div className="p-4 border-b border-border-color dark:border-dark-border-color flex items-center gap-4 flex-shrink-0">
                <PiMagnifyingGlass className="text-text-secondary dark:text-dark-text-secondary h-6 w-6" />
                <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search songs, artists..." className="w-full bg-transparent focus:outline-none placeholder-text-secondary dark:placeholder-dark-text-secondary text-lg" />
                <button onClick={onClose} className="p-1 text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary rounded-full hover:bg-gray-100 dark:hover:bg-dark-border-color"><PiX className="h-5 w-5" /></button>
            </div>
            <div className="flex-grow overflow-y-auto hide-scrollbar min-h-[200px]">
                <ul className="p-4">
                     {!hasQuery && <li className="text-center text-text-secondary dark:text-dark-text-secondary p-8">Search your library or add new songs from YouTube.</li>}
                    {isLoading && <li className="flex justify-center items-center p-8"><PiSpinnerGap className="animate-spin h-6 w-6 text-text-secondary dark:text-dark-text-secondary" /></li>}
                    {hasQuery && !isLoading && !hasLibraryResults && !hasYoutubeResults &&
                        <li className="text-center text-text-secondary dark:text-dark-text-secondary p-8">No results found for "{query}".</li>
                    }
                    {hasLibraryResults && (
                        <>
                            <li className="px-3 pt-2 pb-1 text-xs font-bold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">In Your Library</li>
                            {libraryResults.map(song => (
                                <li key={song.id}><button onClick={() => handlePlaySong(song)} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-dark-border-color flex items-center gap-4 rounded-md">
                                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                        <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow overflow-hidden"><p className="text-text-primary dark:text-dark-text-primary font-semibold truncate">{song.title}</p><p className="text-text-secondary dark:text-dark-text-secondary text-sm truncate">{song.artist}</p></div>
                                </button></li>
                            ))}
                        </>
                    )}
                    {hasDebouncedQuery && hasYoutubeResults && (
                         <>
                            <li className="px-3 pt-4 pb-1 text-xs font-bold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Add from YouTube</li>
                            {youtubeResults.map(result => (
                                <li key={result.id}><button onClick={() => handleAddSong(result)} className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-dark-border-color flex items-center gap-4 rounded-md">
                                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                        <img src={`https://i.ytimg.com/vi/${result.id}/maxresdefault.jpg`} alt={result.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow overflow-hidden"><p className="text-text-primary dark:text-dark-text-primary font-semibold truncate">{result.title}</p><p className="text-text-secondary dark:text-dark-text-secondary text-sm truncate">{result.artist}</p></div>
                                </button></li>
                            ))}
                        </>
                    )}
                </ul>
            </div>
        </>
    );

    if (isMobile) {
        if (!portalElement) return null;
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-50" style={{ display: 'none' }}>
                <div ref={backdropRef} className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0" onClick={onClose}></div>
                <div ref={panelRef} className="absolute bottom-0 left-0 w-full bg-surface dark:bg-dark-surface rounded-t-2xl shadow-2xl h-[85vh] flex flex-col" style={{ transform: 'translateY(100%)' }}>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="pt-8 flex flex-col h-full">
                        {commandContent}
                    </div>
                </div>
            </div>,
            portalElement
        );
    }
    
    return (
        <div ref={modalRef} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 flex-col items-center justify-start pt-24 z-50 bg-black/40 backdrop-blur-lg" style={{ display: 'none' }}>
            <div className="bg-surface dark:bg-dark-surface w-full h-auto max-h-[60vh] max-w-2xl shadow-2xl text-text-primary dark:text-dark-text-primary flex flex-col overflow-hidden md:rounded-lg">
                {commandContent}
            </div>
        </div>
    );
}