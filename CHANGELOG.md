# 📝 CHANGELOG - JarBees: The Game

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
