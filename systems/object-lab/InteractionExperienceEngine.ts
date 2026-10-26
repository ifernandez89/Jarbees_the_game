/**
 * InteractionExperienceEngine
 * ===========================
 * Inspired by halloween.dev (The Last Deploy) & tactile mechanical UI.
 * High-performance, zero-asset-dependency Web Audio DSP micro-synthesizer
 * and reactive sensory coordinator.
 * 
 * Provides tactile clicks, latch snaps, spring resistances, servo whirs,
 * and structural warning pulses.
 */

export type SensoryEventType =
  | 'RELAY_CLICK'
  | 'SLIDER_TICK'
  | 'DESPIECE_ENGAGE'
  | 'DESPIECE_COLLAPSE'
  | 'PART_SELECT'
  | 'LATCH_SNAP'
  | 'ERROR_BUZZ'
  | 'SUCCESS_CHORD';

export interface SensoryEvent {
  type: SensoryEventType;
  intensity?: number; // 0.0 a 1.0
  pitchModifier?: number; // Factor de tono (1.0 = normal)
  metadata?: Record<string, any>;
}

export class InteractionExperienceEngine {
  private static instance: InteractionExperienceEngine;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastTickTime: number = 0;

  private constructor() {
    // Lazily initialized on first user gesture
  }

  public static getInstance(): InteractionExperienceEngine {
    if (!InteractionExperienceEngine.instance) {
      InteractionExperienceEngine.instance = new InteractionExperienceEngine();
    }
    return InteractionExperienceEngine.instance;
  }

  public init(): void {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public dispatch(event: SensoryEvent): void {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const intensity = event.intensity ?? 0.5;
    const pitch = event.pitchModifier ?? 1.0;
    const now = this.audioCtx.currentTime;

    switch (event.type) {
      case 'RELAY_CLICK':
        // Micro-pulso agudo de interruptor industrial (1200Hz, 6ms)
        this.playPulse(1200 * pitch, 0.007, 0.06 * intensity, 'sine');
        break;

      case 'SLIDER_TICK':
        // Rate-limit micro-ticks to 30ms so rapid drag doesn't cause audio clipping
        if (now - this.lastTickTime < 0.025) return;
        this.lastTickTime = now;
        this.playPulse(1600 * pitch, 0.005, 0.04 * intensity, 'triangle');
        break;

      case 'DESPIECE_ENGAGE':
        // Despliegue mecánico: barrido ascendente resonante
        this.playChirp(220 * pitch, 680 * pitch, 0.08, 0.12 * intensity);
        break;

      case 'DESPIECE_COLLAPSE':
        // Cierre y encastre de piezas: barrido descendente hacia golpe seco
        this.playChirp(520 * pitch, 140 * pitch, 0.07, 0.14 * intensity);
        setTimeout(() => this.playThud(85 * pitch, 0.06, 0.25 * intensity), 65);
        break;

      case 'PART_SELECT':
        // Resonancia táctil doble (acorde rápido 440Hz + 880Hz)
        this.playPulse(440 * pitch, 0.03, 0.08 * intensity, 'sine');
        this.playPulse(880 * pitch, 0.02, 0.06 * intensity, 'sine');
        break;

      case 'LATCH_SNAP':
        // Encastre magnético de pestillo / tope
        this.playThud(90 * pitch, 0.05, 0.3 * intensity);
        this.playPulse(2400 * pitch, 0.008, 0.08 * intensity, 'triangle');
        break;

      case 'ERROR_BUZZ':
        // Advertencia armónica disonante (Tritono 320Hz + 452Hz)
        this.playDissonance(320 * pitch, 452 * pitch, 0.14, 0.12 * intensity);
        break;

      case 'SUCCESS_CHORD':
        // Acorde limpio de validación superada (Do-Mi-Sol mayor)
        this.playChord([523.25, 659.25, 783.99], 0.18, 0.1 * intensity);
        break;
    }
  }

  // --- Primitivas de Síntesis DSP ---

  private playPulse(freq: number, duration: number, gainVal: number, type: OscillatorType = 'sine') {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const t = this.audioCtx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.00001, t + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  private playThud(startFreq: number, duration: number, gainVal: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const t = this.audioCtx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + duration);

    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.00001, t + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  private playChirp(fStart: number, fEnd: number, duration: number, gainVal: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const t = this.audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fStart, t);
    osc.frequency.exponentialRampToValueAtTime(fEnd, t + duration);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + duration * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.00001, t + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  private playDissonance(f1: number, f2: number, duration: number, gainVal: number) {
    if (!this.audioCtx) return;
    [f1, f2].forEach((freq) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      const t = this.audioCtx!.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(gainVal, t);
      gain.gain.exponentialRampToValueAtTime(0.00001, t + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  private playChord(freqs: number[], duration: number, gainVal: number) {
    if (!this.audioCtx) return;
    const t = this.audioCtx.currentTime;
    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      const noteDelay = idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + noteDelay);

      gain.gain.setValueAtTime(0.0001, t + noteDelay);
      gain.gain.linearRampToValueAtTime(gainVal / freqs.length, t + noteDelay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.00001, t + noteDelay + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);

      osc.start(t + noteDelay);
      osc.stop(t + noteDelay + duration);
    });
  }
}
