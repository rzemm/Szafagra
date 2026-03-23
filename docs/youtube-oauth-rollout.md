# YouTube OAuth public rollout

Ta funkcja jest gotowa po stronie UI, ale publiczne udostepnienie wymaga jeszcze konfiguracji poza repo.

## Co trzeba ustawic poza kodem

1. Google Cloud / Google Auth Platform
   - ustaw aplikacje jako `External`
   - przejdz z `Testing` do produkcyjnego publish status
   - zostaw tylko scope `https://www.googleapis.com/auth/youtube.readonly`
   - uzupelnij app name, support email, developer contact
   - podlacz produkcyjna domene
   - dodaj homepage, privacy policy i ewentualnie terms URL
2. Google verification
   - przygotuj krotkie wideo z flow logowania i importu playlisty
   - opisz, ze aplikacja tylko odczytuje playlisty uzytkownika
   - podaj polityke prywatnosci zgodna z tym use case
3. Firebase Authentication
   - wlacz Google jako provider
   - dodaj produkcyjna domene do `Authorized domains`
4. OAuth client
   - zweryfikuj `Authorized JavaScript origins`
   - zweryfikuj `Authorized redirect URIs`
   - sprawdz popup sign-in na domenie produkcyjnej

## Co jest zaimplementowane w repo

- Przyjazne komunikaty dla typowych bledow OAuth i rolloutowych.
- Fallback UX informujacy, ze uzytkownik moze chwilowo uzyc linku do playlisty.
- Mozliwosc podstawienia osobnej konfiguracji Firebase tylko dla YouTube OAuth przez zmienne `VITE_YT_FIREBASE_*`.

## Minimalna checklista testowa

- Uzytkownik spoza listy testowej moze przejsc popup logowania.
- Nie wystepuje `redirect_uri_mismatch`, `origin_mismatch` ani `unauthorized_domain`.
- `youtube.readonly` pozwala pobrac playlisty `mine=true`.
- Import playlisty nadal dziala po zalogowaniu.
- Import playlisty po zwyklym linku nadal dziala jako fallback.
