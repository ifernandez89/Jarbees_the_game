'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  ParametricObjectSpec,
  TableParameters,
  LabInspectionLayer,
  ValidationReport
} from '../../types/object-lab';
import { ObjectGeometryBuilder, BuiltAssembly, BuiltPartMesh } from '../../systems/object-lab/ObjectGeometryBuilder';
import { InteractionExperienceEngine } from '../../systems/object-lab/InteractionExperienceEngine';

interface ViewerProps {
  spec: ParametricObjectSpec<TableParameters>;
  validation: ValidationReport;
  explodedProgress: number; // 0.0 a 1.0
  activeLayers: Record<LabInspectionLayer, boolean>;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
}

// -----------------------------------------------------------------------------
// Componente de Pieza Individual con soporte de Despiece Suave
// -----------------------------------------------------------------------------
interface PartMeshRendererProps {
  part: BuiltPartMesh;
  explodedProgress: number;
  isSelected: boolean;
  showWireframe: boolean;
  onSelect: () => void;
}

function PartMeshRenderer({
  part,
  explodedProgress,
  isSelected,
  showWireframe,
  onSelect
}: PartMeshRendererProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Material cálido de roble barnizado con respuesta visual táctil
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isSelected ? '#e0a96d' : hovered ? '#c98a4b' : '#a26a38',
      roughness: 0.38,
      metalness: 0.05,
      wireframe: showWireframe,
      emissive: isSelected ? '#4a2c00' : hovered ? '#2a1700' : '#000000',
      emissiveIntensity: 0.5
    });
  }, [isSelected, hovered, showWireframe]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Posición interpolada entre base y posición explosionada
    const targetX = part.basePosition[0] + part.explosionVector[0] * explodedProgress * 0.45;
    const targetY = part.basePosition[1] + part.explosionVector[1] * explodedProgress * 0.45;
    const targetZ = part.basePosition[2] + part.explosionVector[2] * explodedProgress * 0.45;

    // Smooth damping para inercia mecánica
    const step = 1.0 - Math.exp(-delta * 14);
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * step;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * step;
    meshRef.current.position.z += (targetZ - meshRef.current.position.z) * step;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={part.geometry}
      material={material}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        InteractionExperienceEngine.getInstance().dispatch({
          type: 'RELAY_CLICK',
          intensity: 0.35,
          pitchModifier: 1.1
        });
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
    />
  );
}

// -----------------------------------------------------------------------------
// Visualizador de Colisionadores Físicos (Proxy Hulls)
// -----------------------------------------------------------------------------
function CollidersOverlay({ assembly }: { assembly: BuiltAssembly }) {
  const colMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#10b981',
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
  }, []);

  return (
    <group>
      {assembly.colliders.map((col) => {
        const sizeX = col.halfExtents[0] * 2;
        const sizeY = col.halfExtents[1] * 2;
        const sizeZ = col.halfExtents[2] * 2;
        return (
          <mesh
            key={col.id}
            position={col.center}
            material={colMaterial}
          >
            <boxGeometry args={[sizeX, sizeY, sizeZ]} />
          </mesh>
        );
      })}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Visualizador de Anclas de Interacción de Auren
// -----------------------------------------------------------------------------
function AnchorsOverlay({ assembly }: { assembly: BuiltAssembly }) {
  return (
    <group>
      {assembly.anchors.map((anch) => {
        const isSit = anch.type === 'chair_slot';
        const color = isSit ? '#06b6d4' : '#f59e0b';
        return (
          <group key={anch.id} position={anch.localPos}>
            {/* Esfera de ubicación */}
            <mesh position={[0, 0, 0.05]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Círculo de despeje en el suelo */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <ringGeometry args={[anch.clearanceRadius * 0.8, anch.clearanceRadius, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
            </mesh>
            {/* Etiqueta flotante */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
              <Text
                position={[0, 0.2, 0]}
                fontSize={0.05}
                color={color}
                anchorX="center"
                anchorY="middle"
              >
                {anch.name}
              </Text>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Líneas de Cota CAD y Dimensiones 3D
// -----------------------------------------------------------------------------
function DimensionGizmos({ spec }: { spec: ParametricObjectSpec<TableParameters> }) {
  const { widthX, depthY, heightZ } = spec.dimensions;
  const halfW = widthX / 2;
  const halfD = depthY / 2;
  const offset = 0.12;

  return (
    <group>
      {/* Cota de Ancho X (Frontal) */}
      <group position={[0, -halfD - offset, 0.02]}>
        <Text
          fontSize={0.065}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          {`↔ ${(widthX * 100).toFixed(0)} cm`}
        </Text>
      </group>

      {/* Cota de Profundidad Y (Lateral) */}
      <group position={[halfW + offset, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <Text
          fontSize={0.065}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          {`↔ ${(depthY * 100).toFixed(0)} cm`}
        </Text>
      </group>

      {/* Cota de Altura Z (Vertical en esquina) */}
      <group position={[-halfW - offset, -halfD - offset, heightZ / 2]}>
        <Text
          fontSize={0.065}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          {`↕ ${(heightZ * 100).toFixed(0)} cm`}
        </Text>
      </group>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Visor Principal del Laboratorio
// -----------------------------------------------------------------------------
export default function ObjectLabViewer({
  spec,
  validation,
  explodedProgress,
  activeLayers,
  selectedPartId,
  onSelectPart
}: ViewerProps) {
  // Construye el ensamble paramétrico determinista
  const assembly = useMemo(() => {
    return ObjectGeometryBuilder.buildTableAssembly(spec);
  }, [spec]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [2.2, -2.6, 1.8], fov: 42 }}
        style={{ background: 'radial-gradient(circle at 50% 40%, #111827 0%, #030712 100%)' }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[4, -3, 6]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-3, 4, 3]} intensity={0.4} color="#38bdf8" />
        <pointLight position={[3, -4, 1]} intensity={0.3} color="#f59e0b" />

        {/* Rejilla de Suelo de Ingeniería */}
        <Grid
          infiniteGrid
          cellSize={0.2}
          sectionSize={1.0}
          fadeDistance={10}
          sectionColor="#38bdf8"
          cellColor="#1e293b"
        />

        {/* Ensamble de Piezas */}
        <group>
          {assembly.parts.map((part) => (
            <PartMeshRenderer
              key={part.id}
              part={part}
              explodedProgress={explodedProgress}
              isSelected={selectedPartId === part.id}
              showWireframe={activeLayers.wireframe}
              onSelect={() => {
                const nextSelect = selectedPartId === part.id ? null : part.id;
                onSelectPart(nextSelect);
                InteractionExperienceEngine.getInstance().dispatch({
                  type: 'PART_SELECT',
                  intensity: 0.7
                });
              }}
            />
          ))}
        </group>

        {/* Capa de Colisionadores Físicos */}
        {activeLayers.colliders && <CollidersOverlay assembly={assembly} />}

        {/* Capa de Anclas de Interacción Auren */}
        {activeLayers.anchors && <AnchorsOverlay assembly={assembly} />}

        {/* Cotas Dimensionales CAD */}
        {activeLayers.geometry && <DimensionGizmos spec={spec} />}

        <OrbitControls
          makeDefault
          minDistance={0.8}
          maxDistance={8.0}
          maxPolarAngle={Math.PI / 2 + 0.05} // Evita meterse debajo del piso
          target={[0, 0, spec.dimensions.heightZ * 0.45]}
        />
      </Canvas>
    </div>
  );
}
