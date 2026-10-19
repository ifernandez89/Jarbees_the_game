# 🎨 Scripts de Blender para JarBees

Scripts para optimizar y mejorar los modelos 3D del juego.

## 📋 Scripts Disponibles

### 1. `inspect_bee_model.py`

Inspecciona el modelo de abeja y reporta estadísticas.

**Uso:**
```bash
blender --background --python inspect_bee_model.py
```

**Información que proporciona:**
- Número de objetos en la escena
- Cantidad de vértices y caras
- Animaciones disponibles
- Materiales y texturas
- Recomendaciones de optimización

---

### 2. `add_bee_wing_animation.py`

Añade o mejora la animación de aleteo de las alas de la abeja.

**Uso:**
```bash
blender --background --python add_bee_wing_animation.py
```

**Lo que hace:**
- Busca objetos que puedan ser alas (con nombres: wing, ala, etc.)
- Crea animación de aleteo realista (200-230 aleteos/seg simulados)
- Configura loop infinito
- Exporta modelo animado como `bee_animated.glb`

**Resultado:**
- `public/models/bee_animated.glb` - Modelo con animación mejorada

---

### 3. `create_jarbees_suit.py`

Genera y ensambla la armadura completa y personalizada de **Vesper (BEE-01 Gladiator Protocol)**:
- Encaste y ocultamiento anatómico de la cabeza original de Iron Man.
- Integración de **Casco de Gladiador** con texturas PBR y visor HUD cibernético cian.
- Accesorios exclusivos JarBees: **Hex-Core** en el pecho y **Aletas Dorsales**.
- Placas de armadura berserker:
  - **Escudo Pectoral del Plexo Solar** (`Belt_Buckle_thick.stl`) con gancho táctico (`belt_arm_hook.stl`).
  - **Guanteletes y Cuchillas de Antebrazo** (`Hand_Guard`).
  - **Placas de Bíceps** (`shin_-_left` / `right`).
  - **Coderas Articuladas** (`elbow_cap`).
  - **Placa Pélvica / Hebilla** (`Belt_Buckle.stl`).
  - **Botas y Greaves Blindadas** (`foot_-_left` / `right`) con deformación suave bicomponente.
- Rigging esquelético al armature de Mixamo con animaciones cinemáticas `hover` y `flight`.
- Compresión Draco y exportación a `assets_source/models/jarbees_suit.glb`.

**Uso:**
```bash
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -b -P scripts/create_jarbees_suit.py
node scripts/protect-models.js
```

---

## 🚀 Workflow Recomendado

### Optimizar Modelo de Abeja

1. **Inspeccionar modelo actual:**
   ```bash
   cd C:\Projects\Jarbees_the_game\scripts
   blender --background --python inspect_bee_model.py
   ```

2. **Añadir/mejorar animación:**
   ```bash
   blender --background --python add_bee_wing_animation.py
   ```

3. **Usar modelo optimizado en el juego:**
   ```tsx
   // En GameScene.tsx
   <BeePlayer modelPath="/models/bee_animated.glb" />
   ```

---

## 🔧 Integración con Backend (productos_crud_bkd)

El backend en `C:\Projects\productos_crud_bkd` tiene servicios de procesamiento 3D.

### Rutas relevantes:
- **Modelos:** `C:\Projects\productos_crud_bkd\storage\assets\models`
- **Scripts Blender:** `C:\Projects\productos_crud_bkd\scripts\blender`

### Modelos disponibles:
- `bee_source.glb` (20 MB) - Modelo original de abeja
- `Fox.glb` - Ejemplo con animaciones
- Otros modelos de personajes con animaciones

### Scripts del backend:
Puedes adaptar scripts existentes del backend para JarBees:
- `inspect_model.py` - Inspección general
- `robotize_*.py` - Ejemplos de modificación
- `export_*.py` - Exportación optimizada

---

## 📊 Métricas de Optimización

### Modelo de Abeja Ideal para Web:
- **Vértices:** < 5,000
- **Caras:** < 5,000
- **Texturas:** 1024x1024 (máximo 2K)
- **Animaciones:** 1-3 (aleteo esencial)
- **Tamaño GLB:** < 5 MB

### Árboles Ideales:
- **Vértices:** < 500 por árbol
- **Caras:** < 500 por árbol
- **Texturas:** 512x512
- **Instanciado:** Sí (miles sin impacto)

---

## 🐝 Anatomía de la Abeja Animada

### Partes esperadas:
- **Body** (Cuerpo): Estático
- **Wing_Left** (Ala izquierda): Animada
- **Wing_Right** (Ala derecha): Animada
- **Legs** (Patas): Estáticas o con idle sutil
- **Antennae** (Antenas): Estáticas o con idle sutil

### Animación de Aleteo:
```python
# Ciclo completo: 0.15 segundos (simulando ~200 aleteos/seg visualmente)
# Frame 0: Neutral
# Frame 1/4: Arriba (45°)
# Frame 1/2: Neutral
# Frame 3/4: Abajo (-45°)
# Frame 1: Neutral (loop)
```

---

## 🎬 Exportar para Web

Configuración recomendada en Blender:

```python
bpy.ops.export_scene.gltf(
    filepath="output.glb",
    export_format='GLB',
    export_animations=True,
    export_force_sampling=True,     # Mejor compatibilidad
    export_draco_mesh_compression_enable=True,  # Compresión
    export_texture_dir='',          # Texturas embebidas
    export_yup=True                 # Y-up para Three.js
)
```

---

## 🔗 Referencias

- [Blender Python API](https://docs.blender.org/api/current/)
- [glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)

---

## 📝 Notas

- Todos los scripts asumen Blender 3.x o superior
- Los scripts pueden ejecutarse en modo headless (--background)
- Para debugging visual, ejecuta sin --background

**Última actualización:** 14 de Octubre de 2026
