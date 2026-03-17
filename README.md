# Szafagra

Aplikacja React + Vite do prowadzenia wspolnego pokoju muzycznego opartego o Firestore.

## Uruchomienie

```bash
npm install
npm run dev
```

## Model danych

Glowny stan odtwarzania jest trzymany w dokumencie `rooms/{roomId}/state/main`.

Dokument `state/main` zawiera pola zapisywane przez ownera pokoju, m.in.:
- `isPlaying`
- `activePlaylistId`
- `currentSong`
- `queue`
- `nextOptions`
- `syncAt`
- `syncPos`
- `duration`
- `updatedAt`

Pola glosowania gosci:
- `nextVotes`: mapa `uid -> optionKey`; gosc moze utworzyc, zmienic albo usunac tylko wpis pod wlasnym `request.auth.uid`
- `skipVoters`: mapa `uid -> true`; gosc moze utworzyc albo usunac tylko wpis pod wlasnym `request.auth.uid`

Reguly Firestore nie pozwalaja gosciowi modyfikowac pol ownera ani wpisow innych uzytkownikow w `nextVotes` i `skipVoters`.
