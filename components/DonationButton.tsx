'use client'

import Link from 'next/link'
import { useState } from 'react'

export function DonationButton() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href="/donate"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 40,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: isHovered
          ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 180, 0, 0.95))'
          : 'rgba(0, 0, 0, 0.65)',
        color: isHovered ? '#1a1a2e' : '#FFD700',
        border: '1px solid rgba(255, 215, 0, 0.5)',
        borderRadius: '25px',
        padding: '8px 16px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        textDecoration: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: isHovered
          ? '0 6px 20px rgba(255, 215, 0, 0.45)'
          : '0 4px 15px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
      }}
      title="Apoya el desarrollo de JarBees: The Game"
    >
      <span style={{ fontSize: '1.1rem' }}>☕</span>
      <span>Apoyar Proyecto</span>
    </Link>
  )
}
