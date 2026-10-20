# 🛡️ Plan de Integración: Nueva Placa Pechera para NEXO (JarBees Gladiator)

Este plan establece el flujo de trabajo técnico y visual para extraer, armonizar, encajar y riggear la nueva pechera sobre el torso de **NEXO**, cubriendo completamente el reactor arc hexagonal para consolidar su identidad definitiva sin sacrificar rendimiento ni articulación.

---

## 📐 1. Inspección y Extracción Limpia del Modelo Fuente
* **Objetivo:** Aislar la placa delantera sin mallas parásitas (hombros, capas, mangas o cinturones innecesarios).
* **Acciones:**
  1. Identificar las piezas o mallas constitutivas de la nueva pechera en el modelo fuente (`.glb`, `.fbx`, `.obj` o `.stl`).
  2. Verificar coordenadas de simetría sobre el eje central $X = 0$.
  3. Comprobar la existencia de mapeado UV y canales de textura (BaseColor, Roughness, Metallic, Normal Map).
  4. **Optimización de Polígonos (Decimate):** Evaluar la densidad de vértices para mantener el estándar WebGL fluido (60 FPS en navegador) mediante decimación adaptativa si la pieza supera los 10,000–15,000 vértices.

---

## 🎨 2. Armonización PBR con la Paleta Oficial JarBees
Para que la nueva pieza se fusione orgánicamente con el resto del traje de gladiador cibernético, se aplicará el tratamiento de sombreado según la paleta oficial:

| Elemento / Zona | Material / Tinte | Código Hex | Parámetros PBR |
| :--- | :--- | :--- | :--- |
| **Cuerpo Principal de la Placa** | Azul Petróleo (*Petroleum Blue*) | `#102D46` | Metálico: `0.85`, Rugosidad: `0.24` |
| **Biselados / Nervaduras / Remaches** | Titanio Frío (*Cold Titanium*) | `#A8C4D5` | Metálico: `0.92`, Rugosidad: `0.15` |
| **Refuerzos Laterales / Flancos** | Violeta Profundo (*Deep Violet*) | `#35205B` | Metálico: `0.80`, Rugosidad: `0.22` |
| **Interior / Sellos Herméticos** | Stealth Carbon Black | `#08080C` | Metálico: `0.20`, Rugosidad: `0.60` |

* *En caso de que la pechera traiga textura horneada propia*, se aplicará un algoritmo de tintado espectral sobre la luminancia (`tint_material_texture`), manteniendo los relieves y micro-desgastes originales pero adaptando los tonos a la identidad JarBees.

---

## 🎯 3. Calibración Anatómica y Oclusión del Reactor Hexagonal
* **Coordenadas Objetivo en NEXO:**
  - **Centro del Reactor:** $X \approx 0.000$, $Y \approx -0.176$, $Z \approx 0.416$
  - **Plexo Solar:** $Z \in [0.28, 0.46]$
* **Acciones de Ajuste:**
  1. **Cobertura Total:** La nueva pechera se dimensionará para solapar el hueco y hexágono de poder con un margen de seguridad de $5$ a $10\,\text{mm}$ para evitar *z-fighting* (parpadeo visual entre caras coplanares).
  2. **Tratamiento del Reactor Arc Original:**
     - Se desactivará la geometría visible del hexágono emisor central o se encapsulará por detrás de la pechera blindada, dejando opcionalmente un tenue destello perimetral entre las junturas de la nueva placa si se desea conservar dinamismo energético sutil.
  3. **Alineación de Curvatura:** Adaptar la inclinación frontal (pitch $\approx 10^\circ\text{–}14^\circ$) para acompañar la caja torácica atlética del modelo base.

---

## 🦴 4. Rigging Integral al Esqueleto de Animación (Mixamo)
Para que la pechera no quede estática ni flote al saltar, correr o volar:
1. **Transformación al Espacio Local del Armature:**
   Multiplicar los vértices por la matriz inversa del esqueleto:
   $$\mathbf{V}_{\text{local}} = \mathbf{M}_{\text{armature}}^{-1} \cdot \mathbf{V}_{\text{world}}$$
2. **Paternidad y Modificador Armature:**
   Emparentar la pechera al esqueleto `Armature` con `matrix_local = Identity`.
3. **Ponderación de Vértices (Vertex Weighting):**
   - **Hueso Principal:** `mixamorig:Spine1_03` (peso `1.0` en la base del tórax).
   - **Mezcla Superior (Opcional):** Si la placa sube hasta las clavículas, se distribuirá una transición suave con `mixamorig:Spine2_04` para acompañar torsiones sin quebrar la chapa metálica.

---

## ⚙️ 5. Compilación, Cifrado y Verificación
1. **Script Automatizado (`scripts/create_jarbees_suit.py`):**
   - Incorporar la función de carga, adaptación y parenting de la nueva pechera.
2. **Horneado y Exportación Draco (`assets_source/models/jarbees_suit.glb`):**
   - Exportar con compresión de malla Draco (Nivel 7) y conjunto completo de 20 animaciones de vuelo, combate y locomoción.
3. **Cifrado de Bóveda JB3D (`scripts/protect-models.js`):**
   - Ejecutar `node scripts/protect-models.js` para compilar el archivo seguro `public/models/jarbees_suit.jb3d` que carga el motor Three.js / React Three Fiber.
4. **Renders de Verificación en Alta Definición:**
   - Generar vistas frontal fotorrealista, perfil 3/4 y primer plano del torso para confirmar la oclusión perfecta y la armonía estética.
