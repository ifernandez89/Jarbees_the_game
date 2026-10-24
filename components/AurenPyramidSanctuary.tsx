'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import { getAssetPath } from '@/utils/assetPath'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

/**
 * Dimensiones Oficiales Reales de la Gran Pirámide de Guiza (Keops):
 * - Base cuadrada: 230.34 m de lado (Perímetro ~921.36 m)
 * - Altura original con piramidión: 146.60 m
 * - Altura actual consolidada: 138.80 m
 */
const GIZA_REAL_BASE_WIDTH = 230.34
const GIZA_REAL_BASE_DEPTH = 230.34
const GIZA_REAL_HEIGHT = 138.80

// Cota de base sobre el lecho del valle en Blood Falls / Valle de Taylor
const BASE_GROUND_Y = 1.85

/**
 * Posición del centro geométrico de la pirámide:
 * La pirámide mide 230.34 m de base (semiancho 115.17 m).
 * Rotada 180° en Y, su monumental umbral/portal de entrada queda en su cara frontal (-Z),
 * a una distancia de ~115.17 m hacia el frente del centro.
 * Situando el centro en Z = +118.0:
 * El umbral del portal queda exactamente en Z = +2.83,
 * situando a Auren en (0, 2.0, 0) sobre la gran plataforma de lanzamiento/despliegue
 * justo frente a la puerta de entrada a su casa.
 */
const PYRAMID_CENTER_X = 0.0
const PYRAMID_CENTER_Y = BASE_GROUND_Y
const PYRAMID_CENTER_Z = 118.0

/**
 * Obelisco Cuántico Pylon
 * Pilares de nano-obsidiana con ranuras lumínicas que flanquean la calzada de entrada
 */
function QuantumPylon({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.65 + Math.sin(state.clock.elapsedTime * 2.5 + position[0]) * 0.25
    }
  })

  return (
    <group position={position}>
      {/* Columna monolítica de titanio y obsidiana */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 7.0, 0.9]} />
        <meshStandardMaterial color="#0b111a" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Vértice afilado */}
      <mesh position={[0, 7.5, 0]} castShadow>
        <coneGeometry args={[0.65, 1.2, 4]} />
        <meshStandardMaterial color="#E5A93C" roughness={0.15} metalness={0.95} />
      </mesh>
      {/* Ranura central fotónica cian */}
      <mesh ref={glowRef} position={[0, 3.5, 0.46]}>
        <planeGeometry args={[0.22, 5.5]} />
        <meshBasicMaterial
          color="#55F0FF"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * Santuario Pirámide de Auren (Gran Pirámide a Escala Real 1:1 de Guiza)
 * Acabado y Tratamiento Tecnológico Cuántico NEXO-01 para el Territorio Polar Natal
 */
export function AurenPyramidSanctuary() {
  const modelUrl = getAssetPath('/models/pyramid.jb3d')
  const gltf = useSecureGLTF(modelUrl) as GLTFResult

  // Referencias para animación continua
  const ringsRef = useRef<THREE.Group>(null)
  const beaconRaysRef = useRef<THREE.Group>(null)
  const apexEnergyRef = useRef<THREE.Mesh>(null)
  const daisEmblemRef = useRef<THREE.Mesh>(null)
  const pyramidMeshGroupRef = useRef<THREE.Group>(null)

  // Uniform temporal compartido para el pulso de energía cuántica en el shader de la pirámide
  const customShaderUniforms = useMemo(
    () => ({
      uAurenTime: { value: 0 },
      uPulseColor: { value: new THREE.Color('#55F0FF') },
      uGoldColor: { value: new THREE.Color('#E5A93C') },
    }),
    []
  )

  // Clonar la escena y calibrar escala real a la Gran Pirámide de Guiza
  const { clonedScene, calculatedScale } = useMemo(() => {
    if (!gltf.scene) {
      return { clonedScene: null, calculatedScale: new THREE.Vector3(1, 1, 1) }
    }

    const sceneClone = clone(gltf.scene)

    // Medir bounding box natural para derivar escala exacta a metros reales de Guiza
    const bbox = new THREE.Box3().setFromObject(sceneClone)
    const size = bbox.getSize(new THREE.Vector3())

    const sx = GIZA_REAL_BASE_WIDTH / Math.max(size.x, 0.001)
    const sy = GIZA_REAL_HEIGHT / Math.max(size.y, 0.001)
    const sz = GIZA_REAL_BASE_DEPTH / Math.max(size.z, 0.001)

    sceneClone.scale.set(sx, sy, sz)

    // Ajustar materiales para el acabado tecnológico de obsidiana y circuitos cuánticos
    sceneClone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true

        if (mesh.material) {
          const mat = (
            Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
          ) as THREE.MeshStandardMaterial

          mat.roughness = 0.32
          mat.metalness = 0.65
          mat.envMapIntensity = 1.35

          // Inyección de Shader onBeforeCompile: Pulso de energía cuántica ascendente
          const prevCompile = mat.onBeforeCompile
          mat.onBeforeCompile = (shader, renderer) => {
            if (prevCompile) prevCompile(shader, renderer)

            shader.uniforms.uAurenTime = customShaderUniforms.uAurenTime
            shader.uniforms.uPulseColor = customShaderUniforms.uPulseColor
            shader.uniforms.uGoldColor = customShaderUniforms.uGoldColor

            shader.vertexShader = `
              varying vec3 vAurenPyramidWorldPos;
              ${shader.vertexShader}
            `

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              vAurenPyramidWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
              `
            )

            shader.fragmentShader = `
              varying vec3 vAurenPyramidWorldPos;
              uniform float uAurenTime;
              uniform vec3 uPulseColor;
              uniform vec3 uGoldColor;
              ${shader.fragmentShader}
            `

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `
              #include <dithering_fragment>

              // Onda cuántica de energía que asciende periódicamente hacia el vértice
              float pulseWave = sin(vAurenPyramidWorldPos.y * 0.12 - uAurenTime * 3.5);
              float pulseSharp = smoothstep(0.82, 0.98, pulseWave);

              // Resonancia dorada en los estratos superiores (> 110m)
              float apexFactor = smoothstep(110.0, 140.0, vAurenPyramidWorldPos.y);
              vec3 energeticGlow = mix(uPulseColor, uGoldColor, apexFactor);

              // Adición emisiva de alta tecnología
              gl_FragColor.rgb += energeticGlow * (pulseSharp * 0.42 + apexFactor * 0.18);
              `
            )
          }

          mat.needsUpdate = true
        }
      }
    })

    return {
      clonedScene: sceneClone,
      calculatedScale: new THREE.Vector3(sx, sy, sz),
    }
  }, [gltf.scene, customShaderUniforms])

  // Geometría del rayo de luz atmosférico (Cilindro aditivo hacia la ionosfera)
  const apexY = PYRAMID_CENTER_Y + GIZA_REAL_HEIGHT

  // Loop de renderizado y animación de energía cuántica
  useFrame((state) => {
    const t = state.clock.elapsedTime
    customShaderUniforms.uAurenTime.value = t

    // 1. Rotación de aros orbitales sobre el piramidión de la cumbre
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.8
      ringsRef.current.rotation.x = Math.sin(t * 0.4) * 0.15
    }

    // 2. Pulso del haz de luz atmosférico
    if (apexEnergyRef.current) {
      const mat = apexEnergyRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.35 + Math.sin(t * 2.0) * 0.12
    }

    // 3. Rotación de aros holográficos de la plataforma de salida (dais)
    if (daisEmblemRef.current) {
      daisEmblemRef.current.rotation.z = -t * 0.6
    }
  })

  return (
    <group name="AurenPyramidSanctuary">
      {/* ========================================================================= */}
      {/* 1. MODELO MONUMENTAL DE LA GRAN PIRÁMIDE DE GUIZA (ESCALA 1:1 REAL)      */}
      {/* ========================================================================= */}
      {clonedScene && (
        <primitive
          ref={pyramidMeshGroupRef}
          object={clonedScene}
          position={[PYRAMID_CENTER_X, PYRAMID_CENTER_Y, PYRAMID_CENTER_Z]}
          rotation={[0, Math.PI, 0]} // Portal orientado hacia el frente (-Z) donde se encuentra Auren
        />
      )}

      {/* ========================================================================= */}
      {/* 2. PLATAFORMA DE SALIDA / APARICIÓN DE AUREN (SPAWN DAIS AT [0, 2.0, 0]) */}
      {/* ========================================================================= */}
      <group position={[0, 1.88, 0]}>
        {/* Plataforma base hexagonal de titanio oscuro */}
        <mesh receiveShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[5.2, 5.6, 0.22, 6]} />
          <meshStandardMaterial color="#0c121c" roughness={0.2} metalness={0.85} />
        </mesh>

        {/* Borde exterior iluminado cian de la plataforma */}
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.95, 5.15, 6]} />
          <meshBasicMaterial
            color="#55F0FF"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Aro concéntrico secundario en Aurelium Gold */}
        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.38, 32]} />
          <meshBasicMaterial
            color="#E5A93C"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Glifo holográfico rotatorio de colmena JarBees en el punto exacto de aparición */}
        <mesh ref={daisEmblemRef} position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.45, 6]} />
          <meshBasicMaterial
            color="#55F0FF"
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Emblema central de teletransporte / salida */}
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.55, 6]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Luz puntual de despliegue sobre los pies de Auren */}
        <pointLight position={[0, 0.8, 0]} color="#55F0FF" intensity={1.8} distance={8} />

        {/* Rótulo AR Holográfico flotante sobre la plataforma */}
        <Html position={[0, 3.2, -1.8]} center distanceFactor={16}>
          <div
            style={{
              padding: '6px 14px',
              background: 'rgba(10, 16, 26, 0.88)',
              border: '1px solid rgba(85, 240, 255, 0.65)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(85, 240, 255, 0.35)',
              color: '#F8FAFC',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ color: '#55F0FF', fontSize: '12px', marginBottom: '2px' }}>
              ⬡ SANTUARIO DE AUREN · ORIGEN
            </div>
            <div style={{ color: '#94A3B8', fontSize: '9px' }}>
              GRAN PIRÁMIDE (ESCALA REAL 138.8m · BASE 230m)
            </div>
          </div>
        </Html>
      </group>

      {/* ========================================================================= */}
      {/* 3. CALZADA Y OBELISCOS CUÁNTICOS QUE FLANQUEAN LA ENTRADA                 */}
      {/* ========================================================================= */}
      {/* Pareja de pilones en el acceso de spawn */}
      <QuantumPylon position={[-4.5, BASE_GROUND_Y, 1.2]} />
      <QuantumPylon position={[4.5, BASE_GROUND_Y, 1.2]} />

      {/* Pareja de pilones gigantes flanqueando el monumental portal de la pirámide */}
      <QuantumPylon position={[-16.0, BASE_GROUND_Y, 8.5]} />
      <QuantumPylon position={[16.0, BASE_GROUND_Y, 8.5]} />

      {/* Guías vectoriales lumínicas en el suelo que conectan la entrada con el spawn */}
      <mesh position={[-2.8, BASE_GROUND_Y + 0.05, 5.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 8.0]} />
        <meshBasicMaterial
          color="#55F0FF"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[2.8, BASE_GROUND_Y + 0.05, 5.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 8.0]} />
        <meshBasicMaterial
          color="#55F0FF"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ========================================================================= */}
      {/* 4. PIRAMIDIÓN DE AURELIUM EN LA CUMBRE (APEX CAPSTONE A 140.6m DE ALTURA) */}
      {/* ========================================================================= */}
      <group position={[PYRAMID_CENTER_X, apexY, PYRAMID_CENTER_Z]}>
        {/* Piramidión dorado monolítico coronando el ápice */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <coneGeometry args={[3.2, 5.2, 4]} />
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.96}
            roughness={0.12}
            emissive="#E5A93C"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Plataforma superior de observación / aterrizaje aéreo (Flight Pad a 140m) */}
        <mesh position={[0, -0.2, 0]} receiveShadow>
          <cylinderGeometry args={[4.2, 4.6, 0.6, 4]} />
          <meshStandardMaterial color="#0c1420" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Aros orbitales de energía cuántica alrededor de la cumbre */}
        <group ref={ringsRef} position={[0, 2.5, 0]}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[4.8, 0.08, 16, 64]} />
            <meshBasicMaterial
              color="#55F0FF"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
            <torusGeometry args={[5.6, 0.06, 16, 64]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>

        {/* Faro / Haz de luz fotónico proyectado hacia la estratosfera */}
        <mesh ref={apexEnergyRef} position={[0, 250, 0]}>
          <cylinderGeometry args={[0.8, 3.2, 500, 16, 1, true]} />
          <meshBasicMaterial
            color="#55F0FF"
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Luz omnidireccional de la cumbre */}
        <pointLight position={[0, 3.5, 0]} color="#55F0FF" intensity={3.5} distance={75} />
      </group>
    </group>
  )
}

// Precarga estática del modelo seguro
try {
  useSecureGLTF.preload(getAssetPath('/models/pyramid.jb3d'))
} catch {
  // Ignorar errores en preload
}
