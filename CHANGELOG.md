# Changelog - JarBees: The Game

## [Unreleased] - 2026-10-25

### 🧠 Added - Sistema de Inteligencia Espacial
- **Documentación de arquitectura de navegación espacial** en `docs/AUREN_WORLDLAB_SPATIAL_NAVIGATION.md`
  - Arquitectura en 4 capas: Ingesta BSP/NAV → Grafo Espacial → Motor Cinemático → API de Agente
  - Motor de navegación multimodal para Auren (caminar, volar, híbrido)
  - Sistema de análisis de topología espacial y conectividad de zonas
  - Pipeline conceptual para conversión de geometría BSP a GLB
  - Especificaciones para futuro NAV Debugger visual 3D

### 🗺️ Added - Nuevos Mundos Navegables
- **de_vertigo**: Rascacielos en construcción con verticalidad extrema
  - Escena Three.js completa con iluminación atmosférica de gran altitud
  - Spawn CT en piso 51 (azotea) y Spawn T en almacenes inferiores
  - Implementación de fog ventoso y luces de obra en construcción
- Expansión del hub de teletransporte con 9 destinos CS 1.6 totales

### 📝 Updated - Documentación
- `CS_MAPS_CATALOG.md`: 
  - Actualizado con referencias al sistema de navegación espacial
  - Notas técnicas sobre formato `.nav` (Turtle Rock Studios/Valve)
  - Enlace cruzado a documento de arquitectura espacial
  - Fecha actualizada a 25 de Octubre de 2026

### 🎮 Changed - Componentes de Interfaz
- `AurenMansionHub.tsx`: Expandido array de mapas disponibles en hub de teletransporte
- `CSAssaultWorld.tsx`: Agregada escena completa de Vertigo con iluminación y puntos de interés
- `GameHUD.tsx`: Mejoras en visualización de estado de mundo activo
- `store/gameStore.ts`: Soporte para nuevos mundos y sistema de navegación espacial

### ⚖️ Política de Uso
- Los mapas compilados de Counter-Strike se utilizan exclusivamente como entorno de investigación local bajo fair use
- Excluidos de control de versiones público (`.gitignore`)
- Solo assets originales y con licencia abierta en despliegues de producción

### 🔬 Laboratorio Técnico
- Investigación de formato binario `.nav` (magic number 0xFEEDFACE)
- Análisis de áreas de navegación, flags cinemáticas y puntos de cobertura táctica
- Estudio de caso: de_vertigo (562 áreas NAV, ~174k m³ volumen envolvente)
- Correcciones métricas: checksum BSP, volumen jugable vs bounding box, convención de escala GoldSrc

---

## Notas de Desarrollo

### Próximos Pasos
- [ ] Implementar NAV Debugger visual con wireframe overlay 3D
- [ ] Desarrollar SpatialGraphService agnóstico de motor
- [ ] Crear sistema de navegación propio para Villa Auren
- [ ] Integrar algoritmo A* sobre NavMesh para planificación de rutas

### Contexto Técnico
Este release documenta el salto conceptual de "mundos recorribles" a "espacios interpretables por agentes autónomos", sentando las bases para que Auren pueda razonar sobre topología espacial, planificar rutas óptimas y tomar decisiones de navegación multimodal (terrestre/aérea).

