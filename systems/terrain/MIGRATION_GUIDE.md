# 🔄 Guía de Migración: Terreno Procedural → Terreno Real

Esta guía te ayudará a migrar del sistema de terreno procedural actual al nuevo sistema con datos DEM reales.

## Comparación de Sistemas

### Sistema Antiguo (Procedural)
```tsx
import { InfiniteTerrain } from '@/components/InfiniteTerrain'

<InfiniteTerrain biome="titicaca" seed={12345} />
```

**Características:**
- ✅ Terreno infinito procedural
- ✅ Múltiples biomas
- ✅ Fácil de usar
- ❌ No representa geografía real
- ❌ Sin montañas auténticas

### Sistema Nuevo (Real DEM)
```tsx
import { RealTerrain } from '@/components/RealTerrain'

<RealTerrain region="aconcagua" quality="medium" />
```

**Características:**
- ✅ Montañas y relieve reales
- ✅ Datos de Copernicus/USGS
- ✅ LOD optimizado
- ✅ Streaming dinámico
- ✅ Regiones geográficas reales
- ⚠️ Requiere datos DEM (procedural como fallback)

## Migración Paso a Paso

### Paso 1: Mantener Compatibilidad

Puedes mantener ambos sistemas temporalmente:

```tsx
import { InfiniteTerrain } from '@/components/InfiniteTerrain'
import { RealTerrain } from '@/components/RealTerrain'

export function GameScene() {
  const [useRealTerrain, setUseRealTerrain] = useState(false)
  
  return (
    <Canvas>
      {useRealTerrain ? (
        <RealTerrain region="aconcagua" quality="medium" />
      ) : (
        <InfiniteTerrain biome="titicaca" />
      )}
      
      <button onClick={() => setUseRealTerrain(!useRealTerrain)}>
        Cambiar Terreno
      </button>
    </Canvas>
  )
}
```

### Paso 2: Actualizar BeePlayer

El nuevo sistema es compatible con la API de `getHeightAt`:

```tsx
// ANTES (con InfiniteTerrain)
const terrainManager = useGameStore((state) => state.terrainManager)
const terrainHeight = terrainManager?.getHeightAt(x, z) ?? 0

// DESPUÉS (con RealTerrain) - ¡Misma API!
const terrainManager = useGameStore((state) => state.terrainManager)
const terrainHeight = terrainManager?.getHeightAt(x, z) ?? 0
```

No necesitas cambiar código en tu jugador/personaje.

### Paso 3: Ajustar Configuración de Calidad

```tsx
// Configuración básica
<RealTerrain region="aconcagua" quality="medium" />

// Configuración avanzada
<RealTerrain
  region="aconcagua"
  quality="high"
  chunkSize={1000}      // 1km por chunk
  viewDistance={10000}  // 10km de visión
  onLoad={() => {
    console.log('Terreno cargado, iniciar juego')
  }}
/>
```

### Paso 4: Optimizar Rendimiento

```tsx
import { useRealTerrain } from '@/components/RealTerrain'

function QualitySettings() {
  const { setQuality, getStats } = useRealTerrain()
  
  // Ajustar calidad dinámicamente según FPS
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = getStats()
      if (stats && stats.fps < 30) {
        console.warn('FPS bajo, reduciendo calidad')
        setQuality('low')
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div>
      <button onClick={() => setQuality('low')}>Bajo</button>
      <button onClick={() => setQuality('medium')}>Medio</button>
      <button onClick={() => setQuality('high')}>Alto</button>
    </div>
  )
}
```

## Mapeo de Biomas a Regiones

Si usabas biomas específicos, aquí están las equivalencias:

| Bioma Antiguo | Región Nueva | Notas |
|--------------|--------------|-------|
| `titicaca` | `'titicaca'` | Mismo nombre, datos reales |
| `easter_island` | `'easter_island'` | Mismo nombre, datos reales |
| `constellations` | N/A | No tiene equivalente geográfico |
| Custom procedural | Usar `region` personalizada | Ver ejemplo abajo |

### Ejemplo de Región Personalizada

```tsx
<RealTerrain
  region={{
    name: 'mi_mundo',
    bounds: {
      north: -30.0,
      south: -35.0,
      east: -68.0,
      west: -73.0
    },
    resolution: 30,
    source: 'copernicus'
  }}
  quality="medium"
/>
```

## Modo Híbrido (Recomendado)

Combina terreno real para áreas específicas y procedural para el resto:

```tsx
function HybridTerrain() {
  const playerPosition = useGameStore((state) => state.beePosition)
  const [mode, setMode] = useState<'real' | 'procedural'>('procedural')
  
  useEffect(() => {
    // Cambiar a terreno real cuando el jugador se acerque a la región
    if (isPlayerNearRegion(playerPosition, PREDEFINED_REGIONS.aconcagua)) {
      setMode('real')
    } else {
      setMode('procedural')
    }
  }, [playerPosition])
  
  return (
    <>
      {mode === 'real' ? (
        <RealTerrain region="aconcagua" quality="high" />
      ) : (
        <InfiniteTerrain biome="titicaca" />
      )}
    </>
  )
}
```

## Solución de Problemas

### "Heightmap not found"

El sistema generará automáticamente terreno procedural como fallback:

```tsx
<RealTerrain
  region="aconcagua"
  quality="medium"
  onError={(error) => {
    console.warn('Usando terreno procedural:', error.message)
  }}
/>
```

### Performance Bajo

1. Reducir calidad: `quality="low"`
2. Reducir distancia de visión: `viewDistance={2000}`
3. Aumentar tamaño de chunks: `chunkSize={2000}`

### Colisiones Incorrectas

El sistema nuevo usa la misma API `getHeightAt`, pero verifica que estés llamándolo después de que el terreno esté cargado:

```tsx
const { getHeightAt, isLoaded } = useRealTerrain()

if (isLoaded) {
  const height = getHeightAt(x, z)
  // usar height...
}
```

## Checklist de Migración

- [ ] Importar `RealTerrain` en tu escena
- [ ] Reemplazar `<InfiniteTerrain>` con `<RealTerrain>`
- [ ] Ajustar preset de calidad según tu GPU
- [ ] Probar colisiones con el terreno
- [ ] Optimizar rendimiento si es necesario
- [ ] Configurar región geográfica deseada
- [ ] (Opcional) Implementar modo híbrido
- [ ] (Opcional) Descargar datos DEM reales

## Preguntas Frecuentes

**P: ¿Puedo usar ambos sistemas simultáneamente?**
R: Sí, pero consume más memoria. Recomendamos alternar según la zona del mapa.

**P: ¿Necesito descargar datos DEM?**
R: No, el sistema genera terreno procedural como fallback si no encuentra datos.

**P: ¿Cómo obtengo datos DEM reales?**
R: Ver [TERRAIN_DOWNLOAD_GUIDE.md](./TERRAIN_DOWNLOAD_GUIDE.md) (próximamente)

**P: ¿Funciona con el sistema de vuelo de Auren?**
R: Sí, totalmente compatible. El sistema usa `getHeightAt` como el anterior.

**P: ¿Puedo crear mis propias regiones?**
R: Sí, pasa un objeto `DEMRegion` personalizado al prop `region`.

## Soporte

Si encuentras problemas durante la migración:

1. Revisa la consola del navegador para errores
2. Verifica que `terrainManager` esté en el gameStore
3. Comprueba que el componente esté dentro de `<Canvas>`
4. Consulta los ejemplos en `/systems/terrain/examples/`

## Próximos Pasos

Una vez migrado, considera:

1. Optimizar materiales procedurales (nieve, roca, hierba)
2. Implementar sistema de caché persistente
3. Descargar regiones DEM reales
4. Configurar floating origin para mundos muy grandes
