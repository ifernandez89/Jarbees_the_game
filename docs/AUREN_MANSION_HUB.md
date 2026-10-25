# 🏰 LA MANSIÓN AUREN · CHÂTEAU CENTRAL DE PAGES & JARBEES

> **Cuartel General Oficial y Residencia de Auren en el Mundo Infinito.**  
> Basado en la arquitectura original de **Counter-Strike 1.6 (`de_chateau.glb`)**, con 130 texturas históricas, escaleras reales transitables peldaño a peldaño, ventanales, mampostería señorial, bodega subterránea NEXO y jardines perimetrales.

---

## 🌟 Soluciones a Problemas Críticos de Terreno y Colisión

### 1. Física de Detección de Suelo y Colisiones en Escaleras/Rampas ([BeePlayer.tsx](file:///c:/Projects/Jarbees_the_game/components/BeePlayer.tsx))
* **El Problema**: Al caminar sobre la base en el mundo infinito, el sistema priorizaba ciegamente `terrainManager.getHeightAt(x, z)` (la altura matemática del terreno natural debajo de la casa), ignorando el colisionador 3D de la mansión. Esto provocaba que Auren atravesara las rampas, peldaños y suelos sin poder subir ni posarse sobre ellos.
* **La Solución**: `BeePlayer.tsx` ahora consulta primero `getGroundHeight(...)` con tolerancia vertical adaptativa. Si el rayo impacta cualquier superficie sólida del modelo 3D (patio, escaleras, galería, catacumbas o tejados), esa altura precisa de la malla se utiliza de inmediato, garantizando que Auren camine sólidamente peldaño por peldaño sin atravesarlos.

### 2. Nivelación del Asentamiento en Todos los Biomas ([ChunkManager.ts](file:///c:/Projects/Jarbees_the_game/systems/ChunkManager.ts))
* **El Problema**: En biomas como **Lago Titicaca**, **Isla de Pascua** o **Aconcagua**, las ondas de ruido procedural generaban colinas de hasta 7-8 metros justo en el punto de spawn, enterrando el suelo de la mansión o dejando los pies de Auren bajo tierra.
* **La Solución**: En `getHeightAt(worldX, worldZ)` se creó una **explanada de asentamiento**:
  * Dentro de un radio de `60 metros` (la huella completa de 105 × 114m de la finca), el terreno está nivelado a `0.2m`, por debajo del suelo del Château, evitando 100% que cualquier montículo penetre en las habitaciones o en el sótano.
  * Entre `60m` y `100m` se realiza una transición continua y suave mediante interpolación Hermite hacia las montañas o lagos del bioma activo.

### 3. Fiel Estética Señorial de CS 1.6 ([AurenMansionHub.tsx](file:///c:/Projects/Jarbees_the_game/components/AurenMansionHub.tsx))
* Reemplazo de geometrías básicas planas por el modelo completo y detallado de **`de_chateau.glb`**:
  * **130 Texturas PBR Clásicas**: Piedra de sillería, ladrillo con mortero, maderas talladas, tejas de pizarra, rejas de hierro forjado y estanterías de biblioteca.
  * **Escaleras y Puertas Proporcionales**: Dimensiones humanas calibradas para el exosqueleto NEXO-01 y el vuelo de Auren.
  * **Capa Tecnológica JarBees**:
    * **Dais de Salida**: Situado en el patio del Château (`[8.08, 7.84, -54.04]`) con anillos de Aurelium Gold y glifo rotatorio cian.
    * **Bodega / Catacumbas NEXO**: En el subsuelo (`[-15.0, 7.5, 25.0]`), con el Núcleo Cuántico de Aurelium flotante a 432 Hz y giroscopios en rotación.
    * **Portal Sintonizador de Mundos**: Acceso directo para saltar a otros mapas satélite de CS 1.6 (`cs_assault`, `de_westwood`, `fy_iceworld`, `de_rats3`, `de_aztec`).
