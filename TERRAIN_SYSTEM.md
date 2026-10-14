# 🏔️ SISTEMA DE TERRENO INFINITO - Documentación Técnica

## 📋 Resumen

El sistema de terreno infinito de JarBees utiliza **chunks procedurales** generados con **Perlin Noise** que se crean y destruyen dinámicamente según la posición del jugador.

---

## 🧩 Arquitectura

### 1. Perlin Noise Generator (`utils/perlinNoise.ts`)

Generador de ruido procedural basado en `simplex-noise`.

**Características:**
- Múltiples octavas para detalle (por defecto: 4)
- Persistencia y lacunarity configurables
- Seed opcional para resultados reproducibles
- Funciones especializadas:
  - `get(x, z)`: Valor de ruido normalizado (0-1)
  - `getHeight(x, z, multiplier)`: Altura del terreno
  - `getVegetationDensity(x, z)`: Densidad de vegetación (0-1)
  - `generateHeightMap()`: Grid completo de alturas

**Presets por bioma:**
```typescript
titicaca: {
  octaves: 4,
  scale: 150,
  heightMultiplier: 8,  // Colinas suaves
}

easter_island: {
  octaves: 5,
  scale: 100,
  heightMultiplier: 15, // Montañas volcánicas
}

constellations: {
  octaves: 3,
  scale: 200,
  heightMultiplier: 3,  // Terreno plano
}
```

---

### 2. Chunk Manager (`systems/ChunkManager.ts`)

Sistema de gestión de chunks con pool de reutilización.

**Configuración:**
```typescript
{
  size: 100,              // Tamaño del chunk (100x100 unidades)
  resolution: 5,          // Distancia entre vértices (5 unidades)
  viewDistance: 200,      // Radio de renderizado
  heightMultiplier: 8,    // Multiplicador de altura
  color: '#7CFC00',       // Color del material
}
```

**Funciones principales:**
- `updateChunks(playerX, playerZ)`: Actualiza chunks según posición
- `getActiveChunks()`: Lista de chunks visibles
- `getHeightAt(x, z)`: Altura del terreno en cualquier punto
- `dispose()`: Limpieza de memoria

**Sistema de coordenadas:**
```
Mundo → Chunk: floor(worldPos / chunkSize)
Chunk → Mundo: chunkCoord * chunkSize
```

**Ejemplo:**
```
Player en (250, 0, 150)
→ Chunk (2, 1)
→ Chunks visibles: 3x3 grid centrado en (2, 1)
```

---

### 3. Infinite Terrain Component (`components/InfiniteTerrain.tsx`)

Componente React que conecta ChunkManager con Three.js.

**Props:**
```typescript
{
  biome?: 'titicaca' | 'easter_island' | 'constellations'
  seed?: number  // Seed para reproducibilidad
}
```

**Optimizaciones:**
- `useMemo` para ChunkManager (evita recreación)
- Pool de chunks reutilizables
- Limpieza automática de chunks inactivos
- Registro en gameStore para acceso global

---

## 🎮 Integración con BeePlayer

El BeePlayer detecta la altura del terreno en tiempo real:

```typescript
if (terrainManager) {
  const terrainHeight = terrainManager.getHeightAt(
    bee.position.x, 
    bee.position.z
  )
  minHeight = terrainHeight + 1.0 // 1 metro sobre el suelo
}

bee.position.y = Math.max(minHeight, bee.position.y)
```

---

## 📊 Performance

### Estadísticas

**Configuración actual:**
- Chunk size: 100x100 unidades
- Resolution: 5 unidades
- Segmentos por chunk: 20x20 = 400 quads = 800 tris
- View distance: 200 unidades
- Chunks activos simultáneos: ~9 (3x3 grid)
- Polígonos totales: ~7,200 tris

**Optimizaciones aplicadas:**
- Pool de chunks (reutilización de geometría)
- Limpieza automática de chunks inactivos
- Flat shading desactivado (normales suaves)
- Sombras desactivadas en chunks (solo receive)

**FPS esperado:**
- Desktop: 60+ FPS
- Mobile: 30+ FPS (pendiente optimizar)

---

## 🎨 Biomas Configurables

Cambiar bioma en GameScene.tsx:

```tsx
<InfiniteTerrain biome="titicaca" seed={12345} />
```

**Características por bioma:**

### Lago Titicaca
- Color: Verde césped `#7CFC00`
- Altura: Colinas suaves (8x)
- Vegetación: Densa

### Isla de Pascua
- Color: Marrón volcánico `#8B4513`
- Altura: Montañas pronunciadas (15x)
- Vegetación: Escasa

### Constelaciones
- Color: Gris oscuro `#1a1a2e`
- Altura: Plano (3x)
- Vegetación: Ninguna

---

## 🔧 Configuración Avanzada

### Cambiar resolución del terreno

En `InfiniteTerrain.tsx`:
```typescript
const baseConfig: ChunkConfig = {
  size: 100,
  resolution: 2,  // Más detalle (más vértices)
  // ...
}
```

⚠️ **Nota:** Menor resolution = más polígonos = menor FPS

### Cambiar distancia de renderizado

```typescript
const baseConfig: ChunkConfig = {
  // ...
  viewDistance: 300,  // Más chunks visibles
}
```

### Cambiar características del ruido

En `perlinNoise.ts`:
```typescript
new PerlinNoiseGenerator(
  seed,
  6,      // más octavas = más detalle
  0.7,    // más persistencia = más rugosidad
  2.5,    // más lacunarity = más variación
  80      // menor scale = más frecuencia
)
```

---

## 🐛 Debugging

### Visualizar chunks

Agregar en `InfiniteTerrain.tsx`:
```typescript
// Dentro del forEach de newChunks:
const wireframe = new THREE.LineSegments(
  new THREE.WireframeGeometry(chunkData.geometry),
  new THREE.LineBasicMaterial({ color: 0xff0000 })
)
mesh.add(wireframe)
```

### Mostrar coordenadas de chunks

En `GameHUD.tsx`:
```typescript
const chunkX = Math.floor(position[0] / 100)
const chunkZ = Math.floor(position[2] / 100)
console.log(`Current chunk: (${chunkX}, ${chunkZ})`)
```

---

## 🚀 Próximas Mejoras

### FASE 3 (Vegetación)
- [ ] Instanciado de árboles según densidad
- [ ] Variación de escala/rotación
- [ ] LOD para árboles distantes

### FASE 4 (Optimización)
- [ ] LOD para terreno (menos polígonos a distancia)
- [ ] Frustum culling manual
- [ ] Worker threads para generación de chunks
- [ ] Texture splatting (múltiples texturas)

### FASE 5 (Agua)
- [ ] Detección de zonas de agua (altura < 0)
- [ ] Plano de agua con reflejos
- [ ] Normal mapping animado

---

## 📚 Referencias

- [simplex-noise](https://github.com/jwagner/simplex-noise.js)
- [Three.js BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry)
- [Perlin Noise Wikipedia](https://en.wikipedia.org/wiki/Perlin_noise)
- [Procedural Terrain Generation](https://www.redblobgames.com/maps/terrain-from-noise/)

---

**Última actualización:** 14 de Octubre de 2026
