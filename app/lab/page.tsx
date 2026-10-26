'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ParametricObjectSpec,
  TableParameters,
  LabInspectionLayer,
  ValidationReport
} from '../../types/object-lab';
import { GeometryValidator } from '../../systems/object-lab/GeometryValidator';
import { InteractionExperienceEngine } from '../../systems/object-lab/InteractionExperienceEngine';

// Import dinámico del visor Three.js para evitar problemas de SSR en Next.js
const ObjectLabViewer = dynamic(() => import('../../components/lab/ObjectLabViewer'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#38bdf8',
      fontFamily: 'monospace',
      background: '#030712'
    }}>
      INICIALIZANDO MOTOR GEOMÉTRICO 3D...
    </div>
  )
});

const DEFAULT_SPEC: ParametricObjectSpec<TableParameters> = {
  $schema: '../../schema/jarbees_object.schema.json',
  objectId: 'jarbees_table_001',
  name: 'Mesa de Roble Nexo (Paramétrica v1)',
  category: 'furniture',
  version: '1.0.0',
  author: 'JarBees Object Lab & Auren Engineering',
  description: 'Mesa paramétrica determinista con biseles perimetrales, 4 patas ajustables y anclas ergonómicas para Auren.',
  unit: 'meter',
  dimensions: {
    widthX: 1.40,
    depthY: 0.80,
    heightZ: 0.75
  },
  parameters: {
    legThickness: 0.07,
    legInset: 0.05,
    legTaper: 0.85,
    topThickness: 0.045,
    topBevelRadius: 0.015,
    apronHeight: 0.09,
    apronThickness: 0.025,
    cornerRadius: 0.02
  },
  materials: {
    primary: 'pbr_oak_varnished',
    secondary: 'pbr_black_steel_brackets',
    hardware: 'pbr_brass_bolts'
  }
};

export default function ObjectLabPage() {
  const [spec, setSpec] = useState<ParametricObjectSpec<TableParameters>>(DEFAULT_SPEC);
  const [explodedProgress, setExplodedProgress] = useState<number>(0.0);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  const [activeLayers, setActiveLayers] = useState<Record<LabInspectionLayer, boolean>>({
    geometry: true,
    wireframe: false,
    exploded: false,
    colliders: false,
    anchors: true
  });

  // Validador determinista continuo
  const validation: ValidationReport = useMemo(() => {
    return GeometryValidator.validateTable(spec);
  }, [spec]);

  // Alerta sonora si la validación falla
  useEffect(() => {
    if (validation.status === 'CRITICAL_FAILURE') {
      InteractionExperienceEngine.getInstance().dispatch({ type: 'ERROR_BUZZ' });
    }
  }, [validation.status]);

  const updateDimension = (key: keyof typeof spec.dimensions, val: number) => {
    setSpec(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [key]: val }
    }));
    InteractionExperienceEngine.getInstance().dispatch({ type: 'SLIDER_TICK' });
  };

  const updateParameter = (key: keyof TableParameters, val: number) => {
    setSpec(prev => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: val }
    }));
    InteractionExperienceEngine.getInstance().dispatch({ type: 'SLIDER_TICK' });
  };

  const toggleLayer = (layer: LabInspectionLayer) => {
    setActiveLayers(prev => {
      const next = !prev[layer];
      InteractionExperienceEngine.getInstance().dispatch({
        type: 'RELAY_CLICK',
        intensity: next ? 0.7 : 0.3
      });
      return { ...prev, [layer]: next };
    });
  };

  const toggleExploded = () => {
    const nextVal = explodedProgress > 0.05 ? 0.0 : 1.0;
    setExplodedProgress(nextVal);
    InteractionExperienceEngine.getInstance().dispatch({
      type: nextVal > 0 ? 'DESPIECE_ENGAGE' : 'DESPIECE_COLLAPSE'
    });
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(spec, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${spec.objectId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    InteractionExperienceEngine.getInstance().dispatch({ type: 'SUCCESS_CHORD' });
  };

  const copyBlenderCommand = () => {
    const cmd = `blender --background --python scripts/generate_jarbees_object.py -- --spec public/data/objects/table_001.object.json --out table_001.blend`;
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2500);
    InteractionExperienceEngine.getInstance().dispatch({ type: 'SUCCESS_CHORD' });
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#030712',
      color: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* HEADER / WORKSTATION BAR */}
      <header style={{
        height: '56px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: '#090d16',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '20px' }}>🔬</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: '14px', color: '#38bdf8' }}>
                JARBEES OBJECT LAB
              </span>
              <span style={{
                background: '#1e293b',
                color: '#94a3b8',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                v1.0.0 · MESA MVP
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Motor Geométrico Determinista · Ensamble Cinético & Dualidad Three.js/Blender
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              const muted = !isAudioMuted;
              setIsAudioMuted(muted);
              InteractionExperienceEngine.getInstance().setMuted(muted);
            }}
            style={{
              background: isAudioMuted ? '#ef444422' : '#1e293b',
              border: `1px solid ${isAudioMuted ? '#ef4444' : '#334155'}`,
              color: isAudioMuted ? '#f87171' : '#94a3b8',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isAudioMuted ? '🔇 Audio Silenciado' : '🔊 Audio Táctil DSP'}
          </button>

          <Link
            href="/blueprints"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '12px',
              padding: '6px 12px',
              border: '1px solid #334155',
              borderRadius: '6px'
            }}
          >
            🏛️ Blueprints Villa
          </Link>

          <Link
            href="/game"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '6px'
            }}
          >
            Volver al Vuelo 🐝
          </Link>
        </div>
      </header>

      {/* WORKSPACE BODY */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* PANEL IZQUIERDO: CONTROLES PARAMÉTRICOS */}
        <aside style={{
          width: '320px',
          background: 'rgba(9, 13, 22, 0.94)',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          overflowY: 'auto'
        }}>
          {/* SECCIÓN DESPIECE */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
                💥 MODO DESPIECE (EXPLODED)
              </span>
              <button
                onClick={toggleExploded}
                style={{
                  background: explodedProgress > 0 ? '#f59e0b' : '#1e293b',
                  color: explodedProgress > 0 ? '#000' : '#f8fafc',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {explodedProgress > 0 ? 'Armar ↩' : 'Separar ↗'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedProgress}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setExplodedProgress(val);
                InteractionExperienceEngine.getInstance().dispatch({ type: 'SLIDER_TICK' });
              }}
              style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              <span>Ensamble 0%</span>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{(explodedProgress * 100).toFixed(0)}%</span>
              <span>Despiece 100%</span>
            </div>
          </div>

          {/* SECCIÓN DIMENSIONES */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              📐 DIMENSIONES MÉTRICAS
            </div>

            {/* Ancho */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Ancho (X)</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{(spec.dimensions.widthX).toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="2.40"
                step="0.05"
                value={spec.dimensions.widthX}
                onChange={(e) => updateDimension('widthX', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            {/* Profundidad */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Profundidad (Y)</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{(spec.dimensions.depthY).toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.30"
                step="0.05"
                value={spec.dimensions.depthY}
                onChange={(e) => updateDimension('depthY', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            {/* Altura */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Altura (Z)</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{(spec.dimensions.heightZ).toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="0.60"
                max="0.95"
                step="0.01"
                value={spec.dimensions.heightZ}
                onChange={(e) => updateDimension('heightZ', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* SECCIÓN PARÁMETROS DE CARPINTERÍA */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7', marginBottom: '12px', letterSpacing: '0.05em' }}>
              🪵 PARÁMETROS GEOMÉTRICOS
            </div>

            {/* Grosor de Patas */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Grosor de Patas</span>
                <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>{(spec.parameters.legThickness * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.12"
                step="0.005"
                value={spec.parameters.legThickness}
                onChange={(e) => updateParameter('legThickness', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>

            {/* Retranqueo (Inset) */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Retranqueo Patas (Inset)</span>
                <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>{(spec.parameters.legInset * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.005"
                value={spec.parameters.legInset}
                onChange={(e) => updateParameter('legInset', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>

            {/* Espesor Tablero */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Espesor Tablero</span>
                <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>{(spec.parameters.topThickness * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.08"
                step="0.005"
                value={spec.parameters.topThickness}
                onChange={(e) => updateParameter('topThickness', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>

            {/* Altura de Faldón */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Altura Faldón</span>
                <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>{(spec.parameters.apronHeight * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.14"
                step="0.005"
                value={spec.parameters.apronHeight}
                onChange={(e) => updateParameter('apronHeight', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* CAPAS DE INSPECCIÓN */}
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '10px', letterSpacing: '0.05em' }}>
              👁️ CAPAS DE INSPECCIÓN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.geometry}
                  onChange={() => toggleLayer('geometry')}
                />
                <span style={{ color: '#cbd5e1' }}>Cotas CAD 3D</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.wireframe}
                  onChange={() => toggleLayer('wireframe')}
                />
                <span style={{ color: '#cbd5e1' }}>Malla Alámbrica (Wireframe)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.colliders}
                  onChange={() => toggleLayer('colliders')}
                />
                <span style={{ color: '#10b981' }}>Colisionadores Hulls</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.anchors}
                  onChange={() => toggleLayer('anchors')}
                />
                <span style={{ color: '#06b6d4' }}>Anclas Funcionales Auren</span>
              </label>
            </div>
          </div>
        </aside>

        {/* CENTRO: VISOR 3D */}
        <main style={{ flex: 1, position: 'relative' }}>
          <ObjectLabViewer
            spec={spec}
            validation={validation}
            explodedProgress={explodedProgress}
            activeLayers={activeLayers}
            selectedPartId={selectedPartId}
            onSelectPart={setSelectedPartId}
          />

          {/* Overlay informativo de pieza seleccionada */}
          {selectedPartId && (
            <div style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              padding: '12px 16px',
              maxWidth: '300px',
              zIndex: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                PIEZA SELECCIONADA
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '2px 0 6px 0' }}>
                {selectedPartId}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Haga clic fuera o pulse la pieza nuevamente para deseleccionar. Las piezas mantienen su cinemática y transformaciones independientes.
              </div>
            </div>
          )}
        </main>

        {/* PANEL DERECHO: DIAGNÓSTICO Y EXPORTACIÓN */}
        <aside style={{
          width: '320px',
          background: 'rgba(9, 13, 22, 0.94)',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          overflowY: 'auto'
        }}>
          {/* TARJETA DE ESTADO DE VALIDACIÓN */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>
              DIAGNÓSTICO GEOMÉTRICO
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: validation.status === 'PASSED'
                ? 'rgba(16, 185, 129, 0.15)'
                : validation.status === 'WARNINGS'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                validation.status === 'PASSED'
                  ? '#10b981'
                  : validation.status === 'WARNINGS'
                    ? '#f59e0b'
                    : '#ef4444'
              }`,
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: validation.status === 'PASSED'
                    ? '#34d399'
                    : validation.status === 'WARNINGS'
                      ? '#fbbf24'
                      : '#f87171'
                }}>
                  {validation.status === 'PASSED'
                    ? 'APROBADO PARA PRODUCCIÓN'
                    : validation.status === 'WARNINGS'
                      ? 'ADVERTENCIAS DETECTADAS'
                      : 'FALLO ESTRUCTURAL'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Score de Estabilidad: {validation.score}/100
                </div>
              </div>
              <span style={{ fontSize: '22px' }}>
                {validation.status === 'PASSED' ? '✅' : validation.status === 'WARNINGS' ? '⚠️' : '❌'}
              </span>
            </div>

            {/* Métricas analíticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b' }}>Masa Estimada</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>
                  {validation.metrics.estimatedMassKg} kg
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b' }}>Factor Estabilidad</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>
                  {validation.metrics.stabilityFactor}
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b' }}>Volumen Madera</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>
                  {(validation.metrics.totalVolumeM3 * 1000).toFixed(1)} L
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                <div style={{ color: '#64748b' }}>Paso de Rodillas</div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: validation.metrics.aurenClearanceMet ? '#34d399' : '#f87171'
                }}>
                  {validation.metrics.aurenClearanceMet ? 'Apto Auren' : 'Estrecho'}
                </div>
              </div>
            </div>

            {/* Listado de Issues */}
            {validation.issues.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {validation.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '11px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: issue.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      borderLeft: `3px solid ${issue.severity === 'error' ? '#ef4444' : '#f59e0b'}`,
                      color: '#e2e8f0'
                    }}
                  >
                    {issue.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATÁLOGO DE OBJETOS PRÓXIMOS */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>
              CATÁLOGO DE 6 PIEZAS (de_rats)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { name: 'Mesa', icon: '🪑', active: true },
                { name: 'Cajón', icon: '🗄️', active: false },
                { name: 'Silla', icon: '🪑', active: false },
                { name: 'Alacena', icon: '🚪', active: false },
                { name: 'Mesada', icon: '🍳', active: false },
                { name: 'Heladera', icon: '🧊', active: false },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: item.active ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                    border: `1px solid ${item.active ? '#38bdf8' : '#1e293b'}`,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: item.active ? '#38bdf8' : '#64748b'
                  }}
                >
                  <span>{item.icon}</span>
                  <span style={{ fontWeight: item.active ? 700 : 500 }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* EXPORTACIÓN Y PIPELINE */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
              PIPELINE & EXPORTACIÓN
            </div>

            <button
              onClick={exportJson}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📥 Descargar Spec JSON
            </button>

            <button
              onClick={copyBlenderCommand}
              style={{
                background: copiedCli ? '#10b981' : '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {copiedCli ? '✅ Comando Copiado' : '📋 Copiar Comando Blender (CLI)'}
            </button>

            <button
              onClick={() => {
                setSpec(DEFAULT_SPEC);
                setExplodedProgress(0);
                InteractionExperienceEngine.getInstance().dispatch({ type: 'RELAY_CLICK' });
              }}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #1e293b',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Restablecer Valores de Fábrica
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
