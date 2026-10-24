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
export type FlightRegime = 'hover' | 'cruise' | 'high' | 'transonic' | 'supersonic' | 'hypersonic'

export const FLIGHT_REGIME_ORDER: FlightRegime[] = [
  'hover',
  'cruise',
  'high',
  'transonic',
  'supersonic',
  'hypersonic',
]

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

/** Estado compartido de solo lectura para efectos 60 Hz (cámara, audio, partículas, HUD) */
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
  /** 0..1 intensidad de la envoltura de control de flujo Fase Aurelium */
  aureliumPhase: number
  /** 0..1 incandescencia en bordes de ataque por calentamiento aerodinámico (Mach > 2.2) */
  thermalGlow: number
  /** 0..1 perturbación rasante sobre el suelo (polvo y agitación de vegetación) */
  dustKick: number
  /** Altitud sobre el terreno actual (m) */
  groundAltitude: number
  /** Indica si el sistema inteligente GCAS de JarBees está interviniendo de emergencia */
  gcasActive: boolean
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
  aureliumPhase: 0,
  thermalGlow: 0,
  dustKick: 0,
  groundAltitude: 10,
  gcasActive: false,
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
const CDA = 0.058 // m² · C_D efectivo (cuerpo "acostado" tipo torpedo)
const RHO0 = 1.225 // kg/m³ a nivel del mar (15 °C)
const THRUST_NORMAL = 3800 // N — empuje máximo sin postquemador (límite subsónico Mach ~0.83)
const THRUST_AB_BASE = 9000 // N — postquemador a baja velocidad
const THRUST_AB_GAIN = 3.2 // multiplicador adicional en régimen transónico y supersónico
const REVERSE_THRUST = 3400 // N — empuje inverso con aerofreno
const REVERSE_MAX_SPEED = 16 // m/s máxima marcha atrás
const VERTICAL_MAX = 32 // m/s ascenso
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
  return 340.29 * Math.sqrt(Math.max(0.4, temp / 288.15))
}

/**
 * Resistencia de onda:
 * En vuelo puramente atmosférico sube agresivamente a partir de Mach 0.75 (Mach crítico Mcr),
 * formando una barrera natural alrededor de Mach 0.83 - 0.85 con empuje normal.
 * La Fase Aurelium colapsa el arrastre de onda hasta un 72% al crear la envoltura de flujo ionizado.
 */
export function waveDragMultiplier(mach: number, aureliumPhase = 0): number {
  if (mach < 0.75) return 1
  let wave = 1
  if (mach < 1.05) {
    const t = (mach - 0.75) / 0.3
    wave = 1 + 2.2 * (t * t * (3 - 2 * t))
  } else {
    wave = 1.35 + 1.8 * Math.exp(-(mach - 1.05) * 1.4)
  }
  return 1 + (wave - 1) * (1 - 0.72 * aureliumPhase)
}

/** Empuje disponible (N) según Mach, postquemador y Fase Aurelium */
export function availableThrust(mach: number, afterburner: number, throttle: number, aureliumPhase = 0): number {
  const abThrust = THRUST_AB_BASE * (1 + THRUST_AB_GAIN * smoothstep(0.65, 1.4, mach))
  const aureliumBoost = 1 + 0.35 * aureliumPhase
  return (THRUST_NORMAL * throttle * (1 - afterburner) + abThrust * afterburner) * aureliumBoost
}

export function getRegime(speedKmh: number, mach: number): FlightRegime {
  if (mach >= 3) return 'hypersonic'
  if (mach >= 1) return 'supersonic'
  if (mach >= 0.75 || speedKmh >= REGIME_LIMITS_KMH.high) return 'transonic'
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

  // Sistemas avanzados de alta velocidad y entorno
  aureliumPhase = 0
  thermalGlow = 0
  dustKick = 0
  groundAltitude = 10
  gcasActive = false

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
    this.aureliumPhase = 0
    this.thermalGlow = 0
    this.dustKick = 0
    this.groundAltitude = 10
    this.gcasActive = false
    this.supersonicLatch = false
    this.boomCooldown = 0
    this.carpetTimer = 0
    this.boomImpulse = 0
    flightRuntime.active = false
  }

  /**
   * Avanza la simulación `dt` segundos.
   * @param heading        Rumbo (rotación Y del jugador, rad). Adelante = (-sin, 0, -cos)
   * @param altitude       Altitud absoluta actual en metros (determina densidad y velocidad del sonido ISA)
   * @param mode           Modo de control ('assist' con JarBees GCAS o 'sim' manual)
   * @param groundAltitude Altitud relativa sobre el terreno (m) para efecto suelo y GCAS
   * @returns yawDelta: variación de rumbo (rad) que el llamador debe aplicar
   */
  step(
    dt: number,
    input: FlightInput,
    heading: number,
    altitude: number,
    mode: FlightMode,
    groundAltitude?: number
  ): { yawDelta: number } {
    const assist = mode === 'assist'
    const groundAlt = groundAltitude !== undefined ? Math.max(0, groundAltitude) : Math.max(0, altitude)
    this.groundAltitude = groundAlt

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
    // Reactor Arc / Cuántico JarBees: disponibilidad incondicional de potencia
    const noEnergy = false

    // Temperatura de monitoreo (actúa como lectura visual y acústica en el HUD)
    this.overheated = this.heat >= 96

    // --- Actuadores con inercia -------------------------------------------
    const throttleTarget = input.forward ? 1 : 0
    this.throttle = approach(this.throttle, throttleTarget, (throttleTarget > this.throttle ? 1.6 : 1.2) * dt)

    // Postquemador súper velocidad: se activa SIEMPRE con Shift (boost) sin bloqueos ni límite de tiempo
    const abAllowed = !!input.boost
    // Se activa con Shift si se avanza (forward) o si se asciende/vuela (up / forward)
    const abTarget = abAllowed && (this.throttle > 0.1 || input.forward || input.up) ? 1 : 0
    this.afterburner = approach(this.afterburner, abTarget, (abTarget > this.afterburner ? 1.4 : 2.5) * dt)

    this.brake = approach(this.brake, input.backward ? 1 : 0, 4 * dt)

    // --- Envoltura de flujo Fase Aurelium ---------------------------------
    // Se activa con Boost sostenido a partir de la zona transónica (Mach >= 0.72)
    // canalizando un campo electromagnético/energético que colapsa la onda de choque
    const aureliumTarget =
      abAllowed && this.afterburner > 0.4 && (mach >= 0.72 || this.forwardSpeed > 230) ? 1 : 0
    this.aureliumPhase = approach(
      this.aureliumPhase,
      aureliumTarget,
      (aureliumTarget > this.aureliumPhase ? 1.5 : 3.0) * dt
    )

    // --- Empuje -----------------------------------------------------------
    let thrust = availableThrust(mach, this.afterburner, this.throttle, this.aureliumPhase)
    // En modo simulación manual con temperatura extrema, leve caída máxima del 10% (nunca corte total)
    if (!assist && this.heat > 92) thrust *= 1 - 0.1 * smoothstep(92, 100, this.heat)

    // --- Resistencia aerodinámica y de onda -------------------------------
    const brakeMul = 1 + 1.6 * this.brake
    const dragN =
      0.5 * rho * airspeed * airspeed * CDA * waveDragMultiplier(mach, this.aureliumPhase) * brakeMul
    const dragAccel = dragN / EFFECTIVE_MASS

    const vfBefore = vf
    const safeAir = Math.max(airspeed, 0.001)

    // Aceleración longitudinal neta (empuje − resistencia). El limitador de carga G actúa sobre la
    // aceleración NETA, de modo que nunca altera la velocidad terminal (donde la neta es ≈ 0).
    let aForward = thrust / EFFECTIVE_MASS
    if (vf > -REVERSE_MAX_SPEED) aForward -= (REVERSE_THRUST * this.brake) / EFFECTIVE_MASS
    const accelCap = (assist ? 9 : 14) * G
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

    // --- Vertical y Asistencia Inteligente JarBees (GCAS) -----------------
    const climbMul = 1 + 0.8 * this.afterburner + 0.25 * this.aureliumPhase
    let vyTarget = 0
    if (input.up) vyTarget += VERTICAL_MAX * climbMul
    if (input.down) vyTarget -= VERTICAL_MAX * 0.85 * climbMul
    this.vy += (vyTarget - this.vy) * (1 - Math.exp(-(assist ? 4.0 : 2.2) * dt))

    // JarBees GCAS (Ground Collision Avoidance System):
    // A 1.000+ km/h (280 m/s), 100 ms representan 28 metros. Si el piloto desciende velozmente
    // en vuelo rasante contra el relieve, JarBees interviene con micro-empuje vectorial compensatorio.
    if (assist && airspeed > 130 && groundAlt < 14 && this.vy < -1.5) {
      const gcasAuthority = clamp((14 - groundAlt) / 14, 0, 1)
      const liftForce = (30 * gcasAuthority + Math.abs(this.vy) * 2.8) * dt
      this.vy += Math.min(28 * dt, liftForce)
      this.gcasActive = true
    } else {
      this.gcasActive = false
    }

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

    // --- Energía: Reactor Cuántico / Arc JarBees de Potencia Continua -----
    // Fluctúa dinámicamente como telemetría visual viva, pero con suministro garantizado
    const aureliumDrain = this.aureliumPhase * 1.2
    const drain =
      0.3 * this.throttle +
      1.8 * this.afterburner +
      aureliumDrain +
      (input.up || input.down ? 0.3 : 0)
    const regen = 2.0 + (this.throttle < 0.2 ? 4.0 : 0) + (assist ? 0.8 : 0)
    // Rango operacional óptimo [70% - 100%], nunca se agota
    this.energy = clamp(this.energy + (regen - drain) * dt, 70, 100)

    // --- Temperatura del núcleo y calentamiento aerodinámico --------------
    // A Mach > 1.4 el choque térmico de plasma es equilibrado por el sistema criogénico activo
    const ramHeat =
      mach > 1.4 ? 0.28 * Math.pow(mach, 2.8) * (rho / RHO0) * (1 - 0.50 * this.aureliumPhase) : 0
    const heatIn =
      ramHeat + 0.4 * this.throttle + 2.4 * this.afterburner + 1.0 * this.aureliumPhase
    const cooling = 3.2 + 0.022 * airspeed + (this.throttle < 0.05 ? 3.5 : 0)
    this.heat = clamp(this.heat + (heatIn - cooling) * dt, 10, 100)

    // Incandescencia térmica en bordes de ataque (Mach > 2.2 a Mach 5)
    this.thermalGlow = clamp((mach - 2.0) / 2.5, 0, 1)

    // Perturbación rasante sobre el suelo (polvo y agitación con atenuación inversa)
    if (groundAlt < 28 && airspeed > 30) {
      const prox = clamp(1 - groundAlt / 28, 0, 1)
      this.dustKick = prox * prox * smoothstep(30, 280, airspeed) * (1 + 0.35 * this.afterburner)
    } else {
      this.dustKick = 0
    }

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
    const buffet = 0.5 * bump(this.mach, 0.72, 0.88, 1.02) * (1 - 0.5 * this.aureliumPhase)
    const supersonicHum = 0.1 * smoothstep(1.15, 3.5, this.mach)
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
    rt.camPull = smoothstep(20, 420, this.speed)
    rt.fovBoost = clamp(
      3 + 14 * smoothstep(30, 300, this.speed) + 10 * smoothstep(1.0, 3.0, this.mach) + 10 * this.boomImpulse,
      0,
      34
    )
    rt.boomSeq = this.boomSeq
    rt.boomIntensity = this.boomIntensity
    rt.thrustPct = Math.round(
      (this.throttle * (1 - this.afterburner) * 0.4 + this.afterburner * (0.8 + 0.2 * this.aureliumPhase)) * 100
    )
    rt.aureliumPhase = this.aureliumPhase
    rt.thermalGlow = this.thermalGlow
    rt.dustKick = this.dustKick
    rt.groundAltitude = this.groundAltitude
    rt.gcasActive = this.gcasActive
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
  flightRuntime.aureliumPhase = 0
  flightRuntime.thermalGlow = 0
  flightRuntime.dustKick = 0
  flightRuntime.groundAltitude = 10
  flightRuntime.gcasActive = false
}
