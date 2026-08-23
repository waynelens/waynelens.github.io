type SiteToastState = {
  id: number
  message: string
  visible: boolean
}

let dismissTimer: ReturnType<typeof setTimeout> | undefined

export const useSiteToast = () => {
  const toast = useState<SiteToastState>('site-toast', () => ({
    id: 0,
    message: '',
    visible: false
  }))

  const dismissToast = () => {
    toast.value.visible = false
  }

  const showToast = (message: string, duration = 3200) => {
    if (dismissTimer) clearTimeout(dismissTimer)

    toast.value = {
      id: toast.value.id + 1,
      message,
      visible: true
    }

    if (import.meta.client) {
      dismissTimer = setTimeout(dismissToast, duration)
    }
  }

  return {
    dismissToast,
    showToast,
    toast
  }
}
