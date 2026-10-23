/**
 * ProceduralTerrainMaterial - Material que cambia según altitud y pendiente
 * 
 * Características:
 * - Nieve en cimas (>4000m)
 * - Roca en montañas (2000-4000m)
 * - Hierba en valles (<2000m)
 * - Transiciones suaves entre materiales
 * - Pendiente afecta el material (acantilados = roca)
 */

import * as THREE from 'three'

export interface TerrainMaterialConfig {
  // Elevaciones de transición (metros)
  grassMaxElevation: number  // Hasta dónde llega hierba (default: 2000)
  rockMinElevation: number   // Desde dónde empieza roca (default: 1800)
  snowMinElevation: number   // Desde dónde empieza nieve (default: 3500)
  snowMaxElevation: number   // Nieve permanente (default: 4000)
  
  // Pendientes (grados)
  flatThreshold: number      // Ángulo para terreno plano (default: 20)
  steepThreshold: number     // Ángulo para acantilados (default: 45)
  
  // Colores
  grassColor: THREE.Color
  rockColor: THREE.Color
  snowColor: THREE.Color
  sandColor: THREE.Color
  
  // Propiedades físicas
  roughness: number
  metalness: number
}

/**
 * Crea material procedural para terreno
 */
export class ProceduralTerrainMaterial extends THREE.ShaderMaterial {
  constructor(config: Partial<TerrainMaterialConfig> = {}) {
    const fullConfig: TerrainMaterialConfig = {
      grassMaxElevation: 2000,
      rockMinElevation: 1800,
      snowMinElevation: 3500,
      snowMaxElevation: 4000,
      flatThreshold: 20,
      steepThreshold: 45,
      grassColor: new THREE.Color(0x7CFC00),
      rockColor: new THREE.Color(0x808080),
      snowColor: new THREE.Color(0xFFFFFF),
      sandColor: new THREE.Color(0xC2B280),
      roughness: 0.9,
      metalness: 0.0,
      ...config
    }

    // Uniforms para el shader
    const uniforms = {
      grassMaxElevation: { value: fullConfig.grassMaxElevation },
      rockMinElevation: { value: fullConfig.rockMinElevation },
      snowMinElevation: { value: fullConfig.snowMinElevation },
      snowMaxElevation: { value: fullConfig.snowMaxElevation },
      flatThreshold: { value: Math.cos(THREE.MathUtils.degToRad(fullConfig.flatThreshold)) },
      steepThreshold: { value: Math.cos(THREE.MathUtils.degToRad(fullConfig.steepThreshold)) },
      grassColor: { value: fullConfig.grassColor },
      rockColor: { value: fullConfig.rockColor },
      snowColor: { value: fullConfig.snowColor },
      sandColor: { value: fullConfig.sandColor },
      lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    }

    super({
      uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      lights: true,
    })
  }

  /**
   * Actualiza dirección de luz
   */
  setLightDirection(direction: THREE.Vector3): void {
    this.uniforms.lightDirection.value.copy(direction).normalize()
  }
}

/**
 * Vertex Shader
 */
const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Fragment Shader
 */
const fragmentShader = `
  uniform float grassMaxElevation;
  uniform float rockMinElevation;
  uniform float snowMinElevation;
  uniform float snowMaxElevation;
  uniform float flatThreshold;
  uniform float steepThreshold;
  
  uniform vec3 grassColor;
  uniform vec3 rockColor;
  uniform vec3 snowColor;
  uniform vec3 sandColor;
  uniform vec3 lightDirection;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  // Función de mezcla suave
  float smoothBlend(float value, float min, float max) {
    return smoothstep(min, max, value);
  }
  
  void main() {
    float elevation = vWorldPosition.y;
    vec3 normal = normalize(vNormal);
    
    // Calcular pendiente (dot con vector up)
    float slope = dot(normal, vec3(0.0, 1.0, 0.0));
    
    // Inicializar color base
    vec3 baseColor = grassColor;
    
    // --- Lógica de Material por Elevación ---
    
    // Zona baja: Sand/Grass
    if (elevation < rockMinElevation) {
      float grassFactor = smoothBlend(elevation, 0.0, grassMaxElevation);
      baseColor = mix(sandColor, grassColor, grassFactor);
    }
    
    // Zona media: Rock
    else if (elevation < snowMinElevation) {
      float rockFactor = smoothBlend(elevation, rockMinElevation, snowMinElevation);
      baseColor = mix(grassColor, rockColor, rockFactor);
    }
    
    // Zona alta: Snow
    else {
      float snowFactor = smoothBlend(elevation, snowMinElevation, snowMaxElevation);
      baseColor = mix(rockColor, snowColor, snowFactor);
    }
    
    // --- Modificación por Pendiente ---
    
    // En pendientes pronunciadas, siempre roca
    if (slope < steepThreshold) {
      float steepFactor = smoothBlend(slope, steepThreshold - 0.2, steepThreshold);
      baseColor = mix(rockColor, baseColor, steepFactor);
    }
    
    // --- Iluminación Simple ---
    
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float ambient = 0.3;
    float lighting = ambient + diffuse * 0.7;
    
    vec3 finalColor = baseColor * lighting;
    
    // Agregar variación procedural (simple noise)
    float noise = fract(sin(dot(vWorldPosition.xz, vec2(12.9898, 78.233))) * 43758.5453);
    finalColor *= 0.9 + noise * 0.1;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

/**
 * Material simplificado basado en MeshStandardMaterial
 * Alternativa más rápida sin shaders custom
 */
export class SimpleProceduralMaterial {
  static create(elevation: number = 0): THREE.MeshStandardMaterial {
    let color: number
    
    if (elevation < 1000) {
      color = 0x7CFC00 // Hierba verde
    } else if (elevation < 2500) {
      color = 0x8B7355 // Tierra marrón
    } else if (elevation < 4000) {
      color = 0x808080 // Roca gris
    } else {
      color = 0xFFFFFF // Nieve blanca
    }
    
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false,
    })
  }
  
  /**
   * Crea material interpolado según elevación
   */
  static createInterpolated(
    minElevation: number,
    maxElevation: number
  ): THREE.MeshStandardMaterial {
    const avgElevation = (minElevation + maxElevation) / 2
    return this.create(avgElevation)
  }
}

/**
 * Factory para crear materiales según configuración de calidad
 */
export class TerrainMaterialFactory {
  static create(
    quality: 'low' | 'medium' | 'high' | 'ultra',
    config?: Partial<TerrainMaterialConfig>
  ): THREE.Material {
    switch (quality) {
      case 'low':
        // Material simple sin shaders
        return SimpleProceduralMaterial.create()
      
      case 'medium':
        // Material procedural básico
        return new ProceduralTerrainMaterial(config)
      
      case 'high':
      case 'ultra':
        // Material procedural completo
        return new ProceduralTerrainMaterial({
          ...config,
          // Configuración mejorada para alta calidad
          roughness: 0.95,
        })
      
      default:
        return SimpleProceduralMaterial.create()
    }
  }
}
