'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { GeoProjector, type GeoCoordinate, type WorldPoint3D, calculateHaversineDistance } from '@/utils/geoProjection'
import { getAssetPath } from '@/utils/assetPath'
import ANTARCTICA_DEFAULT_GUIDE from '@/public/data/guides/antarctica_taylor_guide.json'
import ACONCAGUA_DEFAULT_GUIDE from '@/public/data/guides/aconcagua_guide.json'

interface WaypointData {
  lat: number
  lon: number
  name: string
}

interface RouteData {
  id: string
  name: string
  type: string
  color: string
  pulseColor: string
  width: number
  waypoints: WaypointData[]
}

interface PlaceData {
  id: string
  name: string
  type: string
  elevation: number
  coordinates: GeoCoordinate
  color: string
  highlight?: boolean
  description?: string
}

interface GuideData {
  region: string
  name: string
  origin: {
    id: string
    name: string
    coordinates: GeoCoordinate
    description?: string
  }
  places: PlaceData[]
  routes: RouteData[]
}

/**
 * Pin Holográfico 3D estilo Realidad Aumentada (AR)
 * Réplica exacta del pin con aro luminoso y aguja de la imagen de referencia.
 */
function HoloPin({
  place,
  position,
  playerPos,
}: {
  place: PlaceData
  position: WorldPoint3D
  playerPos: [number, number, number]
}) {
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Calcular distancia en tiempo real
  const dx = position.x - playerPos[0]
  const dz = position.z - playerPos[2]
  const distanceMeters = Math.hypot(dx, dz)

  const distanceText =
    distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} km`
      : `${Math.round(distanceMeters)} m`

  // Pulso de rotación y brillo continuo
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 1.5
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08
      ringRef.current.scale.set(s, s, s)
    }
  })

  // Desvanecer tags muy lejanos para evitar saturación visual (> 1500m)
  const isCloseEnough = distanceMeters < 1800

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* 1. Aguja de luz vertical proyectada hacia el suelo */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
        <meshBasicMaterial
          color={place.color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Faro / Pin Head con aro luminoso (como en la foto del usuario) */}
      <group position={[0, 0.25, 0]}>
        {/* Cuerpo del marcador */}
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial
            color={place.color}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Anillo exterior de energía brillante */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.035, 12, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Halo resplandeciente */}
        <mesh>
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshBasicMaterial
            color={place.color}
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            wireframe
          />
        </mesh>
      </group>

      {/* 3. Etiqueta Holográfica AR (Texto flotante sin tapar el terreno) */}
      {isCloseEnough && (
        <Html
          position={[0, 0.85, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontFamily: 'monospace, -apple-system, sans-serif',
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            {/* Tag principal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(5, 12, 25, 0.75)',
                border: `1px solid ${place.color}`,
                boxShadow: `0 0 14px ${place.color}88, inset 0 0 8px ${place.color}44`,
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: place.color,
                  boxShadow: `0 0 6px ${place.color}`,
                }}
              />
              <span>{place.name}</span>
              <span
                style={{
                  fontSize: '9px',
                  color: '#94a3b8',
                  paddingLeft: '4px',
                  borderLeft: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {distanceText}
              </span>
            </div>

            {/* Subtítulo con elevación */}
            {place.elevation !== undefined && (
              <div
                style={{
                  fontSize: '8.5px',
                  color: '#67e8f9',
                  marginTop: '2px',
                  textShadow: '0 0 4px rgba(0,240,255,0.8)',
                  letterSpacing: '0.4px',
                }}
              >
                ALT: {place.elevation.toLocaleString()}m
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Ruta Holográfica con pulsos dinámicos de luz que viajan por el camino
 */
function HoloRoute({
  route,
  projector,
  getHeight,
  hipOffset = 1.15,
}: {
  route: RouteData
  projector: GeoProjector
  getHeight: (x: number, z: number) => number
  hipOffset?: number
}) {
  const pulseSphereRef = useRef<THREE.Mesh>(null)

  // Proyectar todos los waypoints a coordenadas 3D a la altura de la cadera
  const points = useMemo(() => {
    return route.waypoints.map((wp) => {
      const p = projector.project(
        { lat: wp.lat, lon: wp.lon },
        getHeight,
        hipOffset
      )
      return new THREE.Vector3(p.x, p.y, p.z)
    })
  }, [route.waypoints, projector, getHeight, hipOffset])

  // Crear curva para interpolación suave de los pulsos de datos
  const curve = useMemo(() => {
    if (points.length < 2) return null
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2)
  }, [points])

  // Animación del pulso de luz viajando por la ruta
  useFrame((state) => {
    if (!curve || !pulseSphereRef.current) return
    const t = (state.clock.elapsedTime * 0.25) % 1.0
    const pos = curve.getPointAt(t)
    pulseSphereRef.current.position.copy(pos)
  })

  if (points.length < 2) return null

  return (
    <group>
      {/* 1. Línea brillante del camino con mezcla aditiva */}
      <Line
        points={points}
        color={route.color}
        lineWidth={route.width || 2.5}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />

      {/* 2. Pulso de datos / luz que viaja a lo largo de la ruta (idéntico a la imagen) */}
      {curve && (
        <mesh ref={pulseSphereRef}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshBasicMaterial
            color={route.pulseColor || '#ffffff'}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* 3. Balizas en cada nodo del camino */}
      {points.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial
            color={route.color}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Componente Principal: Overlay Táctico Holográfico AR
 */
export function HoloTacticalOverlay() {
  const isHoloMapActive = useGameStore((state) => state.isHoloMapActive)
  const currentBiome = useGameStore((state) => state.currentBiome)
  const playerPosition = useGameStore((state) => state.position)
  const terrainManager = useGameStore((state) => state.terrainManager)

  // Seleccionar guía empaquetada según el bioma activo del jugador
  const initialGuide = useMemo(() => {
    if (currentBiome === 'aconcagua') {
      return ACONCAGUA_DEFAULT_GUIDE as unknown as GuideData
    }
    return ANTARCTICA_DEFAULT_GUIDE as unknown as GuideData
  }, [currentBiome])

  const [guide, setGuide] = useState<GuideData>(initialGuide)
  const [loading, setLoading] = useState(false)

  // Actualizar guía al cambiar de bioma
  useEffect(() => {
    setGuide(initialGuide)
  }, [initialGuide])

  // Opcional: refresco o carga dinámica con resolución de ruta para GitHub Pages (/Jarbees_the_game/...)
  useEffect(() => {
    let mounted = true
    const fileName =
      currentBiome === 'aconcagua'
        ? 'aconcagua_guide.json'
        : 'antarctica_taylor_guide.json'
    const guideUrl = getAssetPath(`/data/guides/${fileName}`)

    fetch(guideUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status} al cargar guía: ${guideUrl}`)
        return res.json()
      })
      .then((data: GuideData) => {
        if (mounted && data) {
          setGuide(data)
        }
      })
      .catch((err) => {
        console.info('[HoloTacticalOverlay] Usando guía táctica bundled base:', err?.message || err)
      })

    return () => {
      mounted = false
    }
  }, [currentBiome])

  // Inicializar proyector geográfico centrado en el origen de despliegue (Blood Falls)
  const projector = useMemo(() => {
    if (!guide) return null
    return new GeoProjector(guide.origin.coordinates, 1.0)
  }, [guide])

  // Función para obtener la altura del terreno debajo de cada punto
  const getHeight = useMemo(() => {
    return (x: number, z: number) => {
      if (terrainManager && typeof terrainManager.getHeightAt === 'function') {
        return terrainManager.getHeightAt(x, z)
      }
      return 0
    }
  }, [terrainManager])

  // Calcular posiciones 3D de los sitios de interés
  const projectedPlaces = useMemo(() => {
    if (!guide || !projector) return []
    return guide.places.map((place) => {
      const p3d = projector.project(
        place.coordinates,
        getHeight,
        1.15, // A la altura de la cadera
        2500 // Comprimir hitos ultra-distantes hacia el horizonte
      )
      return {
        place,
        position: p3d,
      }
    })
  }, [guide, projector, getHeight])

  if (!isHoloMapActive || !guide || !projector || loading) {
    return null
  }

  return (
    <group name="HoloTacticalOverlay">
      {/* Rutas con vectores de neón y pulsos de datos */}
      {guide.routes.map((route) => (
        <HoloRoute
          key={route.id}
          route={route}
          projector={projector}
          getHeight={getHeight}
          hipOffset={1.15}
        />
      ))}

      {/* Pines holográficos de sitios importantes */}
      {projectedPlaces.map(({ place, position }) => (
        <HoloPin
          key={place.id}
          place={place}
          position={position}
          playerPos={playerPosition}
        />
      ))}
    </group>
  )
}
export default HoloTacticalOverlay
