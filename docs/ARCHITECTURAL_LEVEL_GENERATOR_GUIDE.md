# 🏛️ Guía Técnica: Generador de Niveles Arquitectónicos para el Mundo de Auren
## Metodología "Plan-First, Geometry-Second" (Inspirada en Brush-Based Level Design / CS 1.6 & Blender)

> **Documento de Referencia de Ingeniería Arquitectónica y Diseño de Niveles**  
> **Proyecto:** JarBees: The Game / Auren WorldLab  
> **Fecha:** Octubre 2026  
> **Aprobado para:** Generación de edificaciones procedurales transitables (residencias, hangares, laboratorios, búnkeres y ciudades).

---

## 🎯 1. Filosofía: ¿Por qué "Plan-First, Geometry-Second"?

En el modelado procedural 3D tradicional o por IA, suele cometerse el error de "esculpir una casa" como una pieza hueca decorativa. Esto genera defectos críticos:
- Escaleras cuya parte superior choca contra un forjado ciego sin hueco de paso.
- Techos demasiado bajos donde el personaje se incrusta o la cámara colisiona.
- Puertas estrechas donde la cápsula de colisión se atasca.
- Habitaciones inaccesibles o desconectadas del grafo de navegación.

### La Lección de Counter-Strike 1.6 (Valve Hammer Editor / TrenchBroom)
Los mapas icónicos como `cs_assault` (el galpón de rehenes) o `de_chateau` (el caserón señorial) se construían mediante **brushes (volúmenes sólidos convexos)** con vistas ortogonales 2D:
1. **Un piso es un bloque sólido con espesor real.**
2. **Una abertura es un vano geométrico explícito**, nunca un recorte booleano ciego.
3. **Las escaleras definen un prisma de circulación vertical (hueco de forjado)** que corta físicamente la losa superior para garantizar altura libre continua (*headroom*).
4. **La escala está calibrada para el personaje**: la cápsula de colisión dicta las medidas mínimas de cada elemento.

---

## 📏 2. Estándares Antropométricos y de Jugabilidad (Métricas de Auren)

Todas las medidas en JarBees utilizan **1 Blender Unit (BU) = 1 metro**:

| Elemento | Dimensión Mínima | Dimensión Recomendada | Motivo / Jugabilidad |
|---|---|---|---|
| **Altura de Auren** | 1.85 m | 1.85 m | Escala de referencia del exo-traje NEXO-01 |
| **Ancho de Hombros / Cápsula** | 0.60 m | 0.80 m (radio 0.40m) | Radio del colisionador de raycast |
| **Altura libre bajo techos** | 2.60 m | **3.60 m – 4.50 m** | Espacio aéreo para saltos y cámara en 3ª persona |
| **Atrio / Gran Hall (Escala Assault)**| 6.00 m | **8.00 m – 9.00 m** | Doble altura para vuelo/planeo con pechera NEXO |
| **Ancho de puertas simples** | 1.00 m | **1.10 m – 1.20 m** | Tránsito cómodo sin fricción lateral de colisión |
| **Altura de puertas** | 2.10 m | **2.30 m – 2.40 m** | Altura libre con margen holgado sobre Auren |
| **Portones de Hangar / Carga** | 3.00 m | **3.60 m – 5.00 m** | Entrada de vehículos y acceso expedito |
| **Ancho de pasillos y Catwalks** | 1.20 m | **1.60 m – 2.00 m** | Pasarelas elevadas estilo `cs_assault` |
| **Ancho de escaleras** | 1.10 m | **1.30 m – 1.60 m** | Dos personas o Auren con margen lateral |
| **Peldaño: Huella (*Tread*)** | 0.26 m | **0.28 m – 0.30 m** | Pisada natural transitable |
| **Peldaño: Contrahuella (*Riser*)** | 0.16 m | **0.17 m – 0.19 m** | Subida suave sin saltos bruscos de raycast |
| **Altura libre en escalera (*Headroom*)** | 2.20 m | **≥ 2.40 m** | Ningún borde de forjado a menos de 2.40m de cada peldaño |
| **Hueco en forjado superior (*Slab Void*)** | Largo de escalera | **Proyección total + 1.2m descanso** | Apertura total sobre el tramo ascendente |

---

## 🗂️ 3. El Manifiesto Arquitectónico (`*.plan.json`)

El plano arquitectónico 2D en JSON es la **fuente única de verdad (Single Source of Truth)**. Ni Blender ni Three.js deciden dimensiones al azar; ambos consumen este contrato:

```json
{
  "buildingId": "villa_auren_assault_scale",
  "version": "2.0.0",
  "unit": "meter",
  "dimensions": {
    "site": { "x": 48.0, "y": 42.0 },
    "building": { "x": 30.0, "y": 20.0, "height": 8.8 },
    "characterHeight": 1.85
  },
  "levels": [
    {
      "id": "S1",
      "name": "Subsuelo / Lab NEXO",
      "elevation": -3.6,
      "ceilingHeight": 3.4,
      "slabThickness": 0.3,
      "rooms": [...],
      "stairs": [...],
      "slabVoids": [...]
    },
    {
      "id": "PB",
      "name": "Planta Baja / Gran Hangar",
      "elevation": 0.0,
      "ceilingHeight": 4.0,
      "slabThickness": 0.3,
      "rooms": [...],
      "stairs": [...],
      "slabVoids": [...]
    },
    {
      "id": "P1",
      "name": "Planta Alta / Catwalks & Suite",
      "elevation": 4.0,
      "ceilingHeight": 4.5,
      "slabThickness": 0.3,
      "rooms": [...],
      "stairs": [...],
      "slabVoids": [...]
    }
  ],
  "openings": [...],
  "connectivityGraph": [...]
}
```

---

## 🛡️ 4. Validador Geométrico Automatizado (`validate_architecture.py`)

Antes de iniciar cualquier proceso de modelado o apertura de Blender, se ejecuta la **Fase 2 de Validación**. Si un solo test falla, la compilación 3D se detiene:

### Batería de Pruebas Obligatorias:
1. **`CHECK_STAIR_HEADROOM`**:
   Para cada peldaño $i$ en posición $(x_i, y_i, z_i)$, calcula la distancia al forjado inmediatamente superior.
   $$\text{Headroom}_i = Z_{\text{slab\_bottom}} - z_i \ge 2.30\text{ m}$$
2. **`CHECK_SLAB_VOIDS`**:
   Comprueba que el prisma 3D de la escalera y sus descansos esté contenido dentro de un `slabVoid` registrado en el nivel superior.
3. **`CHECK_DOOR_CLEARANCES`**:
   Verifica que toda puerta tenga un ancho $\ge 1.10\text{ m}$ y alto $\ge 2.30\text{ m}$.
4. **`CHECK_CORRIDOR_WIDTHS`**:
   Verifica que los pasillos y pasarelas (*catwalks*) tengan ancho útil $\ge 1.50\text{ m}$.
5. **`CHECK_ROOM_CONNECTIVITY_GRAPH`**:
   Aplica el algoritmo **BFS (Breadth-First Search)** desde el spawn principal hasta todas las salas. Ninguna sala puede ser una isla aislada.
6. **`CHECK_SLAB_LEVEL_ALIGNMENT`**:
   Las cotas de llegada de las escaleras deben coincidir exactamente con la elevación de la losa del nivel de destino.

---

## 🧊 5. Principios de Modelado en Blender (`bpy`)

1. **Uso de Brushes Sólidos**:
   - Cada muro es un prisma cerrado con grosor real (muros perimetrales 0.40m, divisorios 0.25m).
   - Los suelos son losas prismáticas con espesor de 0.25m a 0.30m.
2. **Aberturas Limpias**:
   - Segmentar los muros en tramos (lado izquierdo, lado derecho, dintel superior) para crear vanos rectangulares matemáticamente limpios sin depender de operaciones booleanas que corrompan los vértices o las normales.
3. **Organización Estricta de Colecciones**:
   - `ARCH_Structure`: Cimientos, forjados, muros portantes y columnas.
   - `ARCH_Doors_Windows`: Marcos y carpinterías.
   - `ARCH_Roof`: Cerchas, techos a dos aguas y claraboyas.
   - `NAV_Walkable`: Superficies transitables (losas, peldaños, rampas) etiquetadas para exportación.
   - `COL_Colliders`: Cajas de colisión convexas para raycasting Three.js.
   - `META_InteractionPoints`: Empties para spawns, consolas interactivas y puntos de aterrizaje.
4. **UVs Métricas y PBR**:
   - Mapeo UV cúbico a escala 1:1 métrica, de modo que las texturas de piedra, madera y ladrillo no se estiren al cambiar las dimensiones de los muros.

---

## 🎮 6. Integración en el Motor WebGL (Three.js / React Three Fiber)

1. **Carga y Raycasting**:
   - Se carga el binario `villa_auren.glb` con `useGLTF`.
   - Se registra toda la escena en `GroundCollisionManager.ts` mediante `setGroundCollider(gltf.scene)`.
2. **HUD y Detección de Zonas**:
   - El archivo `villa_auren.world.json` define las cajas volumétricas `bounds: { min: [x,y,z], max: [x,y,z] }` de cada sala.
   - Un loop en `VillaAurenHub.tsx` evalúa la posición de Auren cada frame y actualiza el indicador holográfico (`Atrio Principal`, `Taller NEXO`, `Catwalk P1`, `Lab Cuántico`).
3. **Explanada en el Mundo Infinito**:
   - `ChunkManager.ts` aplana el terreno procedural en un radio de 60m alrededor de la casa para que ninguna colina procedural perfore el suelo.

---

## 📋 7. Cómo Crear un Nuevo Edificio (Paso a Paso)

```bash
# 1. Diseñar el archivo de plano JSON:
#    Crear edif_nombre.plan.json definiendo niveles, salas, escaleras y huecos.

# 2. Ejecutar la validación geométrica:
python scripts/validate_architecture.py --plan edif_nombre.plan.json

# 3. Generar previsualización 2D:
python scripts/render_plan_2d.py --plan edif_nombre.plan.json

# 4. Si la validación da PASS, compilar geometría en Blender:
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python scripts/generate_building.py -- --plan edif_nombre.plan.json

# 5. Integrar el componente Three.js y verificar en el navegador con Auren.
```
