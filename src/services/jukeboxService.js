import { addDoc, collection, deleteDoc, deleteField, doc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const STATE_ID = 'main'

const roomRef = roomId => doc(db, 'rooms', roomId)
const mainStateRef = roomId => doc(db, 'rooms', roomId, 'state', STATE_ID)
const playlistsRef = roomId => collection(db, 'rooms', roomId, 'playlists')
const playlistRef = (roomId, playlistId) => doc(db, 'rooms', roomId, 'playlists', playlistId)
const suggestionsRef = roomId => collection(db, 'rooms', roomId, 'suggestions')
const suggestionRef = (roomId, id) => doc(db, 'rooms', roomId, 'suggestions', id)

export function saveRoomSetting(roomId, key, value) {
  return updateDoc(roomRef(roomId), { [`settings.${key}`]: value })
}

export function setMainState(roomId, payload) {
  return setDoc(mainStateRef(roomId), {
    ...payload,
    syncAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function patchMainState(roomId, payload) {
  return updateDoc(mainStateRef(roomId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export function updatePlaybackSync(roomId, payload) {
  return updateDoc(mainStateRef(roomId), {
    ...payload,
    syncAt: serverTimestamp(),
  })
}

export function voteNextOption(roomId, uid, optionKey, currentVote) {
  const update = currentVote === optionKey
    ? { [`nextVotes.${uid}`]: deleteField() }
    : { [`nextVotes.${uid}`]: optionKey }
  return updateDoc(mainStateRef(roomId), update)
}

export function toggleSkipVote(roomId, uid, alreadyVoted) {
  const update = alreadyVoted
    ? { [`skipVoters.${uid}`]: deleteField() }
    : { [`skipVoters.${uid}`]: true }
  return updateDoc(mainStateRef(roomId), update)
}

export function createPlaylist(roomId, name) {
  return addDoc(playlistsRef(roomId), { name, songs: [], createdAt: serverTimestamp() })
}

export function createPlaylistWithSongs(roomId, name, songs) {
  return addDoc(playlistsRef(roomId), { name, songs, createdAt: serverTimestamp() })
}

export function removePlaylist(roomId, playlistId) {
  return deleteDoc(playlistRef(roomId, playlistId))
}

export function renamePlaylist(roomId, playlistId, name) {
  return updateDoc(playlistRef(roomId, playlistId), { name })
}

export function replacePlaylistSongs(roomId, playlistId, songs) {
  return updateDoc(playlistRef(roomId, playlistId), { songs })
}

export function addSuggestion(roomId, userId, { title, ytId, url }) {
  return addDoc(suggestionsRef(roomId), { userId, title, ytId, url, createdAt: serverTimestamp() })
}

export function deleteSuggestion(roomId, suggestionId) {
  return deleteDoc(suggestionRef(roomId, suggestionId))
}

export function ratePlaylist(roomId, playlistId, userId, score) {
  return updateDoc(playlistRef(roomId, playlistId), { [`ratings.${userId}`]: score })
}

export function incrementPlaylistPlays(roomId, playlistId) {
  return updateDoc(playlistRef(roomId, playlistId), { totalPlays: increment(1) })
}

export function incrementPlaylistVotes(roomId, playlistId) {
  return updateDoc(playlistRef(roomId, playlistId), { totalVotes: increment(1) })
}
