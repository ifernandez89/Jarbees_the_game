# 📝 CHANGELOG - JarBees: The Game

## [0.7.0] - 2026-10-14

### 🌅 Transición Continua Día/Noche, Manto Estelar Cristalino y Ajustes Visuales

#### Mejorado
- **useDayNightCycle.ts**:
  - Reemplazo de bloques discontinuos por una línea temporal continua de 24 horas basada en curvas coseno (*spline interpolation*).
  - Eliminado por completo el corte abrupto entre atardecer, noche y amanecer; cada minuto se funde con el siguiente con suavidad cromática.
- **DynamicSky.tsx**:
  - Manto estelar de 1200 estrellas de alta visibilidad (`fog: false` para que la niebla nunca las oculte).
  - Variación de colores estelares (blanco puro, oro cálido, azul celeste).
  - Transición suave de opacidad (*fade-in* y *fade-out* gradual) al atardecer y amanecer.
  - Órbitas reales y continuas para el sol y la luna con atenuación lumínica natural.
- **WeatherSystem.tsx**:
  - Fusión del color de la niebla volumétrica con el horizonte del cielo para evitar cortes o bandas de color.

## [0.6.0] - 2026-10-14

### 📱 FASE 6 y 7 - Controles Móviles, Superficie de Agua, Selector de Biomas y Donaciones

#### Añadido
- **MobileTouchControls.tsx**: Controles táctiles en pantalla para smartphones y tablets
  - Botones táctiles de giro lateral (◀ / ▶) y altitud (▲ / ▼).
  - Botones táctiles superiores para pausa y alternar audio.
  - Auto-detección de pantallas táctiles mediante `utils/mobileDetect.ts`.
- **WaterSurface.tsx**: Superficie acuática dinámica
  - Plano de agua cristalina translúcida que cubre las cuencas y valles bajos del terreno.
  - Ondulación sutil en tiempo real, adaptada al bioma Lago Titicaca e Isla de Pascua.
- **DonationButton.tsx**: Botón flotante estilizado
  - Acceso directo y no intrusivo a `/donate` desde la esquina del juego.
- **.github/FUNDING.yml**: Configuración oficial para GitHub Sponsors conectada a la cuenta de `ifernandez89`.
- **Selector de Biomas en tiempo real**:
  - Posibilidad de alternar entre Lago Titicaca, Isla de Pascua y Constelaciones haciendo clic en el HUD o presionando la tecla **B**.

## [0.5.0] - 2026-10-14

### 🔊 FASE 5 COMPLETADA - Sistema de Audio Integral y Efectos Dinámicos

#### Añadido
- **AudioManager.ts**: Motor de audio Web Audio + Three.js
  - Soporte de bucles (looping), un-pausing y crossfades musicales.
  - Modulación en tiempo real de tono (pitch shift) y volumen para efectos mecánicos y biológicos.
  - Auto-desbloqueo de AudioContext tras la primera interacción del usuario.
- **useAudio.ts**: Hook de control sonoro para la escena 3D
  - Carga automática de música de fondo, zumbido de abeja, viento y grillos nocturnos.
  - Sincronización en cada fotograma con el ciclo día/noche (atenuación de viento, activación nocturna de grillos).
  - Efectos sonoros de pausa y reanudación del juego.
- **Generador de Audio Procedural DSP** (`scripts/generate_game_audio.py`):
  - `bee_buzz.wav`: Zumbido y aleteo de Apis mellifera a 225Hz con armónicos ricos, vibrato y microturbulencia aerodinámica en bucle sin fisuras.
  - `wind_loop.wav`: Viento ambiental cálido con modulación de ráfagas naturales.
  - `night_crickets.wav`: Grillos de campo estivales a 4.8kHz con ciclos de estridulación.
  - `pause.wav`: Campana acústica armónica para interacción de menú/pausa.
  - `ambient_music.wav`: Pista orquestal ambiental.
- **Integración con backend de IA** (`scripts/generate_audio_from_backend.js` y `generate_audio_with_ai.md`):
  - Puente y especificación para interactuar con el backend `productos_crud_bkd`.

#### Mejorado
- **BeePlayer.tsx**: Modulación acústica del aleteo
  - El zumbido varía dinámicamente de tono y volumen según la velocidad de vuelo.
  - Respuesta sonora inmediata al realizar maniobras de ascenso, descenso o giros.
- **GameHUD.tsx**: Control de audio en pantalla
  - Botón interactivo para silenciar/activar sonido.
  - Indicador visual `[M]` de atajo de teclado.
- **useGameControls.ts**: Tecla `M` configurada para silenciar/activar todo el audio del juego.
- **DynamicSky.tsx**: Corrección de tipos TypeScript para materiales emisivos de sol y luna.

## [0.4.0] - 2026-10-14

### ✨ FASE 4 COMPLETADA - Cielo y Clima Dinámicos

#### Añadido
- **useDayNightCycle.ts**: Sistema de ciclo día/noche
  - 20 minutos reales = 24 horas del juego
  - 4 períodos: amanecer, día, atardecer, noche
  - Intensidad solar variable
  - Colores de cielo interpolados
  - Densidad de niebla dinámica
  - Cálculo de posiciones sol/luna

- **DynamicSky.tsx**: Cielo procedural animado
  - Esfera celeste con shader de gradiente
  - Sol animado con emisión de luz
  - Luna con fases (opacidad variable)
  - 1000 estrellas procedurales (solo de noche)
  - Parpadeo sutil de estrellas
  - Luz direccional siguiendo al sol
  - Luz hemisférica del cielo
  - Transiciones suaves entre períodos

- **WeatherSystem.tsx**: Sistema de clima
  - Niebla volumétrica dinámica
  - Densidad variable según hora del día
  - Color de niebla según cielo
  - Interpolación suave de cambios

#### Mejorado
- **gameStore.ts**: Configuración de día/noche
  - `dayNightEnabled`: activar/desactivar ciclo
  - `dayNightSpeed`: velocidad del ciclo (1x, 2x, etc.)
  - Acciones para configurar sistema

- **GameHUD.tsx**: Reloj del juego
  - Muestra hora actual (HH:MM formato 24h)
  - Íconos según período del día (🌅☀️🌇🌙)
  - Integrado con sistema de día/noche

- **GameScene.tsx**: Iluminación integrada
  - Cielo dinámico reemplaza fondo estático
  - Sistema de clima gestiona niebla
  - Iluminación reducida (el cielo ya aporta luz)
  - Sin gradiente de fondo (cielo procedural)

### 🎮 Características Nuevas
- **Ciclo día/noche completo**: Amanecer → Día → Atardecer → Noche
- **Cielo procedural**: Colores cambian según hora
- **Sol y luna animados**: Siguen trayectoria realista
- **Estrellas nocturnas**: 1000 estrellas con parpadeo
- **Niebla atmosférica**: Más densa de noche, ligera de día
- **Reloj en HUD**: Muestra hora del juego en tiempo real

### 🎯 Próximos Pasos (FASE 5)
- [ ] Animales voladores (pájaros con boids)
- [ ] Mariposas errática
- [ ] Audio ambiente (cantos, viento)
- [ ] Partículas ambientales

---

## [0.3.0] - 2026-10-14

### ✨ FASE 3 EN PROGRESO - Vegetación y Mejoras

#### Añadido
- **TreePopulation.tsx**: Sistema de árboles instanciados
  - Instanciado masivo (miles de árboles sin impacto en FPS)
  - 3 modelos de árboles variados
  - Distribución procedural por chunk
  - Densidad configurable por bioma
  - Variación de escala y rotación
  - Posicionamiento según altura del terreno

- **Scripts de Blender**: Herramientas de optimización 3D
  - `inspect_bee_model.py`: Inspeccionar modelo de abeja
  - `add_bee_wing_animation.py`: Añadir/mejorar animación de aleteo

#### Mejorado
- **BeePlayer.tsx**: Animaciones mejoradas
  - Velocidad de aleteo dinámica (según velocidad de vuelo)
  - Reproducción de todas las animaciones disponibles
  - Logging de animaciones cargadas
  - Prop `modelPath` para modelos customizados

- **useGameControls.ts**: Control con ENTER
  - ENTER ahora también pausa/resume el juego
  - Soporte para ESC, ESPACIO y ENTER

- **GameHUD.tsx**: Instrucciones actualizadas
  - Muestra ENTER como opción de pausa
  - Interfaz más clara

- **InfiniteTerrain.tsx**: Integración con vegetación
  - Estado de chunks activos compartido
  - Renderiza TreePopulation por chunk
  - Coordinación entre terreno y árboles

#### Assets
- ✅ Árboles copiados desde ArcheoScope:
  - `tree1.glb` (new.glb - 19.3 MB)
  - `tree2.glb` (new2.glb - 14.5 MB)
  - `tree3.glb` (new3.glb - 15.9 MB)

### 🎮 Características Nuevas
- **Bosques procedurales**: Miles de árboles generados dinámicamente
- **3 variantes de árboles**: Diversidad visual
- **Densidad por bioma**: Titicaca (denso), Isla de Pascua (escaso)
- **ENTER para pausa**: Control adicional más intuitivo
- **Aleteo dinámico**: La abeja aletea más rápido al ir más rápido

### 🎯 Próximos Pasos (FASE 3 continuación)
- [ ] LOD para árboles distantes
- [ ] Optimización de geometría (menos polígonos)
- [ ] Rocas procedurales
- [ ] Flores y arbustos pequeños

---

## [0.2.0] - 2026-10-14

### ✨ FASE 2 COMPLETADA - Terreno Infinito Procedural

#### Añadido
- **perlinNoise.ts**: Sistema de generación de ruido procedural
  - Generador basado en simplex-noise
  - Múltiples octavas para detalle
  - Presets por bioma (Titicaca, Isla de Pascua, Constelaciones)
  - Funciones para altura, vegetación y densidad
  - Generación de heightmaps para chunks

- **ChunkManager.ts**: Sistema de gestión de chunks
  - Chunks de 100x100 unidades
  - Generación procedural bajo demanda
  - Pool de chunks para reutilización
  - Distancia de renderizado configurable (200 unidades)
  - Sistema de coordenadas mundial → chunk
  - Cálculo de altura en cualquier posición

- **InfiniteTerrain.tsx**: Componente React de terreno
  - Integración con ChunkManager
  - Actualización automática según posición del jugador
  - Soporte para 3 biomas configurables
  - Optimización con useMemo
  - Limpieza automática de chunks inactivos

#### Mejorado
- **BeePlayer.tsx**: Colisión con terreno
  - Detección de altura del terreno en tiempo real
  - Mantiene 1 metro de distancia del suelo
  - Previene atravesar montañas

- **gameStore.ts**: Estado extendido
  - Referencia al ChunkManager
  - Bioma actual ('titicaca' por defecto)
  - Acciones para cambiar bioma

- **GameHUD.tsx**: Indicador de bioma
  - Muestra el nombre del bioma actual
  - Iconos por ubicación

- **GameScene.tsx**: Terreno integrado
  - Reemplaza plano estático por terreno procedural
  - Niebla extendida (100-300 unidades)
  - Sin grid helper (ya no necesario)

#### Técnico
- Generación de geometría con PlaneGeometry
- Modificación de vértices según Perlin Noise
- Recálculo de normales para iluminación correcta
- Sistema de chunks con keys únicas
- Pool de reutilización para performance

### 🎮 Características Nuevas
- **Terreno infinito**: Se genera mientras vuelas
- **Colinas procedurales**: Variación natural del terreno
- **3 biomas disponibles**: Titicaca (verde), Isla de Pascua (volcánico), Constelaciones (espacial)
- **Colisión realista**: La abeja sigue el contorno del terreno

### 🎯 Próximos Pasos (FASE 3)
- [ ] Árboles instanciados
- [ ] Sistema de vegetación con densidad variable
- [ ] Rocas procedurales
- [ ] Agua con reflejos (Lago Titicaca)

---

## [0.1.0] - 2026-10-14

### ✨ FASE 1 COMPLETADA - Abeja Volando

#### Añadido
- **BeePlayer.tsx**: Componente principal de la abeja jugadora
  - Carga del modelo GLB desde `/models/bee.glb`
  - Animación de aleteo automática
  - Movimiento constante hacia adelante
  - Controles de dirección (⬆️⬇️⬅️➡️)
  - Inclinación dinámica según dirección
  - Límites de altitud (0.5m - 50m)

- **FollowCamera.tsx**: Sistema de cámara tercera persona
  - Sigue a la abeja suavemente con lerp
  - Offset dinámico según rotación
  - Siempre apunta al centro de la abeja

- **useGameControls.ts**: Hook de controles
  - Soporte para WASD y teclas de flecha
  - Pausa con ESC o ESPACIO
  - Prevención de controles durante pausa

- **gameStore.ts**: Estado global con Zustand
  - Posición y rotación de la abeja
  - Velocidad y distancia recorrida
  - Controles activos
  - Estado de pausa
  - Altitud y tiempo de juego

- **GameHUD.tsx**: Interfaz de usuario
  - Velocidad en km/h
  - Distancia recorrida en metros
  - Altitud en metros
  - Indicador de FPS
  - Pantalla de pausa
  - Coordenadas de debug (solo desarrollo)

- **types/game.ts**: Definiciones TypeScript
  - Interfaces para estado del juego
  - Configuración de biomas (Titicaca, Isla de Pascua, Constelaciones)
  - Constantes de configuración

#### Mejorado
- **GameScene.tsx**: Integración completa
  - Iluminación mejorada (ambient, directional, hemisphere)
  - Plano de suelo verde temporal
  - Niebla atmosférica
  - Sombras habilitadas
  - Fondo con gradiente de cielo

#### Técnico
- Modelo de abeja movido a `/public/models/bee.glb`
- Estructura de carpetas completada:
  - `/store` - Estado global
  - `/hooks` - Custom hooks
  - `/types` - TypeScript definitions
  - `/components` - Componentes React/Three.js

### 🎮 Controles Implementados
```
⬆️ W / ↑    → Subir
⬇️ S / ↓    → Bajar
⬅️ A / ←    → Girar izquierda
➡️ D / →    → Girar derecha
ESPACIO     → Pausa
ESC         → Pausa
```

### 🎯 Próximos Pasos (FASE 2)
- [ ] Sistema de chunks para terreno infinito
- [ ] Generación procedural con Perlin Noise
- [ ] Biomas intercambiables (Titicaca, Isla de Pascua, Constelaciones)
- [ ] LOD system para optimización

---

## [0.0.1] - 2026-10-14

### Inicial
- Proyecto Next.js 14 + TypeScript inicializado
- React Three Fiber + Drei instalado
- Estructura de carpetas creada
- Documentación completa (README, MASTER_PLAN, DONATION_GUIDE)
- Páginas web: Home, Game, Donate
- Cubo de prueba en escena 3D
