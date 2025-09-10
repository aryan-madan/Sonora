import React, { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from 'react';
import { Song, Playlist, ActiveView, ToastMessage, ContextMenuState, YouTubeSearchResult } from '../types';
import * as db from '../lib/db';
import { useAuth } from './Auth';

type RepeatMode = 'none' | 'one' | 'all';
type Theme = 'light' | 'dark';

interface YTPlayer {
    loadVideoById: (id: string) => void;
    stopVideo: () => void;
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    setVolume: (volume: number) => void;
    mute: () => void;
    unMute: () => void;
    getPlayerState: () => number;
}

export interface MusicContextType {
    playlists: Playlist[];
    likedSongs: Song[];
    allSongs: Song[];
    currentSong: Song | null;
    isPlaying: boolean;
    activeView: ActiveView;
    currentQueue: Song[];
    progress: { currentTime: number; duration: number };
    isShuffle: boolean;
    repeatMode: RepeatMode;
    volume: number;
    isMuted: boolean;
    theme: Theme;
    toasts: ToastMessage[];
    toggleTheme: () => void;
    loadLibrary: () => void;
    createPlaylist: (name: string) => void;
    deletePlaylist: (playlistId: string) => void;
    addSongToPlaylist: (playlistId: string, song: Song) => void;
    removeSongFromPlaylist: (playlistId: string, songId: string) => void;
    likeSong: (song: Song) => void;
    playSong: (song: Song, queue: Song[]) => void;
    togglePlay: () => void;
    setActiveView: (view: ActiveView) => void;
    playNext: () => void;
    playPrev: () => void;
    seek: (time: number) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    removeToast: (id: number) => void;
    toggleShuffle: () => void;
    toggleRepeatMode: () => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    addSongToLibrary: (songDetails: { id: string; title: string; artist: string; duration: number; }) => Promise<Song>;
    updateSongDuration: (songId: string, duration: number) => void;
    updateSongLyrics: (songId: string, lyrics: string) => Promise<void>;
    deleteSongFromLibrary: (songId: string) => Promise<void>;
    addSongToQueue: (song: Song) => void;
    removeSongFromQueue: (songId: string) => void;
    setQueue: (songs: Song[]) => void;
    clearQueue: () => void;
    isCreatePlaylistModalVisible: boolean;
    showCreatePlaylistModal: () => void;
    hideCreatePlaylistModal: () => void;
    isShowcaseVisible: boolean;
    showShowcase: () => void;
    hideShowcase: () => void;
    isCommandMenuVisible: boolean;
    showCommandMenu: () => void;
    hideCommandMenu: () => void;
    isQueueVisible: boolean;
    showQueue: () => void;
    hideQueue: () => void;
    contextMenu: ContextMenuState;
    showContextMenu: (song: Song, x: number, y: number) => void;
    hideContextMenu: () => void;
    playSongNext: (song: Song) => void;
    isAddSongModalVisible: boolean;
    songToAdd: YouTubeSearchResult | null;
    showAddSongModal: (song: YouTubeSearchResult) => void;
    hideAddSongModal: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [likedSongs, setLikedSongs] = useState<Song[]>([]);
    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeView, setActiveView] = useState<ActiveView>({ type: 'all_songs' });
    const [currentQueue, setCurrentQueue] = useState<Song[]>([]);
    const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
    const [volume, setVolumeState] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [theme, setTheme] = useState<Theme>('light');
    
    const [isCreatePlaylistModalVisible, setIsCreatePlaylistModalVisible] = useState(false);
    const [isShowcaseVisible, setIsShowcaseVisible] = useState(false);
    const [isCommandMenuVisible, setIsCommandMenuVisible] = useState(false);
    const [isQueueVisible, setIsQueueVisible] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isVisible: false, x: 0, y: 0, song: null });
    const [isAddSongModalVisible, setIsAddSongModalVisible] = useState(false);
    const [songToAdd, setSongToAdd] = useState<YouTubeSearchResult | null>(null);

    const [ytPlayer, setYtPlayer] = useState<YTPlayer | null>(null);
    const [isYtPlayerReady, setYtPlayerReady] = useState(false);
    const [isSongEnding, setIsSongEnding] = useState(false);
    const progressIntervalRef = useRef<number | null>(null);

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandMenuVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const storedTheme = localStorage.getItem('sonora-theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('sonora-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };
    
    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const loadLibrary = useCallback(async () => {
        if (!user) {
            setAllSongs([]);
            setPlaylists([]);
            setLikedSongs([]);
            return;
        };
        const songs = await db.getAllSongs();
        const pls = await db.getAllPlaylists();
        const liked = await db.getLikedSongs();
        setAllSongs(songs);
        setPlaylists(pls);
        setLikedSongs(liked);
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            loadLibrary();
        }
    }, [user, authLoading, loadLibrary]);
    
    const createPlaylist = async (name: string) => {
        if (!user) {
            addToast('You must be signed in to create playlists.', 'error');
            return;
        }
        const newPlaylist: Playlist = {
            id: `playlist-${Date.now()}`,
            name,
            songs: [],
        };
        await db.savePlaylist(newPlaylist);
        setPlaylists(prev => [...prev, newPlaylist]);
        addToast(`Playlist "${name}" created`);
    };

    const deletePlaylist = async (playlistId: string) => {
        const playlistToDelete = playlists.find(p => p.id === playlistId);
        if (!playlistToDelete) return;

        if (window.confirm(`Are you sure you want to delete "${playlistToDelete.name}"?`)) {
            await db.deletePlaylist(playlistId);
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));

            if (activeView.type === 'playlist' && activeView.id === playlistId) {
                setActiveView({ type: 'all_songs' });
            }
            addToast(`Playlist "${playlistToDelete.name}" deleted`);
        }
    };

    const addSongToPlaylist = async (playlistId: string, song: Song) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist && !playlist.songs.some(s => s.id === song.id)) {
            const updatedPlaylist = { ...playlist, songs: [...playlist.songs, song] };
            await db.savePlaylist(updatedPlaylist);
            setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
            addToast(`Added to "${playlist.name}"`);
        }
    };

    const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist) {
            const updatedPlaylist = {
                ...playlist,
                songs: playlist.songs.filter(s => s.id !== songId)
            };
            await db.savePlaylist(updatedPlaylist);
            setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));

            const song = allSongs.find(s => s.id === songId);
            if (song) {
                addToast(`Removed "${song.title}" from "${playlist.name}"`);
            }
        }
    };
    
    const likeSong = async (song: Song) => {
        if (!user) {
            addToast('You must be signed in to like songs.', 'error');
            return;
        }
        const isLiked = likedSongs.some(s => s.id === song.id);
        if (isLiked) {
            await db.unlikeSong(song.id);
            setLikedSongs(prev => prev.filter(s => s.id !== song.id));
        } else {
            await db.likeSong(song);
            setLikedSongs(prev => [...prev, song]);
        }
    };
    
    const playSong = useCallback(async (song: Song, queue: Song[]) => {
        setIsSongEnding(false);
        setCurrentSong(song);
    
        let finalQueue = [...queue];
        const songIndex = finalQueue.findIndex(s => s.id === song.id);
    
        if (isShuffle) {
            finalQueue.sort(() => Math.random() - 0.5);
            const shuffledIndex = finalQueue.findIndex(s => s.id === song.id);
            if (shuffledIndex > -1) {
                const [selectedSong] = finalQueue.splice(shuffledIndex, 1);
                finalQueue.unshift(selectedSong);
            }
        } else {
            if (songIndex > -1) {
                finalQueue = [
                    ...finalQueue.slice(songIndex),
                    ...finalQueue.slice(0, songIndex)
                ];
            }
        }
        setCurrentQueue(finalQueue);
    
        if (!isYtPlayerReady) {
            addToast('Player is not ready yet', 'error');
            return;
        }
        ytPlayer?.loadVideoById(song.id);
    }, [ytPlayer, isYtPlayerReady, isShuffle, addToast]);

    const togglePlay = useCallback(() => {
        if (!currentSong || !ytPlayer) return;
        if (isPlaying) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    }, [ytPlayer, isPlaying, currentSong]);
    
    const findCurrentSongIndex = useCallback(() => {
        if (!currentSong) return -1;
        return currentQueue.findIndex(s => s.id === currentSong.id);
    }, [currentQueue, currentSong]);

    const seek = useCallback((time: number) => {
        ytPlayer?.seekTo(time / 1000, true);
    }, [ytPlayer]);

    const playNext = useCallback(() => {
        const currentIndex = findCurrentSongIndex();
        if (currentIndex === -1) return;
        
        if (repeatMode === 'one') {
             seek(0);
             ytPlayer?.playVideo();
             return;
        }

        let nextIndex = currentIndex + 1;
        if (nextIndex >= currentQueue.length) {
            if (repeatMode === 'all') nextIndex = 0;
            else { setIsPlaying(false); return; }
        }
        playSong(currentQueue[nextIndex], currentQueue);
    }, [findCurrentSongIndex, currentQueue, playSong, repeatMode, ytPlayer, seek]);

    const playPrev = useCallback(() => {
        const currentIndex = findCurrentSongIndex();
        if (currentIndex > 0) {
            playSong(currentQueue[currentIndex - 1], currentQueue);
        } else if (repeatMode === 'all' && currentQueue.length > 0) {
            playSong(currentQueue[currentQueue.length - 1], currentQueue);
        }
    }, [findCurrentSongIndex, currentQueue, playSong, repeatMode]);

    const setVolume = (vol: number) => {
        setVolumeState(vol);
        ytPlayer?.setVolume(vol * 100);
        if (vol > 0 && isMuted) {
            toggleMute();
        }
    };
    
    const toggleMute = () => {
        setIsMuted(prev => {
            const newMuted = !prev;
            if(newMuted) ytPlayer?.mute(); else ytPlayer?.unMute();
            return newMuted;
        });
    };

    const updateSongDuration = useCallback(async (songId: string, duration: number) => {
        const songToUpdate = allSongs.find(s => s.id === songId);
        if (songToUpdate && duration > 0 && songToUpdate.duration !== duration) {
            const updatedSong = { ...songToUpdate, duration };
            await db.saveSong(updatedSong);
            const updateSongInArray = (songs: Song[]) => songs.map(s => s.id === songId ? updatedSong : s);
            setAllSongs(updateSongInArray);
            setLikedSongs(updateSongInArray);
            setPlaylists(prev => prev.map(p => ({
                ...p,
                songs: updateSongInArray(p.songs)
            })));
            if (currentSong?.id === songId) {
                setCurrentSong(updatedSong);
            }
        }
    }, [allSongs, currentSong]);

    const updateSongLyrics = useCallback(async (songId: string, lyrics: string) => {
        const songToUpdate = allSongs.find(s => s.id === songId);
        if (songToUpdate) {
            const updatedSong = { ...songToUpdate, lyrics };
            await db.saveSong(updatedSong);
            const updateSongInArray = (songs: Song[]) => songs.map(s => s.id === songId ? updatedSong : s);
            setAllSongs(updateSongInArray);
            setLikedSongs(updateSongInArray);
            setPlaylists(prev => prev.map(p => ({
                ...p,
                songs: updateSongInArray(p.songs)
            })));
            if (currentSong?.id === songId) {
                setCurrentSong(updatedSong);
            }
        }
    }, [allSongs, currentSong]);
    
    const onYtPlayerStateChange = useCallback((event: any) => {
        const ENDED = 0, PLAYING = 1, PAUSED = 2, CUED = 5;
        switch(event.data) {
            case PLAYING:
                setIsPlaying(true);
                const duration = ytPlayer?.getDuration() ?? 0;
                if (currentSong && currentSong.duration === 0 && duration > 0) {
                    updateSongDuration(currentSong.id, duration * 1000);
                }
                setProgress(p => ({ ...p, duration: duration * 1000 }));
                break;
            case PAUSED: 
                setIsPlaying(false); 
                break;
            case ENDED: 
                setIsPlaying(false);
                break;
            case CUED:
                ytPlayer?.playVideo();
                break;
        }
    }, [ytPlayer, currentSong, updateSongDuration]);
    
    useEffect(() => {
        if (isPlaying && ytPlayer) {
            progressIntervalRef.current = window.setInterval(() => {
                const currentTime = ytPlayer.getCurrentTime() ?? 0;
                const duration = ytPlayer.getDuration() ?? 0;

                setProgress({
                    currentTime: currentTime * 1000,
                    duration: duration * 1000,
                });

                if (duration > 0 && currentTime >= duration - 0.5 && !isSongEnding) {
                    setIsSongEnding(true); 
                    if (repeatMode === 'one') {
                        ytPlayer.seekTo(0, true);
                        setIsSongEnding(false); 
                    } else {
                        playNext();
                    }
                }
            }, 500);
        } else if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [isPlaying, ytPlayer, repeatMode, isSongEnding, playNext]);

    const addSongToLibrary = useCallback(async (songDetails: { id: string; title: string; artist: string; duration: number; }): Promise<Song> => {
        if (!user) {
            addToast('You must be signed in to add songs to your library.', 'error');
            throw new Error("User not signed in");
        }
        const existingSong = allSongs.find(s => s.id === songDetails.id);
        if (existingSong) {
            addToast(`"${existingSong.title}" is already in your library.`, 'error');
            throw new Error("Song already exists");
        }
    
        const newSong: Song = {
            ...songDetails,
            albumArt: `https://img.youtube.com/vi/${songDetails.id}/hqdefault.jpg`,
        };
    
        await db.saveSong(newSong);
        setAllSongs(prev => [...prev, newSong]);
        addToast(`"${newSong.title}" added to your library.`);
        return newSong;
    }, [allSongs, addToast, user]);

    const toggleShuffle = () => {
        const newShuffleState = !isShuffle;
        setIsShuffle(newShuffleState);
    
        if (newShuffleState) {
            // Shuffle the upcoming songs
            const currentIndex = findCurrentSongIndex();
            if (currentIndex !== -1) {
                const nowPlaying = currentQueue[currentIndex];
                const upcomingSongs = currentQueue.slice(currentIndex + 1);
                for (let i = upcomingSongs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [upcomingSongs[i], upcomingSongs[j]] = [upcomingSongs[j], upcomingSongs[i]];
                }
                const newQueue = [...currentQueue.slice(0, currentIndex), nowPlaying, ...upcomingSongs];
                 // The current song might not be at the start of the array, so we adjust based on its actual position.
                const finalQueue = [
                    ...currentQueue.slice(0, currentIndex + 1),
                    ...upcomingSongs
                ];
                setCurrentQueue(finalQueue);
            }
        } else {
            // Revert to original order
            const sourceList = (() => {
                if (activeView.type === 'playlist') {
                    return playlists.find(p => p.id === activeView.id)?.songs || allSongs;
                }
                if (activeView.type === 'library') return likedSongs;
                return allSongs;
            })();
    
            const songIndexInSource = sourceList.findIndex(s => s.id === currentSong?.id);
            if (songIndexInSource !== -1) {
                const newQueue = [
                    ...sourceList.slice(songIndexInSource),
                    ...sourceList.slice(0, songIndexInSource)
                ];
                setCurrentQueue(newQueue);
            }
        }
    };

    const toggleRepeatMode = () => setRepeatMode(prev => (prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'));

    const deleteSongFromLibrary = async (songId: string) => {
        const songToDelete = allSongs.find(s => s.id === songId);
        if (!songToDelete) return;
        
        if (!window.confirm(`Are you sure you want to delete "${songToDelete.title}" from your library? This cannot be undone.`)) {
            return;
        }

        const wasPlaying = currentSong?.id === songId;
        const oldQueueIndex = findCurrentSongIndex();

        if (wasPlaying) {
             ytPlayer?.stopVideo();
        }
        
        await db.deleteSong(songId);
        await db.unlikeSong(songId);

        setAllSongs(prev => prev.filter(s => s.id !== songId));
        setLikedSongs(prev => prev.filter(s => s.id !== songId));
        
        const updatedPlaylists = await Promise.all(playlists.map(async p => {
            if (p.songs.some(s => s.id === songId)) {
                const newPlaylist = { ...p, songs: p.songs.filter(s => s.id !== songId) };
                await db.savePlaylist(newPlaylist);
                return newPlaylist;
            }
            return p;
        }));
        setPlaylists(updatedPlaylists);
        
        const newQueue = currentQueue.filter(s => s.id !== songId);
        setCurrentQueue(newQueue);

        if (wasPlaying) {
            if (newQueue.length > 0) {
                const nextIndex = oldQueueIndex >= newQueue.length ? 0 : oldQueueIndex;
                playSong(newQueue[nextIndex], newQueue);
            } else {
                setCurrentSong(null);
                setIsPlaying(false);
            }
        }
        addToast(`"${songToDelete.title}" deleted from library.`);
    };

    const setQueue = (newQueue: Song[]) => {
        setCurrentQueue(newQueue);
        if (isShuffle) {
            setIsShuffle(false);
        }
    };

    const addSongToQueue = (song: Song) => {
        if (currentQueue.some(s => s.id === song.id)) {
            addToast(`"${song.title}" is already in the queue.`);
            return;
        }
        setCurrentQueue(prev => [...prev, song]);
        addToast(`"${song.title}" added to queue.`);
    };

    const playSongNext = (song: Song) => {
        if (currentQueue.some(s => s.id === song.id)) {
            addToast(`"${song.title}" is already in the queue.`);
            return;
        }
        const currentIndex = findCurrentSongIndex();
        const newQueue = [...currentQueue];
        newQueue.splice(currentIndex + 1, 0, song);
        setCurrentQueue(newQueue);

        if (!isPlaying && !currentSong) {
            playSong(song, newQueue);
        } else {
            addToast(`"${song.title}" will play next.`);
        }
    };

    const removeSongFromQueue = (songId: string) => {
        setCurrentQueue(prev => prev.filter(s => s.id !== songId));
    };

    const clearQueue = () => {
        const nowPlaying = currentQueue.find(s => s.id === currentSong?.id);
        if(nowPlaying) {
            setCurrentQueue([nowPlaying]);
        } else {
            setCurrentQueue([]);
        }
        addToast("Queue cleared.");
    };

    const showContextMenu = (song: Song, x: number, y: number) => {
        setContextMenu({ isVisible: true, song, x, y });
    };
    const hideContextMenu = () => setContextMenu(prev => ({ ...prev, isVisible: false, song: null }));

    const showAddSongModal = (song: YouTubeSearchResult) => {
        setSongToAdd(song);
        setIsAddSongModalVisible(true);
    };

    const hideAddSongModal = () => {
        setSongToAdd(null);
        setIsAddSongModalVisible(false);
    };

    const value = {
        playlists, likedSongs, allSongs, currentSong, isPlaying, activeView,
        currentQueue, progress, isShuffle, repeatMode, volume, isMuted,
        theme, toggleTheme, toasts,
        createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, 
        likeSong, playSong, togglePlay,
        setActiveView, playNext, playPrev, seek, loadLibrary, addToast, removeToast,
        toggleShuffle, toggleRepeatMode, setVolume, toggleMute, 
        addSongToLibrary, updateSongDuration, updateSongLyrics,
        deleteSongFromLibrary,
        addSongToQueue, removeSongFromQueue, setQueue, clearQueue, playSongNext,
        isCreatePlaylistModalVisible, 
        showCreatePlaylistModal: () => setIsCreatePlaylistModalVisible(true),
        hideCreatePlaylistModal: () => setIsCreatePlaylistModalVisible(false),
        isShowcaseVisible,
        showShowcase: () => setIsShowcaseVisible(true),
        hideShowcase: () => setIsShowcaseVisible(false),
        isCommandMenuVisible,
        showCommandMenu: () => setIsCommandMenuVisible(true),
        hideCommandMenu: () => setIsCommandMenuVisible(false),
        isQueueVisible,
        showQueue: () => setIsQueueVisible(true),
        hideQueue: () => setIsQueueVisible(false),
        contextMenu, showContextMenu, hideContextMenu,
        isAddSongModalVisible, songToAdd, showAddSongModal, hideAddSongModal,
        setPlayer: setYtPlayer, setPlayerReady: setYtPlayerReady, onPlayerStateChange: onYtPlayerStateChange,
    };

    return (
        <MusicContext.Provider value={value as any}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = (): MusicContextType => {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
};