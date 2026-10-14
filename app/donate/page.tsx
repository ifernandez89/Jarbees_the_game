'use client'

import { useRouter } from 'next/navigation'

export default function DonatePage() {
  const router = useRouter()

  const donationOptions = [
    {
      title: '🥇 GitHub Sponsors',
      subtitle: 'Opción Recomendada (Sin comisiones)',
      description: 'Donaciones mensuales o únicas. Retiros directos a CBU argentino.',
      tiers: [
        '☕ $1/mes - Cafecito Virtual',
        '🐝 $5/mes - Apicultor Aprendiz',
        '🍯 $10/mes - Guardián de Colmena',
        '👑 $25/mes - Rey de las Abejas (bioma personalizado)',
      ],
      buttonText: 'Donar vía GitHub',
      link: process.env.NEXT_PUBLIC_GITHUB_SPONSOR_URL || '#',
      primary: true,
    },
    {
      title: '🇦🇷 Transferencia Bancaria',
      subtitle: 'Para donantes argentinos',
      description: 'Transferencia directa desde tu banco o Mercado Pago.',
      details: [
        `Alias: ${process.env.NEXT_PUBLIC_ALIAS || 'TU.ALIAS.MP'}`,
        `CBU: ${process.env.NEXT_PUBLIC_CBU || '0000003100012345678901'}`,
        `Banco: ${process.env.NEXT_PUBLIC_BANK_NAME || 'Tu Banco'}`,
      ],
      buttonText: 'Copiar CBU',
      action: () => {
        navigator.clipboard.writeText(process.env.NEXT_PUBLIC_CBU || '0000003100012345678901')
        alert('CBU copiado al portapapeles!')
      },
    },
    {
      title: '☕ Cafecito.app',
      subtitle: 'Plataforma argentina',
      description: 'Tarjetas argentinas aceptadas. $200 ARS por cafecito.',
      buttonText: 'Invitar Cafecito',
      link: process.env.NEXT_PUBLIC_CAFECITO_URL || '#',
    },
    {
      title: '🌎 PayPal',
      subtitle: 'Para donantes internacionales',
      description: 'Aceptamos PayPal (comisiones aplicadas).',
      buttonText: 'Donar con PayPal',
      link: process.env.NEXT_PUBLIC_PAYPAL_ME_URL || '#',
    },
  ]

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      padding: '40px 20px',
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent',
            border: '2px solid #FFD700',
            color: '#FFD700',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '30px',
          }}
        >
          ← Volver
        </button>

        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '10px',
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            💰 Apoyar JarBees: The Game
          </h1>
          <p style={{ color: '#aaa', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Este juego es <strong>100% gratuito y open source</strong>.<br />
            Tu donación ayuda a mantener el desarrollo activo y agregar nuevas características.
          </p>
        </div>

        {/* Opciones de donación */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '50px',
        }}>
          {donationOptions.map((option, index) => (
            <div
              key={index}
              style={{
                background: option.primary ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))' : 'rgba(255, 255, 255, 0.05)',
                border: option.primary ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '30px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{option.title}</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '15px' }}>{option.subtitle}</p>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>{option.description}</p>

              {option.tiers && (
                <ul style={{ listStyle: 'none', marginBottom: '20px', padding: 0 }}>
                  {option.tiers.map((tier, i) => (
                    <li key={i} style={{ marginBottom: '10px', color: '#FFD700', fontSize: '0.95rem' }}>
                      {tier}
                    </li>
                  ))}
                </ul>
              )}

              {option.details && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }}>
                  {option.details.map((detail, i) => (
                    <div key={i} style={{ marginBottom: '5px' }}>{detail}</div>
                  ))}
                </div>
              )}

              {option.link ? (
                <a
                  href={option.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    background: option.primary ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255, 215, 0, 0.2)',
                    color: option.primary ? '#000' : '#FFD700',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {option.buttonText}
                </a>
              ) : (
                <button
                  onClick={option.action}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 215, 0, 0.2)',
                    color: '#FFD700',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {option.buttonText}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Transparencia */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '50px',
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>📊 Transparencia de Fondos</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>40%</div>
              <div style={{ color: '#aaa' }}>Tiempo de desarrollo</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>30%</div>
              <div style={{ color: '#aaa' }}>Hosting y servidores</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>20%</div>
              <div style={{ color: '#aaa' }}>Herramientas y licencias</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>10%</div>
              <div style={{ color: '#aaa' }}>Assets y música</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '30px',
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>❓ Preguntas Frecuentes</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#FFD700', marginBottom: '5px' }}>¿El juego seguirá siendo gratis?</h4>
            <p style={{ color: '#ccc' }}>Sí, siempre. Es un proyecto open source y educativo.</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#FFD700', marginBottom: '5px' }}>¿Puedo donar de forma anónima?</h4>
            <p style={{ color: '#ccc' }}>Sí. En la transferencia bancaria no pongas tu nombre, o usa un alias en GitHub Sponsors.</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#FFD700', marginBottom: '5px' }}>¿Qué pasa si no puedo donar?</h4>
            <p style={{ color: '#ccc' }}>¡No hay problema! Compartir el proyecto, reportar bugs o simplemente jugarlo ya es un gran apoyo.</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#777', fontSize: '0.9rem' }}>
          <p>¿Dudas? Contacto: tu_email@ejemplo.com</p>
          <p style={{ marginTop: '10px' }}>
            <a href="https://github.com/tu_usuario/jarbees-the-game" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
              GitHub
            </a>
            {' • '}
            <a href="/DONATION_GUIDE.md" target="_blank" style={{ color: '#FFD700' }}>
              Guía Completa de Donaciones
            </a>
          </p>
          <p style={{ marginTop: '20px', fontSize: '1.5rem' }}>🐝💛</p>
        </div>
      </div>
    </main>
  )
}
