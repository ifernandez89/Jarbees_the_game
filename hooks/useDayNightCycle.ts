import { useGameStore } from '@/store/gameStore'

export interface TimeOfDay {
  hours: number        // 0-23
  minutes: number      // 0-59
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'
  sunIntensity: number // 0-1.5
  moonIntensity: number // 0-1
  starsOpacity: number // 0-1 (suavemente visible al atardecer y de noche)
  skyColor: string
  horizonColor: string
  fogDensity: number   // 0-1
}

const CYCLE_DURATION = 20 * 60 // 20 minutos reales = 24 horas del juego
const START_HOUR_OFFSET = 10   // Comienza a las 10:00 AM (día soleado brillante)

interface SkyKeyframe {
  hour: number
  skyColor: string
  horizonColor: string
  sunIntensity: number
  moonIntensity: number
  starsOpacity: number
  fogDensity: number
  period: TimeOfDay['timeOfDay']
}

// Keyframes continuos de 24 horas con transiciones cinematográficas
const SKY_TIMELINE: SkyKeyframe[] = [
  { hour: 0.0,  skyColor: '#050716', horizonColor: '#0b0f26', sunIntensity: 0.0,  moonIntensity: 0.8,  starsOpacity: 1.0,  fogDensity: 0.45, period: 'night' },
  { hour: 4.5,  skyColor: '#090c24', horizonColor: '#161434', sunIntensity: 0.0,  moonIntensity: 0.7,  starsOpacity: 0.95, fogDensity: 0.50, period: 'night' },
  { hour: 5.5,  skyColor: '#171c48', horizonColor: '#4f254b', sunIntensity: 0.15, moonIntensity: 0.4,  starsOpacity: 0.65, fogDensity: 0.52, period: 'dawn' },
  { hour: 6.3,  skyColor: '#305c96', horizonColor: '#e0763c', sunIntensity: 0.55, moonIntensity: 0.1,  starsOpacity: 0.20, fogDensity: 0.46, period: 'dawn' },
  { hour: 7.2,  skyColor: '#4e8dce', horizonColor: '#ffd478', sunIntensity: 0.85, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.38, period: 'day' },
  { hour: 9.0,  skyColor: '#5aa2f0', horizonColor: '#bee2fd', sunIntensity: 1.10, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.30, period: 'day' },
  { hour: 13.0, skyColor: '#549be6', horizonColor: '#b4ddfb', sunIntensity: 1.25, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.25, period: 'day' },
  { hour: 17.0, skyColor: '#4e8ed6', horizonColor: '#cee2f7', sunIntensity: 1.00, moonIntensity: 0.0,  starsOpacity: 0.0,  fogDensity: 0.28, period: 'day' },
  { hour: 18.2, skyColor: '#3d5c9c', horizonColor: '#f1883c', sunIntensity: 0.70, moonIntensity: 0.05, starsOpacity: 0.10, fogDensity: 0.35, period: 'dusk' },
  { hour: 19.3, skyColor: '#242354', horizonColor: '#bb4740', sunIntensity: 0.28, moonIntensity: 0.25, starsOpacity: 0.40, fogDensity: 0.42, period: 'dusk' },
  { hour: 20.5, skyColor: '#101236', horizonColor: '#2b1b46', sunIntensity: 0.05, moonIntensity: 0.55, starsOpacity: 0.75, fogDensity: 0.46, period: 'night' },
  { hour: 22.0, skyColor: '#050716', horizonColor: '#0b0f26', sunIntensity: 0.0,  moonIntensity: 0.8,  starsOpacity: 1.0,  fogDensity: 0.45, period: 'night' },
  { hour: 24.0, skyColor: '#050716', horizonColor: '#0b0f26', sunIntensity: 0.0,  moonIntensity: 0.8,  starsOpacity: 1.0,  fogDensity: 0.45, period: 'night' },
]

export function useDayNightCycle(
  enabled = true,
  speed = 1
) {
  const gameTime = useGameStore((state) => state.gameTime)

  const getTimeOfDay = (time: number): TimeOfDay => {
    if (!enabled) {
      return {
        hours: 12,
        minutes: 0,
        timeOfDay: 'day',
        sunIntensity: 1.1,
        moonIntensity: 0,
        starsOpacity: 0,
        skyColor: '#5aa2f0',
        horizonColor: '#bee2fd',
        fogDensity: 0.28,
      }
    }

    // Progreso continuo del ciclo con offset de inicio a las 10:00 AM
    const offsetSeconds = CYCLE_DURATION * (START_HOUR_OFFSET / 24)
    const cycleProgress = (((time * speed) + offsetSeconds) % CYCLE_DURATION) / CYCLE_DURATION

    const totalHours = cycleProgress * 24
    const hours = Math.floor(totalHours)
    const minutes = Math.floor((totalHours % 1) * 60)

    // Interpolar continuamente entre keyframes de la línea temporal
    let kfPrev = SKY_TIMELINE[0]
    let kfNext = SKY_TIMELINE[1]

    for (let i = 0; i < SKY_TIMELINE.length - 1; i++) {
      if (totalHours >= SKY_TIMELINE[i].hour && totalHours <= SKY_TIMELINE[i + 1].hour) {
        kfPrev = SKY_TIMELINE[i]
        kfNext = SKY_TIMELINE[i + 1]
        break
      }
    }

    // Progreso suave entre ambos keyframes (curva coseno para máxima fluidez)
    const span = kfNext.hour - kfPrev.hour
    const linearT = span > 0 ? (totalHours - kfPrev.hour) / span : 0
    // Smoothstep / cosine easing:
    const t = (1 - Math.cos(linearT * Math.PI)) / 2

    const skyColor = interpolateColor(kfPrev.skyColor, kfNext.skyColor, t)
    const horizonColor = interpolateColor(kfPrev.horizonColor, kfNext.horizonColor, t)
    const sunIntensity = kfPrev.sunIntensity + (kfNext.sunIntensity - kfPrev.sunIntensity) * t
    const moonIntensity = kfPrev.moonIntensity + (kfNext.moonIntensity - kfPrev.moonIntensity) * t
    const starsOpacity = kfPrev.starsOpacity + (kfNext.starsOpacity - kfPrev.starsOpacity) * t
    const fogDensity = kfPrev.fogDensity + (kfNext.fogDensity - kfPrev.fogDensity) * t

    // Período dominante
    const timeOfDay = t < 0.5 ? kfPrev.period : kfNext.period

    return {
      hours,
      minutes,
      timeOfDay,
      sunIntensity,
      moonIntensity,
      starsOpacity,
      skyColor,
      horizonColor,
      fogDensity,
    }
  }

  return getTimeOfDay(gameTime)
}

/**
 * Posición realista del sol en la bóveda celeste
 */
export function getSunPosition(timeOfDay: TimeOfDay): [number, number, number] {
  const { hours, minutes } = timeOfDay
  const totalHours = hours + minutes / 60

  // 12:00 = Cenit (+Y), 06:00 = Este (+X), 18:00 = Oeste (-X)
  const angle = ((totalHours - 6) / 24) * Math.PI * 2
  const distance = 380

  const x = -Math.cos(angle) * distance
  const y = Math.sin(angle) * distance
  const z = -Math.sin(angle * 0.5) * 80

  return [x, y, z]
}

/**
 * Posición de la luna (opuesta al sol en la bóveda)
 */
export function getMoonPosition(timeOfDay: TimeOfDay): [number, number, number] {
  const [sunX, sunY, sunZ] = getSunPosition(timeOfDay)
  // Exactamente en el polo opuesto
  return [-sunX, -sunY, -sunZ]
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
