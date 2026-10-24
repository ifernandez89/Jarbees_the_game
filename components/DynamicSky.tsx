'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useDayNightCycle, getSunPosition, getMoonPosition } from '@/hooks/useDayNightCycle'
import { getAssetPath } from '@/utils/assetPath'
import { useGameStore } from '@/store/gameStore'
import { Clouds } from './Clouds'

interface DynamicSkyProps {
  enabled?: boolean
  speed?: number
}

export function DynamicSky({ enabled = true, speed = 1 }: DynamicSkyProps) {
  const skyGroupRef = useRef<THREE.Group>(null!)
  const sunGroupRef = useRef<THREE.Group>(null!)
  const sunLightRef = useRef<THREE.DirectionalLight>(null!)
  const moonMeshRef = useRef<THREE.Mesh>(null!)
  const moonLightRef = useRef<THREE.DirectionalLight>(null!)
  const skyMeshRef = useRef<THREE.Mesh>(null!)
  
  const { camera } = useThree()
  const timeOfDay = useDayNightCycle(enabled, speed)

  // Textura realista lunar (de Archeoscope / NASA)
  const moonTexture = useTexture(getAssetPath('/textures/moon.jpg'))

  // Bóveda celeste esférica amplia
  const skyGeometry = useMemo(() => {
    return new THREE.SphereGeometry(490, 32, 32)
  }, [])

  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color('#4892e6') },
        bottomColor: { value: new THREE.Color('#bde0ff') },
        offset: { value: 30 },
        exponent: { value: 0.65 },
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

  // Sincronizar objetivos de luz direccional en el centro local del grupo celeste
  useEffect(() => {
    if (skyGroupRef.current) {
      if (sunLightRef.current) {
        skyGroupRef.current.add(sunLightRef.current.target)
        sunLightRef.current.target.position.set(0, 0, 0)
      }
      if (moonLightRef.current) {
        skyGroupRef.current.add(moonLightRef.current.target)
        moonLightRef.current.target.position.set(0, 0, 0)
      }
    }
  }, [])

  // Actualizar posiciones relativas y colores en cada frame
  useFrame(() => {
    if (!skyGroupRef.current) return

    // CRÍTICO: El cielo sigue al jugador para mantener el horizonte infinito
    skyGroupRef.current.position.set(
      camera.position.x,
      camera.position.y * 0.3,
      camera.position.z
    )

    // Actualizar shader del cielo
    if (skyMaterial.uniforms) {
      skyMaterial.uniforms.topColor.value.set(timeOfDay.skyColor)
      skyMaterial.uniforms.bottomColor.value.set(timeOfDay.horizonColor)
    }

    // Posición del grupo completo del sol (núcleo y aureola concéntricos al 100%)
    const [sx, sy, sz] = getSunPosition(timeOfDay)
    if (sunGroupRef.current) {
      sunGroupRef.current.position.set(sx, sy, sz)
      sunGroupRef.current.visible = sy > -35
    }

    // Luz solar: posición y vector alineado exactamente hacia el centro del jugador
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sx, Math.max(10, sy), sz)
      sunLightRef.current.target.position.set(0, 0, 0)
      sunLightRef.current.target.updateMatrixWorld()
      sunLightRef.current.intensity = Math.max(0.0, timeOfDay.sunIntensity * 1.35)
      if (timeOfDay.timeOfDay === 'dawn' || timeOfDay.timeOfDay === 'dusk') {
        sunLightRef.current.color.set('#ffa658')
      } else {
        sunLightRef.current.color.set('#fff6e6')
      }
    }

    // Posición de la luna
    const [mx, my, mz] = getMoonPosition(timeOfDay)
    if (moonMeshRef.current) {
      moonMeshRef.current.position.set(mx, my, mz)
      moonMeshRef.current.visible = my > -30
    }

    // Luz lunar: alineada exactamente hacia el centro del jugador
    if (moonLightRef.current) {
      moonLightRef.current.position.set(mx, Math.max(10, my), mz)
      moonLightRef.current.target.position.set(0, 0, 0)
      moonLightRef.current.target.updateMatrixWorld()
      moonLightRef.current.intensity = Math.max(0.0, timeOfDay.moonIntensity * 0.35)
    }
  })

  const [sunX, sunY, sunZ] = getSunPosition(timeOfDay)
  const [moonX, moonY, moonZ] = getMoonPosition(timeOfDay)

  return (
    <group ref={skyGroupRef}>
      {/* Bóveda celeste con gradiente interpolado */}
      <mesh ref={skyMeshRef} geometry={skyGeometry} material={skyMaterial} />

      {/* Astro Sol Radiante: Grupo unificado y concéntrico */}
      <group ref={sunGroupRef} position={[sunX, sunY, sunZ]}>
        {/* Núcleo del sol */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[18, 32, 32]} />
          <meshStandardMaterial
            color={timeOfDay.timeOfDay === 'dawn' || timeOfDay.timeOfDay === 'dusk' ? '#ff7733' : '#ffee77'}
            emissive={timeOfDay.timeOfDay === 'dawn' || timeOfDay.timeOfDay === 'dusk' ? '#ff5511' : '#ffcc33'}
            emissiveIntensity={Math.max(0.4, timeOfDay.sunIntensity * 2.8)}
            roughness={0.1}
          />
        </mesh>
        {/* Aureola concéntrica suave en la misma coordenada central exacta */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[26, 24, 24]} />
          <meshBasicMaterial
            color={timeOfDay.timeOfDay === 'dawn' || timeOfDay.timeOfDay === 'dusk' ? '#ff8833' : '#ffea77'}
            transparent
            opacity={Math.max(0.0, Math.min(0.28, timeOfDay.sunIntensity * 0.35))}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Luz solar direccional principal */}
      <directionalLight
        ref={sunLightRef}
        position={[sunX, sunY, sunZ]}
        intensity={Math.max(0.0, timeOfDay.sunIntensity * 1.35)}
        color="#fff6e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={650}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />

      {/* Astro Luna Brillante con textura geológica real de Archeoscope / NASA */}
      <mesh ref={moonMeshRef} position={[moonX, moonY, moonZ]}>
        <sphereGeometry args={[14, 32, 32]} />
        <meshStandardMaterial
          map={moonTexture}
          emissiveMap={moonTexture}
          emissive="#c4d5f2"
          emissiveIntensity={Math.max(0.15, timeOfDay.moonIntensity * 1.5)}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Luz lunar nocturna con sombras suaves y destellos sobre nieve/hielo */}
      <directionalLight
        ref={moonLightRef}
        position={[moonX, moonY, moonZ]}
        intensity={Math.max(0.0, timeOfDay.moonIntensity * 0.85)}
        color="#cde2ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={550}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Luz hemisférica reactiva al color ambiental del ciclo y reflejo polar */}
      <hemisphereLight
        args={[timeOfDay.skyColor, timeOfDay.horizonColor, Math.max(0.35, timeOfDay.ambientIntensity * 0.95)]}
      />

      {/* Luz ambiental adaptativa día/noche para visualización nítida permanente del exotraje y terreno */}
      <ambientLight
        color={timeOfDay.ambientColor}
        intensity={Math.max(0.28, timeOfDay.ambientIntensity * 0.85)}
      />

      {/* Aurora Australis (Luces del Sur): cortinas de plasma verde y violeta en el firmamento */}
      <AuroraAustralis opacity={timeOfDay.starsOpacity} />

      {/* Nubes dinámicas reactivas al viento y al ciclo */}
      <Clouds timeOfDay={timeOfDay} />

      {/* Manto de Estrellas y Constelaciones Andinas */}
      <ConstellationsAndStars opacity={timeOfDay.starsOpacity} />
    </group>
  )
}

/**
 * Aurora Australis (Luces del Sur): cortinas celestes ondulantes de plasma esmeralda y violeta
 */
function AuroraAustralis({ opacity }: { opacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const currentBiome = useGameStore((state) => state.currentBiome)

  const { geometry, material } = useMemo(() => {
    // Sinuosidad en cilindro invertido amplio que envuelve el cielo polar
    const geo = new THREE.CylinderGeometry(410, 430, 110, 64, 16, true, Math.PI * 0.25, Math.PI * 1.5)
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uColorA: { value: new THREE.Color('#10b981') }, // Verde esmeralda polar
        uColorB: { value: new THREE.Color('#06b6d4') }, // Cian eléctrico
        uColorC: { value: new THREE.Color('#8b5cf6') }, // Violeta / magenta
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Ondulaciones sinuosas de cortina de plasma auroral
          float wave1 = sin(pos.x * 0.015 + uTime * 0.7) * cos(pos.z * 0.015 + uTime * 0.45) * 16.0;
          float wave2 = sin(pos.x * 0.035 - uTime * 0.9) * 7.0;
          pos.y += wave1 + wave2;
          pos.x += sin(pos.y * 0.03 + uTime * 0.5) * 8.0;
          vWave = wave1 + wave2;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec2 vUv;
        varying float vWave;
        void main() {
          float h = vUv.y;
          vec3 col = mix(uColorA, uColorB, smoothstep(0.12, 0.60, h));
          col = mix(col, uColorC, smoothstep(0.60, 0.95, h));
          
          float edgeFade = smoothstep(0.0, 0.22, h) * smoothstep(1.0, 0.65, h);
          float horizFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
          float curtainRibs = (0.70 + 0.30 * sin(vUv.x * 48.0 + vWave * 0.35));
          
          float alpha = uOpacity * edgeFade * horizFade * curtainRibs * 0.75;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })
    return { geometry: geo, material: mat }
  }, [])

  useFrame((state) => {
    if (!material) return
    const time = state.clock.getElapsedTime()
    material.uniforms.uTime.value = time

    const isPolarOrNight = currentBiome === 'antarctica' ? opacity * 1.35 : opacity * 0.6
    material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      material.uniforms.uOpacity.value,
      isPolarOrNight,
      0.08
    )
    if (meshRef.current) {
      meshRef.current.visible = material.uniforms.uOpacity.value > 0.01
    }
  })

  return <mesh ref={meshRef} position={[0, 90, 0]} geometry={geometry} material={material} />
}

/**
 * Firmamento con Estrellas Brillantes y Constelaciones Andinas (Cruz del Sur / Chakana, Orión)
 */
function ConstellationsAndStars({ opacity }: { opacity: number }) {
  const starsRef = useRef<THREE.Points>(null!)
  const constellationLinesRef = useRef<THREE.LineSegments>(null!)

  // Generar constelaciones identificables y miles de estrellas brillantes
  const { starGeometry, starMaterial, lineGeometry, lineMaterial } = useMemo(() => {
    const starCount = 1400
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    const colorWhite = new THREE.Color('#ffffff')
    const colorGold = new THREE.Color('#ffe19e')
    const colorCyan = new THREE.Color('#b8e6ff')
    const tempCol = new THREE.Color()

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 0.96)
      const radius = 340 + Math.random() * 60

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta)
      positions[idx + 1] = radius * Math.cos(phi) + 12
      positions[idx + 2] = radius * Math.sin(phi) * Math.sin(theta)

      const randCol = Math.random()
      if (randCol < 0.6) {
        tempCol.copy(colorWhite)
      } else if (randCol < 0.82) {
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

    const mat = new THREE.PointsMaterial({
      size: 3.4,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      fog: false,
      depthWrite: false,
    })

    // Definición geométrica de la Constelación Cruz del Sur (Chakana) y cinturón estelar
    // Conectadas por líneas suaves y tenues
    const linesPositions: number[] = []
    const addLine = (p1: [number, number, number], p2: [number, number, number]) => {
      linesPositions.push(...p1, ...p2)
    }

    // Cruz del Sur (visible hacia el sur-este elevado en la bóveda)
    const s1: [number, number, number] = [80, 240, -220]  // Alfa Crucis
    const s2: [number, number, number] = [95, 275, -220]  // Gamma Crucis
    const s3: [number, number, number] = [68, 258, -220]  // Beta Crucis
    const s4: [number, number, number] = [105, 255, -220] // Delta Crucis
    addLine(s1, s2)
    addLine(s3, s4)

    // Cinturón y paralelogramo de Orión
    const o1: [number, number, number] = [-110, 260, -210]
    const o2: [number, number, number] = [-120, 264, -205]
    const o3: [number, number, number] = [-130, 268, -200]
    addLine(o1, o2)
    addLine(o2, o3)
    const b1: [number, number, number] = [-100, 285, -210] // Betelgeuse
    const r1: [number, number, number] = [-140, 245, -200] // Rigel
    addLine(o2, b1)
    addLine(o2, r1)

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linesPositions, 3))

    const lineMat = new THREE.LineBasicMaterial({
      color: '#8ec5fc',
      transparent: true,
      opacity: 0,
      fog: false,
      depthWrite: false,
    })

    return {
      starGeometry: geo,
      starMaterial: mat,
      lineGeometry: lineGeo,
      lineMaterial: lineMat,
    }
  }, [])

  // Parpadeo suave y rotación sutil
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (starsRef.current) {
      starsRef.current.rotation.y = time * 0.003
    }
    if (constellationLinesRef.current) {
      constellationLinesRef.current.rotation.y = time * 0.003
    }

    if (opacity > 0.01) {
      const twinkle = Math.sin(time * 3.5) * 0.06
      const currentOp = Math.max(0, Math.min(1, opacity + twinkle))
      starMaterial.opacity = currentOp
      lineMaterial.opacity = currentOp * 0.35 // Líneas suaves de constelación
      if (starsRef.current) starsRef.current.visible = true
      if (constellationLinesRef.current) constellationLinesRef.current.visible = true
    } else {
      starMaterial.opacity = 0
      lineMaterial.opacity = 0
      if (starsRef.current) starsRef.current.visible = false
      if (constellationLinesRef.current) constellationLinesRef.current.visible = false
    }
  })

  return (
    <group>
      <points ref={starsRef} geometry={starGeometry} material={starMaterial} />
      <lineSegments ref={constellationLinesRef} geometry={lineGeometry} material={lineMaterial} />
    </group>
  )
}

try {
  useTexture.preload(getAssetPath('/textures/moon.jpg'))
} catch {
  // Ignorar en entorno estático
}
