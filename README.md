# 🐝 JarBees: The Game

> **Un juego de vuelo contemplativo en primera persona donde una abeja explora paisajes infinitos inspirados en lugares reales del mundo.**

**Inspirado en:** REZ (Dreamcast), Road Rash 3, Journey  
**Stack:** Next.js + React Three Fiber + Three.js  
**Plataformas:** Web (Desktop + Mobile)

![JarBees Banner](./docs/banner.png)

---

## 🎮 Descripción

JarBees: The Game es una experiencia de exploración relajante donde controlás a una abeja realista volando a través de:

- 🏔️ **Lago Titicaca** - Montañas verdes, agua cristalina
- 🌋 **Isla de Pascua** - Terreno volcánico, océano profundo  
- ✨ **Constelaciones** - Cielo nocturno estrellado

### Características
- ✅ **Sin disparos** - Solo contemplación y vuelo
- ✅ **Scroll infinito** - Terreno procedural generado dinámicamente
- ✅ **Ciclo día/noche** - Transiciones atmosféricas suaves
- ✅ **Clima dinámico** - Niebla, lluvia, viento
- ✅ **Fauna viva** - Pájaros, mariposas, otros insectos
- ✅ **Controles simples** - Teclado o touch (móvil)
- ✅ **Música ambiente** - Soundtrack relajante

---

## 🎯 Controles

### Desktop (Teclado)
```
⬆️ W / ↑    →  Subir
⬇️ S / ↓    →  Bajar
⬅️ A / ←    →  Girar izquierda
➡️ D / →    →  Girar derecha
ESPACIO     →  Pausa
ESC         →  Menú
```

### Mobile (Touch)
- **Joystick izquierdo:** Giro horizontal (⬅️➡️)
- **Joystick derecho:** Altitud (⬆️⬇️)
- **Tap en pantalla:** Pausa

---

## 🚀 Instalación Local

### Requisitos
- Node.js 18+ 
- npm 9+

### Pasos
```bash
# Clonar repositorio
git clone https://github.com/tu_usuario/jarbees-the-game
cd jarbees-the-game

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abrir http://localhost:3000 en el navegador.

---

## 🏗️ Estructura del Proyecto

```
Jarbees_the_game/
├── app/                    # Páginas Next.js
│   ├── game/              # Escena principal del juego
│   └── donate/            # Página de donaciones
├── components/            # Componentes React Three Fiber
│   ├── BeePlayer.tsx      # Abeja controlable
│   ├── InfiniteTerrainSystem.tsx
│   ├── SkySystem.tsx      # Ciclo día/noche
│   └── WeatherSystem.tsx  # Clima dinámico
├── hooks/                 # Custom hooks
├── store/                 # Estado global (Zustand)
├── systems/               # Lógica del juego
├── public/
│   ├── models/            # Modelos 3D (GLB)
│   ├── textures/          # Texturas
│   └── audio/             # Música y efectos
└── types/                 # TypeScript types
```

---

## 💰 Apoyar el Proyecto

Este juego es **100% gratuito y open source**. Si te gusta, considerá apoyarlo:

### 🥇 GitHub Sponsors (Recomendado)
👉 https://github.com/sponsors/[tu_usuario]

**Tiers:**
- ☕ $1/mes - Cafecito Virtual
- 🐝 $5/mes - Apicultor Aprendiz
- 🍯 $10/mes - Guardián de Colmena
- 👑 $25/mes - Rey de las Abejas (bioma personalizado)

### 🇦🇷 Transferencia Bancaria (Argentina)
```
Alias: [tu.alias.mp]
CBU: [0000003100012345678901]
Banco: [Tu banco]
```

### ☕ Cafecito.app
https://cafecito.app/[tu_usuario]

**[Ver guía completa de donaciones →](./DONATION_GUIDE.md)**

---

## 🗺️ Roadmap

### v0.1 - Alpha (Actual)
- [x] Abeja con animación de aleteo
- [x] Controles básicos
- [ ] Terreno procedural infinito
- [ ] Ciclo día/noche

### v0.2 - Beta
- [ ] 3 biomas: Titicaca, Isla de Pascua, Constelaciones
- [ ] Clima dinámico
- [ ] Árboles y vegetación
- [ ] Fauna (pájaros, mariposas)

### v1.0 - Lanzamiento
- [ ] Controles móviles completos
- [ ] Sistema de donaciones integrado
- [ ] Música original
- [ ] Optimización para web

### v1.1 - Post-lanzamiento
- [ ] Nuevos biomas (Amazonas, Sahara, Himalaya)
- [ ] Sistema de fotografía
- [ ] Coleccionables (flores raras)

**[Ver plan completo →](./MASTER_PLAN.md)**

---

## 🛠️ Tecnologías

- **Framework:** Next.js 14
- **3D Engine:** Three.js + React Three Fiber
- **Helpers:** @react-three/drei, @react-three/postprocessing
- **Estado:** Zustand
- **Ruido Procedural:** simplex-noise
- **Lenguaje:** TypeScript

---

## 📸 Screenshots

*Próximamente...*

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

### Áreas donde podés ayudar:
- 🐛 Reportar bugs
- ✨ Sugerir features
- 🎨 Diseñar nuevos biomas
- 🎵 Componer música
- 📝 Mejorar documentación
- 🌍 Traducir a otros idiomas

**[Ver guía de contribución →](./CONTRIBUTING.md)**

---

## 📜 Licencia

- **Código:** MIT License
- **Assets 3D:** Creative Commons BY 4.0
- **Música:** Ver créditos individuales

**[Ver licencia completa →](./LICENSE)**

---

## 👏 Créditos

### Desarrollo
- **Concepto y Código:** [Tu Nombre]
- **Modelo de Abeja:** Basado en bee_source.glb (retocado)
- **Música:** harmonia_mundi.wav (ArcheoScope)

### Inspiración
- **REZ (United Game Artists, 2001)** - Estética y mecánica de vuelo
- **Road Rash 3 (EA, 1995)** - Sensación de velocidad constante
- **Journey (thatgamecompany, 2012)** - Exploración contemplativa
- **ArcheoScope** - Escenas, assets 3D y código base

### Agradecimientos Especiales
- Comunidad de React Three Fiber
- Three.js contributors
- Todos los sponsors y donantes 💛

---

## 📧 Contacto

**Desarrollador:** [Tu Nombre]  
**Email:** tu_email@ejemplo.com  
**GitHub:** [@tu_usuario](https://github.com/tu_usuario)  
**Twitter/X:** [@tu_usuario](https://twitter.com/tu_usuario)

**Discord:** [Unirse al servidor](https://discord.gg/tu_invite)

---

## 🌟 Showcase

Si jugaste JarBees: The Game y querés compartir tu experiencia:
- Usá el hashtag **#JarBeesGame**
- Etiquetame en Twitter/X
- Compartí screenshots en el Discord

---

**Hecho con 💛 por la comunidad de abejas virtuales**

*¡Volá lejos! 🐝✨*
