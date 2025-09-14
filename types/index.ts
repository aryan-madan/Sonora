export interface Song {
    id: string;
    title: string;
    artist: string;
    duration: number; // in milliseconds
    albumArt: string;
    lyrics?: string;
}

export interface Playlist {
    id: string;
    name: string;
    songs: Song[];
}

export interface YouTubeSearchResult {
    id: string;
    title: string;
    artist: string;
    duration: number; // Will be 0, fetched on play
}

export type ActiveView = 
    | { type: 'library' }
    | { type: 'playlist'; id: string }
    | { type: 'all_songs' };

export interface ContextMenuState {
    isVisible: boolean;
    x: number;
    y: number;
    song: Song | null;
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
