# SISTEMA DE VUELO DE ALTA VELOCIDAD Y FÍSICA ATMOSFÉRICA — AUREN & JARBEES

> **Documento de Especificación Técnica, Fórmulas Físicas y Diseño de Simulación**  
> *Módulo de Vuelo de la Armadura JarBees (BEE-01 Vesper / Auren)*  
> *Versión 1.2 — Fecha de consolidación: 2026*

---

## 1. Fundamentos Físicos y Atmósfera ISA

### 1.1 El Número de Mach y la Dependencia de la Altitud
El número de Mach ($M$) es una magnitud adimensional que mide la compresibilidad del aire relativo a la velocidad del objeto:
$$M = \frac{v}{a(h)}$$
donde $a(h)$ es la velocidad local del sonido según la **Atmósfera Estándar Internacional (ISA)**:
$$a(h) = \sqrt{\gamma R T(h)} \approx 340,29 \cdot \sqrt{\frac{T(h)}{288,15}} \quad [\text{m/s}]$$

* $\gamma = 1,4$ (coeficiente adiabático del aire seco)
* $R = 287,05 \text{ J/(kg}\cdot\text{K)}$ (constante específica de los gases para el aire)
* $T(h) = 288,15 - 0,0065 \cdot h \quad [\text{K}]$ (gradiente térmico troposférico hasta 11.000 m)

#### Tabla Comparativa de Regímenes a Distintas Altitudes
| Régimen | Mach | Nivel del mar (15 °C, $a=1.225 \text{ km/h}$) | A 5.000 m ($-17,5 \text{ °C}$, $a=1.154 \text{ km/h}$) | A 11.000 m ($-56,5 \text{ °C}$, $a=1.062 \text{ km/h}$) | Fenómeno Asociado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Crucero** | $M = 0,20$ | $245 \text{ km/h}$ | $231 \text{ km/h}$ | $212 \text{ km/h}$ | Flujo incompresible estándar. |
| **Alta Velocidad**| $M = 0,50$ | $613 \text{ km/h}$ | $577 \text{ km/h}$ | $531 \text{ km/h}$ | Compresibilidad incipiente. |
| **Transónico Crítico** | $M = 0,75$ | $919 \text{ km/h}$ | $866 \text{ km/h}$ | $797 \text{ km/h}$ | Mach crítico ($M_{cr}$): flujo local $M>1$ sobre hombros/pecho. |
| **Límite Atmosférico**| $M = 0,83$ | **$1.017 \text{ km/h}$** | **$958 \text{ km/h}$** | **$882 \text{ km/h}$** | **Techo de vuelo convencional (arrastre de onda compensa empuje).** |
| **Sonido** | $M = 1,00$ | $1.225 \text{ km/h}$ | $1.154 \text{ km/h}$ | $1.062 \text{ km/h}$ | Formación del cono de Mach / estampido sónico continuo. |
| **Supersónico Medio** | $M = 2,00$ | $2.450 \text{ km/h}$ | $2.308 \text{ km/h}$ | $2.124 \text{ km/h}$ | Calentamiento aerodinámico moderado ($\approx 280 \text{ °C}$). |
| **Hipersónico** | $M = 3,00$ | $3.675 \text{ km/h}$ | $3.462 \text{ km/h}$ | $3.186 \text{ km/h}$ | Calentamiento severo ($\approx 530 \text{ °C}$), halo de plasma incipiente. |
| **Hipersónico Extremo**| $M = 5,00$ | $6.125 \text{ km/h}$ | $5.770 \text{ km/h}$ | $5.310 \text{ km/h}$ | Disociación térmica e ionización de bordes de ataque ($>1.450 \text{ °C}$). |

---

## 2. Los Dos Modos de Vuelo de Auren

Para conciliar la física aerodinámica creíble con las capacidades de ciencia ficción de la armadura JarBees, el sistema implementa una arquitectura dual:

### Modo 1: Vuelo Atmosférico Convencional (Mach 0 a Mach 0,83–0,85)
* **Propulsión Cinética Clásica:** Impulsado por los micro-reactores vectoriales de las botas y estabilizadores de espalda.
* **Resistencia Aerodinámica Real:**
  $$F_D = \frac{1}{2} \cdot \rho(h) \cdot v^2 \cdot C_{DA} \cdot k_{onda}(M) \cdot k_{freno}$$
  * A partir de $M \ge 0,75$, el multiplicador de resistencia de onda $k_{onda}(M)$ crece rápidamente de $1,0$ a más de $2,5$.
  * Al llegar a **Mach 0,83 (~1.017 km/h)**, la fuerza de resistencia iguala al empuje continuo de la armadura ($3.800 \text{ N}$), estableciendo un límite natural, orgánico y físicamente verosímil sin requerir "paredes invisibles".
* **Respuesta Acústica:** Rugido aerodinámico profundo y "buffet transónico" modulado a 16 Hz cerca de Mach 0,80–0,88 debido al desprendimiento de vórtices sobre la silueta del traje.

### Modo 2: Vuelo de Fase Aurelium (Transónico a Hipersónico, Mach 1 a Mach 5+)
* **Envoltura de Control de Flujo Aurelium:**
  Al activar el Postquemador con empuje sostenido en la zona transónica ($M \ge 0,72$ y energía suficiente), el reactor Hex-Core proyecta un campo electromagnético ionizado alrededor del cuerpo.
* **Colapso de Resistencia de Onda:**
  $$k_{onda, efectivo} = 1 + (k_{onda}(M) - 1) \cdot (1 - 0,72 \cdot \phi_{aurelium})$$
  La Fase Aurelium ($\phi_{aurelium} \in [0, 1]$) amortigua hasta un **72% del arrastre de onda**, permitiendo a Auren perforar la barrera del sonido y acelerar en regímenes supersónico e hipersónico.
* **Compensaciones y Costes:**
  1. **Consumo Energético:** Consume una tasa adicional de energía ($+3,8\%/\text{s}$).
  2. **Calentamiento por Fricción de Plasma:** A Mach $>2,2$, el estancamiento aerodinámico calienta la superficie. Aunque la Fase Aurelium dispersa el 45% del impacto térmico, velocidades de Mach 3 a 5 elevan rápidamente la temperatura del traje, obligando a gestionar la refrigeración.

---

## 3. Interacción con el Entorno: Dinámicas Rasantes (Ground Effect)

A velocidades transónicas y supersónicas, un vuelo rasante a 282 m/s recorre decenas de metros en fracciones de segundo. El sistema calcula en tiempo real la perturbación sobre el terreno:

1. **Atenuación Cuadrática Inversa de la Presión:**
   $$\text{dustKick} = \left(1 - \frac{h_{suelo}}{28}\right)^2 \cdot \text{smoothstep}(30, 280, v) \cdot (1 + 0,35 \cdot \text{AB})$$
   * Si Auren vuela a más de 28 metros del suelo, la perturbación es puramente acústica.
   * Por debajo de 15 metros, la sobrepresión dinámica proyecta partículas de polvo en una estela cónica en "V" hacia los flancos y hacia atrás.
2. **Estampido Sónico Continuo (N-Wave Shock Carpet):**
   * El estampido sónico no es un evento instantáneo exclusivo del momento de cruce $M=1$; es una onda de choque cónica que se desplaza junto con el personaje mientras se mantenga $M \ge 1$.
   * El sistema genera eventos espaciales periódicos de estela supersónica cuando el vuelo se mantiene sostenido a $M > 1,1$.

---

## 4. Inteligencia Artificial JarBees: GCAS (Ground Collision Avoidance)

A 1.017 km/h, Auren recorre **28 metros cada 100 milisegundos**. El tiempo de reacción humano promedio (200–250 ms) es insuficiente para evitar un accidente contra crestas del relieve o depresiones súbitas del terreno.

* **Integración del GCAS:**
  En modo de vuelo asistido (`assist`), JarBees monitorea continuamente el vector de descenso $v_y$ respecto a la altitud real sobre el terreno ($h_{suelo}$).
* **Evasión Reactiva Asistida:**
  Si $v_{aire} > 130 \text{ m/s}$, $h_{suelo} < 14 \text{ m}$ y $v_y < -1,5 \text{ m/s}$:
  $$F_{lift} = \min\left(28 \cdot dt, \left[30 \cdot \frac{14 - h_{suelo}}{14} + 2,8 \cdot |v_y|\right] \cdot dt\right)$$
  JarBees inyecta micro-vectores de sustentación vertical de emergencia que nivelan a la armadura a ras de la cresta del relieve, indicando `🛡️ GCAS` en el HUD y alertando al piloto.

---

## 5. Arquitectura del Código en el Proyecto

* **`systems/FlightDynamics.ts`**: Motor físico desacoplado (ecuaciones ISA, resistencia compresible, Fase Aurelium, GCAS de JarBees, cálculo de `dustKick` y `thermalGlow`).
* **`systems/FlightAudio.ts`**: Síntesis procedural Web Audio con resonador armónico de Fase Aurelium, buffet transónico y chasquido de onda de choque.
* **`components/FlightEffects.tsx`**: Renderizado GPU Three.js de estelas de velocidad, cono de condensación Prandtl-Glauert modulado por plasma, anillo de energía Aurelium y partículas de polvo rasante.
* **`components/BeePlayer.tsx`**: Integrador temporal de subpasos que alimenta en tiempo real la altura exacta del terreno (`altAboveGround`) al motor físico.
* **`components/GameHUD.tsx`**: Interfaz de telemetría con insignias de régimen (`Transónico`, `Supersónico M>1`, `Hipersónico M>3`), `✨ AURELIUM`, alerta `🛡️ GCAS` y estado térmico de plasma.
