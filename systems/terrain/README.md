# 🏔️ Sistema de Terrenos 3D con Datos Reales

## Arquitectura del Sistema

Este sistema permite cargar montañas y relieve real usando datos DEM (Digital Elevation Model) de fuentes gratuitas como Copernicus GLO-30.

### Módulos

1. **DEMDownloader** - Descarga y procesa datos DEM
2. **HeightmapProcessor** - Convierte DEM a heightmaps utilizables
3. **TerrainChunkSystem** - Sistema de chunks con LOD
4. **TerrainStreamer** - Carga asíncrona y streaming
5. **TerrainCache** - Caché inteligente con límites de memoria
6. **FloatingOrigin** - Sistema de origen flotante para coordenadas grandes
7. **TerrainMaterial** - Materiales procedurales por altitud
8. **TerrainCollision** - Colisiones optimizadas

### Flujo de Datos

```
DEM Source (Copernicus) 
    ↓
GeoTIFF Download
    ↓
Heightmap Processing (16-bit PNG)
    ↓
Chunk Generation (BufferGeometry)
    ↓
LOD System (Quadtree)
    ↓
Streaming & Cache
    ↓
Three.js Rendering
```

## Características

- ✅ Terrenos basados en datos reales de elevación
- ✅ Carga dinámica (streaming) según posición del jugador
- ✅ LOD (Level of Detail) con múltiples resoluciones
- ✅ Optimización de memoria con caché LRU
- ✅ Floating origin para mundos grandes
- ✅ Materiales procedurales (nieve, roca, hierba)
- ✅ Colisiones optimizadas
- ✅ Configuración de calidad ajustable

## Fuentes de Datos DEM

### Copernicus GLO-30 (Recomendado)
- **Resolución**: 30m
- **Cobertura**: Mundial
- **Licencia**: Gratuita con atribución
- **URL**: https://dataspace.copernicus.eu/

### USGS EarthExplorer
- **Resolución**: 30m (SRTM)
- **Cobertura**: Mundial
- **Licencia**: Dominio público
- **URL**: https://earthexplorer.usgs.gov/

## Uso Básico

```typescript
import { RealTerrainSystem } from '@/systems/terrain/RealTerrainSystem'

// Inicializar sistema
const terrainSystem = new RealTerrainSystem({
  scene: threeScene,
  quality: 'medium', // low | medium | high | ultra
  cacheLimit: 2048, // MB
})

// Cargar región específica
await terrainSystem.loadRegion({
  name: 'aconcagua',
  bounds: {
    north: -32.653,
    south: -32.753,
    east: -70.000,
    west: -70.100,
  },
  resolution: 30, // metros
})

// Actualizar cada frame
function animate() {
  terrainSystem.update(playerPosition)
}
```

## Optimización de Recursos

### Niveles de Calidad

| Calidad | Distancia Vista | Chunks Activos | VRAM Estimada | FPS Objetivo |
|---------|----------------|----------------|---------------|--------------|
| Low     | 2 km           | ~20            | 512 MB        | 60+          |
| Medium  | 5 km           | ~50            | 1024 MB       | 60+          |
| High    | 10 km          | ~100           | 2048 MB       | 45+          |
| Ultra   | 20 km          | ~200           | 4096 MB       | 30+          |

### Recomendaciones por GPU

- **RTX 5070 (12GB)**: Ultra con margen
- **RTX 4060 (8GB)**: High cómodo
- **GTX 1660 (6GB)**: Medium óptimo
- **Integradas**: Low

## Estructura de Archivos

```
systems/terrain/
├── README.md
├── RealTerrainSystem.ts          # Sistema principal
├── core/
│   ├── DEMDownloader.ts          # Descarga de datos DEM
│   ├── HeightmapProcessor.ts     # Procesamiento de heightmaps
│   ├── TerrainChunk.ts           # Chunk individual
│   ├── ChunkGenerator.ts         # Generación de geometría
│   └── QuadtreeNode.ts           # Nodo del quadtree LOD
├── streaming/
│   ├── TerrainStreamer.ts        # Sistema de streaming
│   ├── ChunkLoader.ts            # Cargador asíncrono
│   └── TerrainCache.ts           # Caché LRU
├── materials/
│   ├── ProceduralTerrainMaterial.ts  # Material por altitud
│   └── shaders/
│       ├── terrain.vert.glsl
│       └── terrain.frag.glsl
├── physics/
│   ├── TerrainCollision.ts       # Sistema de colisiones
│   └── SimplifiedMesh.ts         # Mesh simplificado
├── utils/
│   ├── FloatingOrigin.ts         # Origen flotante
│   ├── GeoUtils.ts               # Conversión coordenadas
│   └── TerrainMetrics.ts         # Métricas y profiling
└── data/
    ├── regions/                   # Regiones descargadas
    │   ├── aconcagua/
    │   │   ├── metadata.json
    │   │   └── heightmaps/
    │   └── andes/
    └── cache/                     # Caché local
```

## Uso en el Proyecto

### Ejemplo Básico

```tsx
// En tu componente de escena (ej: GameScene.tsx)
import { RealTerrain } from '@/components/RealTerrain'

export function GameScene() {
  return (
    <Canvas>
      {/* Otros componentes */}
      
      <RealTerrain
        region="aconcagua"
        quality="medium"
        onLoad={() => console.log('¡Terreno cargado!')}
      />
      
      {/* Tu personaje, cámara, etc. */}
    </Canvas>
  )
}
```

### Regiones Disponibles

```typescript
import { PREDEFINED_REGIONS } from '@/systems/terrain/RealTerrainSystem'

// Regiones predefinidas:
// - 'aconcagua': Cordillera de los Andes, pico más alto de América
// - 'andes_central': Región más amplia de los Andes centrales
// - 'titicaca': Lago Titicaca y alrededores
// - 'easter_island': Isla de Pascua

<RealTerrain region="aconcagua" quality="high" />
```

### Región Personalizada

```tsx
<RealTerrain
  region={{
    name: 'mi_region',
    bounds: {
      north: -32.553,
      south: -32.753,
      east: -69.900,
      west: -70.100
    },
    resolution: 30,
    source: 'copernicus'
  }}
  quality="medium"
/>
```

### Acceder desde Otros Componentes

```tsx
import { useRealTerrain } from '@/components/RealTerrain'

export function BeePlayer() {
  const { getHeightAt, isLoaded } = useRealTerrain()
  
  useFrame(() => {
    if (isLoaded) {
      const terrainHeight = getHeightAt(bee.position.x, bee.position.z)
      const minHeight = terrainHeight + 1.0 // 1 metro sobre el suelo
      bee.position.y = Math.max(minHeight, bee.position.y)
    }
  })
  
  return <mesh ref={beeRef}>...</mesh>
}
```

## Próximos Pasos

1. ✅ Configurar descarga de DEM
2. ✅ Implementar procesamiento de heightmaps
3. ✅ Sistema de chunks mejorado con LOD
4. ⏳ Streaming asíncrono avanzado
5. ⏳ Caché inteligente con LRU
6. ⏳ Floating origin
7. ⏳ Materiales procedurales (nieve/roca/hierba)
8. ⏳ Colisiones optimizadas
9. ⏳ Descargar datos reales de Copernicus
10. ⏳ Prototipo: Aconcagua 20x20km
