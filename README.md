# szafi.fi

Aplikacja React + Vite do prowadzenia wspolnego pokoju muzycznego opartego o Firestore.

## Uruchomienie

```bash
npm install
npm run dev
```

Testy i lint:

```bash
npm test        # vitest (logika domenowa w src/domain)
npm run lint    # eslint
npm run build   # build produkcyjny (dist/)
```

CI (GitHub Actions) uruchamia lint + testy + build dla kazdego push/PR — patrz `.github/workflows/ci.yml`.

## Architektura

- `src/domain/` — czysta logika kolejki i glosowania (bez Firebase i Reacta), pokryta testami
- `src/services/jukeboxService.js` — jedyna warstwa dotykajaca Firestore
- `src/hooks/` — orkiestracja stanu (auth, subskrypcje, komendy, playback)
- `src/components/` — widoki; view-modele budowane w `useRoomScreenModels.js`

## Model danych

Caly stan pokoju (playlista, odtwarzanie, glosy) jest trzymany w dokumencie `rooms/{roomId}`.
Pola zapisywane przez wlasciciela pokoju to m.in.: `isPlaying`, `currentSong`, `queue`,
`nextOptions`, `syncAt`, `syncPos`, `duration`, `songs`, `settings`, `updatedAt`.

Pola zapisywane przez gosci (kazde ograniczone regulami do wpisu pod wlasnym `request.auth.uid`):

- `nextVotes`: mapa `uid -> optionKey`
- `skipVoters`: mapa `uid -> true`
- `votingProposals`: mapa `key -> {id, title, ytId, addedAt}`
- `eventInterest`: mapa `uid -> true`
- `ratings` (razem z `updatedAt`)
- `totalVotes` (tylko inkrementacja o 1)
- `songs` (tylko dopisanie jednej pozycji, gdy `allowSuggestions` i brak wymaganej akceptacji)

Pozostale kolekcje:

- `tokenIndex/{token}` — mapowanie kodu goscia na `roomId` (tylko `get`, listowanie zabronione)
- `guestAccess/{uid}/rooms/{roomId}` — rejestr dostepu goscia do pokoju prywatnego; utworzenie
  wymaga podania aktualnego `guestToken` pokoju (weryfikowane w regulach)
- `publicAccess/{uid}/rooms/{roomId}` — dostep do szaf publicznych
- `userRooms/{uid}` — historia odwiedzin goscia
- `usernames/{name}`, `userProfiles/{uid}` — rezerwacja nazw uzytkownikow
- `contactMessages` — formularz kontaktowy (tylko create)

## Model dostepu do pokoju

Odczyt `rooms/{roomId}` wymaga jednego z:

1. pokoj jest publiczny (`type == 'public'`),
2. czytajacy jest wlascicielem (`ownerId == uid`),
3. pokoj jest otwarta impreza (`settings.openParty == true`),
4. czytajacy ma wpis w `guestAccess` z tokenem zgodnym z aktualnym `guestToken` pokoju.

Gosc wchodzacy linkiem `?room=<token>` najpierw rejestruje `guestAccess` (dowod znajomosci
tokenu), a dopiero potem czyta pokoj. Zmiana kodu pokoju przez wlasciciela automatycznie
uniewaznia dostepy zarejestrowane na stary token.

Uwaga przy wdrazaniu zmian regul: deployuj reguly i hosting razem
(`firebase deploy`), bo klienci sprzed zmiany nie rejestruja `guestAccess`
i po samym wdrozeniu regul goscie musieliby odswiezyc strone.

## App Check (opcjonalnie)

Po zarejestrowaniu aplikacji w Firebase Console > App Check ustaw:

```bash
VITE_FIREBASE_APPCHECK_SITE_KEY=<klucz reCAPTCHA v3>
```

Bez tej zmiennej App Check jest nieaktywny.

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
VITE_FIREBASE_APPCHECK_SITE_KEY=
```

Szczegolowa checklista wdrozenia publicznego jest w `docs/youtube-oauth-rollout.md`.
