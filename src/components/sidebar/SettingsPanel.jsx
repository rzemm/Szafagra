import { useState } from 'react'

import { HelpModal } from '../HelpPage'
import { CollaborativeModeSettings } from './CollaborativeModeSettings'
import { DisplaySettingsSection } from './settings/DisplaySettingsSection'
import { EventSettingsModal } from './settings/EventSettingsModal'
import { EventSettingsSection } from './settings/EventSettingsSection'
import { RoomCodeModal } from './settings/RoomCodeModal'
import { RoomInfoSection } from './settings/RoomInfoSection'
import { SettingsGroup } from './settings/SettingsGroup'
import { UserPermissionsSettingsSection } from './settings/UserPermissionsSettingsSection'
import { VotingSettingsSection } from './settings/VotingSettingsSection'
import { useLanguage } from '../../context/useLanguage'

export function SettingsPanel({ model }) {
  const { t, lang } = useLanguage()
  const [openGroup, setOpenGroup] = useState('voting')
  const [helpSection, setHelpSection] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [confirmCancelEvent, setConfirmCancelEvent] = useState(false)

  const toggleGroup = (key) => {
    setOpenGroup((current) => current === key ? null : key)
  }

  const collaborativeModel = {
    allowSuggestions: model.allowSuggestions,
    requireSuggestionApproval: model.room?.settings?.requireSuggestionApproval ?? true,
    suggestionsPerUser: model.room?.settings?.suggestionsPerUser ?? null,
    suggestionsRequireLogin: model.room?.settings?.suggestionsRequireLogin ?? true,
    canEditRoom: model.canEditRoom,
    saveSettings: model.saveSettings,
  }

  const userPermissionsModel = {
    allowSuggestFromList: model.allowSuggestFromList,
    allowPlaybackStop: Boolean(model.room?.settings?.allowPlaybackStop),
    playbackStopThreshold: Math.max(1, model.room?.settings?.playbackStopThreshold ?? 2),
    playbackStopMinutes: Math.max(1, model.room?.settings?.playbackStopMinutes ?? 5),
    canEditRoom: model.canEditRoom,
    saveSettings: model.saveSettings,
  }

  const eventModel = {
    partyDate: model.partyDate,
    partyLocation: model.partyLocation,
    partyDescription: model.partyDescription,
    openParty: model.openParty ?? false,
    confirmCancel: confirmCancelEvent,
  }

  const handleCancelEvent = async () => {
    setConfirmCancelEvent(false)
    await model.saveSettings('openParty', false)
    await model.saveSettings('partyDate', '')
    await model.saveSettings('partyLocation', '')
    await model.saveSettings('partyDescription', '')
  }

  return (
    <>
      <div className="section sidebar-settings-list">
        <SettingsGroup
          title={t('votingOptionsGroup')}
          isOpen={openGroup === 'voting'}
          onToggle={() => toggleGroup('voting')}
          onHelp={() => setHelpSection('voting')}
        >
          <VotingSettingsSection model={model} t={t} />
        </SettingsGroup>

        <SettingsGroup
          title={t('roomOptionsGroup')}
          isOpen={openGroup === 'room'}
          onToggle={() => toggleGroup('room')}
          onHelp={() => setHelpSection('room')}
        >
          <CollaborativeModeSettings model={collaborativeModel} t={t} />
        </SettingsGroup>

        <SettingsGroup
          title={t('userPermissionsGroup')}
          isOpen={openGroup === 'userPermissions'}
          onToggle={() => toggleGroup('userPermissions')}
          onHelp={() => setHelpSection('userPermissions')}
        >
          <UserPermissionsSettingsSection model={userPermissionsModel} t={t} />
        </SettingsGroup>

        <SettingsGroup
          title={t('displayGroup')}
          isOpen={openGroup === 'display'}
          onToggle={() => toggleGroup('display')}
          onHelp={() => setHelpSection('display')}
        >
          <DisplaySettingsSection model={model} t={t} />
        </SettingsGroup>

        <SettingsGroup
          title={t('eventGroup')}
          isOpen={openGroup === 'event'}
          onToggle={() => toggleGroup('event')}
          onHelp={() => setHelpSection('event')}
        >
          <EventSettingsSection
            canEditRoom={model.canEditRoom}
            event={eventModel}
            lang={lang}
            roomCode={model.room?.guestToken ?? ''}
            t={t}
            onCancelEvent={handleCancelEvent}
            onOpenEventModal={() => setShowEventModal(true)}
            onOpenRoomCodeModal={() => setShowCodeModal(true)}
            onToggleCancelEvent={setConfirmCancelEvent}
          />
        </SettingsGroup>

        <SettingsGroup
          title={t('roomInfoGroup')}
          isOpen={openGroup === 'roomInfo'}
          onToggle={() => toggleGroup('roomInfo')}
          onHelp={() => setHelpSection('roomInfo')}
        >
          <RoomInfoSection model={model} t={t} />
        </SettingsGroup>
      </div>

      {showEventModal && (
        <EventSettingsModal
          lang={lang}
          initialEvent={eventModel}
          saveSettings={model.saveSettings}
          t={t}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {showCodeModal && (
        <RoomCodeModal
          onChangeRoomCode={model.onChangeRoomCode}
          t={t}
          onClose={() => setShowCodeModal(false)}
        />
      )}

      {helpSection && <HelpModal activeSection={helpSection} onClose={() => setHelpSection(null)} />}
    </>
  )
}
