# 🌅 SISTEMA DE CIELO Y CLIMA - Documentación Técnica

## 📋 Resumen

Sistema completo de día/noche con cielo procedural, sol, luna, estrellas y clima dinámico que reacciona al tiempo del juego.

---

## ⏰ Ciclo Día/Noche

### Configuración Temporal

**Relación tiempo real ↔ tiempo del juego:**
- 20 minutos reales = 24 horas del juego
- 1 minuto real = 1.2 horas del juego  
- 1 segundo real = 72 segundos del juego

**Períodos del día:**

| Período | Horas | Duración Real | Características |
|---------|-------|---------------|-----------------|
| 🌙 **Noche** | 20:00 - 5:00 | 7.5 min | Luna, estrellas, poca luz |
| 🌅 **Amanecer** | 5:00 - 7:00 | 1.7 min | Transición, cielo rojizo |
| ☀️ **Día** | 7:00 - 18:00 | 9.2 min | Sol alto, luz máxima |
| 🌇 **Atardecer** | 18:00 - 20:00 | 1.7 min | Transición, cielo anaranjado |

---

## 🎨 Sistema de Colores

### Transiciones de Cielo

**Amanecer (5:00 - 7:00):**
```
Cielo: #1a1a2e → #87CEEB (oscuro → azul claro)
Horizonte: #FF6347 → #FFD700 (rojo → dorado)
Intensidad sol: 0.3 → 0.8
Niebla: 0.6 → 0.3 (densa → ligera)
```

**Día (7:00 - 18:00):**
```
Cielo: #87CEEB (azul cielo constante)
Horizonte: #E0F6FF (azul claro)
Intensidad sol: 0.8 → 1.0 → 0.8 (curva sinusoidal)
Niebla: 0.3 (constante ligera)
```

**Atardecer (18:00 - 20:00):**
```
Cielo: #87CEEB → #FF6347 (azul → rojo)
Horizonte: #FFD700 → #FF4500 (dorado → naranja rojizo)
Intensidad sol: 0.8 → 0.3
Niebla: 0.3 → 0.6 (ligera → densa)
```

**Noche (20:00 - 5:00):**
```
Cielo: #0a0a1e (azul muy oscuro)
Horizonte: #1a1a2e (gris oscuro)
Intensidad luna: 0.1 + 0.05 random (tenue con variación)
Niebla: 0.7 (muy densa)
```

---

## ☀️ Sol y Luna

### Posiciones Dinámicas

**Trayectoria del Sol:**
```typescript
// Ángulo basado en hora (0° = mediodía)
angle = ((hours - 12) / 12) * π

x = cos(angle) × 50
y = sin(angle) × 50 + 20  // Offset para mantener visible
z = 10
```

**Ejemplo de posiciones:**
- 6:00 (amanecer): X=50, Y=20, Z=10 (este)
- 12:00 (mediodía): X=0, Y=70, Z=10 (cenital)
- 18:00 (atardecer): X=-50, Y=20, Z=10 (oeste)

**Trayectoria de la Luna:**
```typescript
// Opuesta al sol
angle = ((hours - 0) / 12) * π

x = -cos(angle) × 50
y = abs(sin(angle)) × 50 + 15
z = -10
```

### Iluminación

**Sol (7:00 - 20:00):**
- Tipo: DirectionalLight
- Intensidad: 0.3 - 1.5 (según hora)
- Color: #ffffff
- Sombras: Habilitadas
- Rango sombras: 100×100 unidades

**Luna (20:00 - 7:00):**
- Tipo: PointLight
- Intensidad: 0.3
- Color: #AAAAFF (azul tenue)
- Distancia: 200 unidades

**Hemisférica (siempre):**
- Tipo: HemisphereLight
- Color cielo: Dinámico
- Color suelo: Dinámico
- Intensidad: 0.6

---

## ✨ Estrellas

### Generación Procedural

**Características:**
- **Cantidad:** 1000 estrellas
- **Distribución:** Esférica (radio 400-450)
- **Visibilidad:** Solo de noche (20:00 - 5:00)
- **Tamaño:** 2 px
- **Opacidad:** 0.6 - 0.8 (parpadeo)

**Algoritmo de generación:**
```typescript
for (let i = 0; i < 1000; i++) {
  theta = random() × 2π           // Ángulo horizontal
  phi = acos(random() × 2 - 1)    // Ángulo vertical
  radius = 400 + random() × 50    // Distancia variable

  x = radius × sin(phi) × cos(theta)
  y = abs(radius × cos(phi)) + 50  // Solo hemisferio superior
  z = radius × sin(phi) × sin(theta)
}
```

**Animación:**
- Rotación lenta: 0.01 rad/s
- Parpadeo: `opacity = 0.6 + sin(time × 2) × 0.2`

---

## 🌫️ Sistema de Niebla

### Niebla Volumétrica Dinámica

**Configuración:**
```typescript
Fog {
  color: Dinámico (según cielo)
  near: 100 - (densidad × 50)    // 50-100
  far: 400 - (densidad × 100)    // 300-400
}
```

**Densidad por hora:**
- Amanecer: 0.6 → 0.3 (se despeja)
- Día: 0.3 (constante ligera)
- Atardecer: 0.3 → 0.6 (se espesa)
- Noche: 0.7 (muy densa)

**Interpolación suave:**
- Color: Lerp 1% por frame
- Distancias: Lerp 1% por frame

---

## 🎮 Uso en el Juego

### Activar/Desactivar

```typescript
// En gameStore
const setDayNightEnabled = useGameStore((state) => state.setDayNightEnabled)

// Activar
setDayNightEnabled(true)

// Desactivar (queda en mediodía)
setDayNightEnabled(false)
```

### Cambiar Velocidad

```typescript
const setDayNightSpeed = useGameStore((state) => state.setDayNightSpeed)

// Normal (20 min = 24h)
setDayNightSpeed(1)

// Doble velocidad (10 min = 24h)
setDayNightSpeed(2)

// Más lento (40 min = 24h)
setDayNightSpeed(0.5)
```

### Hook useDayNightCycle

```typescript
import { useDayNightCycle } from '@/hooks/useDayNightCycle'

const timeOfDay = useDayNightCycle(enabled, speed)

// Retorna:
{
  hours: 14,                    // 0-23
  minutes: 30,                  // 0-59
  timeOfDay: 'day',            // dawn/day/dusk/night
  sunIntensity: 0.95,          // 0-1
  skyColor: '#87CEEB',         // Color hex
  horizonColor: '#E0F6FF',     // Color hex
  fogDensity: 0.3              // 0-1
}
```

---

## 🎨 Shaders Personalizados

### Shader de Cielo Gradiente

```glsl
// Vertex Shader
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform vec3 topColor;        // Color del cenit
uniform vec3 bottomColor;     // Color del horizonte
uniform float offset;         // Offset vertical
uniform float exponent;       // Curva del gradiente

varying vec3 vWorldPosition;

void main() {
  float h = normalize(vWorldPosition + offset).y;
  vec3 color = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
  gl_FragColor = vec4(color, 1.0);
}
```

**Parámetros:**
- `topColor`: Color del cielo arriba (dinámico)
- `bottomColor`: Color del horizonte (dinámico)
- `offset`: 33 (controla altura del gradiente)
- `exponent`: 0.6 (controla suavidad de transición)

---

## 📊 Performance

### Estadísticas

**Componentes activos:**
- 1× Esfera de cielo (500 unidades radio)
- 1× Sol (esfera 5 unidades)
- 1× Luna (esfera 3 unidades)
- 1000× Estrellas (puntos)
- 1× DirectionalLight (sol)
- 1× PointLight (luna, solo noche)
- 1× HemisphereLight
- 1× Fog

**Costo de renderizado:**
- Esfera cielo: ~2000 tris (32×32 segmentos)
- Sol/Luna: ~2000 tris combinados
- Estrellas: 1000 puntos (1 draw call)
- **Total adicional:** ~4000 tris
- **Impacto FPS:** Mínimo (<5%)

---

## 🔧 Configuración Avanzada

### Personalizar Ciclo

En `useDayNightCycle.ts`:

```typescript
const CYCLE_DURATION = 20 * 60  // Cambiar duración total

// O modificar períodos
if (hours >= 5 && hours < 7) {
  // Amanecer - personalizar aquí
}
```

### Personalizar Colores

```typescript
// Día
skyColor = '#87CEEB'      // Azul cielo
horizonColor = '#E0F6FF'  // Azul claro

// Atardecer
skyColor = '#FF6347'      // Rojo tomate
horizonColor = '#FF4500'  // Naranja rojizo

// Noche
skyColor = '#0a0a1e'      // Azul muy oscuro
horizonColor = '#1a1a2e'  // Gris oscuro
```

### Añadir Nubes (futuro)

```typescript
// En DynamicSky.tsx
{timeOfDay.timeOfDay === 'day' && <Clouds />}
```

---

## 🐛 Debugging

### Visualizar Hora Actual

```typescript
console.log(`${timeOfDay.hours}:${timeOfDay.minutes} - ${timeOfDay.timeOfDay}`)
```

### Testear Diferentes Horas

```typescript
// En gameStore, modificar gameTime inicial
gameTime: 10 * 60 * 60,  // Comenzar a las 10:00
```

### Acelerar Tiempo

```typescript
setDayNightSpeed(10)  // 10x más rápido (2 min = 24h)
```

---

## 📚 Referencias

- [Three.js ShaderMaterial](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- [Three.js Fog](https://threejs.org/docs/#api/en/scenes/Fog)
- [Three.js Lights](https://threejs.org/docs/#api/en/lights/Light)
- [Interpolación de colores](https://en.wikipedia.org/wiki/Color_gradient)

---

**Última actualización:** 14 de Octubre de 2026
