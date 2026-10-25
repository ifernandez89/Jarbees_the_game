# 🏔️ Villa Auren — Alpine Research Residence & WorldLab Hub

> **Entorno 3D original, procedural y modular creado con Blender (Python `bpy`) para integración en Three.js / WebGL.**
> Combina la calidez de una residencia contemporánea de montaña con un laboratorio científico subterráneo y una galería vertical de vuelo Mach para Auren.

---

## 📐 Especificaciones de Arquitectura & Escala

| Parámetro | Medida | Referencia |
|---|---|---|
| **Parcela completa (Terreno local)** | 32 × 30 m | Plataforma transitable con bordes biselados hacia el mundo infinito |
| **Edificio principal** | 20 × 16 m | Planta compacta con circulación y exploración vertical |
| **Niveles** | 3 (S1, PB, P1) + Techo | Subsuelo (Lab), Planta Baja, Mezzanine / Planta Alta y Cubierta alpina |
| **Altura libre PB** | 3.2 m | Altura confortable para Auren (1.85 m) |
| **Altura libre P1** | 3.0 m | Espacios de taller, suite y biblioteca |
| **Altura libre S1 (Lab)** | 3.2 m | Cámara de experimentación y pedestal del Núcleo JarBees |
| **Galería vertical de vuelo** | 4.0 × 4.0 m | Conducto acristalado continuo desde PB hasta la ventana de vuelo en el tejado |
| **Escala de unidades** | 1 BU = 1 m | Conversión automática Z-up (Blender) a Y-up (glTF / Three.js) |

---

## 🗂️ Organización de Colecciones (Blender)

El generador procedural `scripts/generate_villa_auren.py` organiza todos los elementos en colecciones no destructivas:

```text
villa_auren.blend
├── ENV_Terrain             (Terreno local 32x30m, patio, calzada y dais de llegada)
├── ARCH_Structure          (Cimientos, forjados PB/P1, muros perimetrales, columnas de madera)
├── ARCH_Doors_Windows      (Huecos de paso, dinteles, acristalamientos de la galería)
├── ARCH_Roof               (Cubiertas alpinas a dos aguas y claraboya de despegue)
├── INT_Furniture           (Mobiliario para Fase 4)
├── INT_Laboratory          (Consola cuántica, bahías de servidores, dais del Núcleo JarBees, estación Auren)
├── EXT_Vegetation          (Vegetación alpina para Fase 4)
├── COL_Colliders           (83 objetos colisionadores sólidos para raycasting en tiempo real)
├── NAV_Walkable            (26 superficies horizontales transitables y escaleras)
└── META_InteractionPoints (9 Empties de referencia para spawns, accesos e interacción)
```

---

## 🚀 Cómo Construir y Exportar

### Requisitos
- **Blender 5.x o 4.x** (probado y validado en Blender 5.2.2 LTS).

### Comando de generación automática:
```bash
# Desde la raíz del proyecto Jarbees_the_game:
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python scripts/generate_villa_auren.py
```

### Entregables generados:
1. `scripts/generate_villa_auren.py`: Script maestro procedural en Python (`bpy`).
2. `villa_auren.blend`: Archivo nativo de Blender con jerarquías y colecciones.
3. `public/models/villa_auren.glb` y `villa_auren.glb`: Modelo binario glTF 2.0 (147 KB, 83 mallas, 12 materiales PBR).
4. `public/data/villa_auren.world.json` y `villa_auren.world.json`: Manifiesto semántico con salas, colisiones y spawns.
5. `components/VillaAurenHub.tsx`: Componente React Three Fiber listo para integrar en la escena.

---

## ⚡ Integración en Three.js ([VillaAurenHub.tsx](file:///c:/Projects/Jarbees_the_game/components/VillaAurenHub.tsx))

El componente utiliza la convención nativa del proyecto:

```tsx
import { VillaAurenHub } from '@/components/VillaAurenHub'

// Dentro de GameScene.tsx (o en cualquier bioma del mundo infinito):
<Suspense fallback={null}>
  <VillaAurenHub position={[0, 0, 0]} rotation={[0, 0, 0]} />
</Suspense>
```

### Características de integración:
- **Colisiones sólidas automáticas**: `setGroundCollider(gltf.scene)` registra todas las mallas para raycasting adaptativo milimétrico en `GroundCollisionManager.ts`. Auren camina peldaño por peldaño por las escaleras sin atravesar suelos ni atascarse en techos.
- **Posición 100% configurable**: Permite ubicar la villa en el origen `[0, 0, 0]` o en cualquier coordenada del mundo infinito (`sanctuary_infinite`, nieve, lago o montaña).
- **Zonas y HUD semántico en tiempo real**: Detecta automáticamente en cuál de las 11 salas se encuentra Auren (`VILLA_AUREN_ROOMS`) y actualiza el rótulo AR holográfico.
- **Luces dinámicas**: Parpadeo cálido de la chimenea en el Gran Salón, pulso cuántico a 432 Hz en el Núcleo JarBees, y rotación del emblema en el patio.

---

## 🗺️ Distribución de Espacios (Plano Conceptual)

### Planta Baja (PB — Nivel 0.0 m)
- **Patio y Calzada de Piedra**: Plataforma hexagonal de llegada y baliza para Auren.
- **Vestíbulo Principal**: Acceso con pórtico alpino y suelo de piedra.
- **Gran Salón**: Estancia principal con chimenea de piedra y doble altura visual hacia la mezzanine.
- **Cocina & Comedor**: Ala oeste con suelo cálido de madera.
- **Estudio JarBees**: Ala este para investigación y telecomunicaciones.
- **Galería Vertical de Vuelo**: Espacio central diáfano de 4×4 m con cerramiento acristalado continuo hacia la cubierta.

### Planta Alta / Mezzanine (P1 — Nivel +3.4 m)
- **Biblioteca Abierta / Mezzanine**: Pasarela perimetral con vistas al Gran Salón.
- **Taller de Mantenimiento de Auren**: Área este para calibración de exo-traje.
- **Habitación Privada**: Suite alpina con vistas hacia el exterior.
- **Balcón Panorámico Voladizo**: Balcón de 8×2 m sobre el patio de entrada, ideal para despegue en vuelo de crucero.

### Subsuelo / Laboratorio Tecnológico (S1 — Nivel -3.5 m)
- **Cámara del Núcleo JarBees**: Pedestal con núcleo emisor cian a 432 Hz.
- **Consola de Control Cuántica**: Mesa de mando central con tiras holográficas.
- **Bahía de Servidores**: Racks de computación e infraestructura de datos.
- **Plataforma de Carga de Auren**: Base de inducción Aurelium Gold.
- **Escalera Técnica**: Acceso directo hacia la planta baja.

---

## 📊 Fases de Desarrollo

- [x] **Fase 1 — Blockout Geométrico**: Terreno, forjados, muros, escaleras, galería vertical, laboratorio, cubiertas y aperturas. Generación procedural con Blender `bpy`, exportación a GLB (147 KB) y manifiesto semántico JSON.
- [ ] **Fase 2 — Validación Estructural**: Calibración de escala de Auren (1.85 m), pruebas de tránsito en escaleras y vuelo vertical libre por el conducto acristalado.
- [ ] **Fase 3 — Detalles Arquitectónicos**: Marcos de puertas, carpinterías de ventanas, barandillas detalladas y refinamiento de revestimientos PBR.
- [ ] **Fase 4 — Ambientación & Atrezo**: Mobiliario de salón, biblioteca, estanterías, chimenea funcional, equipos de laboratorio y vegetación perimetral instanciada.
- [ ] **Fase 5 — Metadatos Avanzados & Puntos de Interacción**: Puertas interactivas con bisagra, terminales operables y transiciones cinemáticas.
