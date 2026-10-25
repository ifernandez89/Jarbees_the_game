import { useState, useEffect } from 'react'

/**
 * Detecta si la aplicación se ejecuta en un entorno de desarrollo local (localhost / 127.0.0.1)
 * o en un despliegue web público como GitHub Pages (ifernandez89.github.io).
 */
export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV !== 'production'
  }
  const { hostname } = window.location
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  )
}

/**
 * Hook de React para renderizado condicional en UI sin desajustes de hidratación SSR.
 * Inicia en false (coincidiendo con el SSR y GitHub Pages seguro) y actualiza tras el montaje en cliente.
 */
export function useIsLocal(): boolean {
  const [isLocal, setIsLocal] = useState<boolean>(false)

  useEffect(() => {
    setIsLocal(isLocalEnvironment())
  }, [])

  return isLocal
}
