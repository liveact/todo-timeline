const UMAMI_URL = import.meta.env.VITE_UMAMI_URL
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID

type EventName = 'task_create' | 'task_complete'

let initialized = false

export function initAnalytics() {
  if (!UMAMI_URL || !WEBSITE_ID || initialized) return
  initialized = true

  const script = document.createElement('script')
  script.defer = true
  script.src = UMAMI_URL
  script.dataset.websiteId = WEBSITE_ID
  document.head.appendChild(script)
}

export function trackEvent(name: EventName, data?: Record<string, string | number>) {
  if (!UMAMI_URL || !WEBSITE_ID) return
  try {
    window.umami?.track(name, data)
  } catch {
    // noop
  }
}
