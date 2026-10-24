import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function useGameControls() {
  const setControls = useGameStore((state) => state.setControls)
  const setPaused = useGameStore((state) => state.setPaused)
  const isPaused = useGameStore((state) => state.isPaused)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pausa con ESC, ENTER o P
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'KeyP') {
        e.preventDefault()
        setPaused(!isPaused)
        return
      }

      // Mutear / desmutear audio con U
      if (e.code === 'KeyU') {
        e.preventDefault()
        const currentAudio = useGameStore.getState().audioEnabled
        useGameStore.getState().setAudioEnabled(!currentAudio)
        return
      }

      // Mapa Holográfico Táctico AR Flotante con M (Mapa) o N (Nav)
      if (e.code === 'KeyM' || e.code === 'KeyN') {
        e.preventDefault()
        useGameStore.getState().toggleHoloMap()
        return
      }

      // Ciclar destino de expedición ANS (Aconcagua, Chimborazo, etc.) con O
      if (e.code === 'KeyO') {
        e.preventDefault()
        useGameStore.getState().cycleNavigationTarget(1)
        return
      }

      // Cambiar de bioma con B
      if (e.code === 'KeyB') {
        e.preventDefault()
        const biomes: Array<'aconcagua' | 'titicaca' | 'easter_island' | 'constellations' | 'antarctica'> = [
          'aconcagua',
          'titicaca',
          'easter_island',
          'constellations',
          'antarctica',
        ]
        const current = useGameStore.getState().currentBiome
        const next = biomes[(biomes.indexOf(current) + 1) % biomes.length]
        useGameStore.getState().setBiome(next)
        return
      }

      // Giro para quedar de espaldas o mirar al usuario con T o F
      if (e.code === 'KeyT' || e.code === 'KeyF') {
        e.preventDefault()
        if (useGameStore.getState().selectedCharacter === 'iron_man') {
          useGameStore.getState().toggleIronManFlip()
        }
        return
      }

      // JARBEES FLIGHT SYSTEM: alternar modo Asistido / Simulación con G
      if (e.code === 'KeyG') {
        e.preventDefault()
        if (useGameStore.getState().selectedCharacter === 'iron_man') {
          useGameStore.getState().toggleFlightMode()
        }
        return
      }

      // Velo de Fase (Aurelium Phase Veil) con V
      if (e.code === 'KeyV') {
        e.preventDefault()
        if (useGameStore.getState().selectedCharacter === 'iron_man') {
          useGameStore.getState().togglePhaseVeil()
        }
        return
      }

      // Evitar controles de vuelo si está pausado
      if (isPaused) return

      // Emotes del exoesqueleto y acciones tácticas CS 1.6:
      // 1: Saludo, 2: Pulgar arriba, 3: Señalar, 4: Llamar ("Ven"), 5: Victoria
      // 6: Flinch Torso, 7: Flinch Cabeza, 8: Interacción Táctica (C4), 9: Desplome / Caída, 0: Mirada Alerta
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('salute')
        return
      }
      if (e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('thumbs_up')
        return
      }
      if (e.code === 'Digit3' || e.code === 'Numpad3') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('point')
        return
      }
      if (e.code === 'Digit4' || e.code === 'Numpad4') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('beckon')
        return
      }
      if (e.code === 'Digit5' || e.code === 'Numpad5') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('cheer')
        return
      }
      if (e.code === 'Digit6' || e.code === 'Numpad6') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('flinch_torso')
        return
      }
      if (e.code === 'Digit7' || e.code === 'Numpad7') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('flinch_head')
        return
      }
      if (e.code === 'Digit8' || e.code === 'Numpad8') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('tactical_interact')
        return
      }
      if (e.code === 'Digit9' || e.code === 'Numpad9') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('death_forward')
        return
      }
      if (e.code === 'Digit0' || e.code === 'Numpad0') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('quicklook')
        return
      }

      // ACCIONES TÁCTICAS LEFT 4 DEAD (SOURCE ENGINE)
      if (e.code === 'KeyF') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('melee_shove')
        return
      }
      if (e.code === 'KeyG') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('stumble')
        return
      }
      if (e.code === 'KeyH') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('limp_walk')
        return
      }
      if (e.code === 'KeyJ') {
        e.preventDefault()
        useGameStore.getState().triggerEmote('hunter_pounce')
        return
      }

      switch (e.code) {
        // AGACHARSE / MODO BAJO con CTRL o C
        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyC':
          e.preventDefault()
          setControls({ crouch: true })
          break
        // AVANZAR HACIA EL HORIZONTE con Flecha Arriba o W
        case 'KeyW':
        case 'ArrowUp':
          e.preventDefault()
          setControls({ forward: true })
          break
        // FRENAR / DESACELERAR con Flecha Abajo o S
        case 'KeyS':
        case 'ArrowDown':
          e.preventDefault()
          setControls({ backward: true })
          break
        // GIRAR A LA IZQUIERDA con Flecha Izquierda o A
        case 'KeyA':
        case 'ArrowLeft':
          e.preventDefault()
          setControls({ left: true })
          break
        // GIRAR A LA DERECHA con Flecha Derecha o D
        case 'KeyD':
        case 'ArrowRight':
          e.preventDefault()
          setControls({ right: true })
          break
        // SUBIR ALTITUD / SALTO con ESPACIO, E o RePág
        case 'Space':
          e.preventDefault()
          setControls({ up: true, jump: true })
          break
        case 'KeyE':
        case 'PageUp':
          e.preventDefault()
          setControls({ up: true, jump: true })
          break
        // BAJAR ALTITUD con Q o AvPág (y SHIFT para los personajes sin postquemador)
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault()
          if (useGameStore.getState().selectedCharacter === 'iron_man') {
            // POSTQUEMADOR del traje JarBees
            setControls({ boost: true })
          } else {
            setControls({ down: true })
          }
          break
        case 'KeyQ':
        case 'PageDown':
          e.preventDefault()
          setControls({ down: true })
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls({ forward: false })
          break
        case 'KeyS':
        case 'ArrowDown':
          setControls({ backward: false })
          break
        case 'KeyA':
        case 'ArrowLeft':
          setControls({ left: false })
          break
        case 'KeyD':
        case 'ArrowRight':
          setControls({ right: false })
          break
        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyC':
          setControls({ crouch: false })
          break
        case 'Space':
          setControls({ up: false, jump: false })
          break
        case 'KeyE':
        case 'PageUp':
          setControls({ up: false, jump: false })
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          // Soltar SHIFT libera tanto el postquemador como el descenso (según el personaje activo)
          setControls({ boost: false, down: false })
          break
        case 'KeyQ':
        case 'PageDown':
          setControls({ down: false })
          break
      }
    }

    // Añadir listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Limpiar listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setControls, setPaused, isPaused])
}
