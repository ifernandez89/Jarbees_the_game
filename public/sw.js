// JarBees: The Game - Service Worker
const CACHE_NAME = 'jarbees-game-v6'

const PRECACHE_ASSETS = [
  './',
  './game',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/jarbees_game_logo.png',
  './models/bee.jb3d',
  './models/colibri.jb3d',
  './models/butterfly.jb3d',
  './models/iron_man.jb3d',
  './audio/bee_buzz.wav',
  './audio/colibri_flutter.wav',
  './audio/butterfly_flutter.wav',
  './audio/iron_man_thruster.wav',
  './audio/auren_flight.wav',
  './audio/ambient_music.wav',
  './audio/wind_loop.wav'
]

// Instalación: precarga de assets críticos del juego
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Nota en precache inicial de SW:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activación: limpieza de cachés antiguos y reclamar clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Estrategia de Fetch:
// - Para assets estáticos (_next, models, audio, icons): Cache First con fallback a Network
// - Para navegación HTML: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar solicitudes GET del mismo origen
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return
  }

  // 1. Assets estáticos (3D, audio, imágenes, chunks compilados)
  if (
    url.pathname.includes('/_next/') ||
    url.pathname.includes('/models/') ||
    url.pathname.includes('/audio/') ||
    url.pathname.includes('/icons/') ||
    url.pathname.endsWith('.glb') ||
    url.pathname.endsWith('.jb3d') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        })
      })
    )
    return
  }

  // 2. Navegación (páginas HTML): Network First con fallback a caché
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          return caches.match('./')
        })
      })
  )
})
