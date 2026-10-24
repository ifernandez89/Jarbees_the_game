import * as THREE from 'three'

/**
 * Aurelium Phase Veil (Velo de Fase Cuántico de Auren)
 * 
 * Shader Injection para Three.js MeshStandardMaterial que implementa:
 * 1. Screen-Door Dithering (Matriz de Bayer 4x4) + Ruido 3D Procedural en coordenadas locales (vAureliumLocalPos).
 *    Mantiene depthWrite: true sin bugs de Z-sorting ni inversión de mallas.
 * 2. Pulso Hex-Core fotónico que nace en el pecho (y ≈ 0.88 en espacio local) y viaja por la armadura.
 * 3. Contorno Nacarado / Iridiscente (Fresnel Cuántico):
 *    Fresnel = pow(1.0 - max(0.0, n · v), 3.5) modulado con paleta espectral Cian -> Nácar Perlado.
 * 4. Reactividad biomecánica al estado:
 *    - Quieto: 94% de camuflaje cuántico, micro-shimmer en aristas.
 *    - Caminando: Interferencia sutil en extremidades.
 *    - Sprint 55 km/h: Arrastre cinético de viento perturba el campo (+30% visibilidad, chispas fotónicas).
 *    - Vuelo Supersónico: Estela de ionización cuántica.
 *    - Daño / Flinch: Ruptura dieléctrica violenta y retorno al velo.
 */

export interface AureliumPhaseUniforms {
  uAureliumVeil: { value: number }
  uAureliumTime: { value: number }
  uAureliumPulseProgress: { value: number }
  uAureliumDisturbance: { value: number }
  uAureliumColorPrimary: { value: THREE.Color }
  uAureliumColorSecondary: { value: THREE.Color }
}

export function createAureliumPhaseUniforms(): AureliumPhaseUniforms {
  return {
    uAureliumVeil: { value: 0.0 },
    uAureliumTime: { value: 0.0 },
    uAureliumPulseProgress: { value: 0.0 },
    uAureliumDisturbance: { value: 0.0 },
    uAureliumColorPrimary: { value: new THREE.Color('#55F0FF') },
    uAureliumColorSecondary: { value: new THREE.Color('#F8FAFC') },
  }
}

/**
 * Inyecta el shader del Velo de Fase en un material Three.js mediante onBeforeCompile.
 */
export function injectAureliumPhaseVeil(
  material: THREE.Material,
  uniforms: AureliumPhaseUniforms
) {
  const mat = material as THREE.MeshStandardMaterial
  mat.customProgramCacheKey = () => 'aurelium_phase_veil_v1'

  const prevOnBeforeCompile = mat.onBeforeCompile

  mat.onBeforeCompile = (shader, renderer) => {
    if (prevOnBeforeCompile) {
      prevOnBeforeCompile(shader, renderer)
    }

    // Vincular uniforms compartidos
    shader.uniforms.uAureliumVeil = uniforms.uAureliumVeil
    shader.uniforms.uAureliumTime = uniforms.uAureliumTime
    shader.uniforms.uAureliumPulseProgress = uniforms.uAureliumPulseProgress
    shader.uniforms.uAureliumDisturbance = uniforms.uAureliumDisturbance
    shader.uniforms.uAureliumColorPrimary = uniforms.uAureliumColorPrimary
    shader.uniforms.uAureliumColorSecondary = uniforms.uAureliumColorSecondary

    // Inyección en Vertex Shader
    shader.vertexShader = `
      varying vec3 vAureliumLocalPos;
      varying vec3 vAureliumWorldPos;
      varying vec3 vAureliumNormal;
      ${shader.vertexShader}
    `

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vAureliumLocalPos = position;
      vAureliumNormal = normalize(normalMatrix * normal);
      vAureliumWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      `
    )

    // Inyección en Fragment Shader
    shader.fragmentShader = `
      varying vec3 vAureliumLocalPos;
      varying vec3 vAureliumWorldPos;
      varying vec3 vAureliumNormal;

      uniform float uAureliumVeil;
      uniform float uAureliumTime;
      uniform float uAureliumPulseProgress;
      uniform float uAureliumDisturbance;
      uniform vec3 uAureliumColorPrimary;
      uniform vec3 uAureliumColorSecondary;

      // Matriz de Bayer 4x4 normalizada [0..1] para Screen-Door Dithering
      float aurenBayer4x4(vec2 p) {
        int x = int(mod(p.x, 4.0));
        int y = int(mod(p.y, 4.0));
        int idx = x + y * 4;
        float b[16] = float[16](
           0.0 / 16.0,  8.0 / 16.0,  2.0 / 16.0, 10.0 / 16.0,
          12.0 / 16.0,  4.0 / 16.0, 14.0 / 16.0,  6.0 / 16.0,
           3.0 / 16.0, 11.0 / 16.0,  1.0 / 16.0,  9.0 / 16.0,
          15.0 / 16.0,  7.0 / 16.0, 13.0 / 16.0,  5.0 / 16.0
        );
        return b[idx];
      }

      // Generador de ruido hash 3D procedural anclado a coordenadas locales de armadura
      float aurenHash3(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float aurenNoise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(aurenHash3(i + vec3(0.0,0.0,0.0)), aurenHash3(i + vec3(1.0,0.0,0.0)), f.x),
              mix(aurenHash3(i + vec3(0.0,1.0,0.0)), aurenHash3(i + vec3(1.0,1.0,0.0)), f.x), f.y),
          mix(mix(aurenHash3(i + vec3(0.0,0.0,1.0)), aurenHash3(i + vec3(1.0,0.0,1.0)), f.x),
              mix(aurenHash3(i + vec3(0.0,1.0,1.0)), aurenHash3(i + vec3(1.0,1.0,1.0)), f.x), f.y),
          f.z
        );
      }

      ${shader.fragmentShader}
    `

    // Early discard para Screen-Door Dithering & Pulso Hex-Core
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `
      #include <clipping_planes_fragment>

      // Onda esférica de activación desde el Hex-Core del pecho (y ≈ 0.88, z ≈ 0.10)
      vec3 aurenChestCenter = vec3(0.0, 0.88, 0.10);
      float aurenDistFromChest = length(vAureliumLocalPos - aurenChestCenter);
      float aurenWaveFront = uAureliumPulseProgress * 2.4;
      float aurenWaveDist = abs(aurenDistFromChest - aurenWaveFront);
      float aurenPulseIntensity = smoothstep(0.24, 0.0, aurenWaveDist) *
                                  smoothstep(0.0, 0.15, uAureliumPulseProgress) *
                                  smoothstep(1.0, 0.70, uAureliumPulseProgress);

      // Contorno Nacarado Cuántico (Fresnel)
      vec3 aurenViewDir = normalize(cameraPosition - vAureliumWorldPos);
      float aurenViewDot = max(0.0, dot(aurenViewDir, normalize(vAureliumNormal)));
      float aurenFresnel = pow(1.0 - aurenViewDot, 3.5);

      if (uAureliumVeil > 0.005) {
        // En reposo: hasta 94% de disolución cuántica.
        // En sprint / disturbio: la silueta es un 30% más visible debido al arrastre de aire.
        float maxVeil = 0.94 - uAureliumDisturbance * 0.28;
        float targetThreshold = uAureliumVeil * maxVeil;

        // Estructura microcelular hexagonal local + dither de Bayer en pantalla
        float nanoCell = aurenNoise3(vAureliumLocalPos * 18.0) * 0.65 +
                         aurenNoise3(vAureliumLocalPos * 42.0 + 2.5) * 0.35;
        float dither = aurenBayer4x4(gl_FragCoord.xy);
        float shimmer = sin(uAureliumTime * 8.0 + vAureliumLocalPos.y * 24.0) * 0.04;
        float dissolveMetric = nanoCell * 0.65 + dither * 0.35 + shimmer;

        bool isPulseFront = aurenPulseIntensity > 0.28;
        // Borde tangencial cuántico preservado parcialmente para silueta legible
        bool isRimPreserved = aurenFresnel > 0.70 && (dither > 0.32);

        if (dissolveMetric < targetThreshold && !isPulseFront) {
          if (!isRimPreserved) {
            discard;
          }
        }
      }
      `
    )

    // Inyección de emisión fotónica y Fresnel Nacarado
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>

      if (uAureliumVeil > 0.005 || uAureliumPulseProgress > 0.005) {
        // Paleta espectral: Cian translúcido (#55F0FF) hacia Blanco Nacarado Perlado (#F8FAFC)
        vec3 fresnelColor = mix(uAureliumColorPrimary, uAureliumColorSecondary, pow(aurenFresnel, 1.8));

        // Resplandor de contorno cuántico proporcional a Fresnel y Velo
        vec3 phaseEmission = fresnelColor * aurenFresnel * (2.2 + uAureliumDisturbance * 2.8) * uAureliumVeil;

        // Frente de choque luminoso del pulso Hex-Core (pecho a extremidades)
        phaseEmission += uAureliumColorPrimary * aurenPulseIntensity * 4.8;

        // Micro-chispas de fricción cinética al correr a 55 km/h
        if (uAureliumDisturbance > 0.15) {
          float spark = step(0.92, aurenHash3(vAureliumLocalPos * 60.0 + uAureliumTime * 12.0));
          phaseEmission += uAureliumColorPrimary * spark * 2.5 * uAureliumDisturbance;
        }

        gl_FragColor.rgb += phaseEmission;
      }
      `
    )
  }

  mat.needsUpdate = true
}

/**
 * Controlador de física y estados del Velo de Fase para actualizar en useFrame.
 */
export class AureliumPhaseController {
  uniforms: AureliumPhaseUniforms
  currentVeil = 0.0
  targetVeil = 0.0
  pulseTimer = 0.0
  isPulsing = false
  currentDisturbance = 0.0

  constructor() {
    this.uniforms = createAureliumPhaseUniforms()
  }

  /**
   * Actualiza el estado del velo en cada cuadro.
   * @param dt Delta time en segundos
   * @param params Parámetros de telemetría y estado de combate
   */
  update(
    dt: number,
    params: {
      isActive: boolean
      isGroundSprint: boolean
      isFlying: boolean
      forwardSpeed: number
      hasDamageOrFlinch: boolean
    }
  ) {
    const prevTarget = this.targetVeil
    this.targetVeil = params.isActive ? 1.0 : 0.0

    // Si cambia el estado objetivo, detonar pulso Hex-Core esférico
    if (this.targetVeil !== prevTarget) {
      this.isPulsing = true
      this.pulseTimer = 0.0
    }

    // Progresión del pulso Hex-Core (dura ~0.65 segundos)
    if (this.isPulsing) {
      this.pulseTimer += dt / 0.65
      if (this.pulseTimer >= 1.0) {
        this.pulseTimer = 1.0
        this.isPulsing = false
      }
      this.uniforms.uAureliumPulseProgress.value = this.pulseTimer
    } else {
      this.uniforms.uAureliumPulseProgress.value = 0.0
    }

    // Transición suave de disolución del velo
    const veilRate = this.targetVeil > this.currentVeil ? 3.8 : 4.5
    this.currentVeil = THREE.MathUtils.damp(this.currentVeil, this.targetVeil, veilRate, dt)
    this.uniforms.uAureliumVeil.value = this.currentVeil

    // Calcular perturbación según movimiento y daño:
    // - Quieto: 0.0
    // - Sprint terrestre 55 km/h: ~0.35 - 0.40
    // - Vuelo a alta velocidad: ~0.45
    // - Daño / Flinch: 1.0 pico violento
    let targetDisturbance = 0.0
    if (params.hasDamageOrFlinch) {
      targetDisturbance = 1.0
    } else if (params.isGroundSprint) {
      const speedNorm = Math.min(1.0, Math.abs(params.forwardSpeed) / 15.2)
      targetDisturbance = 0.32 * speedNorm
    } else if (params.isFlying) {
      const flyNorm = Math.min(1.0, Math.abs(params.forwardSpeed) / 250.0)
      targetDisturbance = 0.25 + 0.35 * flyNorm
    }

    const distRate = targetDisturbance > this.currentDisturbance ? 12.0 : 4.0
    this.currentDisturbance = THREE.MathUtils.damp(this.currentDisturbance, targetDisturbance, distRate, dt)
    this.uniforms.uAureliumDisturbance.value = this.currentDisturbance

    // Actualizar tiempo acumulado para shimmer y micro-chispas
    this.uniforms.uAureliumTime.value += dt
  }
}
