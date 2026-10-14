# 🚀 Instrucciones de Setup - JarBees: The Game

**Fecha:** 14 de Octubre de 2026  
**Estado:** Estructura base creada (FASE 1 en progreso)

---

## ✅ LO QUE YA TENÉS LISTO

El proyecto ya está inicializado con:

- ✅ Estructura de carpetas completa
- ✅ Next.js 14 + TypeScript configurado
- ✅ React Three Fiber + Drei + PostProcessing en package.json
- ✅ Página de inicio (`/`)
- ✅ Página del juego (`/game`)
- ✅ Página de donaciones (`/donate`)
- ✅ Escena 3D básica con Three.js
- ✅ HUD placeholder
- ✅ Documentación completa (MASTER_PLAN.md, README.md, DONATION_GUIDE.md)

---

## 📦 PASO 1: INSTALAR DEPENDENCIAS

Abrí la terminal en `C:\Projects\Jarbees_the_game` y ejecutá:

```bash
npm install
```

Esto instalará:
- Next.js 14
- React 18
- Three.js
- React Three Fiber
- @react-three/drei (helpers)
- @react-three/postprocessing
- Zustand (estado global)
- simplex-noise (terreno procedural)
- stats.js (FPS counter)
- leva (debug UI)
- TypeScript y tipos

**Tiempo estimado:** 2-3 minutos

---

## 🚀 PASO 2: INICIAR SERVIDOR DE DESARROLLO

```bash
npm run dev
```

Esto arrancará Next.js en http://localhost:3000

**Deberías ver:**
- Página de inicio con botón "Jugar Ahora"
- Clicking "Jugar Ahora" → Escena 3D con un cubo dorado
- HUD con info básica

**Si todo funciona:** ✅ Estructura base OK

---

## 🐝 PASO 3: COPIAR MODELO DE ABEJA

El modelo de la abeja está en el otro proyecto. Copialo manualmente:

```powershell
# Desde PowerShell
Copy-Item "C:\Projects\productos_crud_bkd\storage\assets\models\bee_source.glb" `
          -Destination "C:\Projects\Jarbees_the_game\public\models\bee.glb"
```

**Ubicación final:** `public/models/bee.glb`

---

## 🌳 PASO 4: COPIAR ÁRBOLES DESDE ARCHEOSCOPE

```powershell
# Árboles
Copy-Item "C:\Projects\ArcheoScope\models_3d\Trees\new.glb" `
          -Destination "C:\Projects\Jarbees_the_game\public\models\tree1.glb"

Copy-Item "C:\Projects\ArcheoScope\models_3d\Trees\new2.glb" `
          -Destination "C:\Projects\Jarbees_the_game\public\models\tree2.glb"

Copy-Item "C:\Projects\ArcheoScope\models_3d\Trees\new3.glb" `
          -Destination "C:\Projects\Jarbees_the_game\public\models\tree3.glb"

# Audio
Copy-Item "C:\Projects\ArcheoScope\harmonia_mundi.wav" `
          -Destination "C:\Projects\Jarbees_the_game\public\audio\main_theme.wav"
```

---

## 🎨 PASO 5: (OPCIONAL) COPIAR COMPONENTES REUTILIZABLES

Si querés reutilizar componentes de ArcheoScope:

```powershell
# Ejemplo: Sistema de estrellas
Copy-Item "C:\Projects\ArcheoScope\viewer3d\components\ConstellationsScene.tsx" `
          -Destination "C:\Projects\Jarbees_the_game\components\ConstellationsReference.tsx"

# Lluvia
Copy-Item "C:\Projects\ArcheoScope\viewer3d\components\RainParticles.tsx" `
          -Destination "C:\Projects\Jarbees_the_game\components\RainParticles.tsx"
```

⚠️ **NOTA:** Estos componentes pueden requerir ajustes de imports.

---

## 🔧 PASO 6: CONFIGURAR VARIABLES DE ENTORNO

```bash
# Copiar ejemplo
copy .env.example .env.local
```

Luego editar `.env.local` con tus datos:

```env
# GitHub Sponsors (reemplazar con tu usuario)
NEXT_PUBLIC_GITHUB_SPONSOR_URL=https://github.com/sponsors/TU_USUARIO

# CBU Argentino
NEXT_PUBLIC_CBU=0000003100012345678901
NEXT_PUBLIC_ALIAS=tu.alias.mp
NEXT_PUBLIC_BANK_NAME=Banco Provincia

# Cafecito
NEXT_PUBLIC_CAFECITO_URL=https://cafecito.app/tu_usuario

# PayPal
NEXT_PUBLIC_PAYPAL_ME_URL=https://paypal.me/TuUsuario
```

---

## 🧪 PASO 7: VERIFICAR QUE TODO FUNCIONA

### Test 1: Página de inicio
- Ir a http://localhost:3000
- Ver botones "Jugar Ahora" y "Apoyar Proyecto"
- Click en cada uno → deben navegar correctamente

### Test 2: Escena 3D
- Ir a http://localhost:3000/game
- Deberías ver un cubo dorado girando
- HUD con info en las esquinas
- FPS counter (si habilitaste stats)

### Test 3: Página de donaciones
- Ir a http://localhost:3000/donate
- Ver 4 opciones de donación
- Links funcionando (aunque sean placeholders)

**Si todo funciona:** ✅ Proyecto configurado correctamente

---

## 📋 PRÓXIMOS PASOS (FASE 1)

Según el MASTER_PLAN.md, la FASE 1 requiere:

- [ ] Importar y mostrar modelo de abeja en escena
- [ ] Implementar `BeePlayer.tsx` con movimiento básico
- [ ] Sistema de controles (teclado)
- [ ] Animación de aleteo de la abeja
- [ ] Cámara siguiendo desde atrás
- [ ] HUD funcional (velocidad real, distancia)

**Archivo a crear:**
```
components/BeePlayer.tsx
hooks/useGameControls.ts
store/gameStore.ts
```

---

## 🛠️ COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Exportar estático
npm run export

# Análisis de bundle
npm run analyze

# Linter
npm run lint
```

---

## 🐛 TROUBLESHOOTING

### Error: "Module not found: Can't resolve '@react-three/fiber'"
**Solución:** Ejecutar `npm install` de nuevo

### Error: "window is not defined" (SSR)
**Solución:** Asegurarte de usar `dynamic` con `ssr: false` en imports de Three.js

### Canvas en blanco
**Solución:** 
1. Verificar que el modelo GLB esté en `public/models/`
2. Abrir consola del navegador para ver errores
3. Verificar que no haya conflictos de versiones de Three.js

### FPS bajos (<30)
**Solución:**
1. Reducir calidad de texturas
2. Desactivar postprocessing
3. Verificar extensiones del navegador (desactivar adblock)

---

## 📞 SOPORTE

**Dudas técnicas:** Abrir issue en GitHub  
**Documentación completa:** Ver `MASTER_PLAN.md`  
**Donaciones:** Ver `DONATION_GUIDE.md`

---

**¡Listo para volar! 🐝✨**
