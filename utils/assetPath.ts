/**
 * Helper de resolución de rutas de assets para JarBees: The Game.
 * Garantiza que modelos 3D (.glb), audios (.wav/.mp3) e imágenes
 * nunca den error 404 ni en localhost, ni en Vercel, ni en GitHub Pages
 * (donde la aplicación se hospeda bajo el subdirectorio /Jarbees_the_game).
 */

export function getAssetPath(path: string): string {
  if (!path) return ''

  // URLs absolutas o data URIs no se modifican
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path
  }

  // Asegurar barra diagonal inicial normalizada
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // 1. Variable de entorno configurada en tiempo de compilación (ej: GitHub Actions / Next.js)
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  if (envBasePath) {
    const trimmedBase = envBasePath.endsWith('/') ? envBasePath.slice(0, -1) : envBasePath
    if (cleanPath.startsWith(trimmedBase)) {
      return cleanPath
    }
    return `${trimmedBase}${cleanPath}`
  }

  // 2. Detección dinámica en el navegador (GitHub Pages o subdirectorios)
  if (typeof window !== 'undefined') {
    const { pathname, hostname } = window.location

    // Si la URL actual contiene /Jarbees_the_game (ej: ifernandez89.github.io/Jarbees_the_game/...)
    const repoMatch = pathname.match(/^\/([^/]+)/)
    if (repoMatch) {
      const firstSegment = repoMatch[1]
      const isGithubRepo =
        firstSegment.toLowerCase() === 'jarbees_the_game' ||
        hostname.endsWith('github.io')

      if (isGithubRepo) {
        const repoPrefix = `/${firstSegment}`
        // Evitar duplicar el prefijo si ya está presente
        if (cleanPath.startsWith(repoPrefix)) {
          return cleanPath
        }
        return `${repoPrefix}${cleanPath}`
      }
    }
  }

  return cleanPath
}
