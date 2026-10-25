# 🏛️ Plan Maestro: Enriquecimiento de Villa Auren (Mundo Infinito)
**Inspirado en las métricas de composición de Left 4 Dead y CS 1.6**

---

## 📍 1. Estado Actual y Diagnóstico

En la sesión reciente se analizaron las métricas de riqueza ambiental comparando **`l4d_church`** frente a **`Villa Auren`**:

| Dimensión | Referencia L4D (Iglesia) | Villa Auren (Hoy) | Meta Villa Auren Mejorada |
| :--- | :--- | :--- | :--- |
| **Materiales / Shaders** | 484 slots visibles | 10 materiales de color plano | 8–10 materiales PBR completos con mapas reales |
| **Texturas** | ~157 texels/m (densidad uniforme) | 0 imágenes (solo colores sólidos en Blender) | Mapas CC0 (Albedo, Normal, Roughness, AO) |
| **Draw Calls / Primitivas** | Batcheado en 6 primitivas | 83 mallas individuales | 20–30 mallas unificadas por material |
| **Iluminación** | Lightmaps precomputados + focos | 2 luces dinámicas (fuego + núcleo) | AO / iluminación indirecta horneada + luces clave |
| **Props / Atrezo** | 321 instancias (140 modelos) | 0 props de detalle fino | Objetos modulares instanciados (`InstancedMesh`) |
| **Ambientación Antártica** | Niebla y lluvia gótica | Clima global | Escarcha en cristales, nieve en cornisas, zócalos |

---

## 🎯 2. Objetivos del Proyecto

1. **Subir el listón visual sin perder rendimiento:** Mantener 60+ FPS en Three.js / WebGL agrupando mallas por material (reduciendo los draw calls de 83 a ~25).
2. **Texturas 100% legales y públicas (CC0):** Utilizar recursos de Poly Haven (probados y accesibles vía script) para no depender de assets propietarios de Valve en la casa pública.
3. **Iluminación con profundidad:** Hornear Ambient Occlusion (AO) y luz indirecta para eliminar el aspecto "plano" de los cubos actuales.
4. **Fase Piloto Controlada:** Empezar exclusivamente por el **Gran Atrio Central** (chimenea, portón de acceso y suelo) para validar antes/después con capturas y métricas reales.

---

## 🗺️ 3. Fases de Ejecución

### Fase 1: Descarga y Preparación de Texturas CC0 (1k)
Descargar de Poly Haven mapas a resolución 1k (balance óptimo peso/calidad para web):
* **Piedra Muros:** `castle_brick_02_red` o `medieval_blocks_05` (muros y chimenea).
* **Pavimento Suelo:** `cobblestone_05` o `brown_floor_tiles` (atrio y patio).
* **Madera Estructural:** `brown_planks_08` (vigas, escaleras y pasarelas).
* **Acero Industrial:** `metal_plate_02` (barandillas, marcos de portón y trusses).
* **Hormigón Lab:** `concrete_floor_worn_001` (búnker y subsuelo).

*Ubicación destino:* `public/textures/villa_auren/`

### Fase 2: Modificación del Generador (`scripts/generate_villa_auren.py`)
1. **UVs a Escala de Mundo:** Reemplazar la proyección cúbica genérica de Blender por proyección UV con escala métrica real (~150 px/m, aprendida de L4D).
2. **Nodos PBR Completos:** Conectar en los materiales Principled BSDF los mapas de *Base Color*, *Roughness* y *Normal*.
3. **Modelado de Transiciones (Molduras):**
   * Zócalos en la base de los muros.
   * Marcos salientes para el portón de hangar y ventanales.
   * Remates y cornisas en la chimenea monumental.
4. **Batching / Unificación de Mallas:** Agrupar los cubos arquitectónicos que comparten el mismo material en mallas combinadas antes de exportar a GLB.

### Fase 3: Horneado de Luz y AO (Baking en Blender)
* Generar un segundo canal UV (`UVMap_Lightmap`) en Blender.
* Hornear mapa de sombras/AO difuso suave para las esquinas, vigas y hueco de la chimenea.
* Exportar con `export_texcoords=True` para que Three.js lea el mapa de AO en el segundo canal.

### Fase 4: Validación y Pruebas en el Juego
1. Regenerar `public/models/villa_auren.glb` y `villa_auren.blend`.
2. Probar en `bun run dev` (puerto 3000) en el modo `sanctuary_infinite`.
3. Validar:
   * Colisiones y raycasting con `setGroundCollider` (escaleras, balcón, patio).
   * Rendimiento y consumo de memoria GPU.
   * Iluminación dinámica de la chimenea y núcleo cuántico interactuando con los nuevos mapas normales.

---

## 🚦 4. Instrucción Rápida para Reanudar

Cuando quieras retomar el trabajo, simplemente di:
> *"Continuemos con la Fase 1 del plan de Villa Auren (descargar texturas CC0 y aplicar al Gran Atrio)"*
