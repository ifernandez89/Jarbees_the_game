# 🛡️ Sistema de Protección de Modelos 3D (.jb3d)

## 📌 Resumen
Para evitar la descarga no autorizada y el robo directo de los modelos 3D (`.glb`), se ha implementado una arquitectura de **bóveda de assets cifrados** con **descifrado en memoria (RAM)** mediante la **Web Crypto API**.

---

## 🔒 ¿Cómo funciona la protección?

### 1. Contenedor Binario Seguro (`.jb3d`)
Los archivos `.glb` se procesan mediante el script de cifrado y se convierten a `.jb3d` (*JarBees 3D Container*).
* **Firma / Magic Header:** `JB3D` (0x4A, 0x42, 0x33, 0x44) en lugar de `glTF`.
* **Cifrado Simétrico:** **AES-256-CTR** con vector de inicialización criptográfico (IV) único por archivo y derivación de clave vía SHA-256.
* **Incompatibilidad con Software Externo:** Si alguien descarga un archivo `.jb3d` o lo renombra a `.glb`:
  * **Blender:** Rechaza el archivo (*"Invalid or corrupted glTF signature"*).
  * **Windows 3D Viewer / macOS Preview:** Error de formato no reconocido.
  * **Visores Web (Three.js Editor, Don McCurdy viewer):** Error fatal al no encontrar el chunk glTF.
  * **Extensiones y Scrapers:** No detectan los assets en la red porque la extensión ya no es `.glb` ni el content-type es `model/gltf-binary`.

---

### 2. Descifrado en Memoria RAM (`useSecureGLTF` & `Web Crypto API`)
* **Ubicación:** [`utils/useSecureGLTF.ts`](file:///c:/Projects/Jarbees_the_game/utils/useSecureGLTF.ts) y [`utils/assetSecurity.ts`](file:///c:/Projects/Jarbees_the_game/utils/assetSecurity.ts).
* Cuando el juego solicita un modelo (ej. `/models/bee.jb3d`), se descarga el binario cifrado a un `ArrayBuffer`.
* El buffer se descifra en memoria viva (RAM) en ~3 milisegundos mediante la aceleración por hardware de `window.crypto.subtle`.
* El buffer descifrado se entrega directamente a `GLTFLoader.parse()`.
* **Seguridad:** El archivo descifrado **nunca se guarda en el disco**, **nunca genera una URL Blob persistente** y es recolectado por el Garbage Collector una vez Three.js crea las mallas y geometrías.

---

### 3. Aislamiento en Git y Repositorio Público
* Los modelos originales maestros sin cifrar residen en la carpeta local:
  ```
  /assets_source/models/
  ```
* La carpeta `/assets_source/` está explícitamente ignorada en [`.gitignore`](file:///c:/Projects/Jarbees_the_game/.gitignore).
* En el repositorio público de GitHub y en la carpeta `/public/models/` **SOLO existen los archivos cifrados `.jb3d`**. Nadie puede clonar el repositorio ni navegar en GitHub para descargar los `.glb` originales.

---

## 🛠️ Flujo de Trabajo para el Desarrollador

### ¿Cómo agregar o actualizar modelos 3D?
1. Coloca tu nuevo modelo `.glb` (o versión modificada de Blender) en:
   ```
   assets_source/models/
   ```
2. Ejecuta el comando en tu terminal:
   ```bash
   npm run protect-models
   ```
3. El script automáticamente:
   - Validará la cabecera `glTF`.
   - Cifrará el modelo en AES-256-CTR.
   - Generará el archivo `.jb3d` correspondiente en `public/models/`.
   - Eliminará cualquier `.glb` sin cifrar de `public/models/` para evitar fugas.

---

## 📦 Modelos Protegidos en Producción

| Modelo | Original | Contenedor Seguro | Estado |
| :--- | :--- | :--- | :--- |
| Abeja jugadora | `bee.glb` (4.17 MB) | `bee.jb3d` | Protegido ✅ |
| Mariposa ambiental | `butterfly.glb` (14.98 MB) | `butterfly.jb3d` | Protegido ✅ |
| Colibrí ambiental | `colibri.glb` (23.52 MB) | `colibri.jb3d` | Protegido ✅ |
| Jarbee Robot | `jarbee_robot.glb` (4.17 MB) | `jarbee_robot.jb3d` | Protegido ✅ |
| Jarbee Robot (Draco) | `jarbee_robot.draco.glb` (2.64 MB) | `jarbee_robot.draco.jb3d` | Protegido ✅ |
| Árbol 1 | `tree1.glb` (18.41 MB) | `tree1.jb3d` | Protegido ✅ |
| Árbol 2 | `tree2.glb` (13.79 MB) | `tree2.jb3d` | Protegido ✅ |
| Árbol 3 | `tree3.glb` (15.20 MB) | `tree3.jb3d` | Protegido ✅ |

---

## ⚖️ Defensa Legal
Este sistema técnico se complementa con la licencia restrictiva en [`LICENSE_ASSETS`](file:///c:/Projects/Jarbees_the_game/LICENSE_ASSETS) (*All Rights Reserved*), que prohíbe explícitamente la redistribución, copia o uso derivado de los modelos, facultando la emisión inmediata de reclamaciones DMCA en caso de apropiación indebida.
