import { useGameStore } from '@/store/gameStore'

export interface TimeOfDay {
  hours: number        // 0-23
  minutes: number      // 0-59
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'
  sunIntensity: number // 0-1.5
  moonIntensity: number // 0-1
  starsOpacity: number // 0-1
  skyColor: string
  horizonColor: string
  ambientColor: string
  ambientIntensity: number
  fogDensity: number   // 0-1
}

// 12 minutos reales = 24 horas del juego (ciclo dinámico y visible sin esperas excesivas)
const CYCLE_DURATION = 12 * 60 
const START_HOUR_OFFSET = 10.0 // Comienza a las 10:00 AM (mañana luminosa)

interface SkyKeyframe {
  hour: number
  skyColor: string
  horizonColor: string
  ambientColor: string
  ambientIntensity: number
  sunIntensity: number
  moonIntensity: number
  starsOpacity: number
  fogDensity: number
  period: TimeOfDay['timeOfDay']
}

// Keyframes continuos de 24 horas con balance de color cinematográfico
const SKY_TIMELINE: SkyKeyframe[] = [
  // Medianoche profunda (00:00)
  { hour: 0.0,  skyColor: '#050716', horizonColor: '#0b0f26', ambientColor: '#121838', ambientIntensity: 0.12, sunIntensity: 0.0,  moonIntensity: 0.85, starsOpacity: 1.0,  fogDensity: 0.42, period: 'night' },
  // Madrugada estrellada (04:30)
  { hour: 4.5,  skyColor: '#080a22', horizonColor: '#141432', ambientColor: '#141a3a', ambientIntensity: 0.13, sunIntensity: 0.0,  moonIntensity: 0.75, starsOpacity: 0.95, fogDensity: 0.45, period: 'night' },
  // Primer resplandor del alba (05:30)
  { hour: 5.5,  skyColor: '#161945', horizonColor: '#4f244b', ambientColor: '#2b2342', ambientIntensity: 0.22, sunIntensity: 0.15, moonIntensity: 0.35, starsOpacity: 0.55, fogDensity: 0.48, period: 'dawn' },
  // Amanecer dorado sobre las cumbres (06:30)
  { hour: 6.5,  skyColor: '#2b558f', horizonColor: '#f3823f', ambientColor: '#6e4530', ambientIntensity: 0.48, sunIntensity: 0.65, moonIntensity: 0.05, starsOpacity: 0.15, fogDensity: 0.38, period: 'dawn' },
  // Mañana soleada (08:00)
  { hour: 8.0,  skyColor: '#4a8ece', horizonColor: '#f7d382', ambientColor: '#8a7d60', ambientIntensity: 0.75, sunIntensity: 0.95, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.30, period: 'day' },
  // Mediodía radiante (12:00)
  { hour: 12.0, skyColor: '#4892e6', horizonColor: '#bde0ff', ambientColor: '#96a7b8', ambientIntensity: 0.90, sunIntensity: 1.25, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.22, period: 'day' },
  // Tarde despejada (16:00)
  { hour: 16.0, skyColor: '#468ad4', horizonColor: '#c5e2fc', ambientColor: '#929fae', ambientIntensity: 0.85, sunIntensity: 1.10, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.24, period: 'day' },
  // Atardecer dorado / hora dorada (18:00)
  { hour: 18.0, skyColor: '#395394', horizonColor: '#f78d38', ambientColor: '#7a4e32', ambientIntensity: 0.60, sunIntensity: 0.75, moonIntensity: 0.05, starsOpacity: 0.10, fogDensity: 0.32, period: 'dusk' },
  // Puesta de sol rojiza y crepúsculo (19:15)
  { hour: 19.25, skyColor: '#222350', horizonColor: '#c84439', ambientColor: '#4d2d38', ambientIntensity: 0.35, sunIntensity: 0.25, moonIntensity: 0.30, starsOpacity: 0.45, fogDensity: 0.38, period: 'dusk' },
  // Anochecer azul índigo (20:30)
  { hour: 20.5, skyColor: '#0e1132', horizonColor: '#271a42', ambientColor: '#1d1a36', ambientIntensity: 0.18, sunIntensity: 0.02, moonIntensity: 0.65, starsOpacity: 0.80, fogDensity: 0.42, period: 'night' },
  // Noche plena (22:00)
  { hour: 22.0, skyColor: '#050716', horizonColor: '#0b0f26', ambientColor: '#121838', ambientIntensity: 0.12, sunIntensity: 0.0,  moonIntensity: 0.85, starsOpacity: 1.0,  fogDensity: 0.42, period: 'night' },
  // Cierre de ciclo 24:00 (mismo que 00:00)
  { hour: 24.0, skyColor: '#050716', horizonColor: '#0b0f26', ambientColor: '#121838', ambientIntensity: 0.12, sunIntensity: 0.0,  moonIntensity: 0.85, starsOpacity: 1.0,  fogDensity: 0.42, period: 'night' },
]

export function useDayNightCycle(
  enabledProp?: boolean,
  speedProp?: number
) {
  const storeEnabled = useGameStore((state) => state.dayNightEnabled)
  const storeSpeed = useGameStore((state) => state.dayNightSpeed)
  const enabled = enabledProp !== undefined ? enabledProp : storeEnabled
  const speed = speedProp !== undefined ? speedProp : storeSpeed
  const gameTime = useGameStore((state) => state.gameTime)

  const getTimeOfDay = (time: number): TimeOfDay => {
    if (!enabled) {
      return {
        hours: 12,
        minutes: 0,
        timeOfDay: 'day',
        sunIntensity: 1.15,
        moonIntensity: 0,
        starsOpacity: 0,
        skyColor: '#4892e6',
        horizonColor: '#bde0ff',
        ambientColor: '#96a7b8',
        ambientIntensity: 0.85,
        fogDensity: 0.25,
      }
    }

    // Progreso continuo del ciclo con offset inicial
    const offsetSeconds = CYCLE_DURATION * (START_HOUR_OFFSET / 24)
    const cycleProgress = (((time * speed) + offsetSeconds) % CYCLE_DURATION) / CYCLE_DURATION

    const totalHours = cycleProgress * 24
    const hours = Math.floor(totalHours)
    const minutes = Math.floor((totalHours % 1) * 60)

    // Encontrar el intervalo en la línea temporal
    let kfPrev = SKY_TIMELINE[0]
    let kfNext = SKY_TIMELINE[1]

    for (let i = 0; i < SKY_TIMELINE.length - 1; i++) {
      if (totalHours >= SKY_TIMELINE[i].hour && totalHours <= SKY_TIMELINE[i + 1].hour) {
        kfPrev = SKY_TIMELINE[i]
        kfNext = SKY_TIMELINE[i + 1]
        break
      }
    }

    // Progreso suave entre keyframes (cosine easing)
    const span = kfNext.hour - kfPrev.hour
    const linearT = span > 0 ? (totalHours - kfPrev.hour) / span : 0
    const t = (1 - Math.cos(linearT * Math.PI)) / 2

    const skyColor = interpolateColor(kfPrev.skyColor, kfNext.skyColor, t)
    const horizonColor = interpolateColor(kfPrev.horizonColor, kfNext.horizonColor, t)
    const ambientColor = interpolateColor(kfPrev.ambientColor, kfNext.ambientColor, t)
    const ambientIntensity = kfPrev.ambientIntensity + (kfNext.ambientIntensity - kfPrev.ambientIntensity) * t
    const sunIntensity = kfPrev.sunIntensity + (kfNext.sunIntensity - kfPrev.sunIntensity) * t
    const moonIntensity = kfPrev.moonIntensity + (kfNext.moonIntensity - kfPrev.moonIntensity) * t
    const starsOpacity = kfPrev.starsOpacity + (kfNext.starsOpacity - kfPrev.starsOpacity) * t
    const fogDensity = kfPrev.fogDensity + (kfNext.fogDensity - kfPrev.fogDensity) * t

    const period = t < 0.5 ? kfPrev.period : kfNext.period

    return {
      hours,
      minutes,
      timeOfDay: period,
      sunIntensity,
      moonIntensity,
      starsOpacity,
      skyColor,
      horizonColor,
      ambientColor,
      ambientIntensity,
      fogDensity,
    }
  }

  return getTimeOfDay(gameTime)
}

/**
 * Trayectoria solar cinematográfica visible desde la cámara (orientada hacia el frente -Z)
 * Permite ver el amanecer al frente-izquierda, el mediodía alto al frente, y la puesta al frente-derecha.
 */
export function getSunPosition(timeOfDay: TimeOfDay): [number, number, number] {
  const { hours, minutes } = timeOfDay
  const totalHours = hours + minutes / 60

  // 06:00 = Amanecer (frente-izquierda), 12:00 = Mediodía (frente-arriba), 18:00 = Atardecer (frente-derecha)
  const angle = ((totalHours - 6) / 24) * Math.PI * 2
  const arcAzimuth = -Math.cos(angle)
  const arcElevation = Math.sin(angle)

  const x = arcAzimuth * 280
  const y = arcElevation * 220
  // Inclinado hacia el frente (-Z) para que la cámara en 3ra persona siempre encuadre el astro
  const z = -280 + Math.sin(angle) * 50

  return [x, y, z]
}

/**
 * Trayectoria lunar opuesta al sol
 */
export function getMoonPosition(timeOfDay: TimeOfDay): [number, number, number] {
  const { hours, minutes } = timeOfDay
  const totalHours = hours + minutes / 60

  // Opuesta al sol (fase de 12 horas)
  const angle = ((totalHours - 18) / 24) * Math.PI * 2
  const arcAzimuth = -Math.cos(angle)
  const arcElevation = Math.sin(angle)

  const x = arcAzimuth * 280
  const y = arcElevation * 210
  const z = -280 + Math.sin(angle) * 50

  return [x, y, z]
}

/**
 * Interpolar entre dos colores hexadecimales suavemente
 */
function interpolateColor(color1: string, color2: string, progress: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)

  if (!c1 || !c2) return color1

  const r = Math.round(c1.r + (c2.r - c1.r) * progress)
  const g = Math.round(c1.g + (c2.g - c1.g) * progress)
  const b = Math.round(c1.b + (c2.b - c1.b) * progress)

  return rgbToHex(r, g, b)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}
