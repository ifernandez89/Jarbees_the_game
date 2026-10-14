'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDayNightCycle, getSunPosition, getMoonPosition } from '@/hooks/useDayNightCycle'

interface DynamicSkyProps {
  enabled?: boolean
  speed?: number
}

export function DynamicSky({ enabled = true, speed = 1 }: DynamicSkyProps) {
  const sunRef = useRef<THREE.Mesh>(null!)
  const moonRef = useRef<THREE.Mesh>(null!)
  const skyRef = useRef<THREE.Mesh>(null!)
  
  const timeOfDay = useDayNightCycle(enabled, speed)

  // Crear gradiente esférico del cielo
  const skyGeometry = useMemo(() => {
    return new THREE.SphereGeometry(480, 32, 32)
  }, [])

  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color('#5aa2f0') },
        bottomColor: { value: new THREE.Color('#bee2fd') },
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
    })
  }, [])

  // Actualizar colores del cielo y posiciones celestes
  useFrame(() => {
    if (!enabled) return

    // Actualizar colores del gradiente celeste
    if (skyMaterial.uniforms) {
      skyMaterial.uniforms.topColor.value.set(timeOfDay.skyColor)
      skyMaterial.uniforms.bottomColor.value.set(timeOfDay.horizonColor)
    }

    // Actualizar posición y brillo del sol
    if (sunRef.current) {
      const [x, y, z] = getSunPosition(timeOfDay)
      sunRef.current.position.set(x, y, z)
      sunRef.current.visible = y > -30 // Ocultar solo si está bajo el suelo profundo
    }

    // Actualizar posición de la luna
    if (moonRef.current) {
      const [mx, my, mz] = getMoonPosition(timeOfDay)
      moonRef.current.position.set(mx, my, mz)
      moonRef.current.visible = my > -20
    }
  })

  const [sunX, sunY, sunZ] = getSunPosition(timeOfDay)
  const [moonX, moonY, moonZ] = getMoonPosition(timeOfDay)

  return (
    <group>
      {/* Bóveda celeste con gradiente interpolado */}
      <mesh ref={skyRef} geometry={skyGeometry} material={skyMaterial} />

      {/* Astro Sol */}
      <mesh ref={sunRef} position={[sunX, sunY, sunZ]}>
        <sphereGeometry args={[14, 32, 32]} />
        <meshStandardMaterial
          color="#ffdd55"
          emissive="#ffbb22"
          emissiveIntensity={Math.max(0.2, timeOfDay.sunIntensity * 2.5)}
          roughness={0.2}
        />
      </mesh>

      {/* Luz solar direccional */}
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={Math.max(0.05, timeOfDay.sunIntensity * 1.5)}
        color="#fff9ea"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={600}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />

      {/* Astro Luna */}
      <mesh ref={moonRef} position={[moonX, moonY, moonZ]}>
        <sphereGeometry args={[9, 32, 32]} />
        <meshStandardMaterial
          color="#e8ecf8"
          emissive="#c4d5f2"
          emissiveIntensity={Math.max(0.1, timeOfDay.moonIntensity * 1.8)}
          roughness={0.3}
        />
      </mesh>

      {/* Luz tenue de luna nocturna */}
      {timeOfDay.moonIntensity > 0.1 && (
        <pointLight
          position={[moonX, moonY, moonZ]}
          intensity={timeOfDay.moonIntensity * 0.45}
          color="#c0d4ff"
          distance={450}
        />
      )}

      {/* Luz hemisférica reactiva al color ambiental */}
      <hemisphereLight
        args={[timeOfDay.skyColor, timeOfDay.horizonColor, 0.65]}
      />

      {/* Manto de Estrellas con fade-in continuo y alta visibilidad */}
      <Stars opacity={timeOfDay.starsOpacity} />
    </group>
  )
}

/**
 * Componente de Estrellas Brillantes de Alta Visibilidad
 */
function Stars({ opacity }: { opacity: number }) {
  const starsRef = useRef<THREE.Points>(null!)

  // Generar constelaciones y estrellas con tamaños y colores variados
  const { geometry, material } = useMemo(() => {
    const starCount = 1200
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    const colorWhite = new THREE.Color('#ffffff')
    const colorGold = new THREE.Color('#ffe2a8')
    const colorCyan = new THREE.Color('#b8e2ff')
    const tempCol = new THREE.Color()

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3
      // Distribuir en la media esfera superior (radio 340 a 390, dentro del domo)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 0.95) // Solo hemisferio superior visible
      const radius = 340 + Math.random() * 50

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta)
      positions[idx + 1] = radius * Math.cos(phi) + 15 // Por encima del horizonte
      positions[idx + 2] = radius * Math.sin(phi) * Math.sin(theta)

      // Variación de color estelar
      const randCol = Math.random()
      if (randCol < 0.65) {
        tempCol.copy(colorWhite)
      } else if (randCol < 0.85) {
        tempCol.copy(colorCyan)
      } else {
        tempCol.copy(colorGold)
      }

      colors[idx] = tempCol.r
      colors[idx + 1] = tempCol.g
      colors[idx + 2] = tempCol.b
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Material de puntos sin niebla (fog: false) para visibilidad estelar cristalina
    const mat = new THREE.PointsMaterial({
      size: 3.2,
      sizeAttenuation: false, // Garantiza que siempre midan 3.2 píxeles brillantes en pantalla
      vertexColors: true,
      transparent: true,
      opacity: 0,
      fog: false, // CRÍTICO: La niebla no debe apagar las estrellas
      depthWrite: false,
    })

    return { geometry: geo, material: mat }
  }, [])

  // Parpadeo sutil y rotación de la bóveda celeste
  useFrame((state) => {
    if (starsRef.current && material) {
      const time = state.clock.getElapsedTime()
      // Rotación lenta del firmamento
      starsRef.current.rotation.y = time * 0.003

      // Opacidad gobernada por el ciclo día/noche con microparpadeo
      if (opacity > 0.01) {
        const twinkle = Math.sin(time * 3.5) * 0.08
        material.opacity = Math.max(0, Math.min(1, opacity + twinkle))
        starsRef.current.visible = true
      } else {
        material.opacity = 0
        starsRef.current.visible = false
      }
    }
  })

  return <points ref={starsRef} geometry={geometry} material={material} />
}
