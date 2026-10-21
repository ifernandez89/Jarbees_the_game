# 🧟‍♂️ Integración Táctica Source Engine & Left 4 Dead para Auren (NEXO-01)

> **Documento de Arquitectura Cinética, Biomecánica y Paisaje Sonoro**  
> *Módulo de Locomoción Reactiva, Inercia y Físicas Source — Armadura JarBees NEXO-01*  
> *Versión 1.0 — 2026*

---

## 1. Diagnóstico y Corrección Fundamental de Agacharse (`Ctrl` / `C`)

### 🔍 Causa Raíz del Error Previo
En la versión inicial, al presionar `Ctrl` el personaje permanecía completamente erguido sobre sus piernas estiradas y únicamente inclinaba la cabeza hacia abajo (mirando fijamente a sus pies).

**Origen técnico en Blender / Armature:**
1. En el sistema de coordenadas locales de `mixamorig:Hips_01`, el eje vertical es **Local Y** (a escala de ~36 unidades por metro, donde `-13.5` equivale a descender `-0.375 m` en el mundo real).
2. La función anterior `build_crouch` ejecutaba erróneamente `key_bone_loc(hips, 0, 0, hz)` alterando el **eje Local Z** (profundidad) con un valor diminuto de `-0.15` (apenas 4 milímetros) y dejando el eje vertical `Y = 0`.
3. Al no descender la pelvis, las rotaciones de piernas no articulaban la pose y el cuello inclinaba el casco hacia abajo (`+12°`).

### 🛠️ Solución Implementada
* **Descenso pélvico auténtico:** `hips.location = (0, -13.5, 2.0)` baja el centro de masa 38 centímetros hacia el suelo.
* **Flexión biomecánica profunda:** Muslos elevados a `+68°`, rodillas replegadas a `-112°` y articulación de tobillo a `+44°` para asentar las botas plantadas en el suelo.
* **Compensación cervical de horizonte:** El cuello y cabeza rotan a `-14°` compensando la inclinación del torso (+18°), manteniendo el visor cibernético siempre apuntando al frente hacia el horizonte.
* **Cámara dinámica sincronizada:** En `FollowCamera.tsx`, la cámara desciende suavemente `-0.35m` al agacharse en tierra para ofrecer una perspectiva táctica de perfil bajo.

---

## 2. Nuevas Acciones Cinéticas Inspiradas en Left 4 Dead (Source Engine)

| Animación | Duración / Frames | Tecla / Trigger | Biomecánica y Rol Táctico |
| :--- | :--- | :--- | :--- |
| **`nexo_crouch`** (Corregida) | 24 f (0.8s) Clamped | `Ctrl` / `C` | Perfil bajo táctico en tierra con cadera a `-0.38m`, rodillas a `-112°` y visor nivelado. |
| **`nexo_crouch_walk`** (Corregida) | 32 f (1.06s) Loop | `Ctrl` + `WASD` | Locomoción sigilosa continua con cadera baja (`-0.35m`), pasos rítmicos alternados y brazos en guardia. |
| **`nexo_melee_shove`** *(L4D Shove)* | 28 f (0.93s) One-Shot | `F` | Empuje cinético repulsor: brazos se repliegan al pecho y descargan hacia adelante con impulso de torso para alejar amenazas. Sonido de impacto contundente `nexo_impact_heavy.wav`. |
| **`nexo_stumble_recovery`** *(L4D Stumble)* | 42 f (1.40s) One-Shot | `G` | Desbalanceo inercial hacia atrás tras onda expansiva: pecho lanzado hacia atrás, 2 pasos erráticos de compensación y brazos abiertos para no perder el equilibrio. Sonido `nexo_armor_impact.wav`. |
| **`nexo_limp_walk`** *(L4D Limp Walk)* | 36 f (1.20s) Loop | `H` | Marcha asimétrica de daño crítico (<25% integridad): mano izquierda protegiendo el reactor Hex-Core, paso renqueante y fatiga biomecánica visible. Alerta auditiva de daño. |
| **`nexo_hunter_pounce`** *(Hunter Landing)* | 36 f (1.20s) One-Shot | `J` | Aterrizaje depredador en 3 puntos (Superhero Landing estilo Hunter de L4D): rodilla a ras de suelo (`-16.5`), puño derecho golpeando el terreno y brazo izquierdo extendido. Sonido `nexo_landing_heavy.wav`. |

---

## 3. Paisaje Sonoro Original de Auren y Ajustes Tácticos

1. **`auren_flight.wav`** (Audio Original JarBees Hex-Core):
   Sustituye completamente el antiguo zumbido estridente (420 Hz FM) por un paisaje acústico original, aterciopelado y de alta gama:
   - Resonancia profunda Hex-Core (58 Hz sub-bass y 116 Hz cálido).
   - Flujo aerodinámico ionizado con doble filtro pasa-bajos (sin siseos agudos ni zumbidos).
   - Resonancia cuántica celestial (acorde puro en quinta justa 174 Hz / 261 Hz con chorus lento).
2. **`nexo_landing_heavy.wav`** (`sound/player/jumplanding.wav`):  
   Se dispara al caer desde gran altura (>7.0 m/s), al ejecutar `nexo_hunter_pounce` (`J`) o al realizar un aterrizaje heroico forzado.
3. **`nexo_impact_heavy.wav`** (`sound/physics/metal/metal_barrel_impact_hard1.wav`):  
   Golpe seco y violento de alta masa asociado al empuje repulsor `melee_shove` (`F`).
4. **`nexo_heartbeat_loop.wav`** (`sound/player/HeartbeatLoop.wav`):  
   Latido de tensión fisiológica/mecánica para estados críticos de sobrepresión transónica.
5. **`nexo_warning_denied.wav`** (`sound/player/suit_denydevice.WAV`):  
   Alerta sónica de sobrecarga o restricción del reactor Hex-Core en marcha herido (`H`).
6. **Desactivación de impactos y curación en movimientos:**
   - **Sonido de curación (L4D `bandaging_1.wav`) retirado** de la tecla `8` (`tactical_interact`).
   - **Sonidos de impactos balísticos retirados** de las animaciones `flinch_torso` (`6`), `flinch_head` (`7`) y `stumble` (`G`), dado que en modo exploración no hay agresores externos atacando a Auren.

---

## 4. Cybernetic Dock Mejorado en Pantalla (`GameHUD.tsx`)

El dock inferior de controles ahora cuenta con el selector **`Táctico Source [6-0 / F-J]`**:
* Permite probar directamente mediante atajos de teclado o **haciendo clic sobre cada botón** del dock con el mouse:
  * `[6] Flinch Torso`
  * `[7] Flinch Casco`
  * `[8] Interacción`
  * `[9] Colapso`
  * `[0] Alerta`
  * `[F] Shove Repulsor`
  * `[G] Stumble L4D`
  * `[H] Marcha Herido`
  * `[J] Hunter Landing`

---

## 5. Pipeline de Compilación y Cifrado
1. Generador: `scripts/generate_nexo_animations.py` actualizado con las nuevas curvas y offsets locales en `Y`.
2. Horneado en Blender 5.2: `scripts/reanimate_suit.py` recompiló `assets_source/models/jarbees_suit.glb` (22.85 MB) con compresión Draco nivel 7.
3. Cifrado criptográfico: `node scripts/protect-models.js` empaquetó el binario final en `public/models/jarbees_suit.jb3d`.
