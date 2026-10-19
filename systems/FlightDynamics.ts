/**
 * JARBEES FLIGHT SYSTEM — FlightDynamics
 * ---------------------------------------------------------------------------
 * Motor de dinámica de vuelo de la Armadura JarBees (BEE-01 Vesper).
 *
 * Es un módulo PURO (sin React ni Three.js): recibe entradas del piloto y
 * devuelve velocidad, Mach, energía, temperatura y carga G. De esta forma la
 * simulación es independiente del controlador de animaciones y del aspecto del
 * traje: se puede cambiar el modelo 3D sin romper la física.
 *
 * Modelo físico simplificado (cifras de DISEÑO del juego, no límites reales):
 *
 *   F_D = ½ · ρ · v² · C_D·A · k_onda(M) · k_aerofreno     (resistencia)
 *   a   = (F_empuje − F_D) / m                              (aceleración)
 *
 * - ρ y la velocidad del sonido siguen la atmósfera estándar ISA.
 * - k_onda(M) modela la resistencia de onda: crece fuerte cerca de Mach 1
 *   (zona crítica) y decae en régimen supersónico.
 * - El postquemador entrega mucho más empuje a medida que aumenta el Mach
 *   (necesario para cruzar la barrera del sonido) pero consume energía y
 *   calienta el núcleo del traje.
 */

export type FlightMode = 'assist' | 'sim'
export type FlightRegime = 'hover' | 'cruise' | 'high' | 'transonic' | 'supersonic'

export const FLIGHT_REGIME_ORDER: FlightRegime[] = ['hover', 'cruise', 'high', 'transonic', 'supersonic']

/** Entradas del piloto para un paso de simulación */
export interface FlightInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  boost: boolean
}

/** Estado compartido de solo lectura para efectos 60 Hz (cámara, audio, partículas) */
export interface FlightRuntime {
  active: boolean
  /** Velocidad aerodinámica total (m/s) */
  speed: number
  /** Componente de velocidad en la dirección de rumbo (m/s, con signo) */
  forwardSpeed: number
  vx: number
  vy: number
  vz: number
  mach: number
  speedKmh: number
  regime: FlightRegime
  /** 0..1 palanca de empuje */
  throttle: number
  /** 0..1 nivel de postquemador (con retardo de encendido) */
  afterburner: number
  /** 0..1 aerofreno */
  brake: number
  /** 0..100 */
  energy: number
  /** 0..100 */
  heat: number
  gLoad: number
  overheated: boolean
  lowEnergy: boolean
  /** 0..1 intensidad de vibración (buffet transónico, postquemador, estampido) */
  shake: number
  /** 0..1 factor de alejamiento de cámara por velocidad */
  camPull: number
  /** Grados extra de FOV por velocidad */
  fovBoost: number
  /** Se incrementa en cada estampido sónico (cruce de Mach 1 o estela supersónica) */
  boomSeq: number
  /** Intensidad del último estampido (1 = cruce de Mach 1, <1 = estela sostenida) */
  boomIntensity: number
  /** 0..100 empuje efectivo mostrado en HUD */
  thrustPct: number
}

export const flightRuntime: FlightRuntime = {
  active: false,
  speed: 0,
  forwardSpeed: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  mach: 0,
  speedKmh: 0,
  regime: 'hover',
  throttle: 0,
  afterburner: 0,
  brake: 0,
  energy: 100,
  heat: 10,
  gLoad: 1,
  overheated: false,
  lowEnergy: false,
  shake: 0,
  camPull: 0,
  fovBoost: 0,
  boomSeq: 0,
  boomIntensity: 0,
  thrustPct: 0,
}

// ---------------------------------------------------------------------------
// Constantes de diseño del traje
// ---------------------------------------------------------------------------
const G = 9.81
const MASS = 92 // kg (Aleación Titanio Frío / Polímeros de Colmena)
// Masa dinámica efectiva: 92 kg del traje + campo inercial del Hex-Core. Suaviza las aceleraciones
// manteniendo intactas las velocidades terminales (que dependen sólo de empuje/resistencia).
const INERTIA = 1.6
const EFFECTIVE_MASS = MASS * INERTIA
const CDA = 0.06 // m² · C_D efectivo (cuerpo "acostado" tipo torpedo)
const RHO0 = 1.225 // kg/m³ a nivel del mar
const THRUST_NORMAL = 3600 // N — empuje máximo sin postquemador
const THRUST_AB_BASE = 8000 // N — postquemador a baja velocidad
const THRUST_AB_GAIN = 2.6 // multiplicador adicional a partir de Mach 0.6 → 1.4
const REVERSE_THRUST = 3200 // N — empuje inverso con aerofreno
const REVERSE_MAX_SPEED = 16 // m/s máxima marcha atrás
const VERTICAL_MAX = 30.8 // m/s ascenso (≈ 2.2 × 14 m/s)
const ENERGY_MIN_FOR_AB = 2

/** Límites de régimen en km/h (hover < 30 < crucero < 250 < alta < 800 < transónico < Mach 1) */
export const REGIME_LIMITS_KMH = { hover: 30, cruise: 250, high: 800 }

// ---------------------------------------------------------------------------
// Utilidades matemáticas
// ---------------------------------------------------------------------------
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(target, current + maxDelta)
  return Math.max(target, current - maxDelta)
}

/** Pulso triangular: 0 en lo y hi, 1 en peak */
function bump(x: number, lo: number, peak: number, hi: number): number {
  if (x <= lo || x >= hi) return 0
  return x < peak ? (x - lo) / (peak - lo) : (hi - x) / (hi - peak)
}

// ---------------------------------------------------------------------------
// Atmósfera estándar (ISA, troposfera)
// ---------------------------------------------------------------------------
export function airDensity(altitude: number): number {
  const h = Math.max(0, altitude)
  return RHO0 * Math.pow(Math.max(0.2, 1 - 2.25577e-5 * h), 4.25588)
}

export function speedOfSound(altitude: number): number {
  const h = Math.max(0, altitude)
  const temp = 288.15 - 0.0065 * h
  return 340.29 * Math.sqrt(temp / 288.15)
}

/** Resistencia de onda: pico cerca de Mach 1.05 y decaimiento supersónico */
export function waveDragMultiplier(mach: number): number {
  if (mach < 0.75) return 1
  if (mach < 1.05) {
    const t = (mach - 0.75) / 0.3
    return 1 + 1.4 * (t * t * (3 - 2 * t))
  }
  return 1.15 + 1.25 * Math.exp(-(mach - 1.05) * 1.6)
}

/** Empuje disponible (N) según Mach y postquemador */
export function availableThrust(mach: number, afterburner: number, throttle: number): number {
  const abThrust = THRUST_AB_BASE * (1 + THRUST_AB_GAIN * smoothstep(0.6, 1.4, mach))
  return THRUST_NORMAL * throttle * (1 - afterburner) + abThrust * afterburner
}

export function getRegime(speedKmh: number, mach: number): FlightRegime {
  if (mach >= 1) return 'supersonic'
  if (speedKmh >= REGIME_LIMITS_KMH.high) return 'transonic'
  if (speedKmh >= REGIME_LIMITS_KMH.cruise) return 'high'
  if (speedKmh >= REGIME_LIMITS_KMH.hover) return 'cruise'
  return 'hover'
}

// ---------------------------------------------------------------------------
// Motor de vuelo
// ---------------------------------------------------------------------------
export class FlightDynamics {
  // Velocidad vectorial en el mundo (m/s)
  vx = 0
  vy = 0
  vz = 0

  // Actuadores con inercia
  throttle = 0
  brake = 0
  afterburner = 0
  yawRate = 0

  // Presupuestos
  energy = 100
  heat = 10
  overheated = false

  // Telemetría derivada
  gLoad = 1
  mach = 0
  speed = 0
  forwardSpeed = 0
  regime: FlightRegime = 'hover'
  shake = 0
  boomSeq = 0
  boomIntensity = 0

  private supersonicLatch = false
  private boomCooldown = 0
  private carpetTimer = 0
  private boomImpulse = 0

  reset(): void {
    this.vx = 0
    this.vy = 0
    this.vz = 0
    this.throttle = 0
    this.brake = 0
    this.afterburner = 0
    this.yawRate = 0
    this.energy = 100
    this.heat = 10
    this.overheated = false
    this.gLoad = 1
    this.mach = 0
    this.speed = 0
    this.forwardSpeed = 0
    this.regime = 'hover'
    this.shake = 0
    this.supersonicLatch = false
    this.boomCooldown = 0
    this.carpetTimer = 0
    this.boomImpulse = 0
    flightRuntime.active = false
  }

  /**
   * Avanza la simulación `dt` segundos.
   * @param heading  Rumbo (rotación Y del jugador, rad). Adelante = (-sin, 0, -cos)
   * @param altitude Altitud actual en metros (densidad y velocidad del sonido)
   * @returns yawDelta: variación de rumbo (rad) que el llamador debe aplicar
   */
  step(dt: number, input: FlightInput, heading: number, altitude: number, mode: FlightMode): { yawDelta: number } {
    const assist = mode === 'assist'

    // Descomposición de la velocidad horizontal respecto del rumbo
    const fx = -Math.sin(heading)
    const fz = -Math.cos(heading)
    const rx = Math.cos(heading)
    const rz = -Math.sin(heading)
    let vf = this.vx * fx + this.vz * fz
    let vl = this.vx * rx + this.vz * rz

    const vh = Math.hypot(vf, vl)
    const airspeed = Math.sqrt(vh * vh + this.vy * this.vy)
    const sound = speedOfSound(altitude)
    const mach = airspeed / sound
    const rho = airDensity(altitude)

    // --- Estados de energía y térmicos ------------------------------------
    const noEnergy = this.energy <= 0.5
    if (this.heat >= 100) this.overheated = true
    else if (this.heat < 70) this.overheated = false

    // --- Actuadores con inercia -------------------------------------------
    const throttleTarget = input.forward ? 1 : 0
    this.throttle = approach(this.throttle, throttleTarget, (throttleTarget > this.throttle ? 1.6 : 1.2) * dt)

    const abAllowed = input.boost && this.energy > ENERGY_MIN_FOR_AB && !this.overheated
    const abTarget = abAllowed && this.throttle > 0.15 ? 1 : 0
    this.afterburner = approach(this.afterburner, abTarget, (abTarget > this.afterburner ? 0.8 : 2.5) * dt)

    this.brake = approach(this.brake, input.backward ? 1 : 0, 4 * dt)

    // --- Empuje -----------------------------------------------------------
    let thrust = availableThrust(mach, this.afterburner, this.throttle)
    if (noEnergy) thrust *= 0.3
    if (this.overheated) thrust *= 0.55
    if (!assist) thrust *= 1 - 0.35 * smoothstep(85, 100, this.heat)

    // --- Resistencia aerodinámica -----------------------------------------
    const brakeMul = 1 + 1.6 * this.brake
    const dragN = 0.5 * rho * airspeed * airspeed * CDA * waveDragMultiplier(mach) * brakeMul
    const dragAccel = dragN / EFFECTIVE_MASS

    const vfBefore = vf
    const safeAir = Math.max(airspeed, 0.001)

    // Aceleración longitudinal neta (empuje − resistencia). El limitador de carga G actúa sobre la
    // aceleración NETA, de modo que nunca altera la velocidad terminal (donde la neta es ≈ 0).
    let aForward = thrust / EFFECTIVE_MASS
    if (vf > -REVERSE_MAX_SPEED) aForward -= (REVERSE_THRUST * this.brake) / EFFECTIVE_MASS
    const accelCap = (assist ? 8 : 12) * G
    const decelCap = (assist ? 6 : 10) * G
    const aNetForward = clamp(aForward - dragAccel * (vf / safeAir), -decelCap, accelCap)

    vf += aNetForward * dt
    vl -= dragAccel * (vl / safeAir) * dt

    // Asistencia de estabilidad: detiene de forma gradual (nunca instantánea)
    if (assist) {
      if (!input.forward && !input.backward) {
        const aAssist = Math.min(Math.abs(vf) * 0.8, 25)
        const dv = aAssist * dt
        if (Math.abs(vf) <= dv) vf = 0
        else vf -= Math.sign(vf) * dv
      }
    } else if (!input.forward) {
      // Simulación: sólo un amortiguamiento residual casi imperceptible a baja velocidad
      vf -= vf * 0.12 * dt
    }

    // Alineación velocidad ↔ rumbo (deslizamiento lateral): más "derrape" en simulación
    const alignK = assist ? 3.5 : 0.9 / (1 + 0.4 * mach)
    vl *= Math.exp(-alignK * dt)

    vf = Math.max(vf, -REVERSE_MAX_SPEED)

    // --- Vertical ---------------------------------------------------------
    const climbMul = 1 + 0.8 * this.afterburner
    let vyTarget = 0
    if (input.up) vyTarget += VERTICAL_MAX * climbMul
    if (input.down) vyTarget -= VERTICAL_MAX * 0.85 * climbMul
    if (!input.up && !input.down && noEnergy) vyTarget = -9 // sin energía: la sustentación asistida falla
    if (input.up && noEnergy) vyTarget *= 0.3
    this.vy += (vyTarget - this.vy) * (1 - Math.exp(-(assist ? 4.0 : 2.2) * dt))

    // --- Guiñada con autoridad dependiente de la velocidad ----------------
    const sp = Math.hypot(vf, vl)
    const vRef = assist ? 110 : 80
    const floor = assist ? 0.2 : 0.08
    const authority = Math.max(floor, 1 / (1 + (sp / vRef) * (sp / vRef)))
    const yawTarget = ((input.left ? 1 : 0) - (input.right ? 1 : 0)) * 2.8 * authority
    this.yawRate += (yawTarget - this.yawRate) * (1 - Math.exp(-(assist ? 8 : 3.5) * dt))
    const yawDelta = this.yawRate * dt

    // --- Recomposición en ejes del mundo ----------------------------------
    this.vx = vf * fx + vl * rx
    this.vz = vf * fz + vl * rz
    this.forwardSpeed = vf

    // --- Energía ----------------------------------------------------------
    const drain =
      0.5 * this.throttle +
      3.8 * this.afterburner +
      (input.up || input.down ? 0.5 : 0) +
      (assist ? 0 : 0.2)
    const regen = this.throttle < 0.15 && this.afterburner < 0.05 ? (assist ? 4 : 3) : 0
    this.energy = clamp(this.energy + (regen - drain) * dt, 0, 100)

    // --- Temperatura del núcleo -------------------------------------------
    const heatIn = 1.0 * mach * mach * mach * (rho / RHO0) + 0.6 * this.throttle + 6 * this.afterburner
    const cooling = 2.0 + 0.012 * airspeed + (this.throttle < 0.05 ? 1.5 : 0)
    this.heat = clamp(this.heat + (heatIn - cooling) * dt, 10, 100)

    // --- Carga G ----------------------------------------------------------
    const aNet = dt > 0 ? (vf - vfBefore) / dt : 0
    const aLat = sp * Math.abs(this.yawRate)
    const gInst = Math.sqrt(1 + (aNet / G) * (aNet / G) + (aLat / G) * (aLat / G))
    this.gLoad += (gInst - this.gLoad) * (1 - Math.exp(-6 * dt))

    // --- Velocidad final y Mach -------------------------------------------
    const vhNow = Math.hypot(this.vx, this.vz)
    this.speed = Math.sqrt(vhNow * vhNow + this.vy * this.vy)
    this.mach = this.speed / sound
    const speedKmh = this.speed * 3.6
    this.regime = getRegime(speedKmh, this.mach)

    // --- Estampido sónico -------------------------------------------------
    this.boomCooldown = Math.max(0, this.boomCooldown - dt)
    if (this.mach >= 1 && !this.supersonicLatch && this.boomCooldown <= 0) {
      this.supersonicLatch = true
      this.boomCooldown = 3
      this.boomSeq += 1
      this.boomIntensity = 1
      this.boomImpulse = 1
      this.carpetTimer = 0
    }
    if (this.mach < 0.95) this.supersonicLatch = false

    // Estela supersónica sostenida: evento espacial limitado en frecuencia (≥ 7 s)
    if (this.mach > 1.1) {
      this.carpetTimer += dt
      if (this.carpetTimer >= 7) {
        this.carpetTimer = 0
        this.boomSeq += 1
        this.boomIntensity = 0.35
      }
    } else {
      this.carpetTimer = 0
    }
    this.boomImpulse *= Math.exp(-dt / 0.7)

    // --- Respuesta de cámara/vibración ------------------------------------
    const buffet = 0.5 * bump(this.mach, 0.7, 0.88, 1.02) // buffet transónico (se calma al cruzar Mach 1)
    const supersonicHum = 0.1 * smoothstep(1.15, 2.5, this.mach)
    this.shake = clamp(
      (buffet + supersonicHum + 0.08 * this.afterburner) * (assist ? 0.7 : 1) + 0.8 * this.boomImpulse,
      0,
      1
    )

    this.publish()
    return { yawDelta }
  }

  /** Publica el estado en el objeto compartido para efectos a 60 Hz */
  private publish(): void {
    const rt = flightRuntime
    rt.speed = this.speed
    rt.forwardSpeed = this.forwardSpeed
    rt.vx = this.vx
    rt.vy = this.vy
    rt.vz = this.vz
    rt.mach = this.mach
    rt.speedKmh = this.speed * 3.6
    rt.regime = this.regime
    rt.throttle = this.throttle
    rt.afterburner = this.afterburner
    rt.brake = this.brake
    rt.energy = this.energy
    rt.heat = this.heat
    rt.gLoad = this.gLoad
    rt.overheated = this.overheated
    rt.lowEnergy = this.energy <= 15
    rt.shake = this.shake
    rt.camPull = smoothstep(20, 340, this.speed)
    rt.fovBoost = clamp(
      3 + 14 * smoothstep(30, 300, this.speed) + 8 * smoothstep(1.0, 2.0, this.mach) + 10 * this.boomImpulse,
      0,
      32
    )
    rt.boomSeq = this.boomSeq
    rt.boomIntensity = this.boomIntensity
    rt.thrustPct = Math.round((this.throttle * (1 - this.afterburner) * 0.4 + this.afterburner) * 100)
    rt.active = true
  }
}

/** Devuelve el objeto compartido a su estado en reposo (al cambiar de personaje) */
export function resetFlightRuntime(): void {
  flightRuntime.active = false
  flightRuntime.speed = 0
  flightRuntime.forwardSpeed = 0
  flightRuntime.vx = 0
  flightRuntime.vy = 0
  flightRuntime.vz = 0
  flightRuntime.mach = 0
  flightRuntime.speedKmh = 0
  flightRuntime.throttle = 0
  flightRuntime.afterburner = 0
  flightRuntime.brake = 0
  flightRuntime.shake = 0
  flightRuntime.camPull = 0
  flightRuntime.fovBoost = 0
}
