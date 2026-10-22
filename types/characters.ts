export type CharacterId = 'bee' | 'colibri' | 'butterfly' | 'iron_man'

export interface CharacterProfile {
  id: CharacterId
  name: string
  title: string
  category: 'Fauna Silvestre' | 'Vengador Acorazado' | 'Exoesqueleto Enjambre' | 'Exoesqueleto NEXO'
  icon: string
  badge: string
  badgeColor: string
  modelPath: string
  fallbackKind: 'bee' | 'colibri' | 'butterfly' | 'iron_man'

  // Métricas del mundo real ("Tabla de Tamaños")
  realMetrics: {
    heightOrLength: string      // ej. "18 cm", "1.85 m"
    wingspanOrWidth: string     // ej. "22 cm", "85 cm"
    weight: string              // ej. "0.15 g", "95 kg"
    scaleRatio: string          // ej. "1:10 (Micro)", "1:1 (Macro Humano)"
    propulsion: string          // ej. "Alas membranosas (230 Hz)", "Repulsores de Plasma Arc"
    maxSpeedKmh: string         // ej. "65 km/h", "Supersónica / 1,200+ km/h"
    flightAcrobatics: string    // ej. "Suspensión y giro instantáneo", "Vuelo balístico y maniobras de alta G"
  }

  // Configuración de render 3D en Three.js
  renderConfig: {
    scale: number
    rotation: [number, number, number]
    positionOffset: [number, number, number]
    pitchMultiplier: number
    rollMultiplier: number
    hoverBobbingAmplitude: number
    hasThrusterFX: boolean
  }

  // Cámara en tercera persona adaptada al tamaño del personaje
  camera: {
    offset: [number, number, number]
    lookOffset: [number, number, number]
  }

  // Audio específico
  audio: {
    soundKey: 'bee_buzz' | 'colibri_flutter' | 'butterfly_flutter' | 'iron_man_thruster' | 'auren_flight'
    baseVolume: number
    maxVolume: number
    basePitch: number
    pitchRange: number
  }

  description: string
  highlights: string[]
}

export const CHARACTER_PROFILES: Record<CharacterId, CharacterProfile> = {
  bee: {
    id: 'bee',
    name: 'Abeja Guardiana',
    title: 'JarBee Clásica',
    category: 'Fauna Silvestre',
    icon: '🐝',
    badge: 'Polinizador Ágil',
    badgeColor: '#f59e0b',
    modelPath: '/models/bee.jb3d',
    fallbackKind: 'bee',
    realMetrics: {
      heightOrLength: '18 cm (Estilizada) / 1.8 cm real',
      wingspanOrWidth: '22 cm (Envergadura)',
      weight: '0.14 gramos',
      scaleRatio: '1:10 (Micro-Mundo)',
      propulsion: '2 pares de alas membranosas a 230 batidas/segundo',
      maxSpeedKmh: '58 km/h en picado',
      flightAcrobatics: 'Vuelo estacionario absoluto y micro-corrientes',
    },
    renderConfig: {
      scale: 0.22,
      rotation: [0, Math.PI, 0],
      positionOffset: [-0.007, -0.04, -0.004],
      pitchMultiplier: 1.0,
      rollMultiplier: 1.0,
      hoverBobbingAmplitude: 0.03,
      hasThrusterFX: false,
    },
    camera: {
      offset: [0, 0.70, 1.8],
      lookOffset: [0, 0.05, -1.2],
    },
    audio: {
      soundKey: 'bee_buzz',
      baseVolume: 0.06,
      maxVolume: 0.17,
      basePitch: 0.88,
      pitchRange: 0.35,
    },
    description: 'La heroína original de JarBees. Capaz de suspenderse inmóvil frente a flores o deslizarse con las brisas del Titicaca.',
    highlights: [
      'Aleteo cinemático continuo en reposo',
      'Inclinación reactiva al viento y viraje',
      'Zumbido orgánico con modulación de frecuencia',
    ],
  },

  colibri: {
    id: 'colibri',
    name: 'Colibrí Esmeralda',
    title: 'Navegante Floral',
    category: 'Fauna Silvestre',
    icon: '🐦',
    badge: 'Hipersónico Natural',
    badgeColor: '#10b981',
    modelPath: '/models/colibri.jb3d',
    fallbackKind: 'colibri',
    realMetrics: {
      heightOrLength: '10 cm (Pico a cola)',
      wingspanOrWidth: '12 cm (Envergadura alar)',
      weight: '3.8 gramos',
      scaleRatio: '1:1.5 (Escala real)',
      propulsion: 'Aleteo en forma de ocho (8) a 80 Hz continuo',
      maxSpeedKmh: '72 km/h (aceleración instantánea)',
      flightAcrobatics: 'Vuelo hacia atrás, vertical y frenada en milisegundos',
    },
    renderConfig: {
      // Escala ajustada para vista de cámara en 3ra persona
      scale: 3.2,
      rotation: [0, Math.PI, 0],
      positionOffset: [0, -0.02, 0],
      pitchMultiplier: 1.2,
      rollMultiplier: 1.15,
      hoverBobbingAmplitude: 0.045,
      hasThrusterFX: false,
    },
    camera: {
      offset: [0, 0.75, 1.9],
      lookOffset: [0, 0.05, -1.2],
    },
    audio: {
      soundKey: 'colibri_flutter',
      baseVolume: 0.08,
      maxVolume: 0.22,
      basePitch: 0.95,
      pitchRange: 0.40,
    },
    description: 'El acróbata más veloz del reino alado. Plumaje iridiscente que refleja la luz del sol andino con gran dinamismo.',
    highlights: [
      'Animación original de aleteo en suspensión y crucero',
      'Micro-vibración realista de vuelo estacionario',
      'Plumaje brillante con sombreado PBR optimizado',
    ],
  },

  butterfly: {
    id: 'butterfly',
    name: 'Mariposa Monarca',
    title: 'Planeadora Etérea',
    category: 'Fauna Silvestre',
    icon: '🦋',
    badge: 'Vuelo Ondulante',
    badgeColor: '#ec4899',
    modelPath: '/models/butterfly.jb3d',
    fallbackKind: 'butterfly',
    realMetrics: {
      heightOrLength: '8.5 cm',
      wingspanOrWidth: '13 cm (Envergadura alar)',
      weight: '0.45 gramos',
      scaleRatio: '1:1.2 (Escala real)',
      propulsion: 'Batido amplio de alas escamosas a 12 Hz',
      maxSpeedKmh: '35 km/h con corrientes térmicas',
      flightAcrobatics: 'Planeo sinusoidal suave y balanceo en curvas',
    },
    renderConfig: {
      scale: 2.4,
      rotation: [0, Math.PI, 0],
      positionOffset: [0, -0.03, 0],
      pitchMultiplier: 0.85,
      rollMultiplier: 1.35,
      hoverBobbingAmplitude: 0.06,
      hasThrusterFX: false,
    },
    camera: {
      offset: [0, 0.75, 2.0],
      lookOffset: [0, 0.08, -1.2],
    },
    audio: {
      soundKey: 'butterfly_flutter',
      baseVolume: 0.05,
      maxVolume: 0.15,
      basePitch: 0.9,
      pitchRange: 0.25,
    },
    description: 'Vuelo majestuoso y relajante. Sus alas dobles dibujan una trayectoria ondeante que armoniza con la vegetación del terreno.',
    highlights: [
      'Animación de alas dobles con esqueleto completo',
      'Ondulación suave sincronizada con la brisa',
      'Texturas alares translúcidas de gran fidelidad',
    ],
  },

  iron_man: {
    id: 'iron_man',
    name: 'JarBees: NEXO-01',
    title: 'Exoesqueleto Experimental • Protocolo NEXO-01',
    category: 'Exoesqueleto NEXO',
    icon: '⬡',
    badge: 'Protocolo NEXO-01',
    badgeColor: '#55F0FF',
    modelPath: '/models/jarbees_suit.jb3d',
    fallbackKind: 'iron_man',
    realMetrics: {
      heightOrLength: '1.85 m (Estatura real con exoesqueleto)',
      wingspanOrWidth: '0.84 m (Anchura con estabilizadores dorsales)',
      weight: '92 kg (Aleación Titanio Frío / Polímeros de Colmena)',
      scaleRatio: '1:1 (Escala Humana Completa)',
      propulsion: 'Microturbinas repulsoras en botas y palmas + Hex-Core de colmena',
      maxSpeedKmh: '230 km/h crucero (Supersónico x4) / Mach 3+ supersónico',
      flightAcrobatics: 'Giro 180° por touch directo en traje, estabilizadores dinámicos y vuelo supino',
    },
    renderConfig: {
      // Modelo optimizado en Blender a 1.85m exactos de altura
      scale: 1.0,
      rotation: [0, Math.PI, 0],
      positionOffset: [0, -0.10, 0], // Centrar pivote exactamente en caderas y torso
      pitchMultiplier: 1.0,          // Inclinación aerodinámica natural
      rollMultiplier: 1.25,         // Inclinación lateral en virajes cerrados
      hoverBobbingAmplitude: 0.02,
      hasThrusterFX: true,          // Repulsores emisivos con partículas y luces
    },
    camera: {
      // Cámara cinematográfica en 3ra persona con encuadre heroico cercano (acercado para apreciar pechera y armadura)
      offset: [0, 0.68, 1.72],
      lookOffset: [0, 0.14, -0.85],
    },
    audio: {
      soundKey: 'auren_flight',
      baseVolume: 0.0,
      maxVolume: 0.30,
      basePitch: 1.0,
      pitchRange: 0.35,
    },
    description: 'Armadura de combate y exploración diseñada para proteger lo que importa. Inspirada en la ingeniería avanzada y la naturaleza colaborativa de las abejas, JarBees combina poder, precisión y evolución constante.',
    highlights: [
      'Máscara y visor en Stealth Black mate eliminando reminiscencias de Iron Man',
      'Reactor hexagonal de colmena (Hex-Core) con telemetría de energía y propulsión acústica original',
      'Simulador aerodinámico JarBees: regímenes de vuelo subsónico a Mach 2.5+ con atmósfera ISA',
      'Audio procedural Web Audio API: viento supersónico, buffet transónico y estampido sónico',
      'Efectos audiovisuales: estelas hipersónicas, cono de vapor Mach y ondas de choque',
      'Modos de vuelo Asistido y Simulación Inercial alternables con tecla [G] y telemetría HUD',
    ],
  },
}
