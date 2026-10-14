'use client'

import { useEffect } from 'react'
import { getAssetPath } from '@/utils/assetPath'

export function RegisterSW() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar Service Worker con ruta adaptable a GitHub Pages y localhost
      const swUrl = getAssetPath('/sw.js')
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log('✅ JarBees PWA Service Worker activo en:', reg.scope)
        })
        .catch((err) => {
          console.warn('Nota sobre registro de Service Worker:', err)
        })
    }
  }, [])

  return null
}
