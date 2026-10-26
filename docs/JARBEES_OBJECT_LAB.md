# 🔬 JARBEES OBJECT LAB
## Manual de Ingeniería y Especificación de Objetos Paramétricos Deterministas

> **Documento de Referencia Técnica · JarBees: The Game / Auren WorldLab**  
> **Fecha:** Octubre 2026  
> **Estado:** Fase 1 Implementada (Mesa Paramétrica v1, Visor Web `/lab`, Blender Generator y Validador Físico)  
> **Inspiración:** Metodología Brush/CSG (*de_rats*, GoldSrc), Manifiesto Plan-First de Villa Auren, e Interacción Sensorial Inmersiva (*halloween.dev*).

---

## 🧭 1. Filosofía: ¿Por qué "Plan-First, Part-First"?

En el desarrollo de mundos virtuales 3D, suele cometerse el error de tratar a los objetos domésticos como mallas muertas (*blobs* monolíticos). Al modelar o generar una mesa mediante IA de caja negra o un archivo `.fbx` colapsado:
1. **No hay colisionadores cóncavos:** El motor de físicas genera una caja ciega exterior donde el personaje no puede meter las piernas ni pasar por debajo.
2. **No hay cinemática:** Las puertas no tienen bisagras con pivotes locales; los cajones están soldados al mueble.
3. **No hay semántica:** El personaje (Auren) no sabe dónde sentarse ni cómo interactuar sin programar a mano *hardcoded triggers*.
4. **Las texturas se deforman al escalar:** Cambiar el ancho de una mesa estira sus texturas de madera o metal si no hay proyección métrica procedural.

### Las 3 Reglas de Oro de JarBees Object Lab:
1. **La Especificación JSON es la Fuente Única de Verdad (Single Source of Truth):** Tanto Three.js en la web como Blender en el taller consumen el mismo contrato `*.object.json`.
2. **Jerarquía Descompuesta:** Cada pieza conserva su identidad, su colisionador elemental y su vector de despiece (*Explosion Vector*).
3. **Dualidad Visual y Funcional:** Cada objeto expone geometría renderizable y **anclas semánticas** (`chair_slot`, `item_placement`, `grab_handle`).

---

## 🏗️ 2. Arquitectura del Sistema

```
                    ┌────────────────────────────────────────┐
                    │   public/data/objects/*.object.json    │
                    │   (Especificación Paramétrica JSON)    │
                    └───────────────────┬────────────────────┘
                                        │
                    ┌───────────────────┴────────────────────┐
                    ▼                                        ▼
    ┌───────────────────────────────┐        ┌───────────────────────────────┐
    │     GeometryValidator.ts      │        │   generate_jarbees_object.py  │
    │  - Estabilidad Mecánica       │        │   (Blender 5.2 / bpy Headless)│
    │  - Ergonomía Auren (1.85m)    │        │  - Colecciones GEO, COL, ANCH │
    │  - Paso de Rodillas >= 0.60m  │        │  - Modificador Bevel no dest. │
    │  - Score 0 - 100              │        │  - UVs Cúbicas Métricas (1m)  │
    └───────────────┬───────────────┘        │  - Exportación GLB & .blend   │
                    │                        └───────────────┬───────────────┘
                    ▼                                        │
    ┌───────────────────────────────┐                        │
    │   ObjectGeometryBuilder.ts    │                        │
    │   (Three.js / WebGL / R3F)    │                        │
    │  - Piezas con vectores despiece│                       │
    │  - Colisionadores Hulls       │                        ▼
    │  - Anclas con gizmos 3D       │        ┌───────────────────────────────┐
    └───────────────┬───────────────┘        │ assets_source/*.blend         │
                    │                        │ public/models/*.glb           │
                    ▼                        └───────────────────────────────┘
    ┌───────────────────────────────┐
    │     app/lab/page.tsx          │
    │  (Estación de Trabajo Web)     │
    │  - Despiece suave [0% - 100%] │
    │  - Cotas CAD dimensionales 3D │
    │  - Diagnóstico en tiempo real │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ InteractionExperienceEngine.ts│
    │ (Web Audio DSP Procedural)    │
    │ - Ticks de relé, Thuds de tope│
    │ - Silbidos inerciales         │
    └───────────────────────────────┘
```

---

## 📐 3. Formulación Geométrica y Cinemática

### 3.1. Vector de Despiece (*Exploded View*)
Para cualquier pieza $i$ con posición base $P_{base}$, el visor calcula la posición en tiempo real mediante:
$$P_i(t) = P_{base, i} + \vec{E}_i \cdot \alpha(t) \cdot s$$
Donde:
- $\vec{E}_i$: Vector unitario de explosión analítico (ej. el tablero sube en $+Z$, las patas se expanden radialmente en el plano $XY$).
- $\alpha(t) \in [0.0, 1.0]$: Progreso interpolado mediante amortiguación inercial (*exponential smoothing*).
- $s$: Escala de separación espacial (típicamente $0.45\text{ m}$).

### 3.2. Criterio de Ergonomía Auren (Under-Table Clearance)
Para un personaje humanoide de $1.85\text{ m}$ de estatura con exo-traje táctico:
$$H_{clearance} = H_Z - T_{top} - H_{apron}$$
- Si $H_{clearance} < 0.60\text{ m}$, el validador emite una advertencia de interferencia de rodillas.
- La zona bajo el tablero está libre de colisionadores: Auren puede deslizar sus piernas bajo la mesa o agacharse sin ser repelido por una caja sólida.

### 3.3. Estabilidad y Centro de Gravedad
El polígono de sustentación se calcula a partir de las coordenadas extremas de apoyo de las patas:
$$S_X = W_X - 2 \cdot (\text{legInset} + \frac{\text{legThickness}}{2})$$
$$S_Y = D_Y - 2 \cdot (\text{legInset} + \frac{\text{legThickness}}{2})$$
$$\text{Área de Soporte} = S_X \cdot S_Y$$
$$\text{Factor de Estabilidad} = \min\left(1.0, \frac{\text{Área de Soporte}}{W_X \cdot D_Y \cdot 0.85}\right)$$

---

## 🗂️ 4. El Catálogo Fundacional de 6 Piezas

Inspirado en la cocina a gran escala de **`de_rats`**:

| # | Objeto | Anatomía de Piezas | Grado de Libertad | Interacción con Auren |
|---|---|---|---|---|
| **1** | **Mesa** *(Implementada)* | Tablero, 4 patas, 4 travesaños faldón | Estático / Paramétrico | Puestos de silla Sur/Norte + Superficie de apoyo de objetos |
| **2** | **Cajón** | Frente con tirador, 4 paredes cajoneras, fondo, correderas | Slider 1D ($0.0\text{m} \dots 0.45\text{m}$) | Agarre de manija + Almacenamiento interior |
| **3** | **Silla** | Asiento, respaldo inclinado ($7^\circ$), 4 patas | Estático con ancla IK | `chair_slot` con orientación frontal y altura de pelvis $0.45\text{m}$ |
| **4** | **Alacena** | Carcasa suspendida, estantes, puertas abatibles | Hinge 1D ($0^\circ \dots 95^\circ$) | Manija de puerta + Inspección de repisas |
| **5** | **Mesada** | Encimera, zócalo, booleana CSG de bacha, mueble bajo mesada | CSG determinista | Superficie de trabajo $0.90\text{m}$ + Grifería |
| **6** | **Heladera** | Carcasa perimetral, puerta principal, puerta freezer, burlete | Hinge con retención magnética | Manija empotrada, luz interior al abrir y sonido de compresor |

---

## 🔊 5. Interacción Sensorial y Audio DSP (*halloween.dev*)

El archivo [InteractionExperienceEngine.ts](file:///c:/Projects/Jarbees_the_game/systems/object-lab/InteractionExperienceEngine.ts) provee síntesis procedimental en tiempo real utilizando la **Web Audio API**:

- `RELAY_CLICK`: Micro-pulso sinusoidal de alta frecuencia ($1200\text{ Hz}$, $7\text{ ms}$) al pasar el cursor sobre una pieza.
- `PART_SELECT`: Resonancia dual armónica ($440\text{ Hz} + 880\text{ Hz}$) al seleccionar un componente.
- `SLIDER_TICK`: Click mecánico ultracorto con rate-limiting durante el arrastre de sliders.
- `DESPIECE_ENGAGE`: Barrido de frecuencia ascendente ($220\text{ Hz} \to 680\text{ Hz}$) al separar las piezas.
- `DESPIECE_COLLAPSE`: Barrido descendente culminando en un golpe sordo (*thud* a $85\text{ Hz}$) cuando las piezas encastran.
- `ERROR_BUZZ`: Intervalo disonante de tritono ($320\text{ Hz} + 452\text{ Hz}$) si un parámetro desestabiliza la mesa.

---

## 💻 6. Comandos y Uso

### 6.1. Iniciar la Estación de Trabajo Web
```bash
npm run dev
```
Acceder a [http://localhost:3000/lab](http://localhost:3000/lab) en el navegador.

### 6.2. Ejecutar el Generador en Blender 5.2 (Headless)
```bash
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python scripts/generate_jarbees_object.py -- --spec public/data/objects/table_001.object.json --out assets_source/table_001.blend --glb public/models/table_001.glb
```

**Artefactos producidos:**
- `assets_source/table_001.blend`: Archivo fuente de Blender con mallas no fusionadas, biseles paramétricos y colecciones `GEO_Visual`, `COL_Colliders`, `ANCHORS`.
- `public/models/table_001.glb`: Modelo GLB optimizado con materiales PBR y colisionadores.
