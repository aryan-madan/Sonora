import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Song, Playlist } from '../types';

// Collection references for a specific user
const songsCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, `users/${userId}/songs`);
};

const playlistsCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, `users/${userId}/playlists`);
};

const likedSongsCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, `users/${userId}/likedSongs`);
};

// Song functions
export const saveSong = async (userId: string, song: Song): Promise<void> => {
  const songDocRef = doc(songsCollection(userId), song.id);
  await setDoc(songDocRef, song, { merge: true });
};

export const deleteSong = async (userId: string, songId: string): Promise<void> => {
  const songDocRef = doc(songsCollection(userId), songId);
  await deleteDoc(songDocRef);
};

export const getAllSongs = async (userId: string): Promise<Song[]> => {
  if (!userId) return [];
  const snapshot = await getDocs(songsCollection(userId));
  return snapshot.docs.map(doc => doc.data() as Song);
};

// Playlist functions
export const savePlaylist = async (userId: string, playlist: Playlist): Promise<void> => {
  const playlistDocRef = doc(playlistsCollection(userId), playlist.id);
  await setDoc(playlistDocRef, playlist);
};

export const deletePlaylist = async (userId: string, playlistId: string): Promise<void> => {
  const playlistDocRef = doc(playlistsCollection(userId), playlistId);
  await deleteDoc(playlistDocRef);
};

export const getAllPlaylists = async (userId: string): Promise<Playlist[]> => {
    if (!userId) return [];
    const snapshot = await getDocs(playlistsCollection(userId));
    return snapshot.docs.map(doc => doc.data() as Playlist);
};

// Liked Songs functions
export const likeSong = async (userId: string, song: Song): Promise<void> => {
    const likedSongDocRef = doc(likedSongsCollection(userId), song.id);
    await setDoc(likedSongDocRef, song);
};

export const unlikeSong = async (userId: string, songId: string): Promise<void> => {
    const likedSongDocRef = doc(likedSongsCollection(userId), songId);
    await deleteDoc(likedSongDocRef);
};

export const getLikedSongs = async (userId: string): Promise<Song[]> => {
    if (!userId) return [];
    const snapshot = await getDocs(likedSongsCollection(userId));
    return snapshot.docs.map(doc => doc.data() as Song);
};