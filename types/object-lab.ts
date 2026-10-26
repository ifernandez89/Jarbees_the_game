/**
 * JarBees Object Lab - Type Definitions
 * =====================================
 * Single Source of Truth for procedural, parametric 3D object definitions,
 * kinematic assemblies, validation contracts, and interaction anchors.
 */

export type ObjectCategory = 'furniture' | 'appliance' | 'fixture' | 'prop' | 'structural';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type Axis3D = 'x' | 'y' | 'z';

export interface ObjectDimensions {
  widthX: number;  // Ancho (X) en metros
  depthY: number;  // Profundidad (Y) en metros
  heightZ: number; // Altura (Z) en metros
}

export interface ObjectPartDefinition {
  id: string;
  name: string;
  role: 'structure' | 'surface' | 'kinetic' | 'trim' | 'hardware' | 'fastener';
  primitive: 'box' | 'cylinder' | 'extrusion' | 'composite';
  dimensions: Vector3D;
  localOffset: Vector3D;
  rotation?: Vector3D; // Rotación en grados
  explosionVector: Vector3D; // Dirección de separación en modo despiece (vector unitario)
  materialSlot: string;
  bevelRadius?: number;
  chamfer?: boolean;
  parentPartId?: string;
  kinematic?: {
    type: 'hinge' | 'slide' | 'fixed';
    axis: Axis3D;
    pivot: Vector3D;
    limits: [number, number]; // [min, max] grados o metros
    current?: number;
  };
}

export interface InteractionAnchor {
  id: string;
  type: 'chair_slot' | 'item_placement' | 'grab_handle' | 'door_pull' | 'work_station';
  name: string;
  localPos: [number, number, number];
  normal: [number, number, number];
  clearanceRadius: number; // Margen libre en metros requerido para Auren
}

export interface ColliderDefinition {
  id: string;
  type: 'box' | 'convex_hull';
  center: [number, number, number];
  halfExtents: [number, number, number];
  walkable?: boolean;
  navigableUnderneath?: boolean; // Ej: el hueco bajo la mesa
}

export interface TableParameters {
  legThickness: number;      // Grosor de patas (sección cuadrada o circular)
  legInset: number;          // Retranqueo de las patas respecto al borde
  legTaper?: number;         // Conicidad (1.0 = recta, 0.7 = afinada abajo)
  topThickness: number;      // Espesor del tablero
  topBevelRadius: number;    // Radio de bisel perimetral
  apronHeight: number;       // Altura de los travesaños/faldón
  apronThickness: number;    // Grosor de los travesaños
  cornerRadius?: number;     // Redondeo de esquinas del tablero
}

export interface ParametricObjectSpec<TParams = Record<string, any>> {
  $schema?: string;
  objectId: string;
  name: string;
  category: ObjectCategory;
  version: string;
  author?: string;
  description?: string;
  unit: 'meter';
  dimensions: ObjectDimensions;
  parameters: TParams;
  materials: {
    primary: string;
    secondary?: string;
    hardware?: string;
  };
  parts?: ObjectPartDefinition[];
  colliders?: ColliderDefinition[];
  interaction?: {
    anchors: InteractionAnchor[];
  };
  validationRules?: {
    minStabilityMargin?: number;
    minClearanceRatio?: number;
    maxWeightEstimateKg?: number;
  };
}

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  partId?: string;
  measuredValue?: number;
  expectedThreshold?: number;
}

export interface ValidationReport {
  isValid: boolean;
  status: 'PASSED' | 'WARNINGS' | 'CRITICAL_FAILURE';
  score: number; // 0 a 100
  issues: ValidationIssue[];
  metrics: {
    totalVolumeM3: number;
    estimatedMassKg: number;
    centerOfMass: Vector3D;
    supportPolygonAreaM2: number;
    stabilityFactor: number;
    aurenClearanceMet: boolean;
  };
}

export type LabInspectionLayer = 'geometry' | 'wireframe' | 'exploded' | 'colliders' | 'anchors';
