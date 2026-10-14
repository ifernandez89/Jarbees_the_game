# 📋 CHANGELOG - JarBees: The Game

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

### Próximas Implementaciones
- BeePlayer.tsx con modelo 3D y controles
- Sistema de terreno infinito procedural
- Ciclo día/noche con skybox dinámico
- Sistema de clima (niebla, lluvia)
- Vegetación instanciada (árboles, rocas)
- Animales de fondo (pájaros, mariposas)
- Controles móviles con joystick virtual
- Sistema de donaciones funcional

---

## [0.1.0-alpha] - 2026-10-14

### 🎉 Lanzamiento Inicial del Proyecto

#### Added (Agregado)

**Infraestructura:**
- Proyecto Next.js 14 con TypeScript inicializado
- React Three Fiber + Drei configurados para gráficos 3D
- Zustand para manejo de estado global
- simplex-noise para generación procedural
- Estructura de carpetas profesional:
  - `/app` - Páginas Next.js (home, game, donate)
  - `/components` - Componentes React 3D
  - `/hooks` - Custom hooks (controles, performance)
  - `/store` - Estado global con Zustand
  - `/systems` - Sistemas del juego (terreno, cielo, clima)
  - `/utils` - Utilidades (generadores procedurales, helpers)
  - `/types` - Definiciones TypeScript
  - `/public` - Assets estáticos (models, textures, audio, icons)

**Configuración:**
- `next.config.js` con loaders para GLB y audio
- `tsconfig.json` con path aliases (@/components, etc.)
- `.env.example` con plantilla para URLs de donación
- `.gitignore` configurado para Next.js y Node.js

**Documentación:**
- `README.md` - Documentación principal del proyecto
- `MASTER_PLAN.md` - Plan detallado de desarrollo de 8 semanas/fases
- `DONATION_GUIDE.md` - Guía completa de donaciones (GitHub Sponsors, Cafecito, CBU)
- `SETUP_INSTRUCTIONS.md` - Instrucciones paso a paso de instalación
- `PROJECT_STATUS.md` - Estado actual del proyecto y próximos hitos
- `QUICK_START.md` - Guía rápida para empezar
- `START_HERE.md` - Punto de entrada para nuevos desarrolladores
- `LICENSE` - Licencia MIT con atribuciones

**Páginas Web:**
- `/` - Landing page con introducción y botones (Jugar, Donar, Documentación)
- `/game` - Página del juego con canvas Three.js y escena placeholder (cubo dorado giratorio)
- `/donate` - Página completa de donaciones con múltiples opciones:
  - GitHub Sponsors (opción principal)
  - Cafecito.app (Argentina)
  - PayPal (internacional)
  - CBU directo (transferencia bancaria Argentina)

**Componentes Base:**
- `GameScene.tsx` - Canvas de React Three Fiber con:
  - Escena 3D básica
  - Iluminación (ambiente + direccional)
  - Cubo dorado giratorio (placeholder para la abeja)
  - Grilla de referencia
  - Configuración de rendimiento (shadows, tone mapping)
- HUD placeholder con información de debug

**Dependencias Instaladas:**
- `next` ^14.0.0
- `react` ^18.0.0
- `three` ^0.158.0
- `@react-three/fiber` ^8.15.0
- `@react-three/drei` ^9.92.0
- `zustand` ^4.4.0
- `simplex-noise` ^4.0.0
- `typescript` ^5.0.0

**Sistema de Donaciones Diseñado:**
- GitHub Sponsors como opción principal (0% comisión, Argentina habilitada)
- Cafecito.app para usuarios argentinos
- PayPal para donaciones internacionales
- CBU directo para transferencias bancarias locales
- Página `/donate` con instrucciones detalladas en español

#### Technical Decisions (Decisiones Técnicas)

- ✅ **Next.js 14** sobre Vite - SSR support, mejor SEO para landing pages
- ✅ **React Three Fiber** sobre Three.js vanilla - Integración React, arquitectura basada en componentes
- ✅ **Zustand** sobre Redux - State management más simple y menos boilerplate
- ✅ **Dynamic imports** con `ssr: false` para componentes 3D - Evitar errores de SSR
- ✅ **GitHub Sponsors** como plataforma principal de donaciones - Sin comisiones, Argentina habilitada
- ✅ **8 fases de desarrollo** - Plan incremental y realista
- ✅ **3 biomas iniciales** - Lago Titicaca (verde), Isla de Pascua (volcánico), Constelaciones (noche)

#### Inspiración

- 🎮 **Rez (Dreamcast)** - Estética de vuelo contemplativo, cámara en riel
- 🏎️ **Road Rash 3** - Sensación de velocidad constante
- 🐝 **Concepto original** - Abeja volando sin combate, apreciando el paisaje

---

## Convenciones de Versionado

- **MAJOR (X.0.0)** - Cambios incompatibles con versiones anteriores
- **MINOR (0.X.0)** - Nueva funcionalidad compatible hacia atrás
- **PATCH (0.0.X)** - Corrección de bugs compatible hacia atrás

### Etiquetas de Desarrollo

- **alpha** - Versión muy temprana, funcionalidad básica
- **beta** - Funcionalidad completa, en pruebas
- **rc** - Release candidate, casi listo para producción

---

## Roadmap de Versiones Futuras

### [0.2.0-alpha] - Próxima
- BeePlayer.tsx funcional con modelo GLB
- Controles de vuelo básicos (teclado)
- Cámara tercera persona siguiendo la abeja
- HUD con datos reales (velocidad, altura, posición)

### [0.3.0-alpha] - FASE 2
- Sistema de terreno infinito con chunks
- 3 biomas implementados
- Sistema de LOD básico

### [0.4.0-beta] - FASE 3-4
- Vegetación procedural (árboles, rocas, pasto)
- Ciclo día/noche funcional
- Sistema de clima (niebla, lluvia)

### [0.5.0-beta] - FASE 5-6
- Animales de fondo (pájaros, mariposas)
- Controles móviles con touch
- Optimizaciones de rendimiento

### [1.0.0] - Lanzamiento
- Sistema de donaciones integrado en juego
- Deploy en Vercel + Itch.io
- Documentación completa para usuarios
- Polish final (efectos de partículas, audio reactivo)

---

## Assets Pendientes de Importar

### Desde productos_crud_bkd
- `storage/assets/models/bee_source.glb` → `public/models/bee.glb`

### Desde ArcheoScope
- `models_3d/Trees/new.glb` → `public/models/tree1.glb`
- `harmonia_mundi.wav` → `public/audio/main_theme.wav`
- Texturas de Lago Titicaca (pasto, agua)
- Texturas de Isla de Pascua (volcán, piedras)
- Skybox de constelaciones

---

## Contribuidores

- **xiphos-pc1** - Desarrollo inicial, diseño, documentación

---

## Licencia

Este proyecto está licenciado bajo MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

**Atribuciones:**
- Modelo de abeja: productos_crud_bkd
- Escenarios base: ArcheoScope
- Audio: harmonia_mundi (ArcheoScope)

---

**¡El viaje contemplativo de JarBees está por comenzar! 🐝✨**
