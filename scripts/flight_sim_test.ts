/**
 * Prueba headless del motor de vuelo (sin navegador):
 *   npx -y tsx scripts/flight_sim_test.ts
 * Verifica regímenes, cruce de Mach 1, energía, temperatura y frenado.
 */
import { FlightDynamics, FlightInput } from '../systems/FlightDynamics'

const base: FlightInput = { forward: false, backward: false, left: false, right: false, up: false, down: false, boost: false }

function run(label: string, mode: 'assist' | 'sim', schedule: (t: number) => Partial<FlightInput>, seconds: number) {
  const fd = new FlightDynamics()
  let heading = 0
  let alt = 20
  const dt = 1 / 60
  console.log(`\n=== ${label} [${mode}] ===`)
  console.log('t(s)  km/h   Mach  regimen      empuje energia temp   G     boom')
  for (let i = 0; i <= seconds * 60; i++) {
    const t = i * dt
    const input = { ...base, ...schedule(t) }
    const { yawDelta } = fd.step(dt, input, heading, alt, mode)
    heading += yawDelta
    alt = Math.max(2, alt + fd.vy * dt)
    if (i % 120 === 0) {
      console.log(
        `${t.toFixed(0).padStart(3)}  ${(fd.speed * 3.6).toFixed(0).padStart(5)}  ${fd.mach.toFixed(2).padStart(4)}  ${fd.regime.padEnd(11)}  ${(fd.throttle * 40 + fd.afterburner * 60).toFixed(0).padStart(4)}%  ${fd.energy.toFixed(0).padStart(5)}  ${fd.heat.toFixed(0).padStart(4)}  ${fd.gLoad.toFixed(1).padStart(4)}  ${fd.boomSeq}`
      )
    }
  }
}

run('A) W sostenido sin postquemador (techo del vuelo normal)', 'assist', () => ({ forward: true }), 24)
run('B) W + SHIFT postquemador (cruce de Mach 1)', 'assist', () => ({ forward: true, boost: true }), 40)
run('C) Mach 2 y luego soltar controles (distancia de frenado)', 'assist', (t) => (t < 22 ? { forward: true, boost: true } : {}), 60)
run('D) Mismo vuelo con aerofreno S tras soltar', 'assist', (t) => (t < 22 ? { forward: true, boost: true } : { backward: true }), 40)
run('E) Modo simulación: soltar controles a 200 km/h', 'sim', (t) => (t < 3 ? { forward: true } : {}), 30)
