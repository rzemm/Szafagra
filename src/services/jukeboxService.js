import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { createJoinCode } from '../lib/jukebox'

const roomsRef = collection(db, 'rooms')
const roomRef = roomId => doc(db, 'rooms', roomId)
const suggestionsRef = roomId => collection(db, 'rooms', roomId, 'suggestions')
const suggestionRef = (roomId, id) => doc(db, 'rooms', roomId, 'suggestions', id)
const tokenRef = token => doc(db, 'tokenIndex', token)
const userRoomsRef = uid => doc(db, 'userRooms', uid)
const publicAccessRef = (uid, roomId) => doc(db, 'publicAccess', uid, 'rooms', roomId)
const contactMessagesRef = collection(db, 'contactMessages')
const usernameDoc = name => doc(db, 'usernames', name.trim().toLowerCase())
const userProfileDoc = uid => doc(db, 'userProfiles', uid)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function defaultSettings() {
  return {
    roomMode: 'party',
    voteMode: 'highest',
    voteThreshold: 1,
    skipThreshold: 0,
    queueSize: 1,
    allowSuggestions: false,
    showThumbnails: true,
    isVisible: true,
  }
}

function createRoomPayload({ type, name, ownerId, guestToken, extraSettings = {} }) {
  return {
    type,
    name,
    ownerId,
    guestToken,
    songs: [],
    ratings: {},
    totalPlays: 0,
    totalVotes: 0,
    settings: { ...defaultSettings(), ...extraSettings },
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

function withRoomTimestamps(payload, { includeSyncAt = false } = {}) {
  return {
    ...payload,
    ...(includeSyncAt ? { syncAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  }
}

function updateRoom(roomId, payload, options) {
  return updateDoc(roomRef(roomId), withRoomTimestamps(payload, options))
}

async function createUniqueGuestToken(maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const token = createJoinCode()
    const tokenSnap = await getDoc(tokenRef(token))

    if (!tokenSnap.exists()) return token
  }

  throw new Error('Could not generate a unique guest token')
}

export async function createPrivateRoom(ownerId, name = 'Nowa szafa prywatna', roomMode = null, extraSettings = {}) {
  const guestToken = await createUniqueGuestToken()
  const newRoomRef = doc(roomsRef)

  await setDoc(newRoomRef, createRoomPayload({
    type: 'private',
    name,
    ownerId,
    guestToken,
    extraSettings: { ...(roomMode ? { roomMode } : {}), ...extraSettings },
  }))

  await setDoc(tokenRef(guestToken), {
    roomId: newRoomRef.id,
    type: 'private',
    createdAt: serverTimestamp(),
  })

  return newRoomRef
}

export async function createPrivateRoomCopy(ownerId, sourceRoom) {
  const guestToken = await createUniqueGuestToken()
  const newRoomRef = doc(roomsRef)
  const sourceName = typeof sourceRoom?.name === 'string' && sourceRoom.name.trim()
    ? sourceRoom.name.trim()
    : 'Szafa prywatna'

  await setDoc(newRoomRef, {
    ...createRoomPayload({
      type: 'private',
      name: `${sourceName} (kopia)`,
      ownerId,
      guestToken,
    }),
    songs: Array.isArray(sourceRoom?.songs) ? sourceRoom.songs : [],
    settings: {
      ...defaultSettings(),
      ...(sourceRoom?.settings ?? {}),
    },
  })

  await setDoc(tokenRef(guestToken), {
    roomId: newRoomRef.id,
    type: 'private',
    createdAt: serverTimestamp(),
  })

  return newRoomRef
}

export async function createPublicRoom(name = 'Nowa szafa publiczna', creatorUid, roomMode = null, extraSettings = {}) {
  const guestToken = await createUniqueGuestToken()
  const newRoomRef = doc(roomsRef)

  await setDoc(newRoomRef, createRoomPayload({
    type: 'public',
    name,
    ownerId: null,
    guestToken,
    extraSettings: { ...(roomMode ? { roomMode } : {}), ...extraSettings },
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

export function subscribeLatestRooms(callback, count = 5) {
  const latestRoomsQuery = query(
    roomsRef,
    orderBy('updatedAt', 'desc'),
    limit(Math.max(count * 3, 10)),
  )

  return onSnapshot(latestRoomsQuery, snap => {
    const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(rooms)
  })
}

export function subscribeOpenParties(callback) {
  const q = query(roomsRef, where('settings.openParty', '==', true))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function subscribePublicRooms(callback, count = 30) {
  const q = query(roomsRef, where('type', '==', 'public'), limit(count))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function saveRoomSetting(roomId, key, value) {
  return updateRoom(roomId, {
    [`settings.${key}`]: value,
  })
}

export function setMainState(roomId, payload) {
  return updateRoom(roomId, payload, { includeSyncAt: true })
}

export function patchMainState(roomId, payload) {
  return updateRoom(roomId, payload)
}

export function updatePlaybackSync(roomId, payload) {
  return updateRoom(roomId, payload, { includeSyncAt: true })
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

export function toggleEventInterest(roomId, visitorId, alreadyInterested) {
  const update = alreadyInterested
    ? { [`eventInterest.${visitorId}`]: deleteField() }
    : { [`eventInterest.${visitorId}`]: true }
  return updateDoc(roomRef(roomId), update)
}

export function renameRoom(roomId, name) {
  return updateRoom(roomId, {
    name,
  })
}

export function replaceRoomSongs(roomId, songs) {
  return updateRoom(roomId, {
    songs,
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

export function addPlaylistSuggestion(roomId, userId, { playlistTitle, playlistId, songs }) {
  return setDoc(doc(suggestionsRef(roomId)), {
    type: 'playlist',
    userId,
    playlistTitle,
    playlistId,
    songs,
    createdAt: serverTimestamp(),
  })
}

export function setVotingProposal(roomId, key, song) {
  return updateDoc(roomRef(roomId), {
    [`votingProposals.${key}`]: { id: song.id, title: song.title, ytId: song.ytId, addedAt: Date.now() },
  })
}

export function clearVotingProposals(roomId, keys) {
  if (!keys?.length) return Promise.resolve()
  const update = {}
  for (const key of keys) update[`votingProposals.${key}`] = deleteField()
  return updateDoc(roomRef(roomId), update)
}

export function rateRoom(roomId, userId, score) {
  return updateRoom(roomId, {
    [`ratings.${userId}`]: score,
  })
}

export function incrementRoomPlays(roomId) {
  return updateRoom(roomId, {
    totalPlays: increment(1),
  })
}

export function incrementRoomVotes(roomId) {
  return updateRoom(roomId, {
    totalVotes: increment(1),
  })
}

export async function createContactMessage({
  message,
  authorName = '',
  authorEmail = '',
  source,
  roomId = null,
  userId = null,
}) {
  const trimmedMessage = message?.trim() ?? ''
  const trimmedAuthorName = authorName?.trim() ?? ''
  const trimmedAuthorEmail = authorEmail?.trim() ?? ''

  if (!trimmedMessage) {
    throw new Error('Wiadomosc nie moze byc pusta.')
  }

  if (trimmedAuthorEmail && !EMAIL_REGEX.test(trimmedAuthorEmail)) {
    throw new Error('Podaj poprawny adres email.')
  }

  const payload = {
    message: trimmedMessage,
    authorName: trimmedAuthorName,
    authorEmail: trimmedAuthorEmail,
    source,
    status: 'new',
    createdAt: serverTimestamp(),
  }

  if (roomId) payload.roomId = roomId
  if (userId) payload.userId = userId

  return addDoc(contactMessagesRef, payload)
}

export async function deleteRoom(roomId, guestToken) {
  await deleteDoc(roomRef(roomId))
  if (guestToken) {
    await deleteDoc(tokenRef(guestToken)).catch(() => {})
  }
}

export async function hasSetUsername(uid) {
  const snap = await getDoc(userProfileDoc(uid))
  return snap.exists() && !!snap.data()?.hasSetUsername
}

export async function isUsernameAvailable(name) {
  const snap = await getDoc(usernameDoc(name))
  return !snap.exists()
}

export async function claimUsername(uid, name) {
  const snap = await getDoc(usernameDoc(name))
  if (snap.exists() && snap.data().uid !== uid) throw new Error('taken')
  await setDoc(usernameDoc(name), { uid, username: name })
  await setDoc(userProfileDoc(uid), { username: name, hasSetUsername: true }, { merge: true })
}

export async function changeRoomGuestToken(roomId, currentToken, newToken, roomType) {
  const snap = await getDoc(tokenRef(newToken))
  if (snap.exists()) throw new Error('taken')

  if (currentToken) {
    await deleteDoc(tokenRef(currentToken)).catch(() => {})
  }
  await updateRoom(roomId, { guestToken: newToken })
  await setDoc(tokenRef(newToken), {
    roomId,
    type: roomType ?? 'private',
    createdAt: serverTimestamp(),
  })
}
