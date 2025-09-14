import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Song, Playlist, ActiveView, ContextMenuState, YouTubeSearchResult } from '../types';
import * as db from '../lib/db';
import { useAuth } from './Auth';

type RepeatMode = 'none' | 'one' | 'all';
type Theme = 'light' | 'dark';

// Add YT Player types to the global window object
declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
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
    playbackHistory: Song[];
    isHistoryVisible: boolean;
    showHistory: () => void;
    hideHistory: () => void;
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
    const [theme, setTheme] = useState<Theme>('light');
    const [playbackHistory, setPlaybackHistory] = useState<Song[]>([]);
    
    const [isCreatePlaylistModalVisible, setIsCreatePlaylistModalVisible] = useState(false);
    const [isShowcaseVisible, setIsShowcaseVisible] = useState(false);
    const [isCommandMenuVisible, setIsCommandMenuVisible] = useState(false);
    const [isQueueVisible, setIsQueueVisible] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isVisible: false, x: 0, y: 0, song: null });
    const [isAddSongModalVisible, setIsAddSongModalVisible] = useState(false);
    const [songToAdd, setSongToAdd] = useState<YouTubeSearchResult | null>(null);

    const playerRef = useRef<any>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('sonora-playback-history');
            if (storedHistory) {
                setPlaybackHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to parse playback history from localStorage", error);
            localStorage.removeItem('sonora-playback-history');
        }
    }, []);

    useEffect(() => {
        if (playbackHistory.length > 0) {
            localStorage.setItem('sonora-playback-history', JSON.stringify(playbackHistory));
        } else {
            localStorage.removeItem('sonora-playback-history');
        }
    }, [playbackHistory]);

    const loadLibrary = useCallback(async () => {
        if (!user) {
            setAllSongs([]);
            setPlaylists([]);
            setLikedSongs([]);
            return;
        };
        
        const songs = await db.getAllSongs(user.uid);
        const pls = await db.getAllPlaylists(user.uid);
        const liked = await db.getLikedSongs(user.uid);
    
        const migrationKey = 'sonora-thumbnail-migration-maxres-v1-completed';
        if (!localStorage.getItem(migrationKey)) {
            console.log("Checking for thumbnail migration to maxresdefault...");
    
            const updateArt = (song: Song): Song => ({ ...song, albumArt: `https://img.youtube.com/vi/${song.id}/maxresdefault.jpg` });
            const needsMigration = (song: Song) => !song.albumArt || !song.albumArt.includes('maxresdefault.jpg');
    
            if (songs.some(needsMigration) || liked.some(needsMigration) || pls.some(p => p.songs.some(needsMigration))) {
                console.log("Applying thumbnail migrations locally and saving to DB...");
    
                // Update state immediately for responsiveness
                const updatedSongs = songs.map(s => needsMigration(s) ? updateArt(s) : s);
                const updatedLiked = liked.map(s => needsMigration(s) ? updateArt(s) : s);
                const updatedPlaylists = pls.map(p => ({
                    ...p,
                    songs: p.songs.map(s => needsMigration(s) ? updateArt(s) : s)
                }));
                
                setAllSongs(updatedSongs);
                setPlaylists(updatedPlaylists);
                setLikedSongs(updatedLiked);
    
                // Fire and forget DB updates
                const songsToUpdate = updatedSongs.filter((s, i) => s.albumArt !== songs[i].albumArt);
                const likedToUpdate = updatedLiked.filter((s, i) => s.albumArt !== liked[i].albumArt);
                const playlistsToUpdate = updatedPlaylists.filter((p, i) => JSON.stringify(p.songs) !== JSON.stringify(pls[i].songs));
    
                Promise.all([
                    ...songsToUpdate.map(s => db.saveSong(user.uid, s)),
                    ...likedToUpdate.map(s => db.likeSong(user.uid, s)),
                    ...playlistsToUpdate.map(p => db.savePlaylist(user.uid, p)),
                ]).then(() => {
                    console.log("DB migration complete.");
                }).catch(err => {
                    console.error("DB migration failed:", err);
                    localStorage.removeItem(migrationKey);
                });
    
            } else {
                console.log("No thumbnail migration needed.");
                setAllSongs(songs);
                setPlaylists(pls);
                setLikedSongs(liked);
            }
            
            localStorage.setItem(migrationKey, 'true');
        } else {
            setAllSongs(songs);
            setPlaylists(pls);
            setLikedSongs(liked);
        }
    }, [user]);

    const findCurrentSongIndex = useCallback(() => {
        if (!currentSong) return -1;
        return currentQueue.findIndex(s => s.id === currentSong.id);
    }, [currentQueue, currentSong]);
    
    const playSong = useCallback((song: Song, queue: Song[]) => {
        if (currentSong && currentSong.id !== song.id) {
            setPlaybackHistory(prev => {
                const newHistory = [currentSong, ...prev.filter(s => s.id !== currentSong.id)];
                return newHistory.slice(0, 50); // Limit history to 50 songs
            });
        }

        if (playerRef.current?.getPlayerState) {
            if (currentSong?.id !== song.id && playerRef.current.getPlayerState() !== -1) {
                playerRef.current.stopVideo();
            }
        }
        
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
    }, [isShuffle, currentSong]);

    const playNext = useCallback(() => {
        const currentIndex = findCurrentSongIndex();
        if (currentIndex === -1) return;
        
        if (repeatMode === 'one' && playerRef.current) {
             playerRef.current.seekTo(0);
             playerRef.current.playVideo();
             return;
        }

        let nextIndex = currentIndex + 1;
        if (nextIndex >= currentQueue.length) {
            if (repeatMode === 'all') nextIndex = 0;
            else { setIsPlaying(false); return; }
        }
        playSong(currentQueue[nextIndex], currentQueue);
    }, [findCurrentSongIndex, currentQueue, playSong, repeatMode]);

    const togglePlay = useCallback(() => {
        if (!currentSong || !playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying, currentSong]);

    const playPrev = useCallback(() => {
        if (playerRef.current && playerRef.current.getCurrentTime() > 3) {
            playerRef.current.seekTo(0);
            return;
        }

        if (playbackHistory.length > 0) {
            const prevSong = playbackHistory[0];
            setPlaybackHistory(prev => prev.slice(1));

            const songToQueue = currentSong;
            setCurrentSong(prevSong);

            if (songToQueue) {
                setCurrentQueue(prev => [songToQueue, ...prev.filter(s => s.id !== songToQueue.id)]);
            }
        } else if (playerRef.current) {
            playerRef.current.seekTo(0);
        }
    }, [playbackHistory, currentSong, currentQueue]);

    const seek = useCallback((time: number) => {
        if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(time / 1000, true);
        }
    }, []);

    const mediaSessionSeek = useCallback((details: any) => {
        if (details.fastSeek || details.seekTime === null || !playerRef.current) return;
        playerRef.current.seekTo(details.seekTime, true);
    }, []);
    
    const updateSongDuration = useCallback(async (songId: string, duration: number) => {
        if (!user) return;
        const songToUpdate = allSongs.find(s => s.id === songId);
        if (songToUpdate && duration > 0 && songToUpdate.duration !== duration) {
            const updatedSong = { ...songToUpdate, duration };
            await db.saveSong(user.uid, updatedSong);
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
    }, [allSongs, currentSong, user]);
    
    const playNextRef = useRef(playNext);
    useEffect(() => {
        playNextRef.current = playNext;
    }, [playNext]);

    useEffect(() => {
        const onPlayerReady = () => setIsPlayerReady(true);
        
        const onPlayerStateChange = (event: any) => {
            switch(event.data) {
                case window.YT.PlayerState.PLAYING: setIsPlaying(true); break;
                case window.YT.PlayerState.PAUSED: setIsPlaying(false); break;
                case window.YT.PlayerState.ENDED: playNextRef.current(); break;
                default: break;
            }
        };

        const onPlayerError = (event: any) => {
            console.error("YouTube Player Error:", event.data);
        };

        const initializePlayer = () => {
            if (!window.YT || !window.YT.Player || playerRef.current) return;
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '0',
                width: '0',
                playerVars: { playsinline: 1 },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError,
                }
            });
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = initializePlayer;
        } else {
            initializePlayer();
        }
    }, []);

    useEffect(() => {
        if (isPlayerReady && currentSong && playerRef.current?.loadVideoById) {
            const currentVideoUrl = playerRef.current.getVideoUrl();
            if (!currentVideoUrl || !currentVideoUrl.includes(currentSong.id)) {
                playerRef.current.loadVideoById(currentSong.id);
            }
        }
    }, [currentSong, isPlayerReady]);
    
    useEffect(() => {
        let interval: number | null = null;
        if (isPlaying && playerRef.current?.getDuration) {
            interval = window.setInterval(() => {
                const currentTime = playerRef.current.getCurrentTime() * 1000;
                const duration = playerRef.current.getDuration() * 1000;
                if (!isNaN(duration) && duration > 0) {
                    setProgress({ currentTime, duration });
                    if (currentSong && currentSong.duration <= 1000) {
                        updateSongDuration(currentSong.id, duration);
                    }
                }
            }, 500);
        }
        return () => {
            if (interval) window.clearInterval(interval);
        };
    }, [isPlaying, currentSong, updateSongDuration]);
    
     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandMenuVisible(prev => !prev);
            }
             if (e.target === document.body && e.key === ' ') {
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

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

    useEffect(() => {
        if (!authLoading) {
            loadLibrary();
        }
    }, [user, authLoading, loadLibrary]);
    
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
    
        if (!currentSong) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            return;
        }
    
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist,
            album: 'Sonora',
            artwork: [
                { src: `https://img.youtube.com/vi/${currentSong.id}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' },
            ]
        });
    
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('seekto', mediaSessionSeek);
    
        return () => {
             if (!('mediaSession' in navigator)) return;
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
            navigator.mediaSession.setActionHandler('seekto', null);
        }
    }, [currentSong, isPlaying, togglePlay, playPrev, playNext, mediaSessionSeek]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };
    
    const createPlaylist = async (name: string) => {
        if (!user) {
            console.error('You must be signed in to create playlists.');
            return;
        }
        const newPlaylist: Playlist = {
            id: `playlist-${Date.now()}`,
            name,
            songs: [],
        };
        await db.savePlaylist(user.uid, newPlaylist);
        setPlaylists(prev => [...prev, newPlaylist]);
    };

    const deletePlaylist = async (playlistId: string) => {
        if (!user) return;
        const playlistToDelete = playlists.find(p => p.id === playlistId);
        if (!playlistToDelete) return;

        if (window.confirm(`Are you sure you want to delete "${playlistToDelete.name}"?`)) {
            await db.deletePlaylist(user.uid, playlistId);
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));

            if (activeView.type === 'playlist' && activeView.id === playlistId) {
                setActiveView({ type: 'all_songs' });
            }
        }
    };

    const addSongToPlaylist = async (playlistId: string, song: Song) => {
        if (!user) return;
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist && !playlist.songs.some(s => s.id === song.id)) {
            const updatedPlaylist = { ...playlist, songs: [...playlist.songs, song] };
            await db.savePlaylist(user.uid, updatedPlaylist);
            setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
        }
    };

    const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
        if (!user) return;
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist) {
            const updatedPlaylist = {
                ...playlist,
                songs: playlist.songs.filter(s => s.id !== songId)
            };
            await db.savePlaylist(user.uid, updatedPlaylist);
            setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
        }
    };
    
    const likeSong = async (song: Song) => {
        if (!user) {
            console.error('You must be signed in to like songs.');
            return;
        }
        const isLiked = likedSongs.some(s => s.id === song.id);
        if (isLiked) {
            await db.unlikeSong(user.uid, song.id);
            setLikedSongs(prev => prev.filter(s => s.id !== song.id));
        } else {
            await db.likeSong(user.uid, song);
            setLikedSongs(prev => [...prev, song]);
        }
    };

    const setVolume = (vol: number) => {
        if (playerRef.current?.setVolume) {
            playerRef.current.setVolume(vol * 100);
        }
        setVolumeState(vol);
        if (vol > 0 && isMuted) {
            setIsMuted(false);
            if (playerRef.current?.unMute) {
                playerRef.current.unMute();
            }
        }
    };
    
    const toggleMute = () => {
        setIsMuted(prev => {
            const newMuted = !prev;
            if (playerRef.current) {
               if (newMuted) playerRef.current.mute();
               else playerRef.current.unMute();
            }
            return newMuted;
        });
    };

    const updateSongLyrics = useCallback(async (songId: string, lyrics: string) => {
        if (!user) return;
        const songToUpdate = allSongs.find(s => s.id === songId);
        if (songToUpdate) {
            const updatedSong = { ...songToUpdate, lyrics };
            await db.saveSong(user.uid, updatedSong);
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
    }, [allSongs, currentSong, user]);
    
    const addSongToLibrary = useCallback(async (songDetails: { id: string; title: string; artist: string; duration: number; }): Promise<Song> => {
        if (!user) {
            console.error('You must be signed in to add songs to your library.');
            throw new Error("User not signed in");
        }
        const existingSong = allSongs.find(s => s.id === songDetails.id);
        if (existingSong) {
            console.error(`"${existingSong.title}" is already in your library.`);
            throw new Error("Song already exists");
        }
    
        const newSong: Song = {
            ...songDetails,
            albumArt: `https://img.youtube.com/vi/${songDetails.id}/maxresdefault.jpg`,
        };
    
        await db.saveSong(user.uid, newSong);
        setAllSongs(prev => [...prev, newSong]);
        return newSong;
    }, [allSongs, user]);

    const toggleShuffle = () => {
        const newShuffleState = !isShuffle;
        setIsShuffle(newShuffleState);
    
        if (newShuffleState) {
            const currentIndex = findCurrentSongIndex();
            if (currentIndex !== -1) {
                const nowPlaying = currentQueue[currentIndex];
                const upcomingSongs = currentQueue.slice(currentIndex + 1);
                for (let i = upcomingSongs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [upcomingSongs[i], upcomingSongs[j]] = [upcomingSongs[j], upcomingSongs[i]];
                }
                const finalQueue = [
                    ...currentQueue.slice(0, currentIndex + 1),
                    ...upcomingSongs
                ];
                setCurrentQueue(finalQueue);
            }
        } else {
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
        if (!user) return;
        const songToDelete = allSongs.find(s => s.id === songId);
        if (!songToDelete) return;
        
        if (!window.confirm(`Are you sure you want to delete "${songToDelete.title}" from your library? This cannot be undone.`)) {
            return;
        }

        const wasPlaying = currentSong?.id === songId;
        const oldQueueIndex = findCurrentSongIndex();

        if (wasPlaying && playerRef.current) {
            playerRef.current.stopVideo();
        }
        
        await db.deleteSong(user.uid, songId);
        await db.unlikeSong(user.uid, songId);

        setAllSongs(prev => prev.filter(s => s.id !== songId));
        setLikedSongs(prev => prev.filter(s => s.id !== songId));
        
        const updatedPlaylists = await Promise.all(playlists.map(async p => {
            if (p.songs.some(s => s.id === songId)) {
                const newPlaylist = { ...p, songs: p.songs.filter(s => s.id !== songId) };
                await db.savePlaylist(user.uid, newPlaylist);
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
    };

    const setQueue = (newQueue: Song[]) => {
        setCurrentQueue(newQueue);
        if (isShuffle) {
            setIsShuffle(false);
        }
    };

    const addSongToQueue = (song: Song) => {
        if (currentQueue.some(s => s.id === song.id)) {
            return;
        }
        setCurrentQueue(prev => [...prev, song]);
    };

    const playSongNext = (song: Song) => {
        if (currentQueue.some(s => s.id === song.id)) {
            return;
        }
        const currentIndex = findCurrentSongIndex();
        const newQueue = [...currentQueue];
        newQueue.splice(currentIndex + 1, 0, song);
        setCurrentQueue(newQueue);

        if (!isPlaying && !currentSong) {
            playSong(song, newQueue);
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

    const showHistory = () => {
        setIsHistoryVisible(true);
        setIsQueueVisible(false);
    };
    const hideHistory = () => setIsHistoryVisible(false);
    const showQueue = () => {
        setIsQueueVisible(true);
        setIsHistoryVisible(false);
    };
    const hideQueue = () => setIsQueueVisible(false);

    const value = {
        playlists, likedSongs, allSongs, currentSong, isPlaying, activeView,
        currentQueue, progress, isShuffle, repeatMode, volume, isMuted,
        theme, toggleTheme,
        createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, 
        likeSong, playSong, togglePlay,
        setActiveView, playNext, playPrev, seek, loadLibrary,
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
        isQueueVisible, showQueue, hideQueue,
        contextMenu, showContextMenu, hideContextMenu,
        isAddSongModalVisible, songToAdd, showAddSongModal, hideAddSongModal,
        playbackHistory, isHistoryVisible, showHistory, hideHistory,
    };

    return (
        <MusicContext.Provider value={value}>
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