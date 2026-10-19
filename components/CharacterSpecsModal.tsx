'use client'

import React from 'react'
import { useGameStore } from '@/store/gameStore'
import { CHARACTER_PROFILES, CharacterId } from '@/types/characters'

export function CharacterSpecsModal() {
  const isSpecsModalOpen = useGameStore((state) => state.isSpecsModalOpen)
  const setSpecsModalOpen = useGameStore((state) => state.setSpecsModalOpen)
  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const setSelectedCharacter = useGameStore((state) => state.setSelectedCharacter)

  if (!isSpecsModalOpen) return null

  const characters = Object.values(CHARACTER_PROFILES)
  const currentProfile = CHARACTER_PROFILES[selectedCharacter]

  return (
    <div className="specs-modal-overlay" onClick={() => setSpecsModalOpen(false)}>
      <div className="specs-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado del Modal */}
        <div className="specs-modal-header">
          <div className="specs-modal-title-group">
            <span className="specs-modal-badge">SISTEMA MULTI-PERSONAJE & ESCALAS</span>
            <h2 className="specs-modal-title">📊 Ficha Técnica & Tabla de Tamaños</h2>
            <p className="specs-modal-subtitle">
              Comparativa física, biomecánica y tecnológica de vuelo entre la fauna de JarBees y el Vengador Acorazado
            </p>
          </div>
          <button
            className="specs-modal-close-btn"
            onClick={() => setSpecsModalOpen(false)}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Resumen comparativo de Escala Humana vs Micro-Mundo */}
        <div className="specs-scale-callout">
          <div className="specs-scale-icon">📐</div>
          <div className="specs-scale-info">
            <strong>Relación de Escalas en Motor 3D:</strong>
            <span>
              {' '}Iron Man está configurado a <strong>escala humana real 1:1 (1.85 m)</strong> con cámara cinematográfica retrasada, mientras que la Abeja, el Colibrí y la Mariposa operan en <strong>escala macro adaptada</strong> para mantener visibilidad épica en tercera persona sobre los paisajes infinitos.
            </span>
          </div>
        </div>

        {/* Tarjetas de Selección Rápida */}
        <div className="specs-grid">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacter
            return (
              <div
                key={char.id}
                className={`specs-card ${isSelected ? 'specs-card-selected' : ''}`}
                style={{
                  borderColor: isSelected ? char.badgeColor : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: isSelected ? `0 0 25px ${char.badgeColor}33` : 'none',
                }}
              >
                <div className="specs-card-header">
                  <div className="specs-card-icon-wrap" style={{ background: `${char.badgeColor}22` }}>
                    <span className="specs-card-icon">{char.icon}</span>
                  </div>
                  <div>
                    <span
                      className="specs-card-badge"
                      style={{ background: `${char.badgeColor}25`, color: char.badgeColor }}
                    >
                      {char.badge}
                    </span>
                    <h3 className="specs-card-name">{char.name}</h3>
                    <div className="specs-card-title">{char.title}</div>
                  </div>
                </div>

                <p className="specs-card-desc">{char.description}</p>

                {/* Métricas clave */}
                <div className="specs-card-metrics">
                  <div className="specs-metric-row">
                    <span className="specs-metric-label">📏 Tamaño / Longitud:</span>
                    <strong className="specs-metric-value">{char.realMetrics.heightOrLength}</strong>
                  </div>
                  <div className="specs-metric-row">
                    <span className="specs-metric-label">🪽 Envergadura:</span>
                    <strong className="specs-metric-value">{char.realMetrics.wingspanOrWidth}</strong>
                  </div>
                  <div className="specs-metric-row">
                    <span className="specs-metric-label">⚖️ Peso / Masa:</span>
                    <strong className="specs-metric-value">{char.realMetrics.weight}</strong>
                  </div>
                  <div className="specs-metric-row">
                    <span className="specs-metric-label">⚡ Propulsión:</span>
                    <strong className="specs-metric-value">{char.realMetrics.propulsion}</strong>
                  </div>
                  <div className="specs-metric-row">
                    <span className="specs-metric-label">🚀 Velocidad Máx.:</span>
                    <strong className="specs-metric-value" style={{ color: char.badgeColor }}>
                      {char.realMetrics.maxSpeedKmh}
                    </strong>
                  </div>
                  <div className="specs-metric-row">
                    <span className="specs-metric-label">🎯 Vuelo:</span>
                    <strong className="specs-metric-value">{char.realMetrics.flightAcrobatics}</strong>
                  </div>
                </div>

                {/* Lista de características */}
                <div className="specs-highlights">
                  {char.highlights.map((h, i) => (
                    <div key={i} className="specs-highlight-item">
                      <span style={{ color: char.badgeColor }}>✓</span> {h}
                    </div>
                  ))}
                </div>

                {/* Botón de selección */}
                <button
                  className={`specs-select-btn ${isSelected ? 'specs-select-btn-active' : ''}`}
                  style={{
                    background: isSelected ? char.badgeColor : 'rgba(255, 255, 255, 0.08)',
                    borderColor: char.badgeColor,
                    color: isSelected ? '#000' : '#fff',
                  }}
                  onClick={() => {
                    setSelectedCharacter(char.id)
                  }}
                >
                  {isSelected ? '✓ Personaje Activo' : `Elegir ${char.name.split(' ')[0]}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Tabla Comparativa Directa */}
        <div className="specs-table-wrapper">
          <h3 className="specs-table-title">📐 Tabla Comparativa de Medidas y Especificaciones</h3>
          <table className="specs-table">
            <thead>
              <tr>
                <th>Personaje</th>
                <th>Estatura / Longitud</th>
                <th>Envergadura</th>
                <th>Masa / Peso</th>
                <th>Mecanismo de Vuelo</th>
                <th>Velocidad Máx.</th>
                <th>Sonido del Vuelo</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((char) => (
                <tr
                  key={char.id}
                  className={char.id === selectedCharacter ? 'specs-table-row-selected' : ''}
                >
                  <td>
                    <span style={{ marginRight: 6 }}>{char.icon}</span>
                    <strong>{char.name}</strong>
                  </td>
                  <td>{char.realMetrics.heightOrLength}</td>
                  <td>{char.realMetrics.wingspanOrWidth}</td>
                  <td>{char.realMetrics.weight}</td>
                  <td>{char.realMetrics.propulsion}</td>
                  <td style={{ color: char.badgeColor, fontWeight: 'bold' }}>
                    {char.realMetrics.maxSpeedKmh}
                  </td>
                  <td>
                    {char.id === 'bee' && 'Zumbido 225 Hz'}
                    {char.id === 'colibri' && 'Aleteo rápido 75 Hz'}
                    {char.id === 'butterfly' && 'Susurro de aire 11 Hz'}
                    {char.id === 'iron_man' && 'Turbina Plasma Repulsores'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie de modal */}
        <div className="specs-modal-footer">
          <div className="specs-footer-tip">
            💡 <em>Consejo:</em> Puedes cambiar de personaje en cualquier momento durante el vuelo usando los botones del panel superior del HUD.
          </div>
          <button className="specs-footer-close" onClick={() => setSpecsModalOpen(false)}>
            Cerrar Ficha Técnica
          </button>
        </div>
      </div>
    </div>
  )
}
