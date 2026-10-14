# 🐝 JARBEES: THE GAME - Plan Maestro de Desarrollo

**Fecha de Creación:** 14 de Octubre de 2026  
**Inspiración:** REZ (Dreamcast), Road Rash 3, ArcheoScope  
**Stack Técnico:** Next.js 14 + React Three Fiber + Three.js + Zustand  
**Plataformas:** Desktop (teclado) + Mobile (botones touch)

---

## 🎯 VISIÓN DEL JUEGO

Un juego de vuelo contemplativo en primera persona donde controlás a una abeja atravesando paisajes infinitos inspirados en lugares reales:
- **Lago Titicaca** (montañas, agua cristalina)
- **Isla de Pascua** (volcán Rano Kau, moais)
- **Constelaciones** (cielo nocturno estrellado)

### Mecánica Core
- **NO HAY DISPAROS** - Solo exploración
- **Scroll infinito** - Terreno procedural/chunking dinámico
- **Velocidad constante** hacia adelante (estilo Road Rash 3)
- **Controles**: ⬆️⬇️⬅️➡️ para mover la abeja
- **Clima dinámico**: niebla, lluvia, viento
- **Ciclo día/noche**: amanecer → día → atardecer → noche con estrellas
- **Animales progresivos**: pájaros, mariposas, otros insectos

### Estética
- **Estilo REZ**: limpio, onírico, fluido
- **Cámara**: tercera persona cercana siguiendo la abeja
- **Música**: ambiente relajante (reutilizar harmonia_mundi.wav de ArcheoScope)

---

## 🏗️ ARQUITECTURA DEL PROYECTO

```
Jarbees_the_game/
├── MASTER_PLAN.md              (este archivo)
├── DONATION_GUIDE.md           (GitHub Sponsors + CBU argentino)
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.local
├── public/
│   ├── models/
│   │   ├── bee_animated.glb        (abeja con animación de aleteo)
│   │   ├── bee_realistic.glb       (versión retocada con detalles)
│   │   ├── tree_*.glb              (árboles de ArcheoScope)
│   │   └── rocks/                  (piedras procedurales)
│   ├── textures/
│   │   ├── grass_titicaca.jpg
│   │   ├── volcanic_ground.jpg
│   │   ├── water_normal.jpg
│   │   └── skybox/                 (día/noche)
│   ├── audio/
│   │   ├── harmonia_mundi.wav      (música ambiente)
│   │   ├── wind_loop.wav
│   │   └── bee_wings.wav           (aleteo sutil)
│   └── icons/
│       └── jarbees_logo.png
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    (menú principal)
│   ├── game/
│   │   └── page.tsx                (escena principal del juego)
│   ├── donate/
│   │   └── page.tsx                (página de donaciones)
│   └── globals.css
├── components/
│   ├── BeePlayer.tsx               (abeja controlable con animación)
│   ├── InfiniteTerrainSystem.tsx   (chunking dinámico de terreno)
│   ├── SkySystem.tsx               (ciclo día/noche + estrellas)
│   ├── WeatherSystem.tsx           (lluvia, niebla, viento)
│   ├── TreePopulation.tsx          (instanciado de árboles)
│   ├── AnimalSystem.tsx            (pájaros, mariposas)
│   ├── MobileTouchControls.tsx     (botones para móvil)
│   ├── DonationButton.tsx          (botón flotante con enlace)
│   └── ui/
│       ├── GameHUD.tsx             (velocidad, distancia recorrida)
│       └── PauseMenu.tsx
├── hooks/
│   ├── useGameControls.ts          (teclado + touch)
│   ├── useInfiniteChunks.ts        (gestión de chunks)
│   └── useDayNightCycle.ts
├── store/
│   └── gameStore.ts                (Zustand: estado del juego)
├── systems/
│   ├── ChunkGenerator.ts           (generación procedural)
│   ├── LODManager.ts               (nivel de detalle)
│   └── AudioManager.ts             (música + efectos)
├── utils/
│   ├── perlinNoise.ts              (generación de terreno)
│   └── mobileDetect.ts
└── types/
    └── game.ts
```

---

## 📋 FASES DE DESARROLLO

### FASE 1: ESTRUCTURA BASE (Semana 1)
**Objetivo:** Proyecto funcional con abeja volando en escena vacía

#### Tareas:
- [x] Crear proyecto Next.js 14 + TypeScript
- [ ] Configurar React Three Fiber + Drei + PostProcessing
- [ ] Importar modelo de abeja desde `C:\Projects\productos_crud_bkd\storage\assets\models\bee_source.glb`
- [ ] Implementar `BeePlayer.tsx` con:
  - Movimiento básico ⬆️⬇️⬅️➡️
  - Velocidad constante hacia adelante
  - Animación de aleteo (usar animaciones existentes del GLB)
  - Cámara siguiendo desde atrás
- [ ] Sistema de controles (`useGameControls.ts`):
  - Detección de teclado
  - Detección de dispositivo móvil
- [ ] Gameloop básico con Zustand
- [ ] HUD simple (velocidad, distancia)

**Entregables:**
- Abeja volando en espacio negro
- Controles funcionales desktop
- FPS estable >60

---

### FASE 2: TERRENO INFINITO (Semana 2)
**Objetivo:** Scroll infinito con terreno procedural

#### Tareas:
- [ ] Implementar `InfiniteTerrainSystem.tsx`:
  - Generación de chunks 500x500 unidades
  - Perlin Noise para alturas (basarse en `viewer3d/utils/perlinNoise.ts` de ArcheoScope)
  - Pool de chunks (3 activos: actual, siguiente, anterior)
  - Reciclaje cuando la abeja avanza
- [ ] Texturas del terreno:
  - Modo "Titicaca": pasto verde con piedras
  - Modo "Isla de Pascua": terreno volcánico
- [ ] Colisiones básicas (abeja no atraviesa suelo)
- [ ] LOD system (reducir polígonos a distancia)

**Entregables:**
- Terreno infinito funcional
- 3 biomas intercambiables
- Performance >50 FPS en móvil

---

### FASE 3: VEGETACIÓN Y POBLADORES (Semana 3)
**Objetivo:** Árboles y elementos visuales del paisaje

#### Tareas:
- [ ] Copiar árboles desde `C:\Projects\ArcheoScope\models_3d\Trees\`
- [ ] `TreePopulation.tsx`:
  - Instanciado con `InstancedMesh` (miles de árboles)
  - Distribución procedural según Perlin Noise
  - Variación de escala y rotación
- [ ] Piedras procedurales (`Rock3DModel.tsx` de ArcheoScope)
- [ ] Agua simple (plano con normal map):
  - Lago Titicaca: agua azul cristalina
  - Efecto reflejo básico

**Entregables:**
- Bosques densos en modo Titicaca
- Terreno rocoso en modo Isla de Pascua
- Agua con movimiento sutil

---

### FASE 4: CIELO Y CLIMA (Semana 4)
**Objetivo:** Atmósfera dinámica e inmersiva

#### Tareas:
- [ ] `SkySystem.tsx` (basado en `ConstellationsScene.tsx` de ArcheoScope):
  - Ciclo día/noche (20 min real = 24h del juego)
  - Sol con God Rays
  - Luna con fases
  - Estrellas en noche (reutilizar shader de constelaciones)
  - Skybox con gradientes (amanecer/atardecer)
- [ ] `WeatherSystem.tsx`:
  - Niebla volumétrica (cerca/lejos según clima)
  - Lluvia (partículas)
  - Nubes procedurales (planos con alpha)
- [ ] Iluminación dinámica según hora del día

**Entregables:**
- Transición día → noche fluida
- 3 estados de clima: despejado, nublado, lluvia
- Niebla atmosférica estilo REZ

---

### FASE 5: ANIMALES Y VIDA (Semana 5)
**Objetivo:** Biodiversidad del entorno

#### Tareas:
- [ ] `AnimalSystem.tsx`:
  - **Pájaros**: vuelo en formación (boids algorithm)
  - **Mariposas**: vuelo errático cerca de flores
  - **Otros insectos**: abejas secundarias, libélulas
- [ ] Modelos low-poly de animales (máximo 500 tris c/u)
- [ ] Spawning gradual:
  - Primeros 5 min: solo pájaros
  - 10 min: agregar mariposas
  - 15 min: libélulas y más abejas
- [ ] Audio ambiente:
  - Cantos de pájaros (según hora del día)
  - Viento en árboles

**Entregables:**
- Fauna diversa y animada
- Algoritmo boids funcional
- Audio ambiente dinámico

---

### FASE 6: CONTROLES MÓVILES (Semana 6)
**Objetivo:** Versión mobile jugable

#### Tareas:
- [ ] `MobileTouchControls.tsx`:
  - Joystick virtual (izq: ⬅️➡️, der: ⬆️⬇️)
  - Botones estilo arcade (opcional)
  - Área de tap para pausar
- [ ] Optimización mobile:
  - Reducir draw calls (instancing agresivo)
  - Texturas 512x512 máximo
  - Desactivar sombras si FPS < 30
  - PostProcessing minimalista
- [ ] Detección automática de plataforma
- [ ] UI adaptativa (HUD más grande en móvil)

**Entregables:**
- Controles touch funcionales
- 30+ FPS en móvil mid-range
- Auto-detección desktop/mobile

---

### FASE 7: DONACIONES Y DESPLIEGUE (Semana 7)
**Objetivo:** Monetización y publicación

#### Tareas:
- [ ] Página `/donate` con:
  - **GitHub Sponsors** (opción principal)
  - CBU argentino directo (Banco + Alias)
  - Descripción del proyecto
  - Agradecimientos a donantes
- [ ] Botón flotante "☕ Donar" en esquina del juego
- [ ] `DONATION_GUIDE.md` con instrucciones
- [ ] Configurar GitHub Sponsors:
  - Crear archivo `.github/FUNDING.yml`
  - Conectar cuenta bancaria argentina
  - Definir tiers: $1, $5, $10, $25
- [ ] Build de producción:
  - `npm run build`
  - Exportar estático si es posible
- [ ] Despliegue en:
  - **Itch.io** (versión web)
  - **Vercel** (demo online)
  - **GitHub Pages** (mirror)

**Entregables:**
- Sistema de donaciones funcional
- GitHub Sponsors configurado
- Juego desplegado públicamente

---

### FASE 8: RETOQUE 3D DE LA ABEJA (OPCIONAL)
**Objetivo:** Modelo realista de alta calidad

#### Tareas:
- [ ] Analizar `bee_source.glb` actual con Blender
- [ ] Mejoras visuales:
  - Textura PBR (BaseColor + Normal + Roughness + Metallic)
  - Pelos en cuerpo (geometría o normal map)
  - Alas semi-transparentes con iridiscencia
  - Ojos compuestos con detalle
  - Aguijón y patas articuladas
- [ ] Optimizar para Web:
  - Máximo 5K tris
  - Texturas 2K (comprimir a 1K para móvil)
  - Draco compression
- [ ] Exportar como `bee_realistic.glb`
- [ ] Opcional: usar IA de retoque 3D:
  - **Meshy.ai** (text-to-3D con refinamiento)
  - **Blender + Stable Diffusion** (texture baking)

**Entregables:**
- Modelo de abeja fotorrealista optimizado
- Comparación antes/después
- FPS sin pérdida

---

## 🎨 GUÍA DE ARTE Y ESTÉTICA

### Paleta de Colores

**Modo Lago Titicaca:**
- Cielo: `#87CEEB` (azul claro)
- Pasto: `#7CFC00` → `#228B22` (verde vivo a oscuro)
- Agua: `#00CED1` (turquesa)
- Montañas: `#8B7355` (marrón tierra)

**Modo Isla de Pascua:**
- Cielo: `#FF6347` (rojizo al atardecer)
- Terreno: `#8B4513` → `#2F4F4F` (café volcánico a gris)
- Vegetación: escasa, `#556B2F` (verde oliva)
- Océano: `#191970` (azul marino profundo)

**Modo Constelaciones (noche):**
- Cielo: `#000033` (azul oscuro casi negro)
- Estrellas: `#FFFFFF` + parpadeo
- Vía Láctea: gradiente `#4B0082` a `#191970`
- Luna: `#F5F5DC` (beige claro)

### Referencias Visuales
1. **REZ (Dreamcast)**: túneles de luz, geometría limpia
2. **Road Rash 3**: sensación de velocidad constante
3. **ArcheoScope Training Room**: iluminación y clima
4. **Journey (PS3)**: exploración contemplativa

---

## 🎮 CONTROLES DEFINITIVOS

### Desktop (Teclado)
```
⬆️ W / Flecha Arriba    → Abeja sube
⬇️ S / Flecha Abajo     → Abeja baja
⬅️ A / Flecha Izquierda → Gira izquierda
➡️ D / Flecha Derecha   → Gira derecha
ESPACIO                 → Pausa
ESC                     → Menú
```

### Mobile (Touch)
```
Joystick Izquierdo  → ⬅️➡️ (giro horizontal)
Joystick Derecho    → ⬆️⬇️ (altitud)
Tap en pantalla     → Pausa
```

---

## 💰 SISTEMA DE DONACIONES

### Opción 1: GitHub Sponsors (RECOMENDADO)
**Por qué:** Integrado con GitHub, soporta Argentina, sin comisiones de PayPal

**Pasos:**
1. Ir a https://github.com/sponsors
2. Completar perfil fiscal (CUIT/CUIL argentino)
3. Conectar cuenta bancaria (CBU)
4. Definir tiers:
   - $1/mes: Agradecimiento en README
   - $5/mes: Nombre en créditos del juego
   - $10/mes: Acceso anticipado a nuevas features
   - $25/mes: Diseño de un bioma personalizado

**Archivo `.github/FUNDING.yml`:**
```yaml
github: [tu_usuario_github]
custom: ["https://cafecito.app/tu_usuario", "CBU: 0000003100012345678901"]
```

### Opción 2: CBU Directo
**Formato:**
```
Alias: TU.ALIAS.MP
CBU: 0000003100012345678901
Titular: Tu Nombre Completo
Banco: Banco Provincia / Mercado Pago / etc.
```

**Incluir en `/donate`:**
- QR de Mercado Pago (si tenés)
- Instrucciones claras de transferencia
- Agradecimiento personalizado

### Opción 3: Cafecito.app (Alternativa argentina)
- URL: https://cafecito.app/
- Acepta tarjetas argentinas
- Comisión menor que PayPal
- Retiro directo a banco argentino

---

## 🚀 CRONOGRAMA ESTIMADO

| Fase | Duración | Acumulado |
|------|----------|-----------|
| 1. Estructura Base | 7 días | 1 semana |
| 2. Terreno Infinito | 7 días | 2 semanas |
| 3. Vegetación | 7 días | 3 semanas |
| 4. Cielo y Clima | 7 días | 4 semanas |
| 5. Animales | 7 días | 5 semanas |
| 6. Controles Móviles | 7 días | 6 semanas |
| 7. Donaciones y Deploy | 7 días | 7 semanas |
| 8. Retoque 3D (opcional) | 7 días | 8 semanas |

**Total:** 7-8 semanas (2 meses) para versión completa

---

## 📊 MÉTRICAS DE ÉXITO

### Técnicas
- [x] 60+ FPS en desktop
- [ ] 30+ FPS en móvil mid-range
- [ ] Tiempo de carga < 5 segundos
- [ ] Bundle size < 10 MB
- [ ] Sin memory leaks tras 30 min de juego

### Gameplay
- [ ] Sensación de "flow" (inmersión)
- [ ] Controles responsivos (input lag < 50ms)
- [ ] Transiciones suaves entre biomas
- [ ] Audio sincronizado con gameplay

### Monetización
- [ ] Página de donaciones clara
- [ ] GitHub Sponsors configurado
- [ ] Al menos 3 tiers de donación
- [ ] Agradecimientos visibles

---

## 🛠️ STACK TECNOLÓGICO DETALLADO

```json
{
  "dependencies": {
    "next": "14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@react-three/fiber": "^8.17.10",
    "@react-three/drei": "^9.114.3",
    "@react-three/postprocessing": "^2.16.3",
    "three": "^0.170.0",
    "zustand": "^4.5.0",
    "simplex-noise": "^4.0.3",
    "leva": "^0.9.35",
    "stats.js": "^0.17.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/three": "^0.161.0",
    "typescript": "^5"
  }
}
```

### Herramientas de Desarrollo
- **Blender 4.x:** retoque de modelos 3D
- **glTF-Transform:** optimización de GLB (Draco, texture resize)
- **Texture Packer:** atlas de texturas
- **Audacity:** edición de audio

---

## 📁 ASSETS A MIGRAR DESDE ARCHEOSCOPE

### Modelos 3D
- `models_3d/Trees/new.glb` → árboles principales
- `models_3d/rock_blender/*.glb` → piedras
- `models_3d/water_blender/*.glb` → efectos de agua

### Componentes Reutilizables
- `viewer3d/components/ConstellationsScene.tsx` → sistema de estrellas
- `viewer3d/components/DynamicSky.tsx` → cielo procedural
- `viewer3d/components/RainParticles.tsx` → lluvia
- `viewer3d/components/SnowParticles.tsx` → adaptar a niebla
- `viewer3d/components/Tree3DModel.tsx` → instanciado de árboles
- `viewer3d/utils/perlinNoise.ts` → generación de terreno

### Audio
- `harmonia_mundi.wav` → música principal (loop)

---

## 🐝 DETALLES TÉCNICOS DE LA ABEJA

### Especificaciones del Modelo
**Archivo fuente:** `C:\Projects\productos_crud_bkd\storage\assets\models\bee_source.glb`

**Características actuales:**
- Geometría completa de abeja
- Animaciones de aleteo incluidas
- Texturas base color

**Mejoras propuestas (Fase 8):**
1. **Geometría:**
   - Agregar pelos con geometry nodes (Blender)
   - Refinar alas (semi-transparencia + iridiscencia)
   - Detallar ojos compuestos (hexágonos)

2. **Texturas PBR:**
   - `bee_basecolor.png` (2K)
   - `bee_normal.png` (detalle de pelos)
   - `bee_orm.png` (Occlusion + Roughness + Metallic)
   - `bee_emissive.png` (ojos brillantes)

3. **Animaciones:**
   - Mantener aleteo existente (60 FPS)
   - Agregar idle sutil (antenas moviéndose)
   - Transición suave entre velocidades

4. **Optimización:**
   - Draco compression (-70% tamaño)
   - Texture resize 1K para móvil
   - LOD: versión 2K tris para distancia

### Scripts de Retoque (Blender Python)
Ubicación: `C:\Projects\productos_crud_bkd\scripts\blender\`
- `inspect_bee.py` - Analizar modelo actual
- `robotize_bee.py` - Ejemplo de pipeline (adaptar)

**Nuevo script a crear:**
```python
# enhance_bee_realistic.py
import bpy

# 1. Importar bee_source.glb
# 2. Aplicar subdivisión adaptativa
# 3. Agregar geometry nodes para pelos
# 4. Configurar materiales PBR
# 5. Bake texturas
# 6. Exportar como bee_realistic.glb
```

---

## 🎯 ROADMAP POST-LANZAMIENTO

### v1.1 - Contenido
- [ ] 3 biomas adicionales: Amazonas, Sahara, Himalaya
- [ ] Coleccionables (flores raras)
- [ ] Sistema de fotografía (capturas in-game)

### v1.2 - Multijugador (?)
- [ ] Modo cooperativo (2 abejas)
- [ ] Leaderboard de distancia recorrida
- [ ] Compartir screenshots en redes

### v1.3 - VR (muy futuro)
- [ ] Soporte Oculus Quest
- [ ] Controles de manos
- [ ] Inmersión completa

---

## 📞 CONTACTO Y SOPORTE

**Desarrollador:** [Tu Nombre]  
**GitHub:** https://github.com/tu_usuario/jarbees-the-game  
**Email:** tu_email@ejemplo.com  
**Donaciones:** https://github.com/sponsors/tu_usuario

**Reportar bugs:** Crear issue en GitHub  
**Sugerencias:** Discussions en el repo

---

## 📜 LICENCIAS

- **Código:** MIT License
- **Assets (abeja, árboles):** Creative Commons BY 4.0
- **Música:** Ver licencia de harmonia_mundi.wav (ArcheoScope)
- **Three.js & React Three Fiber:** MIT

---

## ✅ CHECKLIST DE INICIO INMEDIATO

Antes de empezar a programar:

- [ ] Leer este documento completo
- [ ] Clonar estructura de carpetas
- [ ] Copiar modelo de abeja a `public/models/`
- [ ] Copiar árboles de ArcheoScope
- [ ] Instalar dependencias (`npm install`)
- [ ] Probar `npm run dev` (debe mostrar Next.js)
- [ ] Confirmar que Three.js funciona (crear cubo test)

---

**¡AHORA SÍ, A VOLAR! 🐝✨**
