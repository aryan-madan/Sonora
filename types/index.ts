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

export type ToastMessage = {
    id: number;
    message: string;
    type: 'success' | 'error';
};

export interface ContextMenuState {
    isVisible: boolean;
    x: number;
    y: number;
    song: Song | null;
}