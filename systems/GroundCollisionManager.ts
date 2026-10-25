import * as THREE from 'three'

let groundCollider: THREE.Object3D | null = null
const raycaster = new THREE.Raycaster()
const downDir = new THREE.Vector3(0, -1, 0)
const rayOrigin = new THREE.Vector3()

/**
 * Registra el modelo 3D activo como colisionador de suelo para raycasting
 */
export function setGroundCollider(obj: THREE.Object3D | null) {
  groundCollider = obj
}

export function getGroundCollider(): THREE.Object3D | null {
  return groundCollider
}

/**
 * Calcula con precisión milimétrica la altura real del suelo o superficie
 * (suelo, mesas, camas, cajas, escaleras, aceras, túneles y habitaciones interiores).
 * 
 * Tolerancia calibrada para soportar:
 * 1. CAMINAR EN TÚNELES Y HABITACIONES:
 *    Cuando el jugador camina (isGrounded = true), el rayo se lanza desde la altura de las rodillas / muslos
 *    (footY + 0.55m) apuntando hacia abajo.
 *    Cualquier techo de túnel o cielo raso (generalmente a >= 1.8m del piso) queda muy por encima
 *    del origen del rayo, evitando 100% que el personaje se teletransporte o "suba" al techo.
 * 
 * 2. CAMINAR EN SUPERFICIES ELEVADAS (Rats / Cajas / Mesas / Camas / Techos):
 *    Al estar sobre una mesa (12.45m), cama o puente, el rayo detecta de forma inmediata y sólida la superficie
 *    debajo de los pies sin filtrar por normales invertidas de BSP antiguo.
 * 
 * 3. DESPEGUE / CAÍDA / ATERRIZAJE (isGrounded = false):
 *    Al caer o volar bajo, detecta el primer suelo por debajo de los pies (footY + 0.35m) para aterrizar
 *    de forma suave y natural sobre cualquier piso o plataforma elevada.
 */
export function getGroundHeight(
  x: number,
  currentY: number,
  z: number,
  fallback = 1.22,
  isGrounded = false
): number {
  if (!groundCollider) return fallback

  const footY = currentY - 1.05

  // En modo caminar, originY se sitúa a 55cm del suelo (altura de rodilla / peldaño máximo de escalera).
  // Esto garantiza que cualquier techo de túnel (que siempre está a >1.8m del suelo) NUNCA sea alcanzado por el rayo.
  // En modo vuelo / caída, se proyecta desde el torso/cabeza para localizar superficies inferiores donde posarse.
  const originY = isGrounded ? footY + 0.55 : currentY + 0.50
  const maxAllowedY = isGrounded ? footY + 0.50 : footY + 0.35

  rayOrigin.set(x, originY, z)
  raycaster.set(rayOrigin, downDir)
  raycaster.far = 250.0

  const hits = raycaster.intersectObject(groundCollider, true)
  if (hits && hits.length > 0) {
    for (const hit of hits) {
      if (hit.point.y <= maxAllowedY) {
        return hit.point.y
      }
    }
    // Si está en vuelo y cayendo desde gran altura, tomar el primer impacto debajo del origen
    if (!isGrounded && hits[0].point.y <= originY) {
      return hits[0].point.y
    }
  }

  return fallback
}
