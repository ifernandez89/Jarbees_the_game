/**
 * JarBees 3D Asset Security - In-Memory Decryption Module
 *
 * Desempaqueta y descifra contenedores protegidos .jb3d en memoria (RAM)
 * utilizando Web Crypto API acelerada por hardware.
 * El archivo descifrado nunca toca el disco ni se expone como URL pública de descarga.
 */

const VAULT_SALT = 'Jarbees:TheGame:ProtectedAsset:2026'
const VAULT_SECRET = 'JarbeesFlightSim_BeeMesh_SecureSignature_v1'

// Cache de la clave de descifrado importada en SubtleCrypto
let cachedCryptoKey: CryptoKey | null = null

/**
 * Deriva e importa la clave AES-CTR de 256 bits para Web Crypto API
 */
async function getDecryptionKey(subtle: SubtleCrypto): Promise<CryptoKey> {
  if (cachedCryptoKey) {
    return cachedCryptoKey
  }

  const enc = new TextEncoder()
  const keyMaterial = enc.encode(VAULT_SECRET + VAULT_SALT)
  const keyHash = await subtle.digest('SHA-256', keyMaterial)

  cachedCryptoKey = await subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-CTR' },
    false,
    ['decrypt']
  )

  return cachedCryptoKey
}

/**
 * Descifra un buffer binario en formato JB3D a su ArrayBuffer glTF original.
 * Si el buffer ya es un glTF/GLB estándar (comienza con 'glTF'), se devuelve tal cual.
 */
export async function decryptJB3D(data: ArrayBuffer): Promise<ArrayBuffer> {
  if (!data || data.byteLength < 4) {
    throw new Error('Asset de modelo 3D inválido o vacío')
  }

  const bytes = new Uint8Array(data)

  // 1. Detección de glTF sin cifrar (magic: "glTF" -> 0x67, 0x6C, 0x54, 0x46)
  if (
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  ) {
    // Es un GLB sin cifrar (compatibilidad de desarrollo)
    return data
  }

  // 2. Validación de cabecera JB3D ('J', 'B', '3', 'D' -> 0x4A, 0x42, 0x33, 0x44)
  const isJB3D =
    bytes[0] === 0x4a &&
    bytes[1] === 0x42 &&
    bytes[2] === 0x33 &&
    bytes[3] === 0x44

  if (!isJB3D) {
    throw new Error(
      'Firma de archivo 3D inválida. No es un contenedor .jb3d protegido ni un modelo .glb estándar.'
    )
  }

  if (data.byteLength < 30) {
    throw new Error('Contenedor JB3D corrupto: tamaño menor a la cabecera mínima requerida.')
  }

  const version = bytes[4]
  if (version !== 1) {
    throw new Error(`Versión de contenedor JB3D incompatible: ${version}`)
  }

  // IV de 16 bytes (offset 6..21)
  const iv = bytes.subarray(6, 22)

  // Payload cifrado (offset 30..N)
  const ciphertext = bytes.subarray(30)

  // Obtener instancia de SubtleCrypto
  const cryptoObj =
    typeof window !== 'undefined'
      ? window.crypto
      : typeof globalThis !== 'undefined'
      ? globalThis.crypto
      : null

  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error(
      'Web Crypto API no disponible en este entorno. Se requiere contexto seguro (HTTPS o localhost).'
    )
  }

  const cryptoKey = await getDecryptionKey(cryptoObj.subtle)

  const decryptedBuffer = await cryptoObj.subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: iv,
      length: 64,
    },
    cryptoKey,
    ciphertext
  )

  return decryptedBuffer
}
