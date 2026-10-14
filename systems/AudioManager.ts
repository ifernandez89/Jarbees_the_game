import * as THREE from 'three'

export interface AudioConfig {
  volume: number
  loop: boolean
  playbackRate?: number
  fadeInDuration?: number
  fadeOutDuration?: number
}

export class AudioManager {
  private listener: THREE.AudioListener
  private audioLoader: THREE.AudioLoader
  private sounds: Map<string, THREE.Audio | THREE.PositionalAudio> = new Map()
  private musicTracks: Map<string, THREE.Audio> = new Map()
  private currentMusic: THREE.Audio | null = null
  
  // Volúmenes globales
  private masterVolume = 1.0
  private musicVolume = 0.7
  private sfxVolume = 0.8
  private ambientVolume = 0.6
  
  // Estado
  private isMuted = false
  private isPaused = false
  private isUnlocked = false

  constructor(listener: THREE.AudioListener) {
    this.listener = listener
    this.audioLoader = new THREE.AudioLoader()
    this.setupUnlockOnInteraction()
  }

  /**
   * Desbloquea el AudioContext en navegadores modernos tras interacción del usuario
   */
  private setupUnlockOnInteraction(): void {
    if (typeof window === 'undefined') return

    const unlock = () => {
      this.unlockAudio()
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }

    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
  }

  /**
   * Forzar reanudación del contexto de audio
   */
  unlockAudio(): void {
    const context = this.listener.context
    if (context && context.state === 'suspended') {
      context.resume().then(() => {
        this.isUnlocked = true
        console.log('🔊 AudioContext desbloqueado y activo')
      }).catch((err) => {
        console.warn('⚠️ No se pudo reanudar AudioContext:', err)
      })
    } else {
      this.isUnlocked = true
    }
  }

  /**
   * Cargar un sonido desde URL
   */
  async loadSound(
    name: string,
    url: string,
    config: Partial<AudioConfig> = {}
  ): Promise<THREE.Audio> {
    return new Promise((resolve, reject) => {
      const sound = new THREE.Audio(this.listener)

      this.audioLoader.load(
        url,
        (buffer) => {
          sound.setBuffer(buffer)
          const targetVol = (config.volume !== undefined ? config.volume : 1.0) * this.sfxVolume * this.masterVolume
          sound.setVolume(this.isMuted ? 0 : targetVol)
          sound.setLoop(config.loop || false)
          if (config.playbackRate) {
            sound.setPlaybackRate(config.playbackRate)
          }
          
          this.sounds.set(name, sound)
          console.log(`✅ Audio cargado: ${name}`)
          resolve(sound)
        },
        undefined,
        (error) => {
          console.error(`❌ Error cargando audio ${name}:`, error)
          reject(error)
        }
      )
    })
  }

  /**
   * Cargar música de fondo
   */
  async loadMusic(name: string, url: string): Promise<THREE.Audio> {
    return new Promise((resolve, reject) => {
      const music = new THREE.Audio(this.listener)

      this.audioLoader.load(
        url,
        (buffer) => {
          music.setBuffer(buffer)
          music.setVolume(this.isMuted ? 0 : this.musicVolume * this.masterVolume)
          music.setLoop(true)
          
          this.musicTracks.set(name, music)
          console.log(`🎵 Música cargada: ${name}`)
          resolve(music)
        },
        undefined,
        (error) => {
          console.error(`❌ Error cargando música ${name}:`, error)
          reject(error)
        }
      )
    })
  }

  /**
   * Obtener instancia de sonido
   */
  getSound(name: string): THREE.Audio | THREE.PositionalAudio | undefined {
    return this.sounds.get(name)
  }

  /**
   * Verificar si un sonido se está reproduciendo
   */
  isSoundPlaying(name: string): boolean {
    const sound = this.sounds.get(name)
    return !!(sound && sound.isPlaying)
  }

  /**
   * Reproducir un sonido de un solo disparo
   */
  playSound(name: string, volume?: number): void {
    const sound = this.sounds.get(name)
    if (!sound) {
      console.warn(`⚠️ Sonido no encontrado: ${name}`)
      return
    }

    if (this.isMuted || this.isPaused) return

    if (volume !== undefined) {
      sound.setVolume(volume * this.sfxVolume * this.masterVolume)
    }

    if (sound.isPlaying) {
      sound.stop()
    }
    sound.play()
  }

  /**
   * Iniciar reproducción continua (loop) si no está sonando ya
   */
  playLoop(name: string, volume?: number): void {
    const sound = this.sounds.get(name)
    if (!sound) return

    sound.setLoop(true)
    if (volume !== undefined && !this.isMuted) {
      sound.setVolume(volume * this.sfxVolume * this.masterVolume)
    }

    if (!sound.isPlaying && !this.isPaused) {
      try {
        sound.play()
      } catch (err) {
        console.warn(`Error al reproducir bucle ${name}:`, err)
      }
    }
  }

  /**
   * Modificar el tono/velocidad de reproducción de un sonido (Pitch shift)
   */
  setSoundPitch(name: string, pitch: number): void {
    const sound = this.sounds.get(name)
    if (sound && sound.source && typeof sound.setPlaybackRate === 'function') {
      try {
        sound.setPlaybackRate(Math.max(0.1, Math.min(3.0, pitch)))
      } catch {
        // En algunos estados el nodo de fuente puede no estar listo
      }
    }
  }

  /**
   * Ajustar volumen específico de un sonido
   */
  setSoundVolume(name: string, volume: number): void {
    const sound = this.sounds.get(name)
    if (sound) {
      const vol = this.isMuted ? 0 : volume * this.sfxVolume * this.masterVolume
      sound.setVolume(Math.max(0, Math.min(1, vol)))
    }
  }

  /**
   * Reproducir música con crossfade
   */
  async playMusic(name: string, fadeDuration = 2): Promise<void> {
    const music = this.musicTracks.get(name)
    if (!music) {
      console.warn(`⚠️ Música no encontrada: ${name}`)
      return
    }

    if (this.isMuted) return

    // Fade out música actual
    if (this.currentMusic && this.currentMusic.isPlaying) {
      await this.fadeOut(this.currentMusic, fadeDuration)
      this.currentMusic.stop()
    }

    // Fade in nueva música
    this.currentMusic = music
    music.setVolume(0)
    music.play()
    await this.fadeIn(music, fadeDuration, this.musicVolume * this.masterVolume)
  }

  /**
   * Fade in de audio
   */
  private fadeIn(audio: THREE.Audio, duration: number, targetVolume: number): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = 0
      const startTime = Date.now()

      const fade = () => {
        const elapsed = (Date.now() - startTime) / 1000
        const progress = Math.min(elapsed / duration, 1)
        const volume = startVolume + (targetVolume - startVolume) * progress

        if (!this.isMuted) {
          audio.setVolume(volume)
        }

        if (progress < 1) {
          requestAnimationFrame(fade)
        } else {
          resolve()
        }
      }

      fade()
    })
  }

  /**
   * Fade out de audio
   */
  private fadeOut(audio: THREE.Audio, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startVolume = audio.getVolume()
      const startTime = Date.now()

      const fade = () => {
        const elapsed = (Date.now() - startTime) / 1000
        const progress = Math.min(elapsed / duration, 1)
        const volume = startVolume * (1 - progress)

        if (!this.isMuted) {
          audio.setVolume(volume)
        }

        if (progress < 1) {
          requestAnimationFrame(fade)
        } else {
          resolve()
        }
      }

      fade()
    })
  }

  /**
   * Detener un sonido
   */
  stopSound(name: string): void {
    const sound = this.sounds.get(name)
    if (sound && sound.isPlaying) {
      sound.stop()
    }
  }

  /**
   * Pausar/Resumir música
   */
  toggleMusic(): void {
    if (this.currentMusic) {
      if (this.currentMusic.isPlaying) {
        this.currentMusic.pause()
      } else {
        this.currentMusic.play()
      }
    }
  }

  /**
   * Mutear o desmutear
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted
    this.updateAllVolumes()
  }

  getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Mutear/Desmutear alternado
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    this.updateAllVolumes()
    return this.isMuted
  }

  /**
   * Pausar/Resumir todo (al pausar el juego)
   */
  togglePause(forcePause?: boolean): void {
    this.isPaused = forcePause !== undefined ? forcePause : !this.isPaused
    
    if (this.isPaused) {
      this.sounds.forEach((sound) => {
        if (sound.isPlaying) {
          sound.pause()
        }
      })
      
      if (this.currentMusic && this.currentMusic.isPlaying) {
        this.currentMusic.pause()
      }
    } else {
      this.sounds.forEach((sound) => {
        if (sound.getLoop()) {
          sound.play()
        }
      })
      
      if (this.currentMusic) {
        this.currentMusic.play()
      }
    }
  }

  /**
   * Ajustar volumen maestro
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  /**
   * Ajustar volumen de música
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.currentMusic && !this.isMuted) {
      this.currentMusic.setVolume(this.musicVolume * this.masterVolume)
    }
  }

  /**
   * Ajustar volumen de efectos
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  /**
   * Actualizar todos los volúmenes según mute y estado actual
   */
  private updateAllVolumes(): void {
    this.sounds.forEach((sound) => {
      if (this.isMuted) {
        sound.setVolume(0)
      } else {
        sound.setVolume(this.sfxVolume * this.masterVolume)
      }
    })
    
    if (this.currentMusic) {
      if (this.isMuted) {
        this.currentMusic.setVolume(0)
      } else {
        this.currentMusic.setVolume(this.musicVolume * this.masterVolume)
      }
    }
  }

  /**
   * Limpiar recursos
   */
  dispose(): void {
    this.sounds.forEach((sound) => {
      if (sound.isPlaying) {
        sound.stop()
      }
      sound.disconnect()
    })
    
    this.musicTracks.forEach((music) => {
      if (music.isPlaying) {
        music.stop()
      }
      music.disconnect()
    })
    
    this.sounds.clear()
    this.musicTracks.clear()
  }
}
