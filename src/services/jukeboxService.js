import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const STATE_ID = 'main'

const roomRef = roomId => doc(db, 'rooms', roomId)
const mainStateRef = roomId => doc(db, 'rooms', roomId, 'state', STATE_ID)
const playlistsRef = roomId => collection(db, 'rooms', roomId, 'playlists')
const playlistRef = (roomId, playlistId) => doc(db, 'rooms', roomId, 'playlists', playlistId)

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

export function removePlaylist(roomId, playlistId) {
  return deleteDoc(playlistRef(roomId, playlistId))
}

export function renamePlaylist(roomId, playlistId, name) {
  return updateDoc(playlistRef(roomId, playlistId), { name })
}

export function replacePlaylistSongs(roomId, playlistId, songs) {
  return updateDoc(playlistRef(roomId, playlistId), { songs })
}
