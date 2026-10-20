/**
 * JARBEES FLIGHT SYSTEM — FlightAudio
 * ---------------------------------------------------------------------------
 * Audio 100 % procedural (Web Audio API): no descarga archivos y reacciona en
 * tiempo real al régimen de vuelo.
 *
 *  - Viento aerodinámico: ruido filtrado cuyo tono y volumen suben con la velocidad.
 *    Al cruzar Mach 1 el entorno "queda detrás": el viento se apaga y se vuelve grave.
 *  - Turbina / propulsores: dientes de sierra detonados por el empuje.
 *  - Postquemador: rugido de ruido marrón.
 *  - Buffet transónico: golpeteo grave modulado a ~16 Hz en la zona crítica.
 *  - Estampido sónico: golpe sub-grave + chasquido (one-shot).
 */
import type { FlightRuntime } from '@/systems/FlightDynamics'

function createNoiseBuffer(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      data[i] = white
    }
  }
  return buffer
}

export class FlightAudio {
  private ctx: AudioContext
  private master: GainNode

  private windGain: GainNode
  private windFilter: BiquadFilterNode

  private engineGain: GainNode
  private engineFilter: BiquadFilterNode
  private osc1: OscillatorNode
  private osc2: OscillatorNode

  private abGain: GainNode
  private abFilter: BiquadFilterNode

  private buffetGain: GainNode
  private buffetLfoGain: GainNode

  private aureliumGain: GainNode
  private aureliumFilter: BiquadFilterNode
  private aureliumOsc: OscillatorNode

  private whiteBuffer: AudioBuffer
  private brownBuffer: AudioBuffer
  private sources: AudioScheduledSourceNode[] = []
  private lastBoomSeq = 0
  private disposed = false

  constructor(ctx: AudioContext) {
    this.ctx = ctx
    this.whiteBuffer = createNoiseBuffer(ctx, 2, false)
    this.brownBuffer = createNoiseBuffer(ctx, 3, true)

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    // Viento
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.frequency.value = 400
    this.windFilter.Q.value = 0.6
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0
    this.loopNoise(this.whiteBuffer).connect(this.windFilter)
    this.windFilter.connect(this.windGain).connect(this.master)

    // Turbina
    this.engineFilter = ctx.createBiquadFilter()
    this.engineFilter.type = 'lowpass'
    this.engineFilter.frequency.value = 500
    this.engineGain = ctx.createGain()
    this.engineGain.gain.value = 0
    this.osc1 = ctx.createOscillator()
    this.osc1.type = 'sawtooth'
    this.osc1.frequency.value = 80
    this.osc2 = ctx.createOscillator()
    this.osc2.type = 'triangle'
    this.osc2.frequency.value = 121
    this.osc1.connect(this.engineFilter)
    this.osc2.connect(this.engineFilter)
    this.engineFilter.connect(this.engineGain).connect(this.master)
    this.osc1.start()
    this.osc2.start()
    this.sources.push(this.osc1, this.osc2)

    // Postquemador
    this.abFilter = ctx.createBiquadFilter()
    this.abFilter.type = 'lowpass'
    this.abFilter.frequency.value = 900
    this.abGain = ctx.createGain()
    this.abGain.gain.value = 0
    this.loopNoise(this.brownBuffer).connect(this.abFilter)
    this.abFilter.connect(this.abGain).connect(this.master)

    // Buffet transónico (ruido grave con modulación de amplitud)
    const buffetFilter = ctx.createBiquadFilter()
    buffetFilter.type = 'bandpass'
    buffetFilter.frequency.value = 95
    buffetFilter.Q.value = 1.2
    this.buffetGain = ctx.createGain()
    this.buffetGain.gain.value = 0
    this.buffetLfoGain = ctx.createGain()
    this.buffetLfoGain.gain.value = 0
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 16
    lfo.connect(this.buffetLfoGain)
    this.buffetLfoGain.connect(this.buffetGain.gain)
    lfo.start()
    this.sources.push(lfo)
    this.loopNoise(this.brownBuffer).connect(buffetFilter)
    buffetFilter.connect(this.buffetGain).connect(this.master)

    // Resonancia de Fase Aurelium (zumbido futurista ionizado)
    this.aureliumFilter = ctx.createBiquadFilter()
    this.aureliumFilter.type = 'bandpass'
    this.aureliumFilter.frequency.value = 520
    this.aureliumFilter.Q.value = 2.5
    this.aureliumGain = ctx.createGain()
    this.aureliumGain.gain.value = 0
    this.aureliumOsc = ctx.createOscillator()
    this.aureliumOsc.type = 'sine'
    this.aureliumOsc.frequency.value = 520
    this.aureliumOsc.connect(this.aureliumFilter)
    this.aureliumFilter.connect(this.aureliumGain).connect(this.master)
    this.aureliumOsc.start()
    this.sources.push(this.aureliumOsc)
  }

  private loopNoise(buffer: AudioBuffer): AudioBufferSourceNode {
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    src.start()
    this.sources.push(src)
    return src
  }

  private ramp(param: AudioParam, value: number, timeConstant = 0.09): void {
    param.setTargetAtTime(value, this.ctx.currentTime, timeConstant)
  }

  /**
   * Actualiza el audio con el estado de vuelo actual.
   * @param volume Volumen de efectos 0..1 (ya incluye silencio/pausa si es 0)
   */
  update(rt: FlightRuntime, volume: number): void {
    if (this.disposed) return

    const active = rt.active && volume > 0
    this.ramp(this.master.gain, active ? volume : 0, 0.12)
    if (!active) return

    const speedNorm = Math.min(1, rt.speed / 420)
    const hush = 1 - 0.55 * Math.min(1, Math.max(0, (rt.mach - 1) / 0.25)) // supersónico: entorno queda atrás

    // Viento
    this.ramp(this.windGain.gain, 0.5 * Math.pow(speedNorm, 1.3) * hush)
    this.ramp(this.windFilter.frequency, (320 + speedNorm * 2600) * (rt.mach > 1 ? 0.55 : 1))
    this.ramp(this.windFilter.Q, 0.7 - 0.35 * speedNorm)

    // Turbina
    const base = 70 + rt.throttle * 55 + rt.afterburner * 45
    this.ramp(this.osc1.frequency, base, 0.12)
    this.ramp(this.osc2.frequency, base * 1.51, 0.12)
    this.ramp(this.engineFilter.frequency, 380 + rt.throttle * 900 + rt.afterburner * 1500)
    this.ramp(this.engineGain.gain, 0.025 + rt.throttle * 0.06 + rt.afterburner * 0.04)

    // Postquemador
    this.ramp(this.abFilter.frequency, 700 + rt.afterburner * 1300)
    this.ramp(this.abGain.gain, rt.afterburner * 0.7)

    // Buffet transónico
    const trans = Math.max(0, 1 - Math.abs(rt.mach - 0.9) / 0.22) * (1 - 0.5 * rt.aureliumPhase)
    this.ramp(this.buffetGain.gain, 0.12 * trans)
    this.ramp(this.buffetLfoGain.gain, 0.5 * trans)

    // Fase Aurelium (resonancia de flujo electromagnético)
    const aureliumVol = rt.aureliumPhase * 0.22
    this.ramp(this.aureliumGain.gain, aureliumVol)
    this.ramp(this.aureliumOsc.frequency, 460 + rt.mach * 90 + rt.aureliumPhase * 110)
    this.ramp(this.aureliumFilter.frequency, 520 + rt.mach * 100)

    // Estampido sónico
    if (rt.boomSeq !== this.lastBoomSeq) {
      this.lastBoomSeq = rt.boomSeq
      this.boom(rt.boomIntensity)
    }
  }

  /** Golpe sub-grave + chasquido de onda de choque */
  boom(intensity: number): void {
    if (this.disposed) return
    const ctx = this.ctx
    const t0 = ctx.currentTime
    const level = Math.max(0.15, Math.min(1, intensity))

    // Estruendo grave (ruido marrón con filtro descendente)
    const rumble = ctx.createBufferSource()
    rumble.buffer = this.brownBuffer
    const rumbleFilter = ctx.createBiquadFilter()
    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.setValueAtTime(420, t0)
    rumbleFilter.frequency.exponentialRampToValueAtTime(70, t0 + 1.6)
    const rumbleGain = ctx.createGain()
    rumbleGain.gain.setValueAtTime(0.0001, t0)
    rumbleGain.gain.exponentialRampToValueAtTime(1.6 * level, t0 + 0.012)
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7)
    rumble.connect(rumbleFilter).connect(rumbleGain).connect(this.master)
    rumble.start(t0)
    rumble.stop(t0 + 1.8)

    // Impacto sub-grave
    const thump = ctx.createOscillator()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(78, t0)
    thump.frequency.exponentialRampToValueAtTime(26, t0 + 0.9)
    const thumpGain = ctx.createGain()
    thumpGain.gain.setValueAtTime(0.0001, t0)
    thumpGain.gain.exponentialRampToValueAtTime(1.3 * level, t0 + 0.01)
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0)
    thump.connect(thumpGain).connect(this.master)
    thump.start(t0)
    thump.stop(t0 + 1.1)

    // Chasquido seco de la onda de choque
    const crack = ctx.createBufferSource()
    crack.buffer = this.whiteBuffer
    const crackFilter = ctx.createBiquadFilter()
    crackFilter.type = 'highpass'
    crackFilter.frequency.value = 1800
    const crackGain = ctx.createGain()
    crackGain.gain.setValueAtTime(0.0001, t0)
    crackGain.gain.exponentialRampToValueAtTime(0.8 * level, t0 + 0.004)
    crackGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14)
    crack.connect(crackFilter).connect(crackGain).connect(this.master)
    crack.start(t0)
    crack.stop(t0 + 0.2)
  }

  dispose(): void {
    this.disposed = true
    this.sources.forEach((s) => {
      try {
        s.stop()
      } catch {
        // ya detenido
      }
    })
    this.master.disconnect()
  }
}
