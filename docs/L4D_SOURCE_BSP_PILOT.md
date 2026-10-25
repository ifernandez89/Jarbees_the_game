# 🏰 AUREN WORLDLAB — Source Engine BSP Pilot (Left 4 Dead)

Documentación técnica y resultados del laboratorio experimental para la ingestión, análisis espacial y renderizado de mapas del motor **Source Engine (VBSP v20)** dentro de **Auren WorldLab / JarBees**.

---

## 📋 1. Visión del Laboratorio: El Salto desde GoldSrc

En la fase anterior con Counter-Strike 1.6 (GoldSrc BSP v30), aprendimos a recuperar la arquitectura de sólidos (*brushes*) y zonas de combate táctico. Con Left 4 Dead damos el salto al motor **Source Engine**, incorporando:
1. **Verticalidad y arquitectura multicapa:** Corredores estrechos, nave central de la iglesia, campanario y complejo subterráneo de sótanos.
2. **Atmósfera cinematográfica y dirección de arte:** Iluminación tenebrosa, paletas oscuras de terror y transiciones interiores/exteriores.
3. **Puntos de interés de supervivencia:** Mapeo de safe rooms, alijos de suministros, armas y zonas de evacuación.
4. **Composición ambiental:** Aprender cómo la distribución espacial crea tensión y navegación intuitiva para luego aplicar estos principios en la generación procedural de Auren.

---

## 🗺️ 2. El Escenario Piloto: `l4d_church01_basement_beta.bsp`

* **Nombre de Campaña:** *Vaporiza y Reza — Sótano de la Iglesia (Beta)*
* **Motor:** Source Engine (VBSP versión 20)
* **Revisión del Mapa:** 174
* **Archivo Original:** `K:\Mapas\Left 4 Dead\left4dead\maps\l4d_church01_basement_beta.bsp` (37.13 MB)
* **Entorno:** Capilla gótica, patio exterior, cementerio y laberinto subterráneo de sótano fortificado.

---

## 🛠️ 3. El Servicio: `SourceWorldAnalyzer`

Se diseñó e implementó el servicio [scripts/source_world_analyzer.py](file:///c:/Projects/Jarbees_the_game/scripts/source_world_analyzer.py) para no limitarse a una simple conversión de malla, sino producir un **paquete completo de inteligencia espacial**:

```text
assets_source/source_world_analysis/l4d_church01_basement_beta/
├── geometry.glb            # Malla visual optimizada (0.84 MB)
├── collisions.glb          # Colisionador de suelo y barreras simplificado (0.49 MB)
├── navigation.json         # Puntos de spawn, armas, botiquines y zonas de rescate
├── entities.json           # 720 entidades del motor Source parseadas
├── materials.json          # Auditoría de 525 materiales y shaders VMT
├── dependencies.json       # Estado de recursos (MDL, VTX, VVD, VMT, VTF)
├── static_props.json       # Catálogo de 321 instancias de static props y ángulos
└── analysis_report.json    # Métricas espaciales y reporte de rendimiento
```

---

## 🔬 4. Pipeline de Conversión y Extracción de Geometría

### 4.1. Decodificación de la Estructura VBSP v20
El extractor implementado en [scripts/convert_l4d_church_to_glb.py](file:///c:/Projects/Jarbees_the_game/scripts/convert_l4d_church_to_glb.py) lee directamente los *lumps* binarios del mapa:
* **Lump 3 (`LUMP_VERTEXES`):** 11.550 vértices base.
* **Lump 12 (`LUMP_EDGES`) & Lump 13 (`LUMP_SURFEDGES`):** 26.753 aristas y 42.264 surfedges.
* **Lump 6 (`LUMP_TEXINFO`):** 2.142 definiciones de vectores de textura $(s, t)$ y flags de superficie.
* **Lump 7 (`LUMP_FACES`):** 6.095 caras (de 56 bytes cada una).
* **Filtrado:** Se descartan automáticamente superficies invisibles (`SURF_NODRAW = 0x80`, `SURF_SKY = 0x04`, `SURF_TRIGGER = 0x40`).

### 4.2. Conversión Métrica y Normalización Espacial
* **Factor de Escala:** 1 unidad Source = $0.0254\text{ m}$ (1 pulgada métrica).
* **Calibración de Spawn:** La Safe Room original ubicada en Source en $(-1867.0, 2773.0, -80.0)$ se normalizó al origen del juego $[0.0, 1.20, 0.0]$, permitiendo que Auren aparezca parado directamente sobre el suelo del refugio con su botiquín y municiones.

### 4.3. Optimización Radical de Draw Calls (6 Primitivas)
En lugar de crear cientos de materiales individuales que saturarían el renderizador WebGL, las caras visibles se agruparon por familias de materiales PBR cinematográficos:
1. `Church_Stone`: Piedra oscura de la capilla y mampostería.
2. `Old_Wood`: Maderas envejecidas, vigas y bancos de la iglesia.
3. `Urban_Concrete`: Hormigón de aceras y paredes del sótano.
4. `Rusted_Metal`: Tuberías, rejas y puertas blindadas de seguridad.
5. `Dark_Glass`: Ventanales y cristaleras.
6. `Forest_Ground`: Suelo de tierra, grava y hojarasca.

**Resultado:** El mapa entero de la iglesia y sótano se renderiza en **únicamente 6 draw calls**, alcanzando 60–120 FPS sin caídas de rendimiento.

---

## 📊 5. Métricas Comparativas

| Métrica | Mapa BSP Original | Versión Auren WebGL (`l4d_church.glb`) |
| :--- | :--- | :--- |
| **Tamaño de Archivo** | 37.13 MB | **0.84 MB** (reducción del 97.7%) |
| **Caras Renderizadas** | 6.095 caras brutas | **5.217 polígonos limpios** |
| **Vértices** | 11.550 vértices | **11.421 vértices soldados** |
| **Draw Calls Estimados** | 200+ | **6 primitivas batched** |
| **Colisionador (`collisions.glb`)** | Completo BSP | **0.49 MB** (malla de suelo optimizada) |

---

## 🎯 6. Mapeo Táctico y de Navegación (`navigation.json`)

Se extrajeron las coordenadas relativas a la Safe Room de todos los recursos del mapa:
* **Armas:** 33 puntos de armas (escopetas `pumpshotgun`, subfusiles `smg`, pistolas, cócteles molotov y bombas de tubo).
* **Suministros Médicos:** 18 estaciones de primeros auxilios y píldoras.
* **Puntos de Rescate:** 6 posiciones de `info_survivor_rescue`.
* **Hitos de Transición:** Safe Room de inicio y compuerta final `landmark_lvl1_finish`.

---

## 🚀 7. Integración en JarBees

1. **Catálogo de Mapas:** Registrado en [store/gameStore.ts](file:///c:/Projects/Jarbees_the_game/store/gameStore.ts) bajo el identificador `l4d_church` con niebla ambiental `#1c242c` y cielo `#182026`.
2. **Escena 3D:** Implementada en [components/CSAssaultWorld.tsx](file:///c:/Projects/Jarbees_the_game/components/CSAssaultWorld.tsx) (`L4DChurchScene`) con:
   * Niebla densa de terror nocturno (`fog 15m a 120m`).
   * Luces puntuales de safe room (cálida ámbar `#FFA726`) y balizas de emergencia (`#38BDF8` y `#EF4444`).
   * Rótulo holográfico tridimensional de refugio.
   * Colisionador de suelo activo mediante `setGroundCollider`.
3. **Selector y Portal:** Añadido al panel de teletransporte de [components/AurenMansionHub.tsx](file:///c:/Projects/Jarbees_the_game/components/AurenMansionHub.tsx) para acceso instantáneo.

---

## 🔮 8. Próximos Experimentos en Auren WorldLab

1. **Colocación de Static Props Procedurales:** Usar [static_props.json](file:///c:/Projects/Jarbees_the_game/assets_source/source_world_analysis/l4d_church01_basement_beta/static_props.json) para instanciar bancos, farolas y escombros optimizados con `InstancedMesh`.
2. **Luz de Linterna Táctica:** Incorporar linterna frontal acoplada al casco o pecho de Auren para explorar las zonas oscuras del sótano.
3. **Generación Ambiental Basada en Reglas:** Utilizar la densidad de cuartos y pasillos observada en este mapa para alimentar el generador de catacumbas y complejos subterráneos originales.
