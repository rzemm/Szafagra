import { useState } from 'react'

function ConsentCategory({ title, description, detail, alwaysOn, checked, onChange }) {
  return (
    <div className="cookie-category">
      <div className="cookie-category-copy">
        <div className="cookie-category-head">
          <h3>{title}</h3>
          <span className={`cookie-badge${alwaysOn ? ' cookie-badge--locked' : ''}`}>
            {alwaysOn ? 'Zawsze aktywne' : checked ? 'Aktywne' : 'Wylaczone'}
          </span>
        </div>
        <p>{description}</p>
        <span className="cookie-category-detail">{detail}</span>
      </div>

      <label className="toggle-switch" aria-label={title}>
        <input type="checkbox" checked={checked} onChange={onChange} disabled={alwaysOn} />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

function CookiePolicyContent({ onOpenSettings }) {
  return (
    <div className="cookie-policy">
      <div className="cookie-policy-block">
        <h3>Polityka cookies</h3>
        <p>
          Szafagra zapisuje informacje w przegladarce tylko wtedy, gdy sa potrzebne do dzialania aplikacji
          lub gdy uzytkownik wyrazil na to zgode. Zgode mozesz zmienic w dowolnym momencie.
        </p>
      </div>

      <div className="cookie-policy-grid">
        <article className="cookie-policy-card">
          <h4>Niezbedne</h4>
          <p>
            Obejmuja mechanizmy potrzebne do logowania, utrzymania sesji, ochrony bezpieczenstwa
            i dzialania podstawowych funkcji Firebase.
          </p>
          <span>Podstawa: uzasadnione technicznie dzialanie uslugi.</span>
        </article>

        <article className="cookie-policy-card">
          <h4>Analityczne</h4>
          <p>
            Ta kategoria jest przygotowana pod przyszle wlaczenie Firebase Analytics.
            Domyslnie pozostaje wylaczona i nie uruchamia sie bez Twojej zgody.
          </p>
          <span>Podstawa: zgoda uzytkownika.</span>
        </article>
      </div>

      <div className="cookie-policy-block">
        <h4>Czas przechowywania</h4>
        <p>
          Decyzje dotyczace cookies przechowujemy lokalnie w przegladarce, aby nie pytac o nie przy kazdej wizycie.
          Szczegolowe czasy zycia mechanizmow technicznych zaleza od Firebase i ustawien przegladarki.
        </p>
      </div>

      <div className="cookie-policy-block">
        <h4>Zmiana decyzji</h4>
        <p>
          Uzyj przycisku <button type="button" className="cookie-inline-link" onClick={onOpenSettings}>Ustawienia cookies</button>,
          aby ponownie otworzyc panel i zmienic swoja decyzje.
        </p>
      </div>
    </div>
  )
}

export function CookieConsentBanner({ onAcceptAll, onRejectOptional, onOpenSettings }) {
  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Informacja o cookies">
      <div className="cookie-banner-glow" />
      <div className="cookie-banner-copy">
        <span className="cookie-kicker">Cookies</span>
        <h2>Szafagra korzysta z cookies i pamieci przegladarki</h2>
        <p>
          Niezbedne mechanizmy pomagaja w logowaniu, bezpieczenstwie i dzialaniu aplikacji.
          Analityka pozostaje wylaczona, dopoki jej nie zaakceptujesz.
        </p>
      </div>

      <div className="cookie-banner-actions">
        <button className="cookie-btn cookie-btn--ghost" onClick={onRejectOptional}>Odrzuc dodatkowe</button>
        <button className="cookie-btn cookie-btn--soft" onClick={onOpenSettings}>Ustawienia</button>
        <button className="cookie-btn cookie-btn--primary" onClick={onAcceptAll}>Akceptuj</button>
      </div>
    </div>
  )
}

function CookieSettingsDialog({
  consentState,
  onClose,
  onAcceptAll,
  onRejectOptional,
  onSavePreferences,
  onOpenSettings,
}) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(Boolean(consentState.analytics))

  return (
    <div className="cookie-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="cookie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cookie-modal-header">
          <div>
            <span className="cookie-kicker">Prywatnosc</span>
            <h2 id="cookie-settings-title">Ustawienia cookies</h2>
          </div>
          <button type="button" className="cookie-close-btn" onClick={onClose} aria-label="Zamknij ustawienia cookies">
            x
          </button>
        </div>

        <div className="cookie-modal-body">
          <p className="cookie-modal-intro">
            Tutaj ustawiasz, ktore kategorie mozemy uruchomic. Niezbedne mechanizmy pozostaja aktywne,
            bo bez nich logowanie i czesc funkcji aplikacji nie zadzialaja poprawnie.
          </p>

          <div className="cookie-categories">
            <ConsentCategory
              title="Niezbedne"
              description="Logowanie, bezpieczenstwo, podstawowe dzialanie Firebase i ustawienia sesji."
              detail="Te mechanizmy sa wymagane do poprawnego dzialania aplikacji."
              alwaysOn
              checked
              onChange={() => {}}
            />

            <ConsentCategory
              title="Analityczne"
              description="Przyszle pomiary odwiedzin i uzycia aplikacji po wlaczeniu Firebase Analytics."
              detail="Dzis ta kategoria sluzy jako bezpieczny punkt integracji pod przyszla analityke."
              checked={analyticsEnabled}
              onChange={() => setAnalyticsEnabled((current) => !current)}
            />
          </div>

          <CookiePolicyContent onOpenSettings={onOpenSettings} />
        </div>

        <div className="cookie-modal-actions">
          <button className="cookie-btn cookie-btn--ghost" onClick={onRejectOptional}>Odrzuc dodatkowe</button>
          <button className="cookie-btn cookie-btn--soft" onClick={() => onSavePreferences({ analytics: analyticsEnabled })}>
            Zapisz wybor
          </button>
          <button className="cookie-btn cookie-btn--primary" onClick={onAcceptAll}>Akceptuj wszystko</button>
        </div>
      </section>
    </div>
  )
}

export function CookieSettingsModal({ isOpen, ...props }) {
  if (!isOpen) return null
  return <CookieSettingsDialog {...props} />
}
