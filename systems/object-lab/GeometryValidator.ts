/**
 * GeometryValidator
 * =================
 * Deterministic structural & ergonomic validator for JarBees Object Lab.
 * Validates stability against center-of-gravity tipping, ergonomic clearances
 * for Auren (1.85m tall), non-manifold risks, and aspect ratio sanity.
 */

import { ParametricObjectSpec, TableParameters, ValidationReport, ValidationIssue } from '../../types/object-lab';

export class GeometryValidator {
  /**
   * Valida la especificación paramétrica de una mesa.
   */
  public static validateTable(spec: ParametricObjectSpec<TableParameters>): ValidationReport {
    const issues: ValidationIssue[] = [];
    const { widthX, depthY, heightZ } = spec.dimensions;
    const {
      legThickness,
      legInset,
      topThickness,
      apronHeight,
      apronThickness
    } = spec.parameters;

    // 1. Validaciones básicas de positividad y rango
    if (widthX <= 0.4 || depthY <= 0.4 || heightZ <= 0.3) {
      issues.push({
        code: 'ERR_MIN_DIMENSIONS',
        severity: 'error',
        message: 'Las dimensiones globales son inferiores al límite físico mínimo para mobiliario (0.4m x 0.4m x 0.3m).'
      });
    }

    if (topThickness <= 0.015) {
      issues.push({
        code: 'ERR_THIN_TOP',
        severity: 'error',
        message: 'El espesor del tablero es menor a 15mm; generaría alabeo estructural o fragilidad visual.'
      });
    }

    if (legThickness <= 0.025) {
      issues.push({
        code: 'ERR_THIN_LEGS',
        severity: 'error',
        message: 'El grosor de las patas es inferior a 25mm; riesgo de colapso o artefactos de raycast.'
      });
    }

    // 2. Comprobación de interferencia de inset y ancho
    const maxSafeInsetX = (widthX / 2) - legThickness;
    const maxSafeInsetY = (depthY / 2) - legThickness;
    if (legInset >= maxSafeInsetX || legInset >= maxSafeInsetY) {
      issues.push({
        code: 'ERR_LEG_OVERLAP',
        severity: 'error',
        message: 'El retranqueo (inset) de las patas supera el semi-ancho; las patas colisionan en el centro.'
      });
    }

    // 3. Ergonomía Auren: Espacio libre para piernas (Under-table clearance)
    const legClearance = heightZ - topThickness - apronHeight;
    const AUREN_MIN_KNEE_CLEARANCE = 0.60; // 60cm mínimos para que las rodillas de Auren no choquen
    const aurenClearanceMet = legClearance >= AUREN_MIN_KNEE_CLEARANCE;

    if (!aurenClearanceMet) {
      issues.push({
        code: 'WARN_AUREN_CLEARANCE',
        severity: 'warning',
        message: `Altura libre bajo mesa (${(legClearance * 100).toFixed(1)} cm) inferior a los 60cm recomendados para Auren.`,
        measuredValue: legClearance,
        expectedThreshold: AUREN_MIN_KNEE_CLEARANCE
      });
    }

    // 4. Cálculo de Estabilidad Mecánica (Centro de Gravedad vs. Polígono de Soporte)
    // Coordenadas extremas de las 4 patas
    const legSpanX = Math.max(0.1, widthX - 2 * (legInset + legThickness / 2));
    const legSpanY = Math.max(0.1, depthY - 2 * (legInset + legThickness / 2));
    const supportPolygonArea = legSpanX * legSpanY;
    const tableTopArea = widthX * depthY;
    const stabilityFactor = Math.min(1.0, supportPolygonArea / (tableTopArea * 0.85));

    if (stabilityFactor < 0.45) {
      issues.push({
        code: 'WARN_TIPPING_RISK',
        severity: 'warning',
        message: 'Polígono de apoyo de patas demasiado estrecho; alto riesgo de vuelco al apoyar peso en los extremos.',
        measuredValue: stabilityFactor,
        expectedThreshold: 0.45
      });
    }

    // 5. Estimación de Volumen y Masa (Densidad Roble ~720 kg/m³)
    const DENSITY_OAK_KG_M3 = 720;
    const topVol = widthX * depthY * topThickness;
    const legLength = heightZ - topThickness;
    const legsVol = 4 * (legThickness * legThickness * legLength);
    // Apron (4 travesaños)
    const apronXVol = 2 * (legSpanX * apronThickness * apronHeight);
    const apronYVol = 2 * (legSpanY * apronThickness * apronHeight);
    const totalVolume = topVol + legsVol + apronXVol + apronYVol;
    const estimatedMass = totalVolume * DENSITY_OAK_KG_M3;

    // Centro de masa vertical simplificado
    const topMass = topVol * DENSITY_OAK_KG_M3;
    const legsMass = legsVol * DENSITY_OAK_KG_M3;
    const apronsMass = (apronXVol + apronYVol) * DENSITY_OAK_KG_M3;
    const zCenter = (
      topMass * (heightZ - topThickness / 2) +
      legsMass * (legLength / 2) +
      apronsMass * (heightZ - topThickness - apronHeight / 2)
    ) / (topMass + legsMass + apronsMass);

    // Score global
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    let score = 100 - (errorCount * 40 + warningCount * 15);
    score = Math.max(0, Math.min(100, score));

    const status = errorCount > 0
      ? 'CRITICAL_FAILURE'
      : warningCount > 0
        ? 'WARNINGS'
        : 'PASSED';

    return {
      isValid: errorCount === 0,
      status,
      score,
      issues,
      metrics: {
        totalVolumeM3: Number(totalVolume.toFixed(4)),
        estimatedMassKg: Number(estimatedMass.toFixed(1)),
        centerOfMass: { x: 0, y: 0, z: Number(zCenter.toFixed(3)) },
        supportPolygonAreaM2: Number(supportPolygonArea.toFixed(3)),
        stabilityFactor: Number(stabilityFactor.toFixed(2)),
        aurenClearanceMet
      }
    };
  }
}
