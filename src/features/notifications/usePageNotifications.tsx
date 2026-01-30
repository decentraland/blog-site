import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthIdentity } from 'decentraland-crypto-fetch'
import { useNotifications } from '@dcl/hooks'
import { NotificationActiveTab, Profile, dclAddressUtils } from 'decentraland-ui2'
import type { NotificationLocale, NotificationsProps } from 'decentraland-ui2'
import { getEnv } from '../../config'

type UsePageNotificationsProps = {
  identity: AuthIdentity | undefined
  isConnected: boolean
  locale?: NotificationLocale
}

type UsePageNotificationsResult = {
  notificationProps: NotificationsProps | undefined
}

function usePageNotifications(props: UsePageNotificationsProps): UsePageNotificationsResult {
  const { identity, isConnected, locale = 'en' } = props

  const isNotificationsEnabled = Boolean(identity && isConnected)
  const [isPollingEnabled, setIsPollingEnabled] = useState(true)
  const notificationsUrl =
    getEnv('NOTIFICATIONS_API_URL') ?? 'https://notifications.decentraland.org'

  useEffect(() => {
    if (!isNotificationsEnabled) {
      setIsPollingEnabled(true)
    }
  }, [isNotificationsEnabled])

  const handleNotificationsError = useCallback(() => {
    if (isNotificationsEnabled) {
      setIsPollingEnabled(prevState => (prevState ? false : prevState))
    }
  }, [isNotificationsEnabled])

  const {
    notifications,
    isLoading,
    isModalOpen,
    isNotificationsOnboarding,
    modalActiveTab,
    handleNotificationsOpen: handleNotificationsOpenInternal,
    handleOnBegin,
    handleOnChangeModalTab
  } = useNotifications({
    identity: identity ?? undefined,
    isNotificationsEnabled: isNotificationsEnabled && isPollingEnabled,
    initialActiveTab: NotificationActiveTab.NEWEST,
    notificationsUrl,
    onError: handleNotificationsError
  })

  const handleNotificationsOpen = useCallback(() => {
    if (!isPollingEnabled) {
      setIsPollingEnabled(true)
    }
    handleNotificationsOpenInternal()
  }, [handleNotificationsOpenInternal, isPollingEnabled])

  const handleChangeTab = useCallback(
    (_: unknown, tab: NotificationActiveTab) => {
      handleOnChangeModalTab(tab)
    },
    [handleOnChangeModalTab]
  )

  const renderProfile = useCallback(
    (profileAddress: string) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Profile address={profileAddress} size="normal" imageOnly />
        {dclAddressUtils.shorten(profileAddress)}
      </div>
    ),
    []
  )

  const notificationProps = useMemo<NotificationsProps | undefined>(() => {
    if (!isNotificationsEnabled) {
      return undefined
    }

    return {
      locale,
      isLoading,
      isOnboarding: isNotificationsOnboarding,
      isOpen: isModalOpen,
      items: notifications,
      activeTab: modalActiveTab as NotificationActiveTab,
      onClick: handleNotificationsOpen,
      onClose: handleNotificationsOpen,
      onBegin: handleOnBegin,
      onChangeTab: handleChangeTab,
      renderProfile
    }
  }, [
    isNotificationsEnabled,
    locale,
    isLoading,
    isNotificationsOnboarding,
    isModalOpen,
    notifications,
    modalActiveTab,
    handleNotificationsOpen,
    handleOnBegin,
    handleChangeTab,
    renderProfile
  ])

  return { notificationProps }
}

export { usePageNotifications }
export type { UsePageNotificationsProps, UsePageNotificationsResult }
