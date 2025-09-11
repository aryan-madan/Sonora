import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../contexts/Music';
import { Song } from '../types';
import { 
    PiPlayFill, PiPauseFill, PiSkipForwardFill, PiSkipBackFill,
    PiSpeakerHigh, PiSpeakerSlash, PiQueue,
    PiUser, PiSignOut, PiSun, PiMoon, PiList, PiMagnifyingGlass,
    PiHeart, PiHeartFill, PiX, PiPlaylist, PiTrash, PiMinusCircle, 
    PiArrowElbowDownRight, PiYoutubeLogo, PiCaretRight, PiShuffle, PiRepeat, PiRepeatOnce
} from 'react-icons/pi';
import { useAuth } from '../contexts/Auth';
import { gsap } from 'gsap';
import Queue from './Queue';

const formatDuration = (ms: number) => {
    if (isNaN(ms) || ms <= 0) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const CreatePlaylistModal = () => {
    const { isCreatePlaylistModalVisible, hideCreatePlaylistModal, createPlaylist } = useMusic();
    const [name, setName] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideCreatePlaylistModal();
            }
        };
        if (isCreatePlaylistModalVisible) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCreatePlaylistModalVisible, hideCreatePlaylistModal]);
    
    useEffect(() => {
        const container = containerRef.current;
        const modal = modalRef.current;
        if (!container || !modal) return;

        if (isCreatePlaylistModalVisible) {
            container.style.display = 'flex';
            gsap.to(container, { opacity: 1, duration: 0.3 });
            gsap.fromTo(modal,
                { y: 20, opacity: 0, scale: 0.95 },
                { 
                    y: 0, 
                    opacity: 1, 
                    scale: 1,
                    duration: 0.4, 
                    ease: 'power3.out',
                    onStart: () => setTimeout(() => inputRef.current?.focus(), 100)
                }
            );
        } else {
            gsap.to(modal, {
                y: 20,
                opacity: 0,
                scale: 0.95,
                duration: 0.3, 
                ease: 'power3.in',
            });
            gsap.to(container, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => {
                container.style.display = 'none';
                setName('');
            }});
        }
    }, [isCreatePlaylistModalVisible]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            createPlaylist(name.trim());
            hideCreatePlaylistModal();
        }
    };
    
    return (
         <div 
            ref={containerRef}
            onClick={hideCreatePlaylistModal} 
            className="fixed inset-0 items-center justify-center z-50 bg-black/50 backdrop-blur-xl p-4"
            style={{ display: 'none', opacity: 0 }}
        >
            <div 
                ref={modalRef} 
                onClick={e => e.stopPropagation()} 
                className="bg-surface dark:bg-dark-surface w-full max-w-xl shadow-2xl text-text-primary dark:text-dark-text-primary overflow-hidden border border-border-color dark:border-dark-border-color rounded-md"
            >
                <div className="p-10">
                    <h2 className="font-bold text-4xl font-heading mb-2">Create New Playlist</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary mb-8">Give your new collection a name.</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Playlist"
                            className="w-full bg-gray-100 dark:bg-dark-background border border-border-color dark:border-dark-border-color px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary rounded-lg transition-all text-lg"
                        />
                         <button type="submit" className="w-full py-3 px-4 bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:bg-gray-700 dark:hover:bg-fuchsia-400 transition-colors rounded-lg text-base">
                            Create Playlist
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const AddSongModal = () => {
    const { 
        isAddSongModalVisible, hideAddSongModal, songToAdd, addSongToLibrary, playSong, allSongs 
    } = useMusic();
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const cleanSongTitle = (title: string, artist: string): string => {
        let cleaned = title;
        
        const artistPattern = new RegExp(`^${artist.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*-\\s*`, 'i');
        cleaned = cleaned.replace(artistPattern, '');
    
        const patternsToRemove = [
            /\[[^\]]*\]/g, /\([^)]*\)/g, /\{[^}]*\}/g,
            /\s*\|.*$/g,
            /official music video/gi, /official video/gi, /music video/gi,
            /official audio/gi, /lyric video/gi, /visualizer/gi,
            /lyrics/gi, /audio/gi, /hd/gi, /hq/gi, /4k/gi,
            /"/g, /'/g
        ];
    
        patternsToRemove.forEach(p => { cleaned = cleaned.replace(p, ''); });
        
        // Remove featuring artists from the end of the title
        cleaned = cleaned.replace(/\s*(?:ft|feat)\.?\s+.*$/i, '');
    
        return cleaned.trim();
    };

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideAddSongModal();
            }
        };
        if (isAddSongModalVisible) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isAddSongModalVisible, hideAddSongModal]);

    useEffect(() => {
        const container = containerRef.current;
        const modal = modalRef.current;
        if (!container || !modal) return;

        if (isAddSongModalVisible) {
            container.style.display = 'flex';
            gsap.to(container, { opacity: 1, duration: 0.3 });
            gsap.fromTo(modal,
                { y: 20, opacity: 0, scale: 0.95 },
                { 
                    y: 0, 
                    opacity: 1, 
                    scale: 1,
                    duration: 0.4, 
                    ease: 'power3.out',
                    onStart: () => setTimeout(() => titleInputRef.current?.focus(), 100)
                }
            );
        } else {
            gsap.to(modal, {
                y: 20,
                opacity: 0,
                scale: 0.95,
                duration: 0.3, 
                ease: 'power3.in',
            });
            gsap.to(container, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => {
                container.style.display = 'none';
            }});
        }
    }, [isAddSongModalVisible]);

    useEffect(() => {
        if (songToAdd) {
            setTitle(cleanSongTitle(songToAdd.title, songToAdd.artist));
            setArtist(songToAdd.artist);
        }
        if (isAddSongModalVisible) {
            setIsSubmitting(false);
        }
    }, [songToAdd, isAddSongModalVisible]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !artist.trim() || !songToAdd || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            const newSong = await addSongToLibrary({
                id: songToAdd.id,
                title: title.trim(),
                artist: artist.trim(),
                duration: songToAdd.duration,
            });
            playSong(newSong, [newSong, ...allSongs]);
            hideAddSongModal();
        } catch (error) {
            // Error toast is handled in context
            hideAddSongModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!songToAdd) return null;

    return (
        <div 
            ref={containerRef}
            onClick={hideAddSongModal} 
            className="fixed inset-0 items-center justify-center z-50 bg-black/50 backdrop-blur-xl p-4"
            style={{ display: 'none', opacity: 0 }}
        >
            <div 
                ref={modalRef} 
                onClick={e => e.stopPropagation()} 
                className="bg-surface dark:bg-dark-surface w-full max-w-xl shadow-2xl text-text-primary dark:text-dark-text-primary overflow-hidden border border-border-color dark:border-dark-border-color rounded-2xl"
            >
                <div className="p-10">
                    <h2 className="font-bold text-4xl font-heading mb-2">Add to Library</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary mb-8">Confirm the details for your new track.</p>
                
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-background rounded-lg mb-8 border border-border-color dark:border-dark-border-color">
                        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                            <img src={`https://i.ytimg.com/vi/${songToAdd.id}/maxresdefault.jpg`} alt="Song thumbnail" className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold truncate text-text-primary dark:text-dark-text-primary">{songToAdd.title}</p>
                            <p className="text-sm truncate text-text-secondary dark:text-dark-text-secondary flex items-center gap-1.5"><PiYoutubeLogo /> YouTube Track</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Title</label>
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-dark-background border border-border-color dark:border-dark-border-color px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary rounded-lg transition-all text-lg"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-text-primary dark:text-dark-text-primary">Artist</label>
                            <input
                                type="text"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-dark-background border border-border-color dark:border-dark-border-color px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary rounded-lg transition-all text-lg"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:bg-gray-700 dark:hover:bg-fuchsia-400 transition-colors rounded-lg text-base !mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Adding...' : 'Add & Play'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const { user, signOut, signInWithGoogle, loading } = useAuth();
    const { theme, toggleTheme, showCommandMenu } = useMusic();
    const [isProfileOpen, setProfileOpen] = useState(false);

    return (
        <header className="px-4 md:px-10 py-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                 <button onClick={onMenuClick} className="md:hidden text-text-secondary dark:text-dark-text-secondary p-2 -ml-2">
                    <PiList className="h-6 w-6" />
                </button>
                <img src="/icon.svg" alt="Sonora" className="h-5 w-auto" />
                <h1 className="font-sans font-bold tracking-[0em] text-xl text-text-primary dark:text-dark-text-primary hidden sm:block">Sonora</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <button onClick={showCommandMenu} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-2">
                    <PiMagnifyingGlass className="h-5 w-5" />
                </button>
                <button onClick={toggleTheme} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-2">
                    {theme === 'light' ? <PiMoon className="h-5 w-5" /> : <PiSun className="h-5 w-5" />}
                </button>
                {user ? (
                    <div className="relative">
                        <button onClick={() => setProfileOpen(p => !p)} onBlur={() => setTimeout(() => setProfileOpen(false), 150)}>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full" />
                            ) : (
                                <PiUser className="h-8 w-8 p-1 bg-gray-200 dark:bg-dark-surface rounded-full" />
                            )}
                        </button>
                        {isProfileOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-surface dark:bg-dark-surface shadow-lg border border-border-color dark:border-dark-border-color z-10 rounded-md overflow-hidden">
                                <div className="p-2 border-b border-border-color dark:border-dark-border-color">
                                    <p className="font-semibold text-sm truncate">{user.displayName}</p>
                                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{user.email}</p>
                                </div>
                                <button onClick={signOut} className="w-full text-left flex items-center gap-2 p-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border-color">
                                    <PiSignOut/> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    !loading && (
                        <button
                            onClick={signInWithGoogle}
                            className="px-3 py-1.5 bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background text-sm font-bold hover:bg-gray-700 dark:hover:bg-fuchsia-400 transition-colors rounded-md"
                        >
                            Sign In
                        </button>
                    )
                )}
            </div>
        </header>
    );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { 
        playlists, setActiveView, activeView, currentSong, showCreatePlaylistModal,
        isPlaying, togglePlay, playNext, playPrev
    } = useMusic();
    const sidebarRef = React.useRef<HTMLElement>(null);
    const backdropRef = React.useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        
        const handleState = () => {
            if (mediaQuery.matches) {
                if (sidebarRef.current) {
                    sidebarRef.current.style.transform = '';
                    gsap.set(backdropRef.current, { autoAlpha: 0 });
                }
            } else {
                if (isOpen) {
                    gsap.to(backdropRef.current, { autoAlpha: 1, duration: 0.4, ease: 'power3.out' });
                    gsap.to(sidebarRef.current, { x: '0%', duration: 0.4, ease: 'power3.out' });
                } else {
                    gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power3.in' });
                    gsap.to(sidebarRef.current, { x: '-100%', duration: 0.3, ease: 'power3.in' });
                }
            }
        };
        handleState();
        mediaQuery.addEventListener('change', handleState);
        return () => mediaQuery.removeEventListener('change', handleState);
    }, [isOpen]);

    const handleItemClick = (action: () => void) => {
        action();
        onClose();
    }

    const libraryItems = [
        { id: 'all_songs', name: 'All Songs', action: () => setActiveView({ type: 'all_songs' })},
        { id: 'liked', name: 'Liked Songs', action: () => setActiveView({ type: 'library' })},
    ];

    let activeId = '';
    if (activeView.type === 'all_songs') activeId = 'all_songs';
    else if (activeView.type === 'library') activeId = 'liked';
    else if (activeView.type === 'playlist') activeId = activeView.id;

    const NavButton = ({ item, activeId }: { item: { id: string, name: string, action: () => void }, activeId: string }) => {
        const isActive = item.id === activeId;
        return (
            <button
                onClick={() => handleItemClick(item.action)}
                className={`w-full truncate font-heading text-5xl md:text-8xl font-black transition-colors duration-300 flex items-center text-left leading-none md:leading-tight
                    ${isActive ? 'text-text-primary dark:text-dark-text-primary' : 'text-gray-200 dark:text-dark-heading-inactive'}
                    hover:text-gray-400 dark:hover:text-neutral-500`}
            >
                {item.name}
            </button>
        );
    };

    return (
        <>
            <div ref={backdropRef} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" style={{ visibility: 'hidden', opacity: 0 }}></div>
            
            <aside ref={sidebarRef} className="fixed md:relative inset-y-0 left-0 z-40 md:z-auto bg-background dark:bg-dark-background
                flex flex-col w-[80%] max-w-sm md:w-[40%] md:max-w-sm md:flex-shrink-0 p-4 md:p-10 md:pt-0 transform -translate-x-full md:translate-x-0
                min-h-0 group
            ">
                <div className="pt-10 md:pt-0 flex-grow overflow-y-auto hide-scrollbar flex flex-col min-h-0">
                    <ul className="space-y-2">
                        {libraryItems.map(item => <li key={item.id}><NavButton item={item} activeId={activeId} /></li>)}
                    </ul>
                    <ul className="space-y-2 mt-2">
                        {playlists.map(p => {
                            const item = { id: p.id, name: p.name, action: () => setActiveView({ type: 'playlist', id: p.id }) };
                            return <li key={item.id}><NavButton item={item} activeId={activeId} /></li>;
                        })}
                    </ul>
                     <button
                        onClick={() => { showCreatePlaylistModal(); onClose(); }}
                        className="w-full truncate font-heading text-5xl md:text-8xl font-black transition-all duration-300 flex items-center text-left leading-none md:leading-tight
                            text-gray-200 dark:text-dark-heading-inactive
                            hover:text-gray-400 dark:hover:text-neutral-500
                            opacity-0 group-hover:opacity-100 mt-4"
                        aria-label="Create new playlist"
                    >
                        New Playlist
                    </button>
                </div>

                {currentSong && (
                     <div className="mt-auto pt-8 flex-shrink-0">
                        <div className="w-full aspect-square shadow-lg overflow-hidden rounded-md">
                            <img src={currentSong.albumArt} alt={currentSong.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

const SongItem = ({ song, index }: { song: Song; index: number; }) => {
    const { currentSong, playSong, activeView, playlists, allSongs, likedSongs, likeSong, showContextMenu } = useMusic();
    const isCurrent = currentSong?.id === song.id;
    const isLiked = likedSongs.some(s => s.id === song.id);

    const { songs: currentQueue } = React.useMemo(() => {
        if (activeView.type === 'playlist') {
            const playlist = playlists.find(p => p.id === activeView.id);
            return { songs: playlist?.songs || [] };
        }
        if (activeView.type === 'library') {
            return { songs: likedSongs };
        }
        return { songs: allSongs };
    }, [activeView, playlists, likedSongs, allSongs]);
    
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        showContextMenu(song, e.clientX, e.clientY);
    };

    return (
        <li 
            onClick={() => playSong(song, currentQueue)}
            onContextMenu={handleContextMenu}
            className={`flex items-center py-3 border-b border-border-color dark:border-dark-border-color group cursor-pointer transition-colors ${isCurrent ? 'bg-gray-50 dark:bg-dark-surface' : 'hover:bg-gray-50 dark:hover:bg-dark-surface'}`}
        >
            <div className="w-8 text-text-secondary dark:text-dark-text-secondary text-center flex-shrink-0 relative h-5 flex items-center justify-center">
                {isCurrent ? (
                     <div className="flex items-end justify-center gap-0.5 h-4">
                        <span style={{animation: 'pulse 1.2s ease-in-out infinite both', animationDelay: '0s'}} className="w-1 h-full bg-primary dark:bg-dark-primary"></span>
                        <span style={{animation: 'pulse 1.2s ease-in-out infinite both', animationDelay: '0.2s'}} className="w-1 h-2/3 bg-primary dark:bg-dark-primary"></span>
                        <span style={{animation: 'pulse 1.2s ease-in-out infinite both', animationDelay: '0.4s'}} className="w-1 h-full bg-primary dark:bg-dark-primary"></span>
                    </div>
                ) : (
                    <>
                        <span className="group-hover:opacity-0 transition-opacity">{index + 1}</span>
                        <PiPlayFill className="text-text-primary dark:text-dark-text-primary h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                )}
            </div>
            <div className="flex-grow mx-4 overflow-hidden">
                <p className={`font-bold transition-colors truncate ${isCurrent ? 'text-text-primary dark:text-dark-text-primary' : 'text-gray-800 dark:text-gray-300'}`}>{song.title}</p>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary truncate">{song.artist}</p>
            </div>
            <div className="w-20 text-left text-sm text-text-secondary dark:text-dark-text-secondary flex-shrink-0 hidden sm:flex items-center justify-between">
                <span>{formatDuration(song.duration)}</span>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        likeSong(song);
                    }}
                    className="text-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Like ${song.title}`}
                >
                    {isLiked ? <PiHeartFill className="h-5 w-5 text-primary dark:text-dark-primary" /> : <PiHeart className="h-5 w-5" />}
                </button>
            </div>
        </li>
    );
};

const MainContent = () => {
    const { activeView, playlists, likedSongs, allSongs, showCommandMenu } = useMusic();
    const listRef = useRef<HTMLUListElement>(null);

    const { songs } = React.useMemo(() => {
        if (activeView.type === 'playlist') {
            const playlist = playlists.find(p => p.id === activeView.id);
            return { songs: playlist?.songs || [] };
        }
        if (activeView.type === 'library') {
            return { songs: likedSongs };
        }
        return { songs: allSongs };
    }, [activeView, playlists, likedSongs, allSongs]);

    useEffect(() => {
        if (listRef.current?.children) {
            gsap.fromTo(listRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }
            );
        }
    }, [songs]);

    return (
        <main className="flex-grow p-4 md:p-10 md:pt-0 flex flex-col min-w-0">
            <div className="flex-grow flex flex-col min-h-0">
                <div className="hidden sm:flex justify-end text-xs text-text-secondary dark:text-dark-text-secondary uppercase tracking-widest px-4">
                    <div className="w-20 text-left">Time</div>
                </div>
                <div className="flex-grow overflow-y-auto hide-scrollbar [mask-image:linear-gradient(to_bottom,transparent_0,black_5%,black_95%,transparent_100%)]">
                    <ul ref={listRef} className="py-2">
                        {songs.length > 0 ? (
                            songs.map((song, index) => (
                                <SongItem key={song.id} song={song} index={index} />
                            ))
                        ) : (
                             <div className="text-center text-text-secondary dark:text-dark-text-secondary py-16">
                                <p>This list is empty.</p>
                            </div>
                        )}
                    </ul>
                </div>
                <div className="flex justify-end mt-2 mb-2 px-4 flex-shrink-0">
                    <button
                        onClick={showCommandMenu}
                        className="px-4 py-2 bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background text-sm font-bold hover:bg-gray-700 dark:hover:bg-fuchsia-400 transition-colors rounded-md"
                    >
                        + Add new track
                    </button>
                </div>
            </div>
        </main>
    );
};


const Player = () => {
    const { 
        currentSong, isPlaying, togglePlay, progress, seek, playNext, playPrev,
        volume, setVolume, isMuted, toggleMute, showShowcase, showQueue, hideQueue, isQueueVisible,
        likedSongs, likeSong, isShuffle, toggleShuffle, repeatMode, toggleRepeatMode
    } = useMusic();

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!currentSong || progress.duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        seek(progress.duration * percentage);
    };

    if (!currentSong) {
        return <footer className="h-24 bg-surface dark:bg-dark-background border-t border-border-color dark:border-dark-border-color flex-shrink-0" />;
    }
    
    const progressPercentage = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
    const isLiked = likedSongs.some(s => s.id === currentSong.id);
    
    return (
        <footer className="relative flex-shrink-0 h-24 bg-surface dark:bg-dark-background px-4 md:px-10 border-t border-border-color dark:border-dark-border-color">
            <div className="flex items-center justify-between h-full">
                <div className="w-2/3 md:w-1/3 flex-shrink-0 md:flex-1 overflow-hidden">
                    <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={showShowcase}
                    >
                        <div className="h-14 w-14 rounded-md overflow-hidden flex-shrink-0 md:hidden">
                            <img src={currentSong.albumArt} alt={currentSong.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate">{currentSong.title}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{currentSong.artist}</p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center justify-center gap-2 md:gap-4 flex-shrink-0 mx-2">
                    <button onClick={toggleShuffle} className={`p-2 transition-colors ${isShuffle ? 'text-text-primary dark:text-dark-primary' : 'text-text-secondary dark:text-dark-text-secondary'} hover:text-text-primary dark:hover:text-dark-text-primary`} title="Shuffle">
                        <PiShuffle className="h-6 w-6" />
                    </button>
                    <button onClick={playPrev} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors disabled:opacity-50 p-2" disabled={!currentSong}>
                        <PiSkipBackFill className="h-6 w-6" />
                    </button>
                    <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center rounded-full bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background hover:scale-105 transition-transform disabled:opacity-50" disabled={!currentSong}>
                        {isPlaying ? <PiPauseFill className="h-7 w-7" /> : <PiPlayFill className="h-7 w-7" />}
                    </button>
                    <button onClick={playNext} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors disabled:opacity-50 p-2" disabled={!currentSong}>
                        <PiSkipForwardFill className="h-6 w-6" />
                    </button>
                    <button onClick={toggleRepeatMode} className={`p-2 transition-colors ${repeatMode !== 'none' ? 'text-text-primary dark:text-dark-primary' : 'text-text-secondary dark:text-dark-text-secondary'} hover:text-text-primary dark:hover:text-dark-text-primary`} title="Repeat">
                        {repeatMode === 'one' ? <PiRepeatOnce className="h-6 w-6" /> : <PiRepeat className="h-6 w-6" />}
                    </button>
                </div>
                
                <div className="flex items-center justify-end gap-1 md:gap-4 w-1/3 md:flex-1">
                    <div className="flex md:hidden items-center justify-end gap-3">
                        <button onClick={() => likeSong(currentSong)} className="text-text-secondary dark:text-dark-text-secondary transition-colors p-1">
                           {isLiked ? <PiHeartFill className="h-6 w-6 text-primary dark:text-dark-primary" /> : <PiHeart className="h-6 w-6" />}
                        </button>
                        <button onClick={togglePlay} className="text-text-primary dark:text-dark-text-primary transition-colors p-1" disabled={!currentSong}>
                            {isPlaying ? <PiPauseFill className="h-8 w-8" /> : <PiPlayFill className="h-8 w-8" />}
                        </button>
                    </div>

                    <div className="hidden md:flex items-center justify-end gap-1 md:gap-4">
                        <span className="text-xs w-10 text-center text-text-secondary dark:text-dark-text-secondary">
                            {formatDuration(progress.currentTime)}
                        </span>
                        <div className="w-24 h-1 bg-gray-200 dark:bg-dark-border-color rounded-full cursor-pointer group" onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                        }}>
                            <div className="h-full bg-text-primary dark:bg-dark-primary rounded-full relative" style={{ width: `${isMuted ? 0 : volume * 100}%` }}>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-text-primary dark:bg-dark-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                        <button onClick={toggleMute} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-2">
                            {isMuted || volume === 0 ? <PiSpeakerSlash className="h-5 w-5" /> : <PiSpeakerHigh className="h-5 w-5" />}
                        </button>
                        <button onClick={() => likeSong(currentSong)} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-2" title="Like song">
                           {isLiked ? <PiHeartFill className="h-6 w-6 text-primary dark:text-dark-primary" /> : <PiHeart className="h-6 w-6" />}
                        </button>
                        <button onClick={() => isQueueVisible ? hideQueue() : showQueue()} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-2" title="Show queue">
                            <PiQueue className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
             <div className="absolute -top-px left-0 w-full h-0.5 bg-gray-200 dark:bg-dark-border-color group cursor-pointer" onClick={handleProgressBarClick}>
                <div className="h-full bg-primary dark:bg-dark-primary relative" style={{ width: `${progressPercentage}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary dark:bg-dark-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </div>
        </footer>
    );
};

const SongContextMenu = () => {
    const { 
        contextMenu, hideContextMenu, playlists, addSongToPlaylist, 
        activeView, removeSongFromPlaylist, deleteSongFromLibrary, 
        addSongToQueue, playSongNext 
    } = useMusic();
    const { isVisible, x, y, song } = contextMenu;
    const menuRef = useRef<HTMLDivElement>(null);
    const [playlistSubmenuVisible, setPlaylistSubmenuVisible] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideContextMenu();
            }
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                hideContextMenu();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
            setPlaylistSubmenuVisible(false);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible, hideContextMenu]);

    if (!isVisible || !song) return null;

    const handleRemoveFromPlaylist = () => {
        if (activeView.type === 'playlist' && song) {
            removeSongFromPlaylist(activeView.id, song.id);
        }
        hideContextMenu();
    };

    const handleDeleteFromLibrary = () => {
        if (song) {
            deleteSongFromLibrary(song.id);
        }
        hideContextMenu();
    };
    
    const handleAddToQueue = () => {
        if (song) addSongToQueue(song);
        hideContextMenu();
    };
    
    const handlePlayNext = () => {
        if (song) playSongNext(song);
        hideContextMenu();
    };

    const menuStyle: React.CSSProperties = {
        top: y,
        left: x,
        position: 'fixed',
        transform: `translate(${window.innerWidth - x < 240 ? '-100%' : '0'}, ${window.innerHeight - y < 300 ? '-100%' : '0'})`
    };

    return (
        <div
            ref={menuRef}
            style={menuStyle}
            className="z-[100] w-56 bg-surface dark:bg-dark-surface shadow-2xl border border-border-color dark:border-dark-border-color text-sm text-text-primary dark:text-dark-text-primary py-1.5 rounded-lg"
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-1.5 border-b border-border-color dark:border-dark-border-color mb-1">
                <p className="font-bold truncate">{song.title}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary truncate">{song.artist}</p>
            </div>
            
            <button onClick={handlePlayNext} className="w-full text-left flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-border-color">
                <PiArrowElbowDownRight className="h-4 w-4" /> <span>Play Next</span>
            </button>
            <button onClick={handleAddToQueue} className="w-full text-left flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-border-color">
                <PiQueue className="h-4 w-4" /> <span>Add to Queue</span>
            </button>

            <div className="h-px bg-border-color dark:bg-dark-border-color my-1" />

            <div className="relative" onMouseEnter={() => setPlaylistSubmenuVisible(true)} onMouseLeave={() => setPlaylistSubmenuVisible(false)}>
                <button className="w-full text-left flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-border-color">
                    <div className="flex items-center gap-3">
                        <PiPlaylist className="h-4 w-4" /> <span>Add to Playlist</span>
                    </div>
                    <PiCaretRight className="h-4 w-4" />
                </button>
                {playlistSubmenuVisible && (
                    <div className="absolute top-0 left-full ml-1 w-56 bg-surface dark:bg-dark-surface shadow-2xl border border-border-color dark:border-dark-border-color py-1.5 rounded-lg max-h-48 overflow-y-auto hide-scrollbar">
                        {playlists.map(p => (
                            <button key={p.id} onClick={() => { addSongToPlaylist(p.id, song); hideContextMenu(); }} className="w-full text-left block px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-border-color truncate">
                                {p.name}
                            </button>
                        ))}
                         {playlists.length === 0 && <p className="px-3 py-1.5 text-text-secondary dark:text-dark-text-secondary text-xs">No playlists yet.</p>}
                    </div>
                )}
            </div>

            {activeView.type === 'playlist' && (
                <button onClick={handleRemoveFromPlaylist} className="w-full text-left flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-border-color">
                    <PiMinusCircle className="h-4 w-4" /> <span>Remove from Playlist</span>
                </button>
            )}

            <div className="h-px bg-border-color dark:bg-dark-border-color my-1" />

            <button onClick={() => window.open(`https://www.youtube.com/watch?v=${song.id}`, '_blank')} className="w-full text-left flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-border-color">
                <PiYoutubeLogo className="h-4 w-4" /> <span>Open on YouTube</span>
            </button>
            <button onClick={handleDeleteFromLibrary} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <PiTrash className="h-4 w-4" /> <span>Delete from Library</span>
            </button>
        </div>
    );
};

export default function Layout() {
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="h-screen w-screen bg-background text-text-primary dark:bg-dark-background dark:text-dark-text-primary font-sans flex flex-col antialiased overflow-hidden">
            <div className="flex flex-col flex-grow min-h-0">
                <Header onMenuClick={() => setMobileNavOpen(true)} />
                <div className="flex flex-grow min-h-0 relative overflow-hidden">
                    <Sidebar isOpen={isMobileNavOpen} onClose={() => setMobileNavOpen(false)}/>
                    <MainContent />
                    <Queue />
                </div>
            </div>
            <Player />
            <CreatePlaylistModal />
            <AddSongModal />
            <SongContextMenu />
        </div>
    );
}