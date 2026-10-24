# 📝 CHANGELOG - JarBees: The Game

## [0.8.28] - 2026-10-23

### ⚡ Sprint Supersónico Táctico 55 km/h y 🌌 Aurelium Phase Veil (Velo de Fase Cuántico)

#### 1. Sprint Supersónico a Doble Velocidad (15.2 m/s / ~55 km/h)
- **Cinemática Terrestre del Exotraje**:
  - En [BeePlayer.tsx](file:///c:/Projects/Jarbees_the_game/components/BeePlayer.tsx), se duplicó la velocidad punta de carrera terrestre con Boost (`Shift` + `W`) de **7.6 m/s (~27.3 km/h)** a **15.2 m/s (~54.7 km/h)**, transformando la sensación de juego de un trote de infantería a un sprint táctico supersónico de exotraje biónico.
  - La velocidad de retroceso defensivo con `S` escala proporcionalmente a ~9.9 m/s (~35.5 km/h).
- **Erradicación del "Foot-Sliding" (Patinaje sobre Hielo)**:
  - Se calibró dinámicamente la velocidad del AnimationMixer de `nexo_run` mediante una curva exponencial armónica:
    $$\text{animSpeed} = 1.35 + \left(\frac{|\text{velocity}| - 4.5}{10.7}\right)^{1.25} \times 0.85$$
    Pasando de $1.35\times$ en el arranque a $2.20\times$ al correr a 55 km/h. La frecuencia de zancadas y el braceo cerrado de combate se sincronizan con milimétrica precisión con el suelo.
- **Cinemática Dinámica de Cámara ([FollowCamera.tsx](file:///c:/Projects/Jarbees_the_game/components/FollowCamera.tsx))**:
  - **FOV Dinámico**: Se expande suavemente de $65^\circ$ en reposo/caminata hasta $78^\circ$ al esprintar a fondo, transmitiendo una aceleración gravitatoria y visión periférica sin causar mareo.
  - **CamPull en Tierra**: La cámara se aleja suavemente ($0.35\times$ pull y $0.40\times$ retroceso $Z$) elevándose sutilmente para ampliar el horizonte táctico.
  - **Micro-Vibración Cinética**: Se inyecta un suave temblor estructural ($0.08\times$ sprint ratio) que simula el impacto contundente de las botas acorazadas contra el terreno.
- **Seguimiento Continuo del Relieve**:
  - Se implementó amortiguación vertical exponencial analítica (`THREE.MathUtils.damp(player.position.y, floorY, 28, dt)`), eliminando cualquier micro-vibración o desfase al galopar a 55 km/h sobre las crestas y laderas del Aconcagua.

#### 2. Aurelium Phase Veil (Velo de Fase Cuántico — [AureliumPhaseShader.ts](file:///c:/Projects/Jarbees_the_game/systems/AureliumPhaseShader.ts))
- **Resolución del Z-Sorting con Screen-Door Dithering (Alpha Hashing)**:
  - Three.js genera fallos graves de ordenamiento de profundidad (mallas internas que se superponen erróneamente) al emplear `transparent: true` con `opacity < 1` en geometrías complejas.
  - Solución de arquitectura: El shader mantiene `depthWrite: true` y ejecuta un *early discard* combinando una **Matriz de Bayer 4x4** en espacio de pantalla con ruido procedural analítico 3D anclado a coordenadas locales de armadura (`vAureliumLocalPos`). La armadura se disuelve en microestructuras hexagonales fotónicas sin un solo error de Z-buffer.
- **Pulso Fotónico Hex-Core de Activación**:
  - Al activar o desactivar el velo, se detona una onda esférica de choque electromagnético nacida en el reactor pectoral Hex-Core ($y \approx 0.88$, $z \approx 0.10$ en espacio local) que recorre la armadura hacia las extremidades a lo largo de 0.65 segundos, iluminando la frontera de disolución con plasma cian de alta emisión ($4.8\times$).
- **Contorno Nacarado / Iridiscente (Fresnel Cuántico)**:
  - En estado velado, se calcula el contorno tangencial:
    $$\text{Fresnel} = \left(1.0 - \max(0.0, \vec{n} \cdot \vec{v})\right)^{3.5}$$
  - Modulado por una paleta espectral desde azul cian translúcido (`#55F0FF`) hasta un blanco nacarado perlado (`#F8FAFC`). Esto mantiene la silueta heroica del personaje perfectamente legible y nítida para el jugador incluso al 94% de invisibilidad.
- **Reactividad Biomecánica al Estado**:
  - **Reposo / Estático**: Camuflaje al 94% con micro-parpadeo cuántico en aristas.
  - **Caminata**: Ondas de interferencia sutiles en articulaciones.
  - **Sprint a 55 km/h**: El arrastre cinético de aire perturba el campo de fase; la silueta se vuelve un 30% más visible y emite micro-chispas fotónicas de fricción cuántica.
  - **Vuelo Supersónico**: Ionización y distorsión continua del velo.
  - **Daño / Impacto Cinético**: Ruptura dieléctrica violenta (pico de perturbación a 1.0) con destello lumínico y relajación gradual hacia el camuflaje.
- **Controles e Integración de UI**:
  - Tecla dedicada **`[V]`** en teclado para alternar instantáneamente el Velo de Fase en [useGameControls.ts](file:///c:/Projects/Jarbees_the_game/hooks/useGameControls.ts).
  - Botón interactivo `✨ [V] Velo` en el Cybernetic Dock de controles y badge `✨ VELO DE FASE` en la telemetría en [GameHUD.tsx](file:///c:/Projects/Jarbees_the_game/components/GameHUD.tsx).
  - Botón táctil dedicado `✨` en la barra superior móvil en [MobileTouchControls.tsx](file:///c:/Projects/Jarbees_the_game/components/MobileTouchControls.tsx).
  - Estado global centralizado en [gameStore.ts](file:///c:/Projects/Jarbees_the_game/store/gameStore.ts) (`isPhaseVeilActive`, `togglePhaseVeil`).

## [0.8.27] - 2026-10-23

### 🥋 Puños Completamente Cerrados (Erradicación Total de Pulgares Arriba) y Biomecánica Contralateral de Caminata (`nexo_walk`)

#### 1. Puño Anatómico 100% Cerrado sin Pulgar Arriba (`curl_fist`, `nexo_run`, `nexo_walk`)
- **Causa Raíz del Pulgar Levantado**:
  - En la estructura ósea de Mixamo, las rotaciones positivas en $+X$ sobre los huesos del pulgar (`Thumb2` y `Thumb3`) actúan en sentido de extensión / apertura (hacia el cielo / dorso), en lugar de flexión. Por consiguiente, al asignar $+48^\circ$ y $+55^\circ$ en $+X$, los pulgares eran forzados a proyectarse rígidamente hacia arriba en actitud de autoestopista.
- **Solución Geométrica Aplicada**:
  - En [generate_nexo_animations.py](file:///c:/Projects/Jarbees_the_game/scripts/generate_nexo_animations.py), se recalibraron los ejes sagitales y de oposición en `curl_fist`:
    - `mixamorig:{side}HandThumb1`: Rotación $-25^\circ$ en X, $\pm 15^\circ$ en Y, $\mp 35^\circ$ en Z (abducción y aducción sobre el plano palmar).
    - `mixamorig:{side}HandThumb2`: Flexión metacarpiana a $-42^\circ$ en X y $\mp 10^\circ$ en Z.
    - `mixamorig:{side}HandThumb3`: Flexión interfalángica terminal a $-50^\circ$ en X.
  - El pulgar queda ahora completamente replegado y ajustado plano sobre los nudillos de los dedos índice y medio formando un puño atlético cerrado y limpio tanto al correr como al caminar.

#### 2. Erradicación del Efecto "Piernas al Revés" al Caminar de Espaldas (`nexo_walk`)
- **Diagnóstico Cinemático**:
  - **Inversión de Inclinación del Pie (Foot Pitch)**: Al avanzar la pierna hacia el frente para el contacto de talón ($s > 0$), se aplicaba $-s \cdot 12^\circ$ (plantarflexión / punta hacia abajo clavándose en el suelo), mientras que al empujar hacia atrás ($s < 0$) se aplicaba $+12^\circ$ (talón abajo), invirtiendo por completo la cinemática del tobillo.
  - **Braceo Ipsilateral (Paso de Camello)**: En `build_walk`, los brazos se calculaban con $+s \cdot 18^\circ$, provocando que al adelantar la pierna izquierda, el brazo izquierdo también avanzara al unísono, lo que creaba una distorsión visual desbalanceada vista desde atrás.
  - **Eje de Amortiguación Pélvica**: En `mixamorig:Hips_01`, el rebote vertical debe viajar en el eje local $Y$ (no en $Z$), y el giro pélvico de cadera debe acompañar la pierna que avanza (rotación contralateral armónica $-s \cdot 2.2^\circ$).
- **Solución Cinemática Aplicada**:
  - Se corrigió el pitch de los pies a $+s \cdot 14^\circ$ para lograr un impacto natural de talón en fase anterior y extensión de empuje atrás.
  - Braceo contralateral estricto implementado con $-s \cdot 18^\circ$ en brazos y contratorsión natural de columna y codos.
  - Amortiguación vertical hidráulica de cadera en Local $Y$ (`bounce_y = -0.3 + cos(2 * phase) * 0.4`) con postura erguida atlética ($+2.5^\circ$ forward pitch).
- **Despliegue y Protección**:
  - Modelo `jarbees_suit.glb` reanimado en Blender 5.2 con compresión Draco y protegido en `public/models/jarbees_suit.jb3d`.
  - Service Worker invalidado a `jarbees-game-v5` en [sw.js](file:///c:/Projects/Jarbees_the_game/public/sw.js).

## [0.8.26] - 2026-10-23

### 🏃 Puños de Combate Completos en Carrera (`nexo_run`), Cinemática Biomecánica de Caminata (`nexo_walk`) y Retroceso Táctico (`nexo_walk_back`)

#### 1. Erradicación del Gesto "Pulgar Arriba" en Carrera (`nexo_run`)
- **Diagnóstico del Gesto Extraño**:
  - En [generate_nexo_animations.py](file:///c:/Projects/Jarbees_the_game/scripts/generate_nexo_animations.py), la función `curl_fist` flexionaba los dedos índice, medio, anular y meñique a $76^\circ$, pero los huesos del pulgar (`Thumb1`, `Thumb2`, `Thumb3`) solo recibían la mitad del curl (`curl * 0.5 = 34°`) y sin rotación de oposición anatómica sobre la palma.
  - Esto dejaba el pulgar apuntando hacia arriba como un gesto de autoestopista o "pulgar arriba" mientras el resto de la mano formaba un puño.
- **Solución Aplicada**:
  - Rediseño completo de `curl_fist`: Ahora rota el metacarpiano `Thumb1` en oposición ($32^\circ$ X, $\pm 18^\circ$ Y, $\pm 28^\circ$ Z) y flexiona `Thumb2` ($48^\circ$) y `Thumb3` ($55^\circ$), descansando el pulgar firmemente cerrado sobre los nudillos de los dedos índice y medio.
  - La postura al correr ahora luce atlética, cerrada, aerodinámica y de combate.

#### 2. Corrección Biomecánica de Caminata (`nexo_walk`)
- **Diagnóstico del "Caminar al Revés"**:
  - `nexo_walk` arrastraba el mismo error de inversión de fase que tenía antes `nexo_run`: la flexión de rodilla se calculaba con `-c * 40.0` (máxima cuando $c < 0$, fase de apoyo en el suelo) y permanecía rígida a $0^\circ$ en la fase de vuelo hacia adelante ($c > 0$), además de tener signo positivo en lugar del eje sagital negativo de Mixamo.
  - Al ver al personaje desde atrás, la rodilla parecía doblarse en sentido inverso como si caminara hacia atrás.
- **Solución Aplicada**:
  - Cinemática corregida: extensión firme en fase de apoyo (absorción de $10^\circ$ a $16^\circ$) y flexión natural de despeje en fase de vuelo en el aire (hasta $-55^\circ$ en X) para superar el suelo sin arrastrar los pies.
  - Puños relajados con dedos cerrados en lugar de manos abiertas rígidas.

#### 3. Nueva Animación Dedicada de Retroceso Táctico (`nexo_walk_back`)
- **Implementación**:
  - Creada la animación `nexo_walk_back` (36 frames / 1.2s loop) en [generate_nexo_animations.py](file:///c:/Projects/Jarbees_the_game/scripts/generate_nexo_animations.py) con zancada invertida auténtica: apoyo suave sobre el metatarso hacia atrás, extensión de rodilla al recibir el peso, y braceo defensivo compacto.
  - En [BeePlayer.tsx](file:///c:/Projects/Jarbees_the_game/components/BeePlayer.tsx), al presionar la tecla **[S]** (`controls.backward`), el personaje activa prioritariamente `nexo_walk_back` con modulación de velocidad según la aceleración (*boost*).
- **Compresión y Despliegue**:
  - El modelo `jarbees_suit.glb` fue horneado en Blender 5.2 con Draco 7 y cifrado a `public/models/jarbees_suit.jb3d`.
  - Service Worker invalidado a `jarbees-game-v4` en [sw.js](file:///c:/Projects/Jarbees_the_game/public/sw.js) para forzar la actualización inmediata en el cliente sin restos de caché local.

## [0.8.25] - 2026-10-23

### 🏔️ Continuidad Topológica Sin Costuras, Normales Analíticas Globales y Texturizado Bioclimático por Pendiente (Slope-Aware)

#### Diagnóstico del Corte Vertical / "Superposición de Capas de Montañas"
- **Causa Raíz Matemática (Inversión del Eje Z tras Rotación de Malla)**:
  - En [ChunkManager.ts](file:///c:/Projects/Jarbees_the_game/systems/ChunkManager.ts), `THREE.PlaneGeometry(size, size, segments, segments)` se creaba originalmente en el plano $XY$.
  - El bucle de altura muestreaba `z = positions[i + 1] + worldZ` (usando la $Y$ local de Three.js que desciende de $+size/2$ a $-size/2$), y asignaba la altura a $positions[i + 2]$.
  - Posteriormente, se ejecutaba `geometry.rotateX(-Math.PI / 2)`. Por álgebra matricial de rotación, la coordenada $Z$ resultante en Three.js es $Z_{new} = -Y_{old}$.
  - **Consecuencia**: El eje $Z$ de cada chunk quedaba invertido respecto al espacio mundial. En el borde entre el Chunk $(x, z)$ y el Chunk $(x, z+1)$, un chunk mostraba la altura de 100m atrás y el contiguo la de 100m adelante, creando un corte vertical de hasta 40 metros de altura ("pared de cartón" o escalón visible en la captura).
- **Causa Secundaria (Desalineación Origen Local vs Grid Mundial)**:
  - `PlaneGeometry` se centraba en $(0, 0)$ con rango $[-50, +50]$, mientras que la cuadrícula de chunks, [TreePopulation.tsx](file:///c:/Projects/Jarbees_the_game/components/TreePopulation.tsx) y [RockPopulation.tsx](file:///c:/Projects/Jarbees_the_game/components/RockPopulation.tsx) operaban en $[chunkX \cdot size, (chunkX+1) \cdot size]$.
  - Esto desfasaba los árboles y rocas 50 metros del centro del chunk, provocando que rocas flotaran en el aire o sobre el agua.
- **Causa Terciaria (Normales Locales por Chunk)**:
  - `geometry.computeVertexNormals()` solo promediaba las caras internas del chunk, dejando normales desbalanceadas en los bordes perimetrales que producían sombras y reflejos discontinuos.

#### Solución Integral Aplicada
- **Continuidad Geométrica 1:1 en [ChunkManager.ts](file:///c:/Projects/Jarbees_the_game/systems/ChunkManager.ts)**:
  - La geometría se rota primero horizontalmente (`geometry.rotateX(-Math.PI / 2)`) y se traslada inmediatamente a la esquina mínima (`geometry.translate(size / 2, 0, size / 2)`).
  - Los vértices locales se extienden exactamente de $[0, size]$ en $X$ y $Z$, coincidiendo milimétricamente con el sistema de coordenadas de la cuadrícula.
  - Al evaluar $h = this.getHeightAt(x, z)$, los bordes compartidos entre chunks adyacentes calculan exactamente la misma cota matemática con 0.000 mm de separación o salto.
- **Normales Analíticas Globales por Diferencias Centrales**:
  - En lugar de `computeVertexNormals()`, las normales de cada vértice se calculan analíticamente a partir del gradiente del terreno global:
    $$N = \text{normalize}(h(x - \epsilon, z) - h(x + \epsilon, z), 2\epsilon, h(x, z - \epsilon) - h(x, z + \epsilon))$$
  - Al ser una función compartida de coordenadas mundiales, los vértices frontera entre chunks vecinos tienen normales 100% idénticas, eliminando cualquier costura de luz, brillo especular o quiebre de sombra.
- **Materiales Naturalistas por Pendiente y Altitud (*Slope-Aware*)**:
  - A partir de la normal analítica $N_y$, se deriva la inclinación real del terreno (`slope = 1.0 - normY`).
  - Las paredes empinadas y acantilados ($slope > 0.35$) muestran granito oscuro y roca desnuda incluso en altitudes bajas, mientras que los valles y mesetas planas conservan praderas alpinas e ichu.
  - En cumbres altas (>110m), las crestas y paredes verticales mantienen roca expuesta donde la nieve no se sostiene, mientras que las laderas menos empinadas acumulan hielo y nieve perpetua.
- **Domain Warping Geológico & Micro-Detalle en [ChunkManager.ts](file:///c:/Projects/Jarbees_the_game/systems/ChunkManager.ts)**:
  - Implementado *domain warping* sinusoidal continuo para romper la cuadrícula rígida del DEM satelital, generando aristas, espolones y contornos geológicos orgánicos.
  - Agregado micro-relieve fractal y estrato rocoso en laderas altas amortiguado hacia el spawn para preservar la cota cero en el lago.
- **Mayor Fidelidad de Malla en [InfiniteTerrain.tsx](file:///c:/Projects/Jarbees_the_game/components/InfiniteTerrain.tsx)**:
  - Resolución mejorada a 3.125 unidades (32×32 segmentos por chunk), eliminando facetas triangulares marcadas y logrando siluetas suaves en vuelo tanto a baja como a gran altitud.

## [0.8.24] - 2026-10-23

### 🏔️ Erradicación de Terrenos Superpuestos & Calibración de Cota Cero en el Spawn del Aconcagua

#### Diagnóstico del "Terreno Flotando por Encima de Otro"
- **Causa 1 (Persistencia de Mallas Anteriores en Three.js)**:
  - En [InfiniteTerrain.tsx](file:///c:/Projects/Jarbees_the_game/components/InfiniteTerrain.tsx), al ciclar de bioma con la tecla **[B]** (ej: de Titicaca a Aconcagua), `chunkManager.dispose()` destruía los chunks en memoria JS, pero las mallas de Three.js (`chunksRef.current`) **permanecían añadidas al `groupRef.current`** de la escena.
  - Al cargar el bioma Aconcagua, las nuevas mallas de montaña alta se superponían directamente sobre las colinas verdes de Titicaca que nunca se habían removido.
- **Causa 2 (Race Condition al Cargar el DEM Satelital)**:
  - En los primeros milisegundos de arranque, los chunks iniciales se generaban antes de que el `fetch` del archivo binario (`heightmap.bin`) completara, creando colinas bajas verdes a 10m de altitud.
  - Al completar la descarga, los nuevos chunks se generaban a 76m de altitud, produciendo un corte vertical artificial entre chunks antiguos y nuevos que dejaba al terreno superior como una losa suspendida en el aire.
- **Causa 3 (Desfase de Cota Cero en el Spawn)**:
  - La elevación satelital cruda de la región situaba al valle en ~3.614m sobre el nivel del mar, haciendo que el punto de spawn del jugador en `(0, 0)` quedara a 24m de altura mientras la cámara inicial empezaba a `y = 2`, viendo el terreno desde abajo hacia arriba.

#### Solución Integral Aplicada
- **Limpieza de Ciclo de Vida en [InfiniteTerrain.tsx](file:///c:/Projects/Jarbees_the_game/components/InfiniteTerrain.tsx)**:
  - Implementado efecto de desmontaje completo: cada vez que `chunkManager` o el bioma cambia, todas las mallas `THREE.Mesh` en `chunksRef.current` se remueven de `groupRef.current`, se liberan sus geometrías (`geometry.dispose()`) y materiales (`material.dispose()`), y se limpian los registros.
  - Enlace bidireccional `chunkData.mesh = mesh` para que cualquier regeneración asíncrona actualice directamente la geometría viva en la GPU.
- **Calibración Anatómica del Aconcagua en [ChunkManager.ts](file:///c:/Projects/Jarbees_the_game/systems/ChunkManager.ts)**:
  - **Cota Cero en el Spawn**: La elevación del valle en `(0, 0)` ahora se calibra a **2.5 m** (exactamente al nivel del lago), permitiendo despegar, caminar y ver la ladera natural frente al jugador sin quedar bajo tierra.
  - **Cumbre Centrada al Frente**: La cumbre real a 6.935m se ubica al frente a `worldZ = -900 m` alcanzando **128 m** de altitud, con rampa ascendente continua y natural.
  - **Clamp de Píxeles**: Eliminado el salto abrupto a bordes de mapa mediante `Math.max(0, Math.min(510, px))` y un radio de transición suave (*cosine blend*) entre 1.100m y 1.500m.
  - **Precarga Inmediata**: La descarga de `heightmap.bin` se dispara a nivel de módulo del cliente, garantizando que el DEM esté en caché desde el frame 0.

## [0.8.23] - 2026-10-23

### 🏔️ Relieve Satelital Real del Monte Aconcagua en el Mundo Infinito & Limpieza Dorsal de NEXO-01

#### Integración de Datos Satelitales DEM Reales (Copernicus GLO-30 / SRTM)
- **Extracción de Elevación Real**:
  - Descarga y procesamiento de los datos de elevación topográfica del macizo del **Aconcagua** (Argentina), cubriendo el rango real desde el valle a **2.535 m** hasta la cumbre a **6.935 m**.
  - Generación de dataset binario `Float32Array` de 512×512 puntos ([heightmap.bin](file:///c:/Projects/Jarbees_the_game/public/terrain/data/regions/aconcagua/heightmap.bin)) con un peso de solo **1 MB**, permitiendo carga asíncrona instantánea en memoria sin comprometer recursos ni FPS.
- **Muestreo e Hibridación Infinita en [ChunkManager.ts](file:///c:/Projects/Jarbees_the_game/systems/ChunkManager.ts)**:
  - Interpolación bilineal de alta precisión sobre la cuadrícula DEM para recrear las paredes verticales, crestas y glaciares reales de la montaña.
  - **Fusión sin Abismos**: La cumbre del Aconcagua domina el horizonte central a 1.100 m al frente del jugador, mientras que en los bordes exteriores (>1.000m - 1.500m) un *cosine blend* suaviza la topografía hacia la cordillera procedural infinita.
  - **Calibración Vertical**: Altitud de cumbre escalada a **~145 m** en el espacio del juego, permitiendo sobrevolar la montaña, atravesar el manto de nubes a Mach 1, hacer descensos rasantes por la Pared Sur o aterrizar en la cumbre con colisiones y modo caminata integrados.
- **Coloración Geológica Andina por Altitud**:
  - Valles y lagunas (< 6m): pastizal andino fértil (`#4e6b42`).
  - Estepa y Puna (6m - 22m): pastos de altura e ichu dorado (`#666f48`).
  - Granito y paredes verticales (22m - 55m): roca oscura andina (`#544e45`).
  - Morrenas y pedregales (55m - 95m): bloques fríos de granito (`#78736b`).
  - Glaciar de los Polacos (95m - 120m): hielo glaciar y penitentes (`#b8cce0`).
  - Cima nevada (120m - 145m): manto blanco perpetuo (`#ffffff`).
- **Ajustes de Ecosistema & Entorno**:
  - [TreePopulation.tsx](file:///c:/Projects/Jarbees_the_game/components/TreePopulation.tsx): Árboles limitados estrictamente a valles bajos (<15m), dejando las laderas y glaciares completamente alpinos.
  - [RockPopulation.tsx](file:///c:/Projects/Jarbees_the_game/components/RockPopulation.tsx): Aumento de densidad de rocas andinas y morrenas.
  - [WaterSurface.tsx](file:///c:/Projects/Jarbees_the_game/components/WaterSurface.tsx): Agua de lagunas glaciares en azul profundo (`#1b4d6b`).
  - [GameHUD.tsx](file:///c:/Projects/Jarbees_the_game/components/GameHUD.tsx), [gameStore.ts](file:///c:/Projects/Jarbees_the_game/store/gameStore.ts) & [useGameControls.ts](file:///c:/Projects/Jarbees_the_game/hooks/useGameControls.ts): `🏔️ Aconcagua (DEM Real)` establecido como el **bioma predeterminado inicial** al entrar a la partida, con botón interactivo en el HUD y atajo con la tecla **[B]** para ciclar entre entornos.

#### Erradicación de Esfera Residual Negra en la Espalda de NEXO-01
- **Causa Raíz**:
  - En [BeePlayer.tsx](file:///c:/Projects/Jarbees_the_game/components/BeePlayer.tsx), existía una malla estática `<sphereGeometry args={[0.032, 16, 16]} />` con material negro carbón (`#060608`) colocada en `[0, 0.35, 0.04]` que no estaba riggeada a los huesos del esqueleto.
  - Durante las animaciones de vuelo horizontal prone (`nexo_fly`), la columna y el omóplato del modelo atravesaban las coordenadas fijas de la esfera, proyectándola como un círculo negro sobre la espalda del personaje.
- **Corrección**:
  - Remoción total de la malla redundante; el interior del reactor y la pechera ya son cubiertos de forma nativa por el shader y la coraza medieval sin artefactos visuales.

#### Correcciones de Infraestructura en el Sistema de Terreno
- [TerrainChunk.ts](file:///c:/Projects/Jarbees_the_game/systems/terrain/core/TerrainChunk.ts): Inicialización de `currentLOD` corregida a `-1` para permitir que `setLOD(0)` incorpore la malla al grupo en el primer ciclo.
- [ProceduralTerrainMaterial.ts](file:///c:/Projects/Jarbees_the_game/systems/terrain/materials/ProceduralTerrainMaterial.ts): Fijado `lights: false` para evitar requerimientos de uniforms de Three.js en shaders con modelo de luz manual.

## [0.8.22] - 2026-10-22

### 🏃 Biomecánica Auténtica de Carrera (`nexo_run`) & Erradicación Acústica del Drone de Fondo

#### Corrección Crítica de Cinemática de Piernas en Carrera ("Correr hacia atrás")
- **Diagnóstico Cinemático**:
  - Al ver al personaje desde atrás, las piernas parecían correr "en reversa" o hacer moonwalk debido a una inversión de fase en la flexión de rodilla (`mixamorig:LeftLeg_056` y `mixamorig:RightLeg_061`).
  - La fórmula anterior aplicaba la flexión máxima de rodilla (`93°`) durante la **fase de apoyo en el suelo** (`c <= 0`), mientras que durante la **fase de vuelo/avance en el aire** (`c > 0`), la rodilla permanecía casi recta (`15°`).
  - En la vista frontal, la perspectiva ocultaba la rigidez de la pierna en vuelo, pero desde la vista trasera (cámara estándar del jugador en 3ra persona), ver la pierna estirada mientras avanzaba y doblarse hacia atrás en el suelo generaba la evidente ilusión óptica de estar corriendo marcha atrás.
- **Solución Biomecánica Aplicada en [generate_nexo_animations.py](file:///c:/Projects/Jarbees_the_game/scripts/generate_nexo_animations.py)**:
  - **Fase de Apoyo / Stance**: Rodilla extendida firme con flexión suave de absorción de impacto (`18° a 26°`) mientras el pie empuja de adelante hacia atrás (`foot_y` de `-14.2` a `+21.6`).
  - **Fase de Vuelo / Swing**: En cuanto el pie despega del suelo por detrás (`f = 18`), la rodilla se flexiona profundamente (`-86°`) levantando el talón hacia la pelvis (`foot_z` asciende de `-28.6` a `-12.2`), permitiendo que la pierna pase holgadamente en el aire hacia adelante y extienda el metatarso justo antes de la pisada.
  - El modelo `jarbees_suit.glb` fue recompilado con Draco 7 y empaquetado/cifrado en `public/models/jarbees_suit.jb3d`.

#### Identificación y Erradicación Definitiva del Zumbido de Fondo
- **Causa Real Encontrada en Análisis Espectral**:
  - El archivo [ambient_music.wav](file:///c:/Projects/Jarbees_the_game/public/audio/ambient_music.wav) (`harmonia_mundi.wav`) contenía un **drone continuo en 45 Hz y sus armónicos (90 Hz, 135 Hz, 180 Hz y 225 Hz)**, que representaba el **48.6% de la energía sonora total** del track.
  - Al reproducirse en bucle continuo de fondo vía `manager.playMusic('ambient', 2.5)` al 65% de volumen (`musicVolume: 0.65`), generaba un constante zumbido/hum eléctrico de baja frecuencia audible en todo momento independientemente del personaje.
- **Tratamiento Acústico**:
  - Se filtró `ambient_music.wav` mediante transformación FFT con un corte de paso alto a 130-180 Hz y notch específico en 225 Hz, reduciendo la energía grave por debajo de 200 Hz del 48.6% al **3.73%**. La música ahora preserva sus campanas, texturas y acordes etéreos cristalinos sin ningún tipo de zumbido o zumbido eléctrico residual.
  - Se filtró también `wind_loop.wav` eliminando ruidos sordos graves sub-120 Hz.
  - Se actualizó la versión del Service Worker en [sw.js](file:///c:/Projects/Jarbees_the_game/public/sw.js) a `jarbees-game-v3` para forzar la invalidación inmediata de la caché local del navegador y garantizar que los nuevos audios limpios y el modelo corregido se descarguen al instante.

#### Barrido de Estabilidad & Saneamiento de Código
- **Sincronización en [RealTerrain.tsx](file:///c:/Projects/Jarbees_the_game/components/RealTerrain.tsx)**:
  - Eliminada llamada a propiedad obsoleta `setBeePosition` inexistente en `GameState`.
  - Conversión de `position` a instancia `THREE.Vector3` para alimentar `RealTerrainSystem.update()`, garantizando streaming dinámico continuo de chunks de elevación real.
  - Saneamiento de tipado en cleanup asignando `terrainManager: null`.
- **Atenuación Inicial en [useAudio.ts](file:///c:/Projects/Jarbees_the_game/hooks/useAudio.ts)**:
  - Inicialización de volumen en `loadSound` y `playLoop` de `wind` fijada en `0.05` (antes `0.25`), previniendo cualquier pico acústico transitorio al cargar el juego.
- **Validación de Compilación en Producción**:
  - `npm run build` ejecutado exitosamente con 0 errores de TypeScript, 0 fallos de linter y empaquetado optimizado de Next.js listo para testeo.

## [0.8.21] - 2026-10-22

### 🛡️ Calibración Luminosa de Armadura Plateada & Silenciamiento Total del Zumbido

#### Diagnóstico y Solución de Texturas Oscuras en Three.js
- **Causa Raíz**: En [BeePlayer.tsx](file:///c:/Projects/Jarbees_the_game/components/BeePlayer.tsx), el recorrido de materiales forzaba `mat.color` a `#102D46` (azul petróleo oscuro) en `Red_Part` (60% del cuerpo) y `#35205B` (violeta oscuro) en `Gold_Part` (25% del cuerpo). El casco tenía un filtro condicional que preservaba `mat.color = '#ffffff'`, razón por la cual el casco lucía gris claro mientras el resto del cuerpo se oscurecía en un tono casi negro.
- **Unificación Plata Forjada PBR**:
  - Se eliminaron las máscaras oscuras en Three.js. Para todos los componentes texturizados (`Red_Part`, `Gold_Part`, pechera de ángel, casco), `mat.color` se estableció en `#ffffff` en espacio `sRGBColorSpace`, reproduciendo fielmente las texturas de plata forjada horneadas en Blender.
  - Para evitar pérdida de luz difusa en Three.js (debido a la ausencia de mapa de entorno HDRI en la escena), `metalness` se calibró a `0.40` y `roughness` a `0.28`, garantizando un ~60% de reflexión difusa plateada y brillante en cualquier ángulo.
  - Se añadieron luces de estudio frontales y traseras de relleno (`pointLight` y `ambientLight`) alrededor del personaje para iluminar uniformemente las placas y la pechera tanto mirando al frente como en vista supina/inclinada.

#### Identificación y Extinción Definitiva del Zumbido de Fondo
- **Diagnóstico del Zumbido ("no es el sonido de la abeja")**:
  - **Fuente 1 (Osciladores de Turbina en [FlightAudio.ts](file:///c:/Projects/Jarbees_the_game/systems/FlightAudio.ts))**: El motor de audio procedural Web Audio API mantenía un piso residual incondicional `engineGain.gain = 0.02` alimentado por un oscilador de onda triangular a 58 Hz y otro de onda senoidal a 116 Hz. Al estar en reposo o suspensión estática (hovering), este circuito generaba un zumbido eléctrico constante de 58/116 Hz.
  - **Fuente 2 (Bucle Armónico en [characters.ts](file:///c:/Projects/Jarbees_the_game/types/characters.ts) / [BeePlayer.tsx](file:///c:/Projects/Jarbees_the_game/components/BeePlayer.tsx))**: El sonido `auren_flight` tenía `baseVolume: 0.09`. Al estar flotando en el aire sin tocar el suelo (`!isGrounded`), el sistema reproducía el archivo `auren_flight.wav` (compuesto de capas senoidales continuas a 110, 165 y 220 Hz) a un 9% de volumen, percibido como un drone o zumbido permanente.
  - **Fuente 3 (Viento Ambiente en [useAudio.ts](file:///c:/Projects/Jarbees_the_game/hooks/useAudio.ts))**: El loop de viento corría a un volumen elevado de 0.25 - 0.32 con resonancia grave.
- **Extinción Aplicada**:
  - En `FlightAudio.ts`: La ganancia del oscilador de turbina ahora es estrictamente `0.0` cuando el personaje está en reposo o hovering estático (`throttle < 0.01` y `speed < 3.0 km/h`).
  - En `types/characters.ts`: `baseVolume` de `auren_flight` se fijó en `0.0`.
  - En `BeePlayer.tsx`: Cuando el traje está en reposo terrestre o en flotación aérea estacionaria (`MACH 0.00 | 0 km/h`), `audio.setSoundVolume(soundKey, 0.0)` silencia por completo el sonido de vuelo.
  - En `useAudio.ts`: El viento ambiental se redujo a una brisa sutil (`0.04 - 0.06`), eliminando cualquier estruendo o rumble de fondo.

## [0.8.20] - 2026-10-22

### 🎖️ Overhaul Táctico de Carrera CS 1.6 & Left 4 Dead (`nexo_run`)

#### Biomecánica & Cinética Source Engine
- **Rediseño Completo de la Carrera Táctica (`nexo_run`)**:
  - **Inspiración CS 1.6 (GoldSrc) & Left 4 Dead (Source Engine)**: Sustituido el antiguo ciclo de carrera con brazos abiertos en abducción excesiva (-28°) por una postura militar compacta, ágil y de alta inercia (Tactical Rush).
  - **Guardia Táctica de Brazos**: Los brazos ahora permanecen disciplinados y ceñidos al torso (`X = 4.0°`), con los codos flexionados en ángulo cerrado táctico (`Z = -30°` a `-52°` en carrera impulsada), eliminando el aspecto de "brazos extendidos/alas".
  - **Puños de Combate**: Se incorporó flexión anatómica completa de dedos (`fist_curl = 68°`) formando puños cerrados listos para el combate en lugar de manos abiertas y sueltas.
  - **Doble Rebote y Amortiguación Pélvica**: Se corrigió el eje de rebote en `mixamorig:Hips_01` (ahora en el eje vertical `Local Y`), transmitiendo el impacto de talón/metatarso con compresión amortiguada y elevación en fase aérea en cada paso.
  - **Combat Horizon Lock (Estabilización de Visor)**: La inclinación atlética hacia adelante del torso (`+13°`) se compensa de forma giroscópica continua en cuello y cabeza (`-8°` / `-10.5°`), manteniendo el visor cibernético siempre apuntando al frente hacia el horizonte.
  - **Zancada y Contacto Reactivo**: Cadencia precisa de 24 frames (0.8s a 30 FPS) horneada fotograma a fotograma (25 keyframes continuos) con flexión y extensión elástica de rodillas y pisada plantar firme.

#### Paleta Monolítica y Acabado PBR (Plata Forjada & Acero Reliquia)
- **Armonización Completa con la Pechera Medieval de Ángel (`armor_plate` / `DefaultMaterial`)**:
  - **Fusión y Camuflaje Pectoral**: Se eliminó la antigua combinación fragmentada de azul petróleo y violeta. La armadura completa ahora comparte la misma base de **Acero Plateado Forjado** (`#9EA4AA`, `Metallic = 0.90`, `Roughness = 0.28`), haciendo que la pechera se integre y camufle orgánicamente con los hombros, pectorales, costillas y abdomen.
  - **Relieves y Biseles en Plata Pulida**: Los marcos perimetrales, crestas y biseles reflejan en **Plata Pulida Reforzada** (`#C8CED4`, `Metallic = 0.92`, `Roughness = 0.24`), replicando las líneas pulidas de la placa pectoral.
  - **Remaches de Bronce/Latón Antiguo**: Los remaches del casco gladiador y anclajes corporales fueron calibrados al tono exacto de los remaches de latón de la pechera (`#B88E48`).
  - **Juntas en Gunmetal Steel**: Uniones articulares, juntas y tendones oscurecidos en grafito de alta densidad (`#3E4248`) para recrear los surcos oscuros tallados en el metal.
  - **Contraste Fotónico Visor**: El visor cibernético detrás de la ranura en T del casco brilla en cian puro, creando un contraste épico entre acero medieval forjado y tecnología cibernética.

#### Compilación y Cifrado
- Modelo `assets_source/models/jarbees_suit.glb` reanimado y exportado en Blender 5.2 con compresión Draco nivel 7.
- Binario de producción empaquetado y cifrado criptográficamente en `public/models/jarbees_suit.jb3d`.

## [0.8.19] - 2026-10-21

### 🦾 Corrección Cinemática de Brazos (Carrera y Agachado) & Saneamiento Acústico Total

#### Corregido & Biomecánica
- **Corrección Cinemática de Brazos al Correr (`nexo_run`)**:
  - Se eliminó la inyección externa de Mixamo en `scripts/generate_nexo_animations.py` que sobreescribía la animación e introducía un cruce forzado de brazos hacia el centro del tórax, entrelazando las manos dentro de la pechera.
  - Se implementó un ciclo procedural puro de carrera atlética con abducción lateral fija (`X = -28.0°`), asegurando que ambos brazos y antebrazos oscilen a ~22 cm a los costados del torso, con total holgura respecto a las costillas y pechera medieval reliquia.
- **Corrección Anatómica al Agacharse (`nexo_crouch`, `nexo_crouch_stand` y `nexo_crouch_walk`)**:
  - Se eliminó la rotación en el eje local X (`-38°`) de los antebrazos que abría los codos hacia afuera en postura de "alas de pollo" y torsionaba las manos en ángulos antinaturales.
  - La flexión de codo ahora articula suavemente en el eje sagital Z (`-14°` a `+14°`), dejando caer los brazos de forma protegida y relajada paralelos a los muslos (`X = ±13.2 cm`), con las manos y muñecas niveladas de manera natural al frente junto a las rodillas.

#### Limpiado & Paisaje Sonoro
- **Saneamiento Definitivo de Audios con Derechos de Autor**:
  - Se eliminaron por completo todos los disparos de audio en las teclas `J` (`nexo_landing_heavy.wav`) y `H` (`nexo_warning_denied.wav`), así como en aterrizajes forzados o pesados.
  - Se purgaron y eliminaron del repositorio todos los archivos WAV con procedencia de Valve / Source Engine (`nexo_landing_heavy.wav`, `nexo_warning_denied.wav`, `nexo_heartbeat_loop.wav`, `nexo_impact_heavy.wav`, `nexo_armor_impact.wav`), suprimiendo su carga en `hooks/useAudio.ts` y `components/BeePlayer.tsx`.
- **Nuevo Paisaje Acústico Continuo y Libre de Zumbidos para Auren (`auren_flight.wav`)**:
  - En `scripts/generate_auren_audio.py`, se sintetizó un paisaje acústico continuo a 44.1 kHz 16-bit sin modulación de volumen sinusoidal (eliminada la respiración de 0.33 Hz que generaba un vaivén intermitente) y sin armónicos a 58 Hz / 116 Hz tipo zumbido de transformador eléctrico.
  - Capa de armónicos cuánticos en quinta justa y octavas limpias (A2 = 110 Hz, E3 = 165 Hz, A3 = 220 Hz, C#4 = 277.18 Hz), flujo aerodinámico iónico aterciopelado y micro-shimmer a 880 Hz.
  - En reposo estático sobre tierra firme, Auren entra en standby silencioso absoluto (volumen `0.0`).
  - El zumbido de abeja (`bee_buzz`) ahora se inicializa en `0.0` para evitar cualquier filtración residual al seleccionar a Auren.

#### Compilación & Cifrado
- **Horneado y Cifrado glTF Draco v7**:
  - Nuevo set horneado en Blender 5.2 sobre `assets_source/models/jarbees_suit.glb` (22.85 MB) y cifrado criptográfico mediante `scripts/protect-models.js` a `public/models/jarbees_suit.jb3d`.

---

## [0.8.18] - 2026-10-21

### 🎵 Paisaje Acústico Original de Auren y Depuración de Sonidos Tácticos

#### Modificado & Mejorado
- **Diseño Acústico Original para Auren (`auren_flight.wav` y `iron_man_thruster.wav`)**:
  - Se eliminó por completo el zumbido penetrante y estridente de 420 Hz FM que emulaba insectos/avispas.
  - Se sintetizó un sonido cinematográfico y relajante para el reactor Hex-Core de la armadura:
    - Sub-grave cálido y profundo (fundamental de 58 Hz + 116 Hz) que brinda sensación de masa e ingeniería avanzada.
    - Flujo aerodinámico ionizado con doble filtro pasa-bajos convolucional (~420 Hz cutoff) sin siseos ni frecuencias agudas.
    - Resonancia cuántica en intervalo de quinta justa (174 Hz y 261 Hz) con modulación suave de fase ultra-lenta (0.25 Hz).
- **Osciladores en Tiempo Real de `FlightAudio.ts`**:
  - Se sustituyó el oscilador `sawtooth` por ondas triangulares y senoidales suaves, reduciendo las frecuencias de corte de turbina para un sonido aterciopelado.
  - La resonancia de Fase Aurelium pasó de un zumbido agudo en paso banda a 520 Hz a un acorde armónico suave a 174 Hz con atenuación dinámica.

#### Corregido & Limpiado
- **Eliminación de Sonidos de Curación (Left 4 Dead)**:
  - Se retiró el sonido de vendaje y curación (`nexo_heal_nanites.wav` / `bandaging_1.wav`) del movimiento táctico `[8] Interacción` (`tactical_interact`).
- **Eliminación de Sonidos de Impacto en Animaciones de Daño**:
  - Se retiraron los sonidos balísticos de impacto (`nexo_armor_impact.wav`) al ejecutar las animaciones `[6] Flinch Torso`, `[7] Flinch Casco` y `[G] Stumble`, adaptando las reacciones cinéticas al contexto de exploración sin agresores externos.
- **Actualización de Tooltips en HUD**:
  - Se ajustaron las descripciones en `GameHUD.tsx` para reflejar reacciones cinéticas en lugar de pruebas de impacto/daño recibido.

---

## [0.8.17] - 2026-10-21

### 🧟‍♂️ Integración Táctica Source Engine / Left 4 Dead y Corrección de Agachado

#### Corregido
- **Corrección de la Animación de Agacharse (`nexo_crouch` y `nexo_crouch_walk`)**:
  - Se corrigió el mapeo de traslación pélvica de `mixamorig:Hips_01`: anteriormente se aplicaba sobre el eje Z con valor ínfimo (4 mm) sin alterar la altura, dejando al personaje de pie mirando a sus pies. Ahora desciende -13.5 unidades en el eje vertical Local Y (-0.38 m reales) con flexión profunda de rodillas (-112°), torso inclinado +18° y cabeza a -14° manteniendo la mirada al horizonte.
  - Sincronización de cámara en `FollowCamera.tsx`: al agacharse en tierra, la cámara desciende suavemente -0.35m ofreciendo una perspectiva táctica auténtica de perfil bajo.

#### Añadido
- **Set de Acciones Tácticas Source / Left 4 Dead (`scripts/generate_nexo_animations.py`, `public/models/jarbees_suit.jb3d`)**:
  - `nexo_melee_shove` (Tecla `F`): Empuje cinético repulsor frontal para despejar enemigos cuerpo a cuerpo (con sonido `nexo_impact_heavy.wav`).
  - `nexo_stumble_recovery` (Tecla `G`): Tambaleo y desbalanceo inercial hacia atrás tras onda de choque o impacto masivo (con sonido `nexo_armor_impact.wav`).
  - `nexo_limp_walk` (Tecla `H`): Marcha asimétrica renqueante por integridad crítica (<25%), mano izquierda protegiendo el reactor Hex-Core.
  - `nexo_hunter_pounce` (Tecla `J`): Aterrizaje depredador en 3 puntos / Superhero Landing estilo Hunter de Left 4 Dead (con sonido `nexo_landing_heavy.wav`).
- **Banco de Sonidos Físicos Valve / Left 4 Dead (`public/audio/`)**:
  - Incorporación de `nexo_landing_heavy.wav` (impacto de caída pesada), `nexo_armor_impact.wav` (impacto balístico), `nexo_impact_heavy.wav` (golpe contundente), `nexo_heartbeat_loop.wav` (latido fisiológico en tensión), `nexo_warning_denied.wav` (alerta de servos), `nexo_heal_nanites.wav` (presurización/nanoreparación).
- **Dock Táctico Interactivo en HUD (`components/GameHUD.tsx`)**:
  - Menú `Táctico Source [6-0 / F-J]` con botones táctiles interactivos clicables para detonar cada acción táctica y emote directamente con el ratón o teclado.
- **Documentación Técnica Dedicada**:
  - Creación de `AUREN_SOURCE_L4D_SYSTEM.md`.

---

## [0.8.16] - 2026-10-21

### 🎖️ Integración de Animaciones Tácticas CS 1.6 & Cybernetic Controls Dock

#### Añadido
- **Set de 9 Animaciones Tácticas Inspiradas en CS 1.6 / GoldSrc (`scripts/generate_nexo_animations.py`, `public/models/jarbees_suit.jb3d`)**:
  - `nexo_crouch_walk` (crouchrun): Locomoción sigilosa en perfil bajo con cadera a -0.16m, rodillas continuas entre -45° y -75° y brazos compactos al frente.
  - `nexo_flinch_torso` (gut_flinch): Sacudida reactiva instantánea (16 frames) con repliegue de torso (+24°) y protección del reactor Hex-Core.
  - `nexo_flinch_head` (head_flinch): Latigazo cefálico hacia atrás (-28°) por impacto o sobrepresión transónica.
  - `nexo_death_forward`, `nexo_death_back`, `nexo_death_left`, `nexo_death_right`: Colapsos inerciales direccionales de caída/muerte.
  - `nexo_tactical_interact`: Interacción y tecleo holográfico en el panel del guantelete (inspirado en `v_c4`).
  - `nexo_quicklook`: Barrido perimétrico rápido de vigilancia (inspirado en `hostage.mdl`).
- **Cybernetic Controls Dock (`components/GameHUD.tsx`, `app/globals.css`)**:
  - Reemplazo del bloque plano de texto amontonado por una cápsula flotante estilizada con glassmorphism oscuro y micro-etiquetas `<kbd>`.
  - Muestra contextualmente `[WASD] Mover`, `[Ctrl] Agachar (+WASD Sigilo)`, `[Espacio] Salto/Vuelo`, `[1-5] Emotes`.
  - Botón micro desplegable `[6-0] Táctico CS` para probar las nuevas acciones tácticas.
- **Soporte de Entrada para Agachado y Sigilo (`hooks/useGameControls.ts`)**:
  - Mapeo nativo de `ControlLeft` y `ControlRight` además de `KeyC`.
  - Combinación fluida `Ctrl` + `WASD` que transiciona automáticamente a `nexo_crouch_walk`.
  - Mapeo de teclas numéricas 6..0 para detonar flinches, interacción y colapso.
- **Documentación Técnica Dedicada**:
  - Creación de `AUREN_CS_TACTICAL_ANIMATIONS.md` con tablas de retargeting esquelético `Bip01` -> `mixamorig`.

---

## [0.8.15] - 2026-10-20

### 🚶 Postura de Vuelo Aerodinámica Horizontal ("Acostado") y Locomoción Terrestre Táctica Natural

#### Añadido
- **Postura de Vuelo Horizontal Prone ("Acostado") (`scripts/generate_nexo_animations.py`, `public/models/jarbees_suit.jb3d`)**:
  - Reestructuración biomecánica completa de la animación **`nexo_fly_forward`**:
    - Inclinación frontal longitudinal de la pelvis (`mixamorig:Hips_01`) a **78°** y alineación vertebral recta (`+2°`) para vuelo en torpedo nivelado.
    - Cuello y cabeza compensados a -24° y -48° respectivamente, manteniendo la mirada y el visor dirigidos hacia el frente y el horizonte.
    - Brazos perfilados a lo largo de los flancos como superficies aerodinámicas estabilizadoras (`mixamorig:LeftArm`/`RightArm` extendidos hacia atrás).
    - Piernas extendidas en línea recta con tobillos y botas a 48° simulando toberas vectoriales.
  - Actualización de **`nexo_boost`** a postura plana hipersónica con inclinación a **84°**.
  - Actualización de **`nexo_bank`** manteniendo vuelo prone a **75°** con alabeo dinámico de 35°.
- **Suspensión Táctica en Vuelo Estático (`nexo_hover`)**:
  - Reemplazo de la postura vertical rígida (0°) por una inclinación dinámica de suspensión frontal a **42°** con rodillas semiflexionadas (-14°) y botas a 36°.

#### Modificado / Optimizado
- **Ajuste de Locomoción Terrestre Natural ("Chill" & Forward Swing) (`scripts/generate_nexo_animations.py`, `components/BeePlayer.tsx`)**:
  - Reemplazo del balanceo lateral oscilante por un braceo anteroposterior auténtico (adelante y atrás) con oscilación controlada en el eje frontal.
  - Postura holgada y paso amplio en la caminata terrestre del exoesqueleto, eliminando movimientos rígidos o exagerados.
  - Incremento de la velocidad de caminata por defecto a $7.2\text{ m/s}$ (trote táctico ágil en tierra).
- **Modulación de Cabeceo y Actitud en Vuelo (`components/BeePlayer.tsx`)**:
  - Eliminación de multiplicadores globales de inclinación excesiva en favor de trimado natural:
    - Actitud horizontal por defecto en crucero nivelado.
    - Cabeceo dinámico hacia arriba (`+0.22 rad`) durante ascenso activo con espacio.
    - Cabeceo hacia abajo (`-0.25 rad`) durante descensos o picadas.
    - Postura de frenado aerodinámico reactivo (`+0.25 rad`) al pulsar aerofreno con `S`.

## [0.8.14] - 2026-10-20

### 🚶 Modo Tierra (Walk) con Reconocimiento de Terreno, Transición Vuelo/Suelo y Limpieza Visual de Aurelium

#### Añadido
- **Reconocimiento Dinámico del Suelo y Conmutación a Modo Caminata (`components/BeePlayer.tsx`, `store/gameStore.ts`)**:
  - Al descender con **`Q`** o descender voluntariamente hacia el relieve, el exoesqueleto NEXO-01 detecta la cota de contacto con el terreno (`player.position.y <= floorY + 0.08`) y conmuta de inmediato al **Modo Walk** (`isGrounded = true`).
  - La posición vertical se ancla fielmente a las curvas y elevaciones del relieve sin hundimientos ni flotabilidad artificial.
- **Locomoción Terrestre Completa en Tierra Firme (`components/BeePlayer.tsx`)**:
  - **`W` / `S`**: Desplazamiento a pie hacia adelante y retroceso activando el ciclo auténtico de caminata pesada **`nexo_walk`** (o **`nexo_run`** al activar aceleración con Shift).
  - **`A` / `D`**: Giro sobre el terreno ejecutando animaciones de giro sobre el suelo (**`nexo_turn_left`** / **`nexo_turn_right`**).
  - **Reposo en Tierra**: Postura firme y vertical con respiración biomecánica en reposo (**`nexo_idle`**), desactivando balanceos aéreos, inclinación de torpedo y derivas de viento.
- **Despegue y Transición Instantánea a Vuelo con Barra Espaciadora (`components/BeePlayer.tsx`)**:
  - Al presionar **`SPACE BAR`** en tierra firme, el exoesqueleto ejecuta un salto/impulso elástico hacia arriba (`nexo_takeoff` / impulso vertical $v_y \approx 6.4\text{ m/s}$).
  - Sale instantáneamente del modo tierra (`isGrounded = false`), devolviendo de inmediato los mandos de **`WASD`** a los micro-reactores vectoriales y físicas completas de vuelo.
- **Respuesta Audiovisual y Telemetría Adaptativa (`components/GameHUD.tsx`, `components/BeePlayer.tsx`)**:
  - **HUD Inteligente**: Muestra el estado en tiempo real (`🚶 Caminando` / `🧍 En Tierra (Modo Walk)` vs `▶ Volando`).
  - **Panel de Controles Contextual**: Actualiza las leyendas de ayuda en la parte inferior de la pantalla para reflejar los controles de caminata o vuelo según corresponda.
  - **Gestión Acústica de Propulsores**: En tierra los reactores se silencian a un zumbido de espera imperceptible ($0.015$ volumen), apagando el rugido de turbina hasta el nuevo despegue.

#### Modificado / Optimizado
- **Limpieza de Geometría Visual de Fase Aurelium (`components/FlightEffects.tsx`)**:
  - Eliminación de la malla esférica *wireframe* magenta que envolvía la cámara durante la aceleración supersónica, despejando la visión periférica y conservando intactos el cono de vapor Mach, las estelas cinemáticas y los anillos de onda de choque.

## [0.8.13] - 2026-10-20

### 🚀 Sistema de Altas Velocidades, Física Transónica/Hipersónica, Fase Aurelium y Navegación Inteligente JarBees GCAS

#### Añadido
- **Física Atmosférica Compresible y Techo de Vuelo Realista (`systems/FlightDynamics.ts`)**:
  - Implementación precisa de la atmósfera estándar ISA: velocidad del sonido $a(h) = 340.29 \sqrt{T(h)/288.15}$ y densidad $\rho(h)$.
  - **Techo Atmosférico Natural**: El vuelo convencional alcanza su equilibrio físico natural a **Mach 0,83 (~1.017 km/h al nivel del mar y 882 km/h a 11.000 m)**. A partir del Mach crítico ($M_{cr} \approx 0,72$), la resistencia de onda $k_{onda}(M)$ se dispara contrarrestando el empuje normal sin requerir límites artificiales.
  - **Soporte de Régimen Hipersónico (Mach 3 a Mach 5+)**: Incorporación del régimen `'hypersonic'` al orden canónico `FLIGHT_REGIME_ORDER`.
- **Modo Dual de Vuelo: Fase Aurelium (`systems/FlightDynamics.ts`, `components/FlightEffects.tsx`)**:
  - Creación de la envoltura de control de flujo ionizado Aurelium ($\phi_{aurelium}$):
    - Se activa al sostener postquemador a partir de Mach 0,72 con reactor Hex-Core cargado.
    - Colapsa el arrastre de onda hasta un 72%, permitiendo perforar la barrera del sonido y acelerar hacia Mach 1, 2 y regímenes hipersónicos.
    - Penalizaciones balanceadas: consumo acelerado de energía del reactor ($+3.8\%/\text{s}$) y generación térmica.
- **Inteligencia de Vuelo JarBees GCAS (Ground Collision Avoidance System) (`systems/FlightDynamics.ts`, `components/BeePlayer.tsx`)**:
  - A 1.017 km/h Auren recorre 28 metros cada 100 ms (fuera del tiempo de reacción humano de 200 ms).
  - En modo asistido, JarBees monitorea la altitud rasante ($h_{suelo}$) y el vector de descenso; si detecta impacto inminente a alta velocidad ($v_{aire} > 130 \text{ m/s}$, $h < 14 \text{ m}$, $v_y < -1.5 \text{ m/s}$), inyecta micro-sustentación vectorial compensatoria automática.
- **Dinámicas Rasantes y Respuesta del Entorno (Ground Wake & Thermal Glow) (`components/FlightEffects.tsx`)**:
  - **Polvo y Agitación Rasante**: Sistema GPU de 90 partículas de polvo en abanico cónico en "V" que se levantan cuando Auren vuela a ras de suelo ($<28\text{ m}$) a alta velocidad, con atenuación inversa cuadrática $(1 - h/28)^2$.
  - **Halo de Fase Aurelium**: Envoltura electromagnética elipsoide translúcida en Three.js con pulso y blend aditivo que canaliza el flujo del traje.
  - **Incandescencia Térmica de Plasma**: A Mach $>2,2$, el cono y las estelas de velocidad cambian su coloración de azul cian a fuego incandescente (ámbar a rojo fuego) representando el calor de estancamiento aerodinámico.
- **Audio Procedural de Fase Aurelium (`systems/FlightAudio.ts`)**:
  - Oscilador y filtro pasabanda resonante sintetizado en Web Audio API que produce un siseo electromagnético ionizado cuando el flujo Aurelium está activo.
- **Telemetría e Indicadores en Pantalla (`components/GameHUD.tsx`, `store/gameStore.ts`)**:
  - Insignia brillante `✨ AURELIUM` cuando la envoltura de flujo está activa.
  - Indicador de alerta `🛡️ GCAS` cuando la IA de JarBees asiste en el rasante.
  - Indicador de régimen `Hipersónico (M>3)` y aviso de plasma térmico en el núcleo.
- **Encuadre Cinematográfico Cercano de Cámara (`types/characters.ts`)**:
  - Acercamiento de la cámara en 3ra persona para el personaje NEXO-01 (`offset: [0, 0.68, 1.72]`, `lookOffset: [0, 0.14, -0.85]`), aumentando la cercanía e inmersión en un ~25% para apreciar con mayor fidelidad la pechera medieval, el visor stealth y los detalles mecánicos del exoesqueleto.
- **Documentación Técnica y Lore (`AUREN_HIGH_SPEED_FLIGHT_SYSTEM.md`)**:
  - Especificación exhaustiva con ecuaciones aerodinámicas, tablas comparativas de altitudes y explicación de los dos modos de vuelo.

## [0.8.12] - 2026-10-20

### 🛡️ Pechera Medieval Reliquia de Auren (Nexo Viajero del Tiempo), Brazos Estilizados y Cifrado JB3D

#### Añadido
- **Integración de la Pechera Medieval Reliquia (`scripts/create_jarbees_suit.py`, `components/BeePlayer.tsx` & `public/models/jarbees_suit.jb3d`)**:
  - Incorporación de la pechera histórica de acero forjado con relieve del ángel alado y remaches de bronce (`armor_plate.glb`), complementando el concepto narrativo de Nexo como viajero del tiempo que ensambla reliquias de diversas épocas en su traje sintético.
  - Calibración volumétrica anatómica sobre el torso ($0.355\text{ m}$ ancho, $0.405\text{ m}$ alto, $0.220\text{ m}$ espesor, inclinación frontal de $9.5^\circ$), cubriendo el esternón y el antiguo reactor sin oclusiones ni interferencias esqueléticas.
  - Rigging 100% integrado al hueso `mixamorig:Spine1_03` con deformación fluida a lo largo de todo el árbol de animaciones de combate, vuelo y emotes.
  - Calibración de shader PBR en Three.js con reflectancia de acero pulido (`roughness: 0.28`, `metalness: 0.90`) y espacio de color `sRGB` para máxima fidelidad de textura.
- **Herramientas de Inspección y Calibración 3D (`scripts/test_calibrate_cuirass.py`, `scripts/test_cuirass_scale.py`)**:
  - Scripts de renderizado y ajuste en Blender headless para validación cinemática previa de piezas y ensamblado.

#### Modificado / Optimizado
- **Limpieza y Estilización Anatómica de Brazos (`scripts/create_jarbees_suit.py`)**:
  - Eliminación de las placas facetadas orcas en bíceps (`shin_-_left/right`), coderas y hojas de guanteletes que sobrecargaban la silueta lateral.
  - Retorno a la silueta limpia, aerodinámica y sintética de los brazos, resaltando el contraste entre la cerámica perlada, las líneas de titanio y la pechera central.
- **Bóveda Criptográfica y Re-cifrado de Modelos (`scripts/protect-models.js`)**:
  - Compilación y cifrado AES-256-CTR de `jarbees_suit.glb` a `public/models/jarbees_suit.jb3d` con compresión Draco v7 (22.46 MB).

## [0.8.11] - 2026-10-20

### 🥋 Retargeting Auténtico Mixamo Androide, Corrección Anatómica de Rodillas en Aterrizaje y Set de Emotes Tácticos con Articulación Manual

#### Añadido
- **Retargeting e Inyección de Animaciones Auténticas de Mixamo (`scripts/extract_android_motions.py`, `scripts/generate_nexo_animations.py` & `components/BeePlayer.tsx`)**:
  - Extractor universal de movimientos Mixamo FBX a formato canónico JSON (`humanoid_motion_library.json`).
  - Inyección de 6 animaciones de combate y locomoción con retargeting 1:1 sobre los 65 huesos estándar Mixamo del exoesqueleto NEXO-01:
    - `nexo_walk` (37 frames): Ciclo bipedal natural y balanceado.
    - `nexo_run` (22 frames): Carrera atlética con zancada dinámica.
    - `nexo_attack` (44 frames): Golpe cuerpo a cuerpo y descarga de ataque cinético.
    - `nexo_jump` (51 frames): Secuencia acrobática completa de salto vertical y recepción.
    - `nexo_damage` (42 frames): Reacción de impacto recibido y recuperación de guardia.
    - `nexo_dead` (110 frames): Colapso cinemático de derrota y desactivación de sistemas.
  - Registro de las nuevas acciones (`nexo_attack`, `nexo_damage`, `nexo_dead`, `nexo_emote_ok`, `nexo_emote_welcome_thumbs`) en el controlador de animaciones de Three.js.
- **Set de Emotes Tácticos con Articulación Manual Individual**:
  - Gesto 4: Señal de OK táctico (`nexo_emote_ok`), con anillo índice-pulgar cerrado al frente y dedos medio, anular y meñique extendidos.
  - Gesto 2: Pulgar arriba (`nexo_emote_thumbs_up`) refinado con flexión articulada en falanges de dedos 2 a 5.
  - Gesto 5: Celebración victoria (`nexo_emote_cheer`) con fase de carga (windup) y elevación de puño cerrado.
  - Asset táctico complementario `public/models/tactical_hands.jb3d`.
- **Actualización de Telemetría HUD (`components/GameHUD.tsx`)**:
  - Leyenda de controles y panel de ayuda actualizado con la asignación de los nuevos emotes (teclas 1 a 5).

#### Corregido
- **Corrección Anatómica de Rodillas en Aterrizaje Heroico y Heavy Land (`scripts/generate_nexo_animations.py`)**:
  - Resuelto el bug de flexión invertida de rodillas registrado en v0.8.10:
    - Inversión del signo angular (`-lk`, `-rk`) en los huesos `LeftLeg_056` y `RightLeg_061`, logrando una flexión humana hacia atrás anatómicamente perfecta.
    - Calibración de apoyo cinemático: pierna izquierda firme como pilar delantero con suela plana contra el suelo (+52°, -92°, +40°) y pierna derecha arrodillada amortiguando el impacto (-18°, -90°, -15°).

## [0.8.10] - 2026-10-19

### 🦾 Aterrizaje Heroico Original JarBees (Kinetic Strikedown), Emotes Tácticos Frontales y Estabilización Cinemática

#### Añadido
- **Aterrizaje Heroico Original JarBees ("Kinetic Strikedown Touchdown") (`scripts/generate_nexo_animations.py` & `components/BeePlayer.tsx`)**:
  - Reemplazo total de la antigua sentadilla simétrica por una pose heroica y cinematográfica inspirada en el impacto de tres puntos:
    - **Descenso Pélvico Real (-0.40 m)**: Corrección del factor de escala $36\times$ y permutación de ejes locales en Mixamo (`Local Y = World Z`, `Local Z = -World Y`).
    - **Brazo Derecho (Impacto Cinético / Concussive Cushion)**: Hombro derecho descendido y guantelete cibernético proyectado hacia adelante y abajo, descargando una onda de choque contra el suelo.
    - **Brazo Izquierdo (Alerón Estabilizador)**: Desplegado hacia atrás y arriba como estabilizador aerodinámico con silueta afilada.
    - **Mirada al Horizonte**: Cabeza y cuello en contra-flexión hacia arriba ($-30^\circ$), manteniendo el visor HUD clavado firmemente en el horizonte.
  - **Máquina de Estados de Aterrizaje Fluida**:
    - Anticipación automática en aproximación a tierra ($< 1.0\text{ m}$) con tecla de descenso.
    - Ventana de amortiguación cinematográfica de $1.20\text{ s}$ al tocar suelo (`justLanded`).
    - Cancelación instantánea y reactiva (0 ms de lag) al presionar `W`, `Shift` (Boost) o `Espacio` (Salto).
- **Emotes Tácticos y Militares con Orientación Frontal (Teclas 1 al 5)**:
  - `1`: Saludo Militar de honor a la sien del visor.
  - `2`: Aprobación táctica con pulgar al frente del pecho y asentimiento.
  - `3`: Señalamiento directo de objetivo al horizonte.
  - `4`: Gesto de llamada / beckon frente al torso.
  - `5`: Celebración y puño en alto.
  - Todos los movimientos corregidos para operar estrictamente por delante del cuerpo en el hemisferio frontal (`Y < 0`).
- **Aerofreno Reactivo (`S`) con Codos Adelantados**:
  - Codos proyectados hacia adelante y hacia afuera con separación $> 0.40\text{ m}$, eliminando el choque anatómico tras la espalda.
- **Suspensión Vertical Erguida (`nexo_hover`)**:
  - Columna vertebral y cadera fijadas a $0.0^\circ$ con postura militar recta.

#### Corregido
- **Eliminación del Bug de "Autofrenado" o "Tildado" al Acelerar**:
  - Se desacopló la detección de caídas respecto al desnivel de colinas u ondulaciones del relieve, midiendo la velocidad vertical real en coordenadas de mundo y sincronizada a 60 Hz desde `flightRuntime`.

#### Nota Técnica Registrada (Pendiente de Calibración)
- **Sentido de Flexión en Rodillas (Anotado para revisión)**:
  - Durante la compresión profunda de impacto en `build_landing` y `build_heavy_land`, las rodillas (`LeftLeg_056` y `RightLeg_061`) presentan flexión invertida respecto al plano anatómico humano. Queda registrado como prioridad de inicio para calibrar el eje/signo de rotación local en Mixamo.

## [0.8.9] - 2026-10-19

### 📱 Optimización de UI Móvil: Touch en Traje para Giro de Vesper, D-Pad Limpio y Retiro de Turbo

#### Optimizado
- **Controles Táctiles Móviles (`components/MobileTouchControls.tsx`)**:
  - **Eliminación total de botones centrales en el D-Pad**: Se retiró cualquier botón adicional en el centro de los 4 controles direccionales (▲, ▼, ◀, ▶), dejando el centro limpio y despejado con un espacio vacío original.
  - **Eliminación del botón ⚡TURBO**: Se removió el botón de postquemador en pantallas táctiles que sobrecargaba la esquina inferior derecha y se superponía con la telemetría.
- **Giro de Vesper por Touch Directo en Pantalla (`components/BeePlayer.tsx`)**:
  - Exclusivo para Vesper: el giro de 180° para mirar al usuario o quedar de espaldas cuando está suspendido se activa ahora directamente mediante un toque (*touch / pointer down*) del usuario sobre el traje en la escena 3D, de forma idéntica al clic en PC y sin requerir botones adicionales en la interfaz.
  - **Preservación estricta de mecánicas originales**: Las mecánicas de vuelo, cabeceo y físicas de la abeja, el colibrí y la mariposa se mantienen 100% preexistentes e intactas.
- **Simplificación del HUD de Telemetría en Móviles (`components/GameHUD.tsx` & `app/globals.css`)**:
  - Saneamiento de pantalla en smartphones/tablets: se ocultan filas secundarias de telemetría técnica (`Empuje`, `Energía`, `Núcleo °C`, `Carga G`, botón redundante `MODO` y descripciones extensas) mediante `.hud-desktop-only`.
  - El HUD móvil queda reducido a un indicador ultraligero y nítido (Mach, km/h, insignia de régimen y altitud) ubicado arriba a la derecha sin ninguna colisión con los botones de `SUBIR` / `BAJAR`.

## [0.8.8] - 2026-10-19

### 🛡️ Armadura Berserker Gladiator Protocol (BEE-01 Vesper), Visor Cibernético HUD y Optimización de Rendimiento WebGL

#### Añadido
- **Armadura Berserker Gladiator Protocol (`scripts/create_jarbees_suit.py` & `components/BeePlayer.tsx`)**:
  - Integración completa de placas modulares de exoesqueleto basadas en la armadura Berserker cosplay, prescindiendo deliberadamente de hombreras con púas para mantener una silueta aerodinámica:
    - **Escudo Pectoral del Plexo Solar**: Placa blindada convexa (`Belt_Buckle_thick.stl`) combinada con gancho de soporte táctico (`belt_arm_hook.stl`), anclada anatómicamente a la espina dorsal superior (`mixamorig:Spine1_03`) con acabado Titanio Frío (`#A8C4D5`).
    - **Guanteletes de Antebrazo con Cuchillas Cibernéticas**: Cuchillas tácticas (`Hand_Guard_-_left.stl` y `Right`) orientadas 45° al exterior sobre los antebrazos (`LeftForeArm_010` y `RightForeArm_034`), visibles e imponentes en vistas frontal y en perspectiva 3/4.
    - **Placas Blindadas de Bíceps**: Placas curvadas anatómicas (`shin_-_left.stl` y `Right`) montadas sobre los brazos superiores (`LeftArm_09` y `RightArm_033`) en acabado Violeta Profundo (`#35205B`).
    - **Coderas Articuladas**: Copas de impacto de codo (`elbow_cap_-_left.stl` y `Right`) en Violeta Profundo.
    - **Placa Pélvica / Hebilla Inferior**: Placa de cintura (`Belt_Buckle.stl`) acoplada a la cadera (`mixamorig:Hips_01`).
    - **Botas y Greaves de Combate**: Botas pesadas (`foot_-_left.stl` y `Right`) en Azul Petróleo (`#102D46`) con doble influencia de deformación en tobillo (`LeftLeg_056` / `LeftFoot_057`) para flexión orgánica sin artefactos de malla.
- **Casco de Gladiador y Visor Cibernético HUD**:
  - Sustitución y ocultamiento total de la cabeza original de Iron Man (vértices replegados al 35% del radio de cuello).
  - Casco Gladiador con texturas PBR completas: domo en Azul Petróleo, máscara en Violeta Profundo, escudo T y cresta en Titanio Frío.
  - Visor cilíndrico interior emisor en Cian Energético (`#55F0FF`, intensidad 3.5) que brilla tras la ranura en T del casco.

#### Optimizado
- **Controles Táctiles Móviles y Giros Acrobáticos Discretos (`components/MobileTouchControls.tsx`, `components/BeePlayer.tsx`, `store/gameStore.ts`)**:
  - **Eliminación del botón ⚡TURBO**: Suprimido el botón de postquemador en pantallas táctiles que sobrecargaba la esquina inferior derecha y se superponía a la telemetría.
  - **Giros Acrobáticos Limitados por Toque (Arriba y Abajo)**: Sustituido el antiguo botón circular `🔄` (que invertía la orientación a 180° indefinidamente) por dos botones discretos en el centro del D-Pad:
    - `⤴` **Giro hacia arriba (Looping 360°)**: Maniobra vertical con arco de ascenso (+1.9m) que recupera automáticamente la horizontalidad frontal.
    - `⤵` **Giro hacia abajo (Picado 360°)**: Inmersión vertical controlada (-1.6m) con salida suave a nivel de vuelo.
    - Cada toque ejecuta una acrobacia acotada de 0.82s sin desorientar al usuario ni dejar al personaje volando de espaldas.
- **Simplificación del HUD de Telemetría en Móviles (`components/GameHUD.tsx` & `app/globals.css`)**:
  - Saneamiento de pantalla en smartphones/tablets: se ocultan filas secundarias de telemetría técnica (`Empuje`, `Energía`, `Núcleo °C`, `Carga G`, botón redundante `MODO` y descripciones extensas) mediante `.hud-desktop-only`.
  - El HUD móvil queda reducido a un indicador ultraligero y nítido (Mach, km/h, insignia de régimen y altitud) ubicado arriba a la derecha sin ninguna colisión con los botones de `SUBIR` / `BAJAR`.
- **Rendimiento WebGL y Eliminación de Lag / Stuttering**:
  - **Decimación de Malla en un 75% (`scripts/create_jarbees_suit.py`)**: Los modelos CAD originales de impresión 3D superaban los 250,000 vértices de alta densidad, lo que saturaba el vertex shader y la deformación por huesos en Three.js. Se implementó un algoritmo de decimación adaptativo con ratio 0.25 que preserva los ángulos y aristas afiladas:
    - Escudo del plexo solar: de 28,000 a 8,000 vértices.
    - Botas y greaves: de 48,000 a 14,500 vértices por bota.
    - Guanteletes de antebrazo: de 11,000 a 3,100 vértices.
    - Placas de bíceps: de 21,000 a 6,100 vértices.
    - Coderas: de 7,500 a 2,200 vértices.
  - **Compresión Draco Nivel 7**: Cuantización espacial a 14 bits que reduce el peso de transmisión a 9.61 MB.
  - Cifrado seguro a formato `.jb3d` para descarga eficiente y descompresión acelerada en WebGL, estabilizando el juego a 60 FPS continuos.

#### Corregido
- **Conos de Propulsión de Botas (`components/FlightEffects.tsx` & `components/BeePlayer.tsx`)**:
  - Retirados definitivamente los conos de fuego y aros de emisión de las suelas a favor de la estética limpia y estilizada de las nuevas botas berserker blindadas.
- **Mapeo de Materiales Dinámicos (`components/BeePlayer.tsx`)**:
  - Resuelto conflicto de nombres de materiales que teñía erróneamente de negro el visor cibernético del casco de gladiador.
  - Enrutamiento correcto de shaders para las nuevas piezas acopladas (`Plexus`, `Gauntlet`, `Bicep`, `Elbow`, `Boot`).

## [0.8.7] - 2026-10-19

### ⚡ Simulador Aerodinámico JarBees (BEE-01 Vesper), Regímenes Supersónicos y Acabado Stealth Black

#### Añadido
- **Simulador Aerodinámico JarBees (`systems/FlightDynamics.ts`)**:
  - Motor de dinámica de vuelo puro desacoplado de React y Three.js, modelando resistencia atmosférica real ($F_D = \frac{1}{2} \rho v^2 C_D A \cdot k_{onda}(M)$) con atmósfera estándar ISA.
  - Curva de resistencia de onda transónica que penaliza el avance cerca de Mach 1 y exige postquemador para franquear la barrera del sonido.
  - 5 regímenes cinemáticos calculados dinámicamente:
    - `hover` (0–60 km/h: sustentación estacionaria y micro-maniobras).
    - `cruise` (60–300 km/h: vuelo rasante sobre valles y colinas).
    - `high` (300–800 km/h: alta velocidad subsónica).
    - `transonic` (800–1200 km/h / Mach 0.65–1.0: buffet oscilatorio y alta fricción).
    - `supersonic` (1200–2800 km/h / Mach 1.0–2.5+: onda de choque y penetración atmosférica).
  - Termodinámica del núcleo **Hex-Core**: consumo energético con postquemador (`boost`) y calentamiento acumulativo con alerta térmica y protección por sobrecalentamiento.
  - Modos de vuelo duales con alternancia instantánea por tecla `[G]`: **Modo Asistido** (estabilización automática) y **Modo Simulación Inercial** (inercia pura sin asistencia).
  - Script de pruebas headless del modelo de vuelo (`scripts/flight_sim_test.ts`) para verificación determinista de aceleración, frenado y consumo.

- **Audio Procedural en Tiempo Real (`systems/FlightAudio.ts`)**:
  - Motor de sonido procedural 100% sintetizado con Web Audio API (cero dependencias de archivos de audio externos):
    - Ruido de viento filtrado que asciende en frecuencia con la velocidad y atenúa los agudos al superar Mach 1 ("el sonido del entorno queda atrás").
    - Ruido tonal de turbinas repulsoras modulado en frecuencia y amplitud por el empuje (`throttle`).
    - Rugido subsónico de postquemador (`afterburner`) mediante generador de ruido marrón con filtros paso bajo dinámicos.
    - Modulación de vibración transónica (*buffet*) a ~16 Hz en la zona crítica.
    - Estampido sónico (*sonic boom*) procedural con pulso subsónico y chasquido al quebrar la velocidad del sonido.

- **Efectos Audiovisuales Hipersónicos (`components/FlightEffects.tsx`)**:
  - Estelas aerodinámicas (*speed streaks*) en túnel de viento volumétrico que se estiran proporcionalmente a la velocidad del aire.
  - Cono de condensación / cono de Mach volumétrico con sombreador GLSL personalizado y degradado de vapor opaco en el ápice.
  - Ondas de choque sónicas (*shockwave rings*) expansivas que se dispersan en el espacio al producirse cada estampido sónico.
  - Llamas de propulsión repulsora en botas (`SuitThrusterFlames`) vinculadas dinámicamente al vector de empuje y estado de postquemador.

- **Streaming Anticipado de Terreno Procedural (`systems/ChunkManager.ts` & `components/InfiniteTerrain.tsx`)**:
  - Precarga direccional predictiva: proyecta hasta 380m por delante según el vector de avance horizontal ($v_x, v_z$).
  - Presupuesto controlado de instanciación por frame (`maxNew = 4`) para evitar micro-tirones de CPU a más de 2000 km/h.

- **Telemetría Avanzada en HUD y Controles Móviles (`components/GameHUD.tsx` & `components/MobileTouchControls.tsx`)**:
  - Telemetría en tiempo real para la armadura: Mach digital, velocímetro km/h, insignia de régimen aerodinámico, barra de empuje, indicador ⚡AB, porcentaje de carga Hex-Core, termómetro de núcleo (°C) y carga de gravedad (G).
  - Selector de modo de vuelo en pantalla `[G] ASIST / SIM`.
  - Controles móviles táctiles enriquecidos: botón dedicado `⚡TURBO` (Postquemador), botón central `🔄` en el D-pad para inversión de orientación 180° y botón superior de modo de vuelo.

#### Corregido
- **Llamas Repulsoras de Botas (`components/FlightEffects.tsx`)**:
  - Rediseñada la geometría de los conos de propulsión de las botas (`SuitThrusterFlames`): diámetro de base reducido de 19 cm a 4.8 cm para que queden contenidos dentro de la planta del pie (~8 cm) sin sobresalir por los bordes.
  - Anclaje anatómico exacto en el centro geométrico de cada suela: interpolación longitudinal entre el tobillo (`LeftFoot`/`RightFoot`) y la base de los dedos (`LeftToeBase`/`RightToeBase`), sumada al vector lateral corporal para desplazar cada tobera 3.0 cm hacia el eje medio de cada pie, erradicando el sesgo hacia el borde interno.
  - Sombreador GLSL personalizado con atenuación de tobera (`rimSoft`) y desvanecimiento suave hacia la punta, eliminando cualquier aro plano o corte circular visible.

#### Mejorado
- **Identidad Propia JarBees (BEE-01 Vesper) (`components/BeePlayer.tsx` & `types/characters.ts`)**:
  - Rostro, visores ópticos y núcleo frontal transformados a acabado **Stealth Black mate** (`#0D0D11`), distanciando radicalmente el diseño de cualquier similitud visual con Iron Man y afianzando la personalidad propia del universo JarBees.
  - Inclinación visual dinámica que mantiene postura horizontal de torpedo a alta velocidad y se yergue al activar el aerofreno (tecla `S`).
  - Vibración estructural microscópica en el modelo 3D derivada de la telemetría de buffet y estampido.
- **Cámara Dinámica de Persecución (`components/FollowCamera.tsx`)**:
  - Seguimiento relativo con amortiguación exponencial adaptativa a la velocidad: elimina el retraso excesivo a Mach 2 manteniendo la distancia focal constante (~3-4m).
  - Retroceso y elevación progresiva de cámara (`camPull`) y apertura dinámica de campo visual (+25° FOV) a altas velocidades.
  - Sacudida y rotación angular de cámara sincronizadas con las turbulencias transónicas y estampidos.

## [0.8.6] - 2026-10-18

### 🛡️ Bóveda de Protección de Modelos 3D (.jb3d) y Descifrado en Memoria (RAM)

#### Añadido
- **Bóveda de Cifrado de Assets (.jb3d)**:
  - Implementado formato de contenedor criptográfico `.jb3d` para reemplazar todos los `.glb` públicos.
  - Cifrado simétrico AES-256-CTR con vector de inicialización único por archivo y derivación SHA-256 (`scripts/protect-models.js`).
  - Comando npm `npm run protect-models` para procesar modelos maestros desde `assets_source/models/` y sanear la carpeta pública.
- **Descifrado en Memoria RAM (`utils/assetSecurity.ts` & `utils/useSecureGLTF.ts`)**:
  - Módulo de descifrado en cliente acelerado por hardware mediante Web Crypto API (`crypto.subtle`).
  - Hook `useSecureGLTF` con soporte completo de DRACO, Meshopt, precarga (`useSecureGLTF.preload`) y fallback de compatibilidad.
  - El modelo 3D descifrado nunca se almacena en disco ni crea URLs públicas de descarga en el navegador.
- **Protección de Repositorio**:
  - `assets_source/` añadido a `.gitignore` para garantizar que los `.glb` maestros nunca se suban al repositorio público de GitHub.
  - Archivos `.glb` sin cifrar removidos de `public/models/`. Solo se distribuyen los binarios protegidos `.jb3d`.
  - Documentación técnica completa en `MODEL_PROTECTION.md`.

#### Actualizado
- **BeePlayer.tsx**: Migrado a `useSecureGLTF` cargando `/models/bee.jb3d`.
- **AmbientWildlife.tsx**: Migrado a `useSecureGLTF` cargando `/models/colibri.jb3d` y `/models/butterfly.jb3d`.
- **public/sw.js**: Precache y caché offline del Service Worker actualizados para dar soporte a `.jb3d`.
- **next.config.js**: Reglas de Webpack actualizadas para soportar la extensión `.jb3d`.

## [0.8.5] - 2026-10-16

### 📱 Estabilización Cinemática de Cámara y Eliminación de Temblor en Móviles

#### Corregido
- **FollowCamera.tsx**:
  - Eliminado por completo el temblor / sacudida (*camera jitter*) que se percibía al avanzar con la abeja, especialmente visible en pantallas móviles.
  - **Sincronización directa en grafo 3D**: La cámara ahora sigue directamente el nodo 3D en tiempo real (`beePlayer`) en vez de suscribirse al estado asíncrono de React/Zustand, eliminando la latencia de 1 a 2 frames que causaba desincronización con el render loop de WebGL.
  - **Suavizado síncrono de LookAt y Posición**: Se unificó la interpolación de la posición de la cámara y del objetivo de mira (*lookAt target*) bajo amortiguación exponencial pura (`1 - Math.exp(-14 * delta)`), garantizando una orientación matemática estable e independiente de fluctuaciones en el framerate.
  - **Cero recolección de basura (GC)**: Vectores y matrices de transformación preasignados en `useRef`, eliminando allocations de memoria por frame.

#### Mejorado
- **BeePlayer.tsx**:
  - Nombrado el grupo de la abeja como `beePlayer` para acceso directo desde el grafo de la escena.
  - Física de velocidad mantenida en `velocityRef` y vectores cacheados en `useRef`, evitando re-renderizados innecesarios del componente en React en cada frame.
  - Sincronización del estado global de telemetría (HUD: velocidad, distancia, altitud) optimizada a ~10 Hz (cada 100ms) en lugar de disparar 240+ emisiones por segundo en el hilo principal de React.
- **InfiniteTerrain.tsx, WaterSurface.tsx & AmbientWildlife.tsx**:
  - Desacoplados de las suscripciones reactivas per-frame de posición de Zustand, consultando la posición directamente en `useFrame`. Esto reduce el consumo de CPU en dispositivos móviles y evita la reconciliación virtual del DOM en cientos de elementos naturales.
- **GameScene.tsx**:
  - Añadido `touchAction: 'none'` al contenedor y al `Canvas` en móviles para prevenir que los gestos táctiles del navegador generen micro-desplazamientos de viewport.

## [0.8.4] - 2026-10-16

### 🐝 Vuelo a Altura Constante, Optimización Mobile de Inicio y HUD Compacto

#### Corregido
- **BeePlayer.tsx**:
  - Corregido el vector de movimiento de avance `forwardVector` para operar estrictamente sobre el plano horizontal XZ mediante el ángulo de orientación Yaw (`bee.rotation.y`), eliminando el descenso progresivo en picada que ocurría al acelerar. Ahora la abeja mantiene constante su altitud al avanzar o frenar.
  - Desacoplada la inclinación aerodinámica de vuelo (Pitch y Roll) de la física de traslación Y, aplicándola visualmente sobre el ancla del modelo 3D (`modelAnchorRef.current`).
- **FollowCamera.tsx**:
  - Estabilizada la matriz de orientación de la cámara con rotación exclusiva sobre el eje Y (`makeRotationY`), manteniendo el horizonte nivelado y cinematográfico sin cabeceos hacia el suelo al acelerar.

#### Mejorado
- **app/page.tsx**:
  - Habilitado scroll vertical táctil suave y continuo con `min-height: 100dvh`, `overflow-y: auto` y padding inferior seguro (`55px`), evitando que la barra de navegación del navegador móvil tape los elementos interactivos.
  - Dimensiones del logo (95px), título y márgenes verticalmente optimizados para pantallas móviles (`@media (max-width: 600px), (max-height: 750px)`), garantizando que el botón **"▶ Jugar Ahora"** sea visible y accesible de inmediato al ingresar.
- **app/globals.css & GameHUD.tsx**:
  - Paneles del HUD estilizados con clases CSS responsivas, reduciendo la tipografía y espaciados de 1 a 2 puntos en PC.
  - En móviles: reubicada la telemetría de vuelo a la esquina superior derecha bajo los botones rápidos táctiles, liberando la esquina inferior derecha para que los controles de `SUBIR` y `BAJAR` no se superpongan.
  - Ocultada automáticamente la barra de instrucciones de teclado en pantallas móviles para no ensuciar el centro de la pantalla.

## [0.8.3] - 2026-10-16

### 🌊 Alineación Directa de Reflejo Solar/Lunar en Agua y Oleaje PBR

#### Corregido
- **DynamicSky.tsx**:
  - Corregida la dirección de los rayos solares y lunares en `directionalLight`: su propiedad `target` estaba anclada en el origen mundial `(0, 0, 0)` en lugar de seguir a la cámara. Al volar kilómetros por el mundo infinito, la luz incidía en un ángulo oblicuo incorrecto desviando el reflejo en el agua.
  - Se vinculó `sunLight.target` y `moonLight.target` directamente al centro local del observador, asegurando que el vector de incidencia solar/lunar provenga exactamente del disco visual del sol o la luna en cualquier posición o distancia recorrida.

#### Mejorado
- **WaterSurface.tsx**:
  - Incorporada textura procedural de normales de oleaje (`normalMap`) con animación de desplazamiento continuo en la dirección del viento.
  - Parámetros PBR de agua natural (dieléctrico real con `metalness: 0.08`, `roughness: 0.18`), generando una estela de luz reflectiva (*sun glade / moon glade*) que apunta directa y perfectamente hacia el astro en el horizonte.

## [0.8.2] - 2026-10-15

### 🌕 Textura Lunar Realista de Archeoscope, Autoría Legal y Optimización de Fauna

#### Añadido
- **Textura Lunar de Alta Definición**:
  - Incorporada textura 2K geológica de la Luna proveniente de *Archeoscope* / NASA (`public/textures/moon.jpg`).
  - Mapeo difuso y emisivo aplicado a la esfera lunar en `DynamicSky.tsx`, dotándola de relieve, cráteres y resplandor nocturno auténtico.
- **Marco Legal y de Propiedad Intelectual**:
  - **LICENSE**: Actualizado con licencia **CC BY-NC 4.0** asignando la autoría y derechos de creador principal a **Ignacio Fernandez** (`@ifernandez89`).
  - **LICENSE_ASSETS**: Protección estricta **ALL RIGHTS RESERVED** sobre todos los modelos 3D, texturas, música, arte e identidad visual de *JarBees: The Game*.
  - **NOTICE**: Documento formal de atribuciones a librerías de terceros (Three.js, R3F, Drei, Next.js, Zustand) y créditos de sonido y astronomía.

#### Corregido
- **AmbientWildlife.tsx**:
  - Implementada clonación con `SkeletonUtils.clone` para preservar armatures y esqueletos de los modelos con huesos (`colibri.glb` y `butterfly.glb`).
  - Sistema de seguimiento dinámico frontal en el espacio infinito: los colibríes y mariposas se mantienen activos y visibles delante de la abeja (10m a 25m) con envergaduras aumentadas a ~1.0m – 1.15m.

## [0.8.1] - 2026-10-15

### ☀️ Corrección de Sol Unificado, Purga de Quads y Ascenso Aéreo Ampliado

#### Corregido
- **DynamicSky.tsx**:
  - Corregido el efecto de "doble sol / doble círculo" mediante la unificación de coordenadas concéntricas en `sunGroupRef`, eliminando el doble offset de posición entre núcleo y aureola.
  - Eliminados los billboards planos rectangulares que generaban cajas blancas en el cielo.
- **WeatherSystem.tsx**:
  - Eliminados los puntos/partículas que generaban artefactos cuadrados en pantalla, manteniendo la niebla volumétrica limpia.

#### Mejorado
- **BeePlayer.tsx**:
  - Límite de altitud máxima incrementado de **45 m a 82 m** para permitir planear en altura justo por debajo del manto de nubes.
  - Velocidad de ascenso vertical con tecla `ESPACIO` incrementada a **14.0 m/s** para una respuesta ágil e inmediata en vuelo.

## [0.8.0] - 2026-10-15

### 🌤️ Ciclo Día/Noche Dinámico, Viento Permanente, Fauna Aérea y Rocas Archeoscope

#### Añadido
- **AmbientWildlife.tsx**: Fauna voladora ambiental en el mundo infinito
  - Colibríes y mariposas con modelos 3D y animaciones reales (`flight`, `hover`, `idle`).
  - Dinámicas de vuelo autónomas: aleteo y ráfagas rápidas para colibríes; vuelo cadencioso y ondulante para mariposas.
  - Reposicionamiento inteligente en el terreno infinito para mantener 60 FPS sin saturación de memoria.
  - Arquitectura preparada para intercambio de foco de cámara / insecto.
- **Clouds.tsx**: Sistema de nubes volumétricas dinámicas
  - Cúmulos algodonosos estilizados que se desplazan con el vector de viento.
  - Tinte cromático reactivo al ciclo solar: melocotón/ámbar al amanecer, blanco puro al mediodía, naranja rojizo al atardecer y azul índigo a la luz lunar.
- **RockPopulation.tsx**: Rocas, cantos de camino y megalitos estilo *Archeoscope*
  - Instanciación procedural por cuadrantes sin penalización de rendimiento.
  - Distribución orgánica en laderas, crestas y orillas con colores de granito y musgo andino.
- **Viento permanente por defecto**:
  - Brisa continua de 1.8 m/s en `gameStore.ts` con sustentación y leve balanceo natural en la abeja.
  - Bucle sonoro ambiental de viento siempre suavemente audible.

#### Mejorado
- **useDayNightCycle.ts & DynamicSky.tsx**:
  - Activado el avance continuo del tiempo de juego (`updateGameTime` por fotograma).
  - Trayectoria solar y lunar reorientada hacia el frente (`-Z`) con corona dorada esférica para total visibilidad del amanecer, mediodía y atardecer.
  - Manto de estrellas de alta visibilidad y constelaciones identificables (**Cruz del Sur / Chakana** y **Orión**) conectadas por líneas estelares.
  - La bóveda celeste sigue a la cámara para conservar el horizonte infinito.
  - Ciclo calibrado a 12 minutos para transiciones fluidas y perceptibles.
- **BeePlayer.tsx**:
  - Reducción sustancial del volumen del zumbido (base `0.06`, máximo moderado `0.17`).
  - Límite de altitud ampliado a **82 m** permitiendo ascender libremente justo bajo el manto de nubes.
  - Velocidad de ascenso vertical con tecla `ESPACIO` incrementada a 14.0 m/s para máxima respuesta y agilidad.
- **WeatherSystem.tsx**:
  - Eliminación de quads/artefactos cuadrados, conservando niebla volumétrica limpia y cinemática.
- **GameScene.tsx**:
  - Eliminación de luces estáticas que sobreexponían la noche, permitiendo una auténtica atmósfera nocturna con luz lunar.

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
