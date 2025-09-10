import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Song, Playlist } from '../types';

// Helper to get the current user's ID
const getUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// Collection references for the current user
const songsCollection = () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated for DB operation');
  return collection(db, `users/${userId}/songs`);
};

const playlistsCollection = () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated for DB operation');
  return collection(db, `users/${userId}/playlists`);
};

const likedSongsCollection = () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated for DB operation');
  return collection(db, `users/${userId}/likedSongs`);
};

// Song functions
export const saveSong = async (song: Song): Promise<void> => {
  const songDocRef = doc(songsCollection(), song.id);
  await setDoc(songDocRef, song, { merge: true });
};

export const deleteSong = async (songId: string): Promise<void> => {
  const songDocRef = doc(songsCollection(), songId);
  await deleteDoc(songDocRef);
};

export const getAllSongs = async (): Promise<Song[]> => {
  const userId = getUserId();
  if (!userId) return [];
  const snapshot = await getDocs(songsCollection());
  return snapshot.docs.map(doc => doc.data() as Song);
};

// Playlist functions
export const savePlaylist = async (playlist: Playlist): Promise<void> => {
  const playlistDocRef = doc(playlistsCollection(), playlist.id);
  await setDoc(playlistDocRef, playlist);
};

export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const playlistDocRef = doc(playlistsCollection(), playlistId);
  await deleteDoc(playlistDocRef);
};

export const getAllPlaylists = async (): Promise<Playlist[]> => {
    const userId = getUserId();
    if (!userId) return [];
    const snapshot = await getDocs(playlistsCollection());
    return snapshot.docs.map(doc => doc.data() as Playlist);
};

// Liked Songs functions
export const likeSong = async (song: Song): Promise<void> => {
    const likedSongDocRef = doc(likedSongsCollection(), song.id);
    await setDoc(likedSongDocRef, song);
};

export const unlikeSong = async (songId: string): Promise<void> => {
    const likedSongDocRef = doc(likedSongsCollection(), songId);
    await deleteDoc(likedSongDocRef);
};

export const getLikedSongs = async (): Promise<Song[]> => {
    const userId = getUserId();
    if (!userId) return [];
    const snapshot = await getDocs(likedSongsCollection());
    return snapshot.docs.map(doc => doc.data() as Song);
};
