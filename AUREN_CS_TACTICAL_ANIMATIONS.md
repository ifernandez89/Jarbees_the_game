# 🎖️ Animaciones Tácticas CS 1.6 & GoldSrc para Auren (NEXO-01)

> **Documento de Arquitectura, Retargeting y Guía de Controles**  
> *Módulo de Locomoción y Cinética Táctica — Armadura JarBees NEXO-01*  
> *Versión 1.0 — 2026*

---

## 1. Visión y Fundamentos

Las animaciones del motor **GoldSrc (Half-Life 1 / Counter-Strike 1.6)** son reconocidas mundialmente por su **inmediatez cinética, silueta limpia y economía de fotogramas**: comunican impacto físico, inercia y disciplina táctica de manera instantánea.

En esta actualización, Auren incorpora un set de 9 animaciones adaptadas desde los modelos originales (`player.mdl`, `hostage.mdl`, `v_c4.mdl`) hacia la jerarquía esquelética Mixamo de la armadura JarBees.

---

## 2. Correspondencia Esquelética (Retargeting)

| Hueso GoldSrc (`Bip01`) | Hueso Mixamo Auren | Rol Biomecánico |
| :--- | :--- | :--- |
| `Bip01 Pelvis` | `mixamorig:Hips_01` | Centro de gravedad, inclinación y traslación vertical/horizontal |
| `Bip01 Spine` / `Spine1` | `mixamorig:Spine_02` / `Spine1_03` | Flexión torácica, torsión al caminar y contracción ante impacto |
| `Bip01 Neck` | `mixamorig:Neck_05` | Articulación cervical y estabilización giroscópica |
| `Bip01 Head` | `mixamorig:Head_06` | Orientación del visor cibernético y latigazos de impacto |
| `Bip01 L/R UpperArm` | `mixamorig:LeftArm_09` / `RightArm_033` | Disposición táctica de hombros y braceo |
| `Bip01 L/R Forearm` | `mixamorig:LeftForeArm_010` / `RightForeArm_034` | Codos flexionados en guardia y tecleo |
| `Bip01 L/R Thigh` | `mixamorig:LeftUpLeg_00` / `RightUpLeg_060` | Zancada, zancada baja y absorción de choque |
| `Bip01 L/R Calf` | `mixamorig:LeftLeg_056` / `RightLeg_061` | Flexión de rodillas continua hacia atrás |
| `Bip01 L/R Foot` | `mixamorig:LeftFoot_057` / `RightFoot_062` | Apoyo plantar y amortiguación elástica |

---

## 3. Catálogo de Animaciones Implementadas

### 3.1 `nexo_crouch_walk` (Inspirada en `crouchrun` — CS 1.6 Seq 5)
* **Tipo:** Loop continuo (32 frames / 1.06s a 30 FPS).
* **Activación:** Mantener `Ctrl` (o `C`) mientras te desplazas con `W`, `A`, `S` o `D`.
* **Biomecánica:** Pelvis descendida a `-0.16m`, torso inclinado `+16°`, rodillas en flexión profunda continua (entre `-45°` y `-75°`), pasos rítmicos alternados y brazos recogidos hacia el pecho en guardia sigilosa. Ideal para explorar cavernas y grietas bajas sin ser detectado.

### 3.2 `nexo_flinch_torso` (Inspirada en `gut_flinch` — CS 1.6 Seq 99)
* **Tipo:** One-shot reactivo (16 frames / 0.53s a 30 FPS).
* **Activación:** Tecla `6` o ante impactos frontales.
* **Biomecánica:** Sacudida reactiva instantánea: contracción del torso hacia adelante (`+24°`), desplazamiento inercial de cadera hacia atrás y repliegue de brazos para proteger el reactor Hex-Core. Retorno elástico inmediato a la postura base.

### 3.3 `nexo_flinch_head` (Inspirada en `head_flinch` — CS 1.6 Seq 100)
* **Tipo:** One-shot reactivo (14 frames / 0.46s a 30 FPS).
* **Activación:** Tecla `7` o ante sobrepresión transónica de plasma.
* **Biomecánica:** Latigazo brusco de cabeza y cuello hacia atrás (`-28°`), elevación tensa de hombros y recuperación giroscópica fluida.

### 3.4 Muertes e Inercia Direccional (CS 1.6 Directional Deaths)
* **`nexo_death_forward` (Tecla `9` / Colapso Frontal):** Rodillas ceden al frente, torso colapsa amortiguado contra el terreno con brazos extendidos.
* **`nexo_death_back`:** Desplome hacia atrás por impacto violento, cayendo sobre los estabilizadores dorsales.
* **`nexo_death_left` & `nexo_death_right`:** Colapsos laterales inerciales cuando la fuerza del impacto proviene de los costados.

### 3.5 `nexo_tactical_interact` (Inspirada en `pressbutton` de `v_c4.mdl`)
* **Tipo:** One-shot (32 frames / 1.06s a 30 FPS).
* **Activación:** Tecla `8`.
* **Biomecánica:** El antebrazo izquierdo se eleva a la altura del pecho; la mano derecha pulsa tres toques de precisión sobre el panel holográfico del guantelete con inclinación atenta del casco.

### 3.6 `nexo_quicklook` (Inspirada en `quicklook` de `hostage.mdl`)
* **Tipo:** One-shot (30 frames / 1.0s a 30 FPS).
* **Activación:** Tecla `0`.
* **Biomecánica:** Barrido de reconocimiento perimetral rápido: giro de cabeza a la izquierda, pausa de escaneo, giro a la derecha y centrado al frente.

---

## 4. Nuevo Dock de Controles en la Interfaz (HUD)

Para evitar saturar la pantalla con bloques densos de texto plano ("un chorro"), se implementó un **Cybernetic Controls Dock**:
* **Cápsula translúcida flotante** con efecto glassmorphism oscuro y borde cian.
* **Etiquetas Keycap (`<kbd>`)** estilizadas e iluminadas:
  * `[WASD] Mover`
  * `[Ctrl] Agachar` *(indicando visualmente el combo `+WASD Sigilo`)*
  * `[Espacio] Salto / Despegar` (en tierra) o `Ascenso` (en vuelo)
  * `[Shift] ⚡AB` (Postquemador en vuelo)
  * `[1-5] Emotes`
* **Botón desplegable micro `[6-0] Táctico CS ▲`**: Abre sutilmente la fila inferior con los accesos directos para probar flinches, interacción y colapsos.

---

## 5. Pipeline de Compilación y Seguridad

1. **Generador procedural:** `scripts/generate_nexo_animations.py`.
2. **Horneado y compresión Draco:** `scripts/reanimate_suit.py` ejecutado en Blender 5.2.
3. **Cifrado criptográfico:** `node scripts/protect-models.js` convierte `assets_source/models/jarbees_suit.glb` (22.70 MB) en el binario protegido `public/models/jarbees_suit.jb3d`.
