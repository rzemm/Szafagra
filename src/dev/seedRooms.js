import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const roomsRef = collection(db, 'rooms')
const tokenRef = (token) => doc(db, 'tokenIndex', token)

function makeId() {
  return Math.random().toString(36).slice(2, 13)
}

const SAMPLE_ROOMS = [
  {
    name: 'Klasyki Rocka',
    token: 'rock-klasyki',
    songs: [
      { title: 'Bohemian Rhapsody', ytId: 'fJ9rUzIMcZQ' },
      { title: 'Smells Like Teen Spirit', ytId: 'hTWKbfoikeg' },
      { title: 'Back in Black', ytId: 'pAgnJDJN4VA' },
      { title: 'November Rain', ytId: 'UkORSyEaTng' },
      { title: 'Hotel California', ytId: 'BciS5krYL80' },
    ],
    ratings: { u1: 5, u2: 5, u3: 4, u4: 5, u5: 4 },
    totalPlays: 87,
    totalVotes: 312,
  },
  {
    name: 'Pop Hity',
    token: 'pop-hity-2024',
    songs: [
      { title: 'Shape of You', ytId: 'JGwWNGJdvx8' },
      { title: 'Uptown Funk', ytId: 'OPf0YbXqDm0' },
      { title: 'Rolling in the Deep', ytId: 'rYEDA3JcQqw' },
      { title: 'Despacito', ytId: 'ktvTqknDobU' },
      { title: 'Blinding Lights', ytId: '4NRXx6paco8' },
      { title: 'As It Was', ytId: 'H5v3kku4y6Q' },
    ],
    ratings: { u6: 4, u7: 3, u8: 4, u9: 5, u10: 3 },
    totalPlays: 143,
    totalVotes: 521,
  },
  {
    name: 'Chill & Relax',
    token: 'chill-relax-mix',
    songs: [
      { title: 'Heat Waves', ytId: 'mRD0-GxqHVo' },
      { title: 'Watermelon Sugar', ytId: 'E07s5ZYygMg' },
      { title: 'Levitating', ytId: 'TUVcZfQe-Kw' },
      { title: 'bad guy', ytId: 'DyDfgMOUjCI' },
      { title: 'drivers license', ytId: 'ZmDBbnmKpqQ' },
    ],
    ratings: { u11: 5, u12: 4, u13: 5 },
    totalPlays: 56,
    totalVotes: 189,
  },
  {
    name: 'Rap & Hip-Hop',
    token: 'rap-hiphop-mix',
    songs: [
      { title: 'Lose Yourself', ytId: '_Yhyp-_hX2s' },
      { title: 'HUMBLE.', ytId: 'tvTRZJ-4EyI' },
      { title: "God's Plan", ytId: 'xpVfcZ0ZcFM' },
      { title: 'Hotline Bling', ytId: 'uxpDa-c-4Mc' },
      { title: 'Sicko Mode', ytId: '6ONRf7h3Mdk' },
    ],
    ratings: { u14: 4, u15: 4, u16: 3, u17: 5 },
    totalPlays: 72,
    totalVotes: 267,
  },
  {
    name: 'Zlote Lata 80',
    token: 'lata-80-zlote',
    songs: [
      { title: "Don't Stop Believin'", ytId: 'VcjzHMhBtf0' },
      { title: 'Take On Me', ytId: 'djV11Xbc914' },
      { title: 'Africa', ytId: 'FTQbiNvZqaY' },
      { title: 'Girls Just Want to Have Fun', ytId: 'PIb6AZdTr-A' },
      { title: 'Sweet Child O Mine', ytId: '1w7OgIMMRc4' },
      { title: 'Wake Me Up Before You Go-Go', ytId: 'pIIpB0hasO0' },
    ],
    ratings: { u18: 5, u19: 4, u20: 5, u21: 4, u22: 5, u23: 4 },
    totalPlays: 104,
    totalVotes: 398,
  },
]

export async function seedSampleRooms() {
  const results = []

  for (const sample of SAMPLE_ROOMS) {
    const newRoomRef = doc(roomsRef)
    const songs = sample.songs.map((s) => ({
      id: makeId(),
      title: s.title,
      ytId: s.ytId,
      url: `https://youtu.be/${s.ytId}`,
    }))

    await setDoc(newRoomRef, {
      type: 'public',
      name: sample.name,
      ownerId: null,
      guestToken: sample.token,
      songs,
      ratings: sample.ratings,
      totalPlays: sample.totalPlays,
      totalVotes: sample.totalVotes,
      settings: {
        voteMode: 'highest',
        voteThreshold: 1,
        skipThreshold: 0,
        queueSize: 1,
        allowSuggestions: false,
        requireSuggestionApproval: true,
        allowPlaybackStop: false,
        playbackStopThreshold: 2,
        playbackStopMinutes: 5,
        showThumbnails: true,
        isVisible: true,
      },
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
    })

    await setDoc(tokenRef(sample.token), {
      roomId: newRoomRef.id,
      type: 'public',
      createdAt: serverTimestamp(),
    })

    results.push({ name: sample.name, id: newRoomRef.id, token: sample.token })
    console.log(`Utworzono: ${sample.name} (${newRoomRef.id})`)
  }

  console.log('Gotowe! Utworzone listy:', results)
  return results
}
