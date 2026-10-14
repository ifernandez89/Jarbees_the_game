/**
 * Utilidad para detectar si el usuario está en un dispositivo móvil o táctil
 */

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || ''
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return isMobileUA || (hasTouch && window.innerWidth <= 1024)
}

export function isTouchScreen(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
