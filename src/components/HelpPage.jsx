import { useState } from 'react'
import { useLanguage } from '../context/useLanguage'
import '../styles/help.css'

function Section({ id, title, openId, setOpenId, children }) {
  const open = openId === id
  return (
    <div className={`help-section${open ? ' help-section--open' : ''}`}>
      <button className="help-section-header" onClick={() => setOpenId(open ? null : id)}>
        <span>{title}</span>
        <span className="help-section-arrow">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="help-section-body">{children}</div>}
    </div>
  )
}

const CONTENT = {
  voting: {
    pl: (
      <>
        <h3>Tryb wyboru piosenek</h3>
        <p>Określa, jak Szafi.fi wyłania następną piosenkę spośród opcji do głosowania.</p>
        <ul>
          <li><strong>Głosowanie</strong> — goście głosują na swój faworyt. Wygrywa opcja z największą liczbą głosów.</li>
          <li><strong>Prawdopodobieństwo</strong> — każdy głos zwiększa szansę opcji na wygraną, ale wynik jest losowy. Zapobiega sytuacji, gdzie ta sama piosenka wygrywa w każdej rundzie.</li>
        </ul>
        <h3>Piosenek na 1 głos</h3>
        <p>Ile piosenek jest grupowanych w jedną opcję do głosowania. Przy wartości 1 każda piosenka to osobna opcja; wyższe wartości tworzą "zestawy" piosenek.</p>
        <h3>Kolejka (min. piosenek)</h3>
        <p>Minimalna liczba piosenek, które muszą czekać w kolejce zanim pojawi się nowe głosowanie. Zapobiega przerwom w muzyce gdy lista jest krótka.</p>
        <h3>Głosy do pominięcia</h3>
        <p>Ile głosów „pomiń" od gości wymagane jest, aby automatycznie przeskoczyć bieżącą piosenkę. Wartość 0 wyłącza tę funkcję.</p>
      </>
    ),
    en: (
      <>
        <h3>Song selection mode</h3>
        <p>Determines how Szafi.fi picks the next song from the voting options.</p>
        <ul>
          <li><strong>Voting</strong> — guests vote for their favourite. The option with the most votes wins.</li>
          <li><strong>Probability</strong> — each vote increases an option's chance of winning, but the result is random. Prevents the same song from winning every round.</li>
        </ul>
        <h3>Songs per vote</h3>
        <p>How many songs are grouped into one voting option. At 1, every song is its own option; higher values create song "bundles".</p>
        <h3>Queue (min. songs)</h3>
        <p>The minimum number of songs that must be queued before new voting starts. Prevents music gaps when the playlist is short.</p>
        <h3>Votes to skip</h3>
        <p>How many "skip" votes from guests are needed to automatically skip the current song. Set to 0 to disable.</p>
      </>
    ),
  },

  userPermissions: {
    pl: (
      <>
        <h3>Propozycje z listy</h3>
        <p>Goście mogą nominować do głosowania piosenki już istniejące na liście szafy.</p>
        <ul>
          <li><strong>Wyłączone</strong> — funkcja niedostępna.</li>
          <li><strong>Jedna propozycja</strong> — każdy gość może nominować jedną piosenkę na rundę.</li>
          <li><strong>Bez limitu</strong> — goście mogą nominować dowolnie wiele piosenek.</li>
        </ul>
        <h3>Wyłącz muzykę</h3>
        <p>Goście mogą zagłosować za zatrzymaniem odtwarzania. Po zebraniu wymaganej liczby głosów muzyka zatrzymuje się na określony czas.</p>
        <h3>Min. użytkowników</h3>
        <p>Ile głosów „stop" potrzeba, żeby muzyka się zatrzymała.</p>
        <h3>Czas w minutach</h3>
        <p>Jak długo muzyka pozostaje zatrzymana po zebraniu głosów.</p>
      </>
    ),
    en: (
      <>
        <h3>Suggest from list</h3>
        <p>Guests can nominate songs already on the room's list for voting.</p>
        <ul>
          <li><strong>Off</strong> — feature unavailable.</li>
          <li><strong>One nomination</strong> — each guest can nominate one song per round.</li>
          <li><strong>Unlimited</strong> — guests can nominate as many songs as they like.</li>
        </ul>
        <h3>Turn music off</h3>
        <p>Guests can vote to stop playback. When enough votes are collected, music pauses for a set duration.</p>
        <h3>Min. users</h3>
        <p>How many "stop" votes are needed to pause music.</p>
        <h3>Duration in minutes</h3>
        <p>How long music stays paused after the votes are collected.</p>
      </>
    ),
  },

  display: {
    pl: (
      <>
        <h3>Pasek tekstu</h3>
        <p>Przewijający się tekst wyświetlany na ekranie właściciela i/lub widoczny dla gości. Możesz go użyć do ogłoszeń lub wiadomości powitalnej.</p>
        <h3>Miniatury</h3>
        <p>Pokazuje okładki filmów YouTube przy piosenkach na liście i w kolejce.</p>
        <h3>Pokaż kod QR</h3>
        <p>Wyświetla kod QR na ekranie właściciela — goście mogą go zeskanować, żeby dołączyć do szafy.</p>
        <h3>Pokaż kod szafy</h3>
        <p>Wyświetla tekstowy kod szafy na ekranie — alternatywny sposób dołączenia bez skanowania QR.</p>
        <h3>Pokaż kolejkę</h3>
        <p>Nakłada kolejkę odtwarzania na główny ekran szafy.</p>
      </>
    ),
    en: (
      <>
        <h3>Text ticker</h3>
        <p>A scrolling text shown on the owner's screen and/or to guests. Use it for announcements or a welcome message.</p>
        <h3>Thumbnails</h3>
        <p>Shows YouTube video thumbnails next to songs in the list and queue.</p>
        <h3>Show QR code</h3>
        <p>Displays a QR code on the owner's screen — guests can scan it to join the room.</p>
        <h3>Show room code</h3>
        <p>Displays a text room code on screen — an alternative way to join without scanning QR.</p>
        <h3>Show queue</h3>
        <p>Overlays the playback queue on the main room screen.</p>
      </>
    ),
  },

  room: {
    pl: (
      <>
        <h3>Tryb wspólnego tworzenia listy</h3>
        <p>Gdy włączony, goście mogą samodzielnie dodawać piosenki do listy szafy — nie tylko głosować. To tryb, w którym playlista należy do wszystkich obecnych.</p>
        <h3>Nowe utwory trafiają do</h3>
        <p>Określa, co się dzieje z piosenką po jej dodaniu przez gościa.</p>
        <ul>
          <li><strong>Kolejki</strong> — piosenka czeka na akceptację właściciela przed pojawieniem się na liście.</li>
          <li><strong>Listy</strong> — piosenka jest dodawana do listy automatycznie, bez zatwierdzania.</li>
        </ul>
        <h3>Bez limitu propozycji</h3>
        <p>Każdy gość może dodać dowolną liczbę piosenek. Gdy wyłączone, możesz określić maksymalną liczbę na osobę.</p>
        <h3>Max propozycji na osobę</h3>
        <p>Ile piosenek może dodać jeden gość. Działa tylko gdy opcja "bez limitu" jest wyłączona.</p>
        <h3>Wymagaj logowania</h3>
        <p>Goście muszą być zalogowani przez Google, żeby dodawać piosenki. Zapobiega spamowi i pozwala śledzić kto dodał co.</p>
      </>
    ),
    en: (
      <>
        <h3>Collaborative playlist mode</h3>
        <p>When enabled, guests can add songs to the room's list directly — not just vote. Everyone helps build the playlist together.</p>
        <h3>New songs go to</h3>
        <p>Determines what happens to a song after a guest adds it.</p>
        <ul>
          <li><strong>Queue</strong> — the song waits for the owner's approval before appearing on the list.</li>
          <li><strong>List</strong> — the song is added to the list automatically, without approval.</li>
        </ul>
        <h3>Unlimited suggestions</h3>
        <p>Each guest can add any number of songs. When off, you can set a maximum per person.</p>
        <h3>Max suggestions per person</h3>
        <p>How many songs one guest can add. Only applies when unlimited is off.</p>
        <h3>Require login</h3>
        <p>Guests must be signed in with Google to add songs. Prevents spam and lets you track who added what.</p>
      </>
    ),
  },

  event: {
    pl: (
      <>
        <p>Wydarzenie pozwala powiązać szafę z konkretną imprezą. Po ustawieniu daty szafa pojawia się na stronie głównej Szafi.fi w liście nadchodzących wydarzeń — goście mogą zaznaczyć „jestem zainteresowany" i przejrzeć playlistę z wyprzedzeniem.</p>
        <h3>Data i godzina</h3>
        <p>Termin wydarzenia. Wymagany, żeby szafa trafiła na listę publiczną.</p>
        <h3>Miejsce</h3>
        <p>Adres lub nazwa lokalizacji. Kliknięcie otwiera Google Maps.</p>
        <h3>Opis</h3>
        <p>Krótka informacja o imprezie widoczna dla gości na stronie głównej i w zakładce Wydarzenie.</p>
        <h3>Kod szafy</h3>
        <p>Unikalny, łatwy do wpisania kod, którym goście mogą dołączyć do szafy bez linku.</p>
      </>
    ),
    en: (
      <>
        <p>Events let you link a room to a specific party or gathering. Once a date is set, the room appears on the Szafi.fi homepage in the upcoming events list — guests can mark "I'm interested" and browse the playlist in advance.</p>
        <h3>Date & time</h3>
        <p>The event date. Required for the room to appear in the public list.</p>
        <h3>Location</h3>
        <p>Address or venue name. Clicking opens Google Maps.</p>
        <h3>Description</h3>
        <p>A short note about the event, visible to guests on the homepage and in the Event tab.</p>
        <h3>Room code</h3>
        <p>A unique, easy-to-type code guests can use to join the room without a link.</p>
      </>
    ),
  },

  roomInfo: {
    pl: (
      <>
        <h3>Nazwa</h3>
        <p>Wyświetlana nazwa szafy, widoczna dla gości i na liście wydarzeń na stronie głównej Szafi.fi.</p>
        <h3>Widoczność</h3>
        <p>Gdy włączona, szafa jest widoczna publicznie na stronie głównej Szafi.fi. Gdy wyłączona, dostępna tylko przez bezpośredni link.</p>
        <h3>Skopiuj link do szafy</h3>
        <p>Kopiuje do schowka bezpośredni link, którym goście mogą dołączyć do szafy.</p>
        <h3>Statystyki</h3>
        <p>Średnia ocena gości (1–5 gwiazdek), łączna liczba odtworzonych piosenek i oddanych głosów.</p>
        <h3>Eksport / import</h3>
        <p>Możliwość zapisania całej listy piosenek do pliku JSON lub wczytania jej z wcześniej zapisanego pliku.</p>
      </>
    ),
    en: (
      <>
        <h3>Name</h3>
        <p>The display name of the room, shown to guests and in the event listing on the Szafi.fi homepage.</p>
        <h3>Visibility</h3>
        <p>When on, the room is publicly visible on the Szafi.fi homepage. When off, only accessible via a direct link.</p>
        <h3>Copy room link</h3>
        <p>Copies a direct link to the clipboard that guests can use to join the room.</p>
        <h3>Stats</h3>
        <p>Average guest rating (1–5 stars), total songs played and votes cast.</p>
        <h3>Export / import</h3>
        <p>Save the full song list to a JSON file or load one from a previously saved file.</p>
      </>
    ),
  },
}

export function HelpModal({ onClose, activeSection }) {
  const { lang } = useLanguage()
  const [openId, setOpenId] = useState(activeSection ?? null)

  return (
    <div className="help-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="help-modal">
        <div className="help-modal-header">
          <h2 className="help-modal-title">{lang === 'pl' ? 'Pomoc' : 'Help'}</h2>
          <button className="help-modal-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="help-modal-body">
          <div className="help-sections">
            <Section id="voting" openId={openId} setOpenId={setOpenId} title={lang === 'pl' ? 'Opcje głosowania' : 'Voting options'}>
              {CONTENT.voting[lang]}
            </Section>
            <Section id="room" openId={openId} setOpenId={setOpenId} title={lang === 'pl' ? 'Wspólna lista' : 'Collaborative playlist'}>
              {CONTENT.room[lang]}
            </Section>
            <Section id="userPermissions" openId={openId} setOpenId={setOpenId} title={lang === 'pl' ? 'Uprawnienia użytkowników' : 'User permissions'}>
              {CONTENT.userPermissions[lang]}
            </Section>
            <Section id="display" openId={openId} setOpenId={setOpenId} title={lang === 'pl' ? 'Wyświetlanie' : 'Display'}>
              {CONTENT.display[lang]}
            </Section>
            <Section id="event" openId={openId} setOpenId={setOpenId} title={lang === 'pl' ? 'Wydarzenie' : 'Event'}>
              {CONTENT.event[lang]}
            </Section>
            <Section id="roomInfo" openId={openId} setOpenId={setOpenId} title={lang === 'pl' ? 'Informacje o szafie' : 'Room info'}>
              {CONTENT.roomInfo[lang]}
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}
