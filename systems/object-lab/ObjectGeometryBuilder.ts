/**
 * ObjectGeometryBuilder
 * =====================
 * Generador procedural determinista de ensambles geométricos en Three.js.
 * Construye mallas descompuestas por piezas con vectores de explosión analíticos,
 * jerarquías de transformación, colisionadores huecos y anclas de interacción.
 */

import * as THREE from 'three';
import {
  ParametricObjectSpec,
  TableParameters,
  ObjectPartDefinition,
  ColliderDefinition,
  InteractionAnchor
} from '../../types/object-lab';

export interface BuiltPartMesh {
  id: string;
  name: string;
  role: string;
  geometry: THREE.BufferGeometry;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  explosionVector: [number, number, number];
  dimensions: [number, number, number];
  materialSlot: string;
}

export interface BuiltAssembly {
  spec: ParametricObjectSpec<TableParameters>;
  parts: BuiltPartMesh[];
  colliders: ColliderDefinition[];
  anchors: InteractionAnchor[];
  boundingSphereRadius: number;
}

export class ObjectGeometryBuilder {
  /**
   * Construye el ensamble 3D de la mesa paramétrica.
   */
  public static buildTableAssembly(spec: ParametricObjectSpec<TableParameters>): BuiltAssembly {
    const { widthX, depthY, heightZ } = spec.dimensions;
    const {
      legThickness,
      legInset,
      topThickness,
      apronHeight,
      apronThickness
    } = spec.parameters;

    const parts: BuiltPartMesh[] = [];
    const colliders: ColliderDefinition[] = [];

    const legHeight = Math.max(0.05, heightZ - topThickness);
    const halfWidth = widthX / 2;
    const halfDepth = depthY / 2;

    // -------------------------------------------------------------------------
    // 1. Tablero Superior (Tabletop)
    // -------------------------------------------------------------------------
    const topGeom = new THREE.BoxGeometry(widthX, depthY, topThickness);
    const topZ = heightZ - (topThickness / 2);

    parts.push({
      id: 'table_top',
      name: 'Tablero de Roble Macizo',
      role: 'surface',
      geometry: topGeom,
      basePosition: [0, 0, topZ],
      baseRotation: [0, 0, 0],
      explosionVector: [0, 0, 1.2], // Sube verticalmente
      dimensions: [widthX, depthY, topThickness],
      materialSlot: 'primary'
    });

    colliders.push({
      id: 'col_top',
      type: 'box',
      center: [0, 0, topZ],
      halfExtents: [widthX / 2, depthY / 2, topThickness / 2],
      walkable: true
    });

    // -------------------------------------------------------------------------
    // 2. Patas (4x Legs - Distribución de 4 esquinas con Inset)
    // -------------------------------------------------------------------------
    const legPosX = halfWidth - legInset - (legThickness / 2);
    const legPosY = halfDepth - legInset - (legThickness / 2);
    const legZ = legHeight / 2;

    const legCorners = [
      { id: 'leg_sw', name: 'Pata Sudoeste (SW)', x: -legPosX, y: -legPosY, dirX: -1, dirY: -1 },
      { id: 'leg_se', name: 'Pata Sudeste (SE)', x: legPosX, y: -legPosY, dirX: 1, dirY: -1 },
      { id: 'leg_nw', name: 'Pata Noroeste (NW)', x: -legPosX, y: legPosY, dirX: -1, dirY: 1 },
      { id: 'leg_ne', name: 'Pata Noreste (NE)', x: legPosX, y: legPosY, dirX: 1, dirY: 1 },
    ];

    legCorners.forEach((corner) => {
      const legGeom = new THREE.BoxGeometry(legThickness, legThickness, legHeight);
      
      // Vector de explosión radial hacia afuera y levemente hacia abajo
      const expNorm = Math.sqrt(corner.dirX * corner.dirX + corner.dirY * corner.dirY);
      const expX = (corner.dirX / expNorm) * 0.9;
      const expY = (corner.dirY / expNorm) * 0.9;
      const expZ = -0.3;

      parts.push({
        id: corner.id,
        name: corner.name,
        role: 'structure',
        geometry: legGeom,
        basePosition: [corner.x, corner.y, legZ],
        baseRotation: [0, 0, 0],
        explosionVector: [expX, expY, expZ],
        dimensions: [legThickness, legThickness, legHeight],
        materialSlot: 'primary'
      });

      colliders.push({
        id: `col_${corner.id}`,
        type: 'box',
        center: [corner.x, corner.y, legZ],
        halfExtents: [legThickness / 2, legThickness / 2, legHeight / 2],
        navigableUnderneath: true
      });
    });

    // -------------------------------------------------------------------------
    // 3. Faldones / Travesaños de Refuerzo (4x Aprons)
    // -------------------------------------------------------------------------
    // Los travesaños se ubican inmediatamente bajo el tablero
    const apronZ = heightZ - topThickness - (apronHeight / 2);
    const spanX = Math.max(0.05, (legPosX * 2) - legThickness);
    const spanY = Math.max(0.05, (legPosY * 2) - legThickness);

    // Apron Norte y Sur (a lo largo de X)
    const geomApronX = new THREE.BoxGeometry(spanX, apronThickness, apronHeight);
    
    parts.push({
      id: 'apron_south',
      name: 'Travesaño Frontal (Sur)',
      role: 'structure',
      geometry: geomApronX.clone(),
      basePosition: [0, -legPosY, apronZ],
      baseRotation: [0, 0, 0],
      explosionVector: [0, -1.0, 0], // Se expande hacia el frente
      dimensions: [spanX, apronThickness, apronHeight],
      materialSlot: 'primary'
    });

    parts.push({
      id: 'apron_north',
      name: 'Travesaño Dorsal (Norte)',
      role: 'structure',
      geometry: geomApronX.clone(),
      basePosition: [0, legPosY, apronZ],
      baseRotation: [0, 0, 0],
      explosionVector: [0, 1.0, 0], // Se expande hacia atrás
      dimensions: [spanX, apronThickness, apronHeight],
      materialSlot: 'primary'
    });

    // Apron Este y Oeste (a lo largo de Y)
    const geomApronY = new THREE.BoxGeometry(apronThickness, spanY, apronHeight);

    parts.push({
      id: 'apron_west',
      name: 'Travesaño Lateral Izquierdo (Oeste)',
      role: 'structure',
      geometry: geomApronY.clone(),
      basePosition: [-legPosX, 0, apronZ],
      baseRotation: [0, 0, 0],
      explosionVector: [-1.0, 0, 0], // Se expande hacia la izquierda
      dimensions: [apronThickness, spanY, apronHeight],
      materialSlot: 'primary'
    });

    parts.push({
      id: 'apron_east',
      name: 'Travesaño Lateral Derecho (Este)',
      role: 'structure',
      geometry: geomApronY.clone(),
      basePosition: [legPosX, 0, apronZ],
      baseRotation: [0, 0, 0],
      explosionVector: [1.0, 0, 0], // Se expande hacia la derecha
      dimensions: [apronThickness, spanY, apronHeight],
      materialSlot: 'primary'
    });

    // -------------------------------------------------------------------------
    // 4. Anclas Funcionales (Interaction Anchors)
    // -------------------------------------------------------------------------
    const anchors: InteractionAnchor[] = [
      {
        id: 'anchor_sit_south_a',
        type: 'chair_slot',
        name: 'Puesto Auren Sur-1',
        localPos: [-halfWidth * 0.45, -halfDepth - 0.25, 0.0],
        normal: [0, 1, 0],
        clearanceRadius: 0.4
      },
      {
        id: 'anchor_sit_south_b',
        type: 'chair_slot',
        name: 'Puesto Auren Sur-2',
        localPos: [halfWidth * 0.45, -halfDepth - 0.25, 0.0],
        normal: [0, 1, 0],
        clearanceRadius: 0.4
      },
      {
        id: 'anchor_sit_north_a',
        type: 'chair_slot',
        name: 'Puesto Auren Norte-1',
        localPos: [-halfWidth * 0.45, halfDepth + 0.25, 0.0],
        normal: [0, -1, 0],
        clearanceRadius: 0.4
      },
      {
        id: 'anchor_sit_north_b',
        type: 'chair_slot',
        name: 'Puesto Auren Norte-2',
        localPos: [halfWidth * 0.45, halfDepth + 0.25, 0.0],
        normal: [0, -1, 0],
        clearanceRadius: 0.4
      },
      {
        id: 'anchor_surface_center',
        type: 'item_placement',
        name: 'Superficie de Apoyo Mesa',
        localPos: [0, 0, heightZ],
        normal: [0, 0, 1],
        clearanceRadius: 0.6
      }
    ];

    const radius = Math.sqrt(halfWidth * halfWidth + halfDepth * halfDepth + (heightZ / 2) * (heightZ / 2));

    return {
      spec,
      parts,
      colliders,
      anchors,
      boundingSphereRadius: radius
    };
  }
}
