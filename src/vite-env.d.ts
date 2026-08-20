/// <reference types="vite/client" />

interface Window {
  umami?: { track: (name: string, data?: Record<string, string | number>) => void }
}
