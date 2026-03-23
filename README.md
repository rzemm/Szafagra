# Szafagra

Aplikacja React + Vite do prowadzenia wspolnego pokoju muzycznego opartego o Firestore.

## YouTube OAuth rollout

Import playlist z konta YouTube korzysta z Google OAuth i zakresu `youtube.readonly`.

Publiczny rollout wymaga dwoch warstw konfiguracji:
- kod aplikacji: obsluga popupu, bledow i ewentualnie osobnej konfiguracji YouTube OAuth przez envy
- konfiguracja zewnetrzna: Google Cloud OAuth Consent Screen, App Verification, Firebase Authentication authorized domains i poprawne origin/redirect URI

Opcjonalnie mozna rozdzielic konfiguracje zwyklego Firebase od YouTube OAuth. Jesli ponizsze zmienne nie sa ustawione, import YouTube korzysta z glownej konfiguracji Firebase:

```bash
VITE_YT_FIREBASE_API_KEY=
VITE_YT_FIREBASE_AUTH_DOMAIN=
VITE_YT_FIREBASE_PROJECT_ID=
VITE_YT_FIREBASE_STORAGE_BUCKET=
VITE_YT_FIREBASE_MESSAGING_SENDER_ID=
VITE_YT_FIREBASE_APP_ID=
```

Szczegolowa checklista wdrozenia publicznego jest w `docs/youtube-oauth-rollout.md`.

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
