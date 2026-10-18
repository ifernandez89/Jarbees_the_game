'use client'

import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib'
import { useLoader } from '@react-three/fiber'
import { decryptJB3D } from '@/utils/assetSecurity'
import type { GLTF } from 'three-stdlib'

let dracoLoader: DRACOLoader | null = null
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'

function extensions(
  useDraco: boolean | string = true,
  useMeshopt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) {
  return (loader: GLTFLoader) => {
    if (extendLoader) {
      extendLoader(loader)
    }
    if (useDraco) {
      if (!dracoLoader) {
        dracoLoader = new DRACOLoader()
      }
      dracoLoader.setDecoderPath(typeof useDraco === 'string' ? useDraco : decoderPath)
      loader.setDRACOLoader(dracoLoader)
    }
    if (useMeshopt) {
      loader.setMeshoptDecoder(
        typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder
      )
    }
  }
}

/**
 * Loader seguro que descifra los modelos protegidos .jb3d en memoria (RAM)
 * antes de que GLTFLoader procese la geometría, esqueletos, materiales y animaciones.
 */
export class SecureGLTFLoader extends GLTFLoader {
  load(
    url: string,
    onLoad: (data: GLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void {
    const resourcePath = this.resourcePath || url.slice(0, url.lastIndexOf('/') + 1)

    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status} cargando modelo: ${url}`)
        }
        const rawBuffer = await response.arrayBuffer()
        // Descifrado instantáneo en RAM mediante Web Crypto API
        const gltfBuffer = await decryptJB3D(rawBuffer)

        this.parse(
          gltfBuffer,
          resourcePath,
          (gltf) => {
            onLoad(gltf)
          },
          (error) => {
            if (onError) onError(error as any)
          }
        )
      })
      .catch((err) => {
        if (onError) onError(err as any)
      })
  }
}

/**
 * Hook React Three Fiber seguro equivalente a useGLTF, compatible con .jb3d y .glb
 */
export const useSecureGLTF = (
  path: string,
  useDraco: boolean | string = true,
  useMeshopt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
): GLTF => {
  return useLoader(
    SecureGLTFLoader as any,
    path,
    extensions(useDraco, useMeshopt, extendLoader)
  ) as GLTF
}

useSecureGLTF.preload = (
  path: string,
  useDraco: boolean | string = true,
  useMeshopt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) => {
  return useLoader.preload(
    SecureGLTFLoader as any,
    path,
    extensions(useDraco, useMeshopt, extendLoader)
  )
}

useSecureGLTF.clear = (path: string) => {
  return useLoader.clear(SecureGLTFLoader as any, path)
}

useSecureGLTF.setDecoderPath = (path: string) => {
  decoderPath = path
}
