# 🌌 JarBees — Aurelium Phase Veil (Velo de Fase Cuántico) & Sprint Supersónico 55 km/h

## 📋 Resumen Ejecutivo
Este documento detalla la arquitectura gráfica, matemática y biomecánica de dos de las mecánicas más avanzadas introducidas en **JarBees (v0.8.28)**:
1. **Sprint Supersónico Terrestre (55 km/h / 15.2 m/s)**: Duplicación de velocidad terrestre con calibración dinámica de cadencia de carrera en `nexo_run`, FOV dinámico de $65^\circ$ a $78^\circ$ y seguimiento de relieve analítico amortiguado.
2. **Aurelium Phase Veil (Velo de Fase Cuántico)**: Shader injection PBR mediante `onBeforeCompile` en Three.js con **Screen-Door Dithering (Matriz de Bayer 4x4)**, ruido 3D en coordenadas locales de armadura, pulso de activación esférico fotónico Hex-Core y **Fresnel Cuántico nacarado**.

---

## ⚡ 1. Sprint Supersónico 55 km/h

### 1.1 Comparativa de Velocidades

| Parámetro | Valor Previo | Nuevo Valor Supersónico | Sensación de Juego |
| :--- | :--- | :--- | :--- |
| **Caminata Base (`W`)** | 5.0 m/s (~18 km/h) | 5.0 m/s (~18 km/h) | Trote táctico controlado |
| **Sprint con Boost (`Shift` + `W`)** | 7.6 m/s (~27.3 km/h) | **15.2 m/s (~54.7 km/h)** | **Sprint táctico supersónico de exotraje** |
| **Retroceso Defensivo (`S`)** | 3.25 m/s (~11.7 km/h) | 3.25 m/s (~11.7 km/h) | Paso firme de repliegue |
| **Retroceso con Boost (`Shift` + `S`)** | 4.94 m/s (~17.8 km/h) | **9.88 m/s (~35.5 km/h)** | Retirada ágil con cobertura |

### 1.2 Calibración Dinámica de Cadencia de Animación (`nexo_run`)
Para evitar el defecto de *foot-sliding* (patinaje sobre hielo), la velocidad de reproducción del ciclo de carrera se evalúa en cada cuadro según la curva:

$$\text{animSpeed} = 1.35 + \left(\frac{|\text{velocity}| - 4.5}{10.7}\right)^{1.25} \times 0.85$$

- A $5.0 \text{ m/s}$: $\text{animSpeed} \approx 1.35\times$
- A $10.0 \text{ m/s}$: $\text{animSpeed} \approx 1.74\times$
- A $15.2 \text{ m/s}$: $\text{animSpeed} \approx 2.20\times$

El braceo cerrado y el doble rebote pélvico se sincronizan con las pisadas sin resbalamiento visual sobre el DEM del Aconcagua.

### 1.3 Cinemática de Cámara ([FollowCamera.tsx](file:///c:/Projects/Jarbees_the_game/components/FollowCamera.tsx))
- **FOV Dinámico**: Se calcula a partir de `groundSprintRatio`:
  $$\text{targetFOV} = 65^\circ + (\text{groundSprintRatio} \times 13^\circ) \implies 78^\circ \text{ al tope}$$
- **CamPull**: Desplazamiento reactivo de cámara hacia atrás ($+40\%$) y hacia arriba ($+0.28\text{m}$) para otorgar visión periférica superior.
- **Micro-Vibración Cinética**: Temblor sutil ($0.08\times$ sprint ratio) que transmite la masa inercial de la armadura al contactar el suelo.

---

## 🌌 2. Aurelium Phase Veil (Velo de Fase Cuántico)

### 2.1 El Gran Desafío Gráfico en Three.js: Z-Sorting vs Dithered Dissolve
Poner múltiples mallas articuladas en `transparent: true` con `opacity < 1` rompe el buffer de profundidad (`gl_FragDepth`), dibujando extremidades traseras encima de las delanteras.

**Solución Implementada**:
- `depthWrite: true` se mantiene inmutable en el pipeline.
- Se aplica **Screen-Door Dithering** (Alpha Hashing) con una matriz de Bayer $4 \times 4$ en coordenadas de fragmento (`gl_FragCoord.xy`) combinada con ruido 3D procedural:

```glsl
float aurenBayer4x4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int idx = x + y * 4;
  float b[16] = float[16](
     0.0 / 16.0,  8.0 / 16.0,  2.0 / 16.0, 10.0 / 16.0,
    12.0 / 16.0,  4.0 / 16.0, 14.0 / 16.0,  6.0 / 16.0,
     3.0 / 16.0, 11.0 / 16.0,  1.0 / 16.0,  9.0 / 16.0,
    15.0 / 16.0,  7.0 / 16.0, 13.0 / 16.0,  5.0 / 16.0
  );
  return b[idx];
}
```

- Si el valor métrico cae por debajo del umbral del velo, el fragmento se descarta anticipadamente (`discard;`), permitiendo que el Z-buffer conserve la oclusión perfecta sin errores de ordenamiento.

### 2.2 Coordenadas Locales de Armadura (`vAureliumLocalPos`)
Para que el patrón de microestructuras hexagonales y ruido 3D no se desplace o "nade" en el espacio mundial cuando el personaje se mueve a 55 km/h o vuela a 230 km/h:
- El vertex shader exporta `vAureliumLocalPos = position;`.
- El muestreo de ruido celular permanece anclado rígidamente a cada placa de metal, remache y bisel de la armadura.

### 2.3 Pulso Hex-Core Pectoral
Una onda esférica fotónica se detona al cambiar el estado del velo:
- Centro de ignición: Reactor pectoral ($x=0.0$, $y=0.88$, $z=0.10$).
- Radio de propagación: de $0.0\text{ m}$ a $2.4\text{ m}$ en $0.65\text{ s}$.
- Modulación de emisión: La frontera de choque se tiñe de un resplandor cian puro con intensidad $4.8\times$.

### 2.4 Contorno Nacarado / Iridiscente (Fresnel Cuántico)
$$\text{Fresnel} = \left(1.0 - \max(0.0, \vec{n} \cdot \vec{v})\right)^{3.5}$$
- Gradiente espectral: Del Azul Cian Cuántico (`#55F0FF`) hacia el Blanco Nacarado Perlado (`#F8FAFC`).
- Incluso con el camuflaje al 94%, el borde tangencial permanece parcialmente legible, garantizando que el usuario distinga su propia silueta heroica en cualquier bioma y condición lumínica.

### 2.5 Reactividad Biomecánica
| Estado de Auren | Visibilidad | Comportamiento del Campo de Fase |
| :--- | :--- | :--- |
| **Reposo / Sigilo** | ~6% visible (94% camuflaje) | Silueta translúcida con micro-parpadeo sutil en aristas. |
| **Caminata Normal** | ~10% visible | Ondas de interferencia sutiles en rodillas y codos. |
| **Sprint Supersónico 55 km/h** | ~30% más visible | El arrastre cinético perturba el campo con micro-chispas fotónicas. |
| **Vuelo Transónico / AB** | Distorsión reactiva | Estela de ionización cuántica tras alerones y botas. |
| **Daño / Flinch Cinético** | Destello transitorio | Ruptura dieléctrica violenta (perturbación 1.0) y reconvergencia a velo. |

---

## 🎮 3. Mapeo de Controles e Interfaz

- **Teclado**:
  - **`[V]`**: Alternar Velo de Fase (Aurelium Phase Veil).
  - **`Shift` + `WASD`**: Sprint Supersónico Terrestre (55 km/h).
- **Dock de Controles (HUD)**:
  - Botón interactivo `✨ [V] Velo` con estado en vivo (`ACTIVO` / `OFF`).
  - Badge de telemetría `✨ VELO DE FASE` con borde pulsante.
- **Mobile Touch Controls**:
  - Botón táctil `✨` en la barra superior con anillo lumínico cian.
