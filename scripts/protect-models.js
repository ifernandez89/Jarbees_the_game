/**
 * JarBees 3D Asset Protection System
 *
 * Convierte los modelos 3D originales (.glb) en contenedores cifrados (.jb3d).
 * Los archivos .jb3d resultantes:
 *  - NO pueden ser abiertos por Blender, 3ds Max, Maya ni visores online.
 *  - NO tienen cabecera glTF, impidiendo que extensiones o extractores automáticos los detecten.
 *  - Solo el juego en ejecución puede descifrarlos en memoria (RAM) a través de Web Crypto API.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Claves de derivación simétrica para la bóveda de assets
const VAULT_SALT = 'Jarbees:TheGame:ProtectedAsset:2026';
const VAULT_SECRET = 'JarbeesFlightSim_BeeMesh_SecureSignature_v1';

function deriveVaultKey() {
  return crypto.createHash('sha256').update(VAULT_SECRET + VAULT_SALT).digest();
}

const SOURCE_DIR = path.resolve(__dirname, '../assets_source/models');
const TARGET_DIR = path.resolve(__dirname, '../public/models');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function protectGLBFile(sourcePath, targetPath) {
  const originalBuffer = fs.readFileSync(sourcePath);

  // Validar cabecera glTF ("glTF" = 0x46546C67)
  const isGLTF = originalBuffer.length >= 4 && originalBuffer.slice(0, 4).toString('ascii') === 'glTF';
  if (!isGLTF) {
    console.warn(`⚠️ [SKIP] ${path.basename(sourcePath)} no contiene una cabecera glTF válida.`);
    return null;
  }

  const key = deriveVaultKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  const encryptedPayload = Buffer.concat([cipher.update(originalBuffer), cipher.final()]);

  // Contenedor JB3D:
  // [0..3]: Magic 'JB3D'
  // [4]: Versión (1)
  // [5]: Flags (0)
  // [6..21]: IV (16 bytes)
  // [22..29]: Tamaño original (BigUInt64BE)
  // [30..N]: Payload cifrado
  const header = Buffer.alloc(30);
  header.write('JB3D', 0, 4, 'ascii');
  header.writeUInt8(1, 4);
  header.writeUInt8(0, 5);
  iv.copy(header, 6, 0, 16);
  header.writeBigUInt64BE(BigInt(originalBuffer.length), 22);

  const container = Buffer.concat([header, encryptedPayload]);

  ensureDirectoryExistence(targetPath);
  fs.writeFileSync(targetPath, container);

  return {
    name: path.basename(sourcePath),
    originalSize: (originalBuffer.length / (1024 * 1024)).toFixed(2) + ' MB',
    protectedSize: (container.length / (1024 * 1024)).toFixed(2) + ' MB',
    targetFile: path.basename(targetPath),
  };
}

function processDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Directorio de origen no encontrado: ${sourceDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);
    if (entry.isDirectory()) {
      const subResults = processDirectory(srcPath, path.join(targetDir, entry.name));
      results.push(...subResults);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.glb')) {
        const outName = entry.name.replace(/\.glb$/, '.jb3d');
        const dstPath = path.join(targetDir, outName);
        const res = protectGLBFile(srcPath, dstPath);
        if (res) results.push(res);
      } else if (entry.name.endsWith('.json')) {
        // Copiar metadatos no binarios si los hay
        const dstPath = path.join(targetDir, entry.name);
        ensureDirectoryExistence(dstPath);
        fs.copyFileSync(srcPath, dstPath);
      }
    }
  }

  return results;
}

function cleanPublicGLB(targetDir) {
  if (!fs.existsSync(targetDir)) return;
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      cleanPublicGLB(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.glb')) {
      const correspondingJB3D = fullPath.replace(/\.glb$/, '.jb3d');
      if (fs.existsSync(correspondingJB3D)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️  Eliminado GLB público no protegido: ${path.relative(TARGET_DIR, fullPath)}`);
      }
    }
  }
}

console.log('🔒 ==========================================');
console.log('🛡️  JarBees 3D Asset Encryption & Protection');
console.log('🔒 ==========================================\n');

const results = processDirectory(SOURCE_DIR, TARGET_DIR);

console.table(results);
console.log(`\n✅ ${results.length} modelos protegidos con éxito en formato .jb3d.`);
console.log('📦 Contenedores guardados en /public/models/\n');

console.log('🧹 Limpiando archivos .glb sin cifrar de /public/models/ ...');
cleanPublicGLB(TARGET_DIR);
console.log('✨ Carpeta pública saneada: solo contiene contenedores protegidos .jb3d.\n');
