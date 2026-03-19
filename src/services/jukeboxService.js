import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { genId } from '../lib/jukebox'

const roomsRef = collection(db, 'rooms')
const roomRef = roomId => doc(db, 'rooms', roomId)
const suggestionsRef = roomId => collection(db, 'rooms', roomId, 'suggestions')
const suggestionRef = (roomId, id) => doc(db, 'rooms', roomId, 'suggestions', id)
const tokenRef = token => doc(db, 'tokenIndex', token)
const userRoomsRef = uid => doc(db, 'userRooms', uid)
const publicAccessRef = (uid, roomId) => doc(db, 'publicAccess', uid, 'rooms', roomId)

function defaultSettings() {
  return {
    voteMode: 'highest',
    voteThreshold: 1,
    skipThreshold: 0,
    queueSize: 1,
    allowSuggestions: false,
    showThumbnails: true,
  }
}

function createRoomPayload({ type, name, ownerId, guestToken }) {
  return {
    type,
    name,
    ownerId,
    guestToken,
    songs: [],
    ratings: {},
    totalPlays: 0,
    totalVotes: 0,
    settings: defaultSettings(),
    isPlaying: false,
    currentSong: null,
    queue: [],
    nextOptions: {},
    nextVotes: {},
    skipVoters: {},
    syncPos: 0,
    duration: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    syncAt: serverTimestamp(),
  }
}

export async function createPrivateRoom(ownerId, name = 'Nowy pokoj prywatny') {
  const guestToken = genId()
  const newRoomRef = doc(roomsRef)

  await setDoc(newRoomRef, createRoomPayload({
    type: 'private',
    name,
    ownerId,
    guestToken,
  }))

  await setDoc(tokenRef(guestToken), {
    roomId: newRoomRef.id,
    type: 'private',
    createdAt: serverTimestamp(),
  })

  return newRoomRef
}

export async function createPublicRoom(name = 'Nowy pokoj publiczny', creatorUid) {
  const guestToken = genId()
  const newRoomRef = doc(roomsRef)

  await setDoc(newRoomRef, createRoomPayload({
    type: 'public',
    name,
    ownerId: null,
    guestToken,
  }))

  await setDoc(tokenRef(guestToken), {
    roomId: newRoomRef.id,
    type: 'public',
    createdAt: serverTimestamp(),
  })

  if (creatorUid) {
    await setDoc(publicAccessRef(creatorUid, newRoomRef.id), {
      roomId: newRoomRef.id,
      grantedAt: serverTimestamp(),
      lastAccessed: serverTimestamp(),
    })
  }

  return newRoomRef
}

export function ensurePublicRoomAccess(uid, roomId) {
  return setDoc(publicAccessRef(uid, roomId), {
    roomId,
    grantedAt: serverTimestamp(),
    lastAccessed: serverTimestamp(),
  }, { merge: true })
}

export function recordGuestVisit(uid, roomId, guestToken) {
  return setDoc(userRoomsRef(uid), {
    guestOf: { [roomId]: { guestToken, lastVisited: serverTimestamp() } },
  }, { merge: true })
}

export function subscribeOwnedRooms(uid, callback) {
  const ownedRoomsQuery = query(
    roomsRef,
    where('ownerId', '==', uid),
    where('type', '==', 'private'),
  )

  return onSnapshot(ownedRoomsQuery, snap => {
    const rooms = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
    callback(rooms)
  })
}

export function saveRoomSetting(roomId, key, value) {
  return updateDoc(roomRef(roomId), {
    [`settings.${key}`]: value,
    updatedAt: serverTimestamp(),
  })
}

export function setMainState(roomId, payload) {
  return updateDoc(roomRef(roomId), {
    ...payload,
    syncAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function patchMainState(roomId, payload) {
  return updateDoc(roomRef(roomId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export function updatePlaybackSync(roomId, payload) {
  return updateDoc(roomRef(roomId), {
    ...payload,
    syncAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function voteNextOption(roomId, uid, optionKey, currentVote) {
  const update = currentVote === optionKey
    ? { [`nextVotes.${uid}`]: deleteField() }
    : { [`nextVotes.${uid}`]: optionKey }
  return updateDoc(roomRef(roomId), update)
}

export function toggleSkipVote(roomId, uid, alreadyVoted) {
  const update = alreadyVoted
    ? { [`skipVoters.${uid}`]: deleteField() }
    : { [`skipVoters.${uid}`]: true }
  return updateDoc(roomRef(roomId), update)
}

export function renameRoom(roomId, name) {
  return updateDoc(roomRef(roomId), {
    name,
    updatedAt: serverTimestamp(),
  })
}

export function replaceRoomSongs(roomId, songs) {
  return updateDoc(roomRef(roomId), {
    songs,
    updatedAt: serverTimestamp(),
  })
}

export function addSuggestion(roomId, userId, { title, ytId, url }) {
  return setDoc(doc(suggestionsRef(roomId)), {
    userId,
    title,
    ytId,
    url,
    createdAt: serverTimestamp(),
  })
}

export function deleteSuggestion(roomId, suggestionId) {
  return deleteDoc(suggestionRef(roomId, suggestionId))
}

export function rateRoom(roomId, userId, score) {
  return updateDoc(roomRef(roomId), {
    [`ratings.${userId}`]: score,
    updatedAt: serverTimestamp(),
  })
}

export function incrementRoomPlays(roomId) {
  return updateDoc(roomRef(roomId), {
    totalPlays: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export function incrementRoomVotes(roomId) {
  return updateDoc(roomRef(roomId), {
    totalVotes: increment(1),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRoom(roomId, guestToken) {
  await deleteDoc(roomRef(roomId))
  if (guestToken) {
    await deleteDoc(tokenRef(guestToken)).catch(() => {})
  }
}
