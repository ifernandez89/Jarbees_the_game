# 🔊 Generación de Audio con IA

Este documento describe cómo usar el backend `productos_crud_bkd` para generar audio con IA.

## 🎯 Audios Necesarios para JarBees

### 1. Efectos de la Abeja
- **bee_flap.wav** - Sonido de aleteo de alas (loop)
  - Frecuencia: 200-250 Hz
  - Duración: 0.5s (loop)
  - Descripción para IA: "Soft buzzing sound of bee wings flapping, gentle and rhythmic"

- **bee_hover.wav** - Sonido de abeja flotando
  - Frecuencia: 180-220 Hz
  - Duración: 1s (loop)
  - Descripción para IA: "Gentle bee hovering sound, soft buzz"

### 2. Sonidos Ambientales
- **wind_light.wav** - Viento suave (día)
  - Duración: 5s (loop)
  - Descripción para IA: "Soft gentle wind blowing through trees, peaceful nature sound"

- **wind_strong.wav** - Viento fuerte (tormenta)
  - Duración: 5s (loop)
  - Descripción para IA: "Strong wind blowing, intense natural wind sound"

- **night_crickets.wav** - Grillos nocturnos
  - Duración: 5s (loop)
  - Descripción para IA: "Cricket chirping at night, peaceful nature ambience"

### 3. Música Adaptativa (Opcional)
- **music_day.wav** - Música diurna (ya tenemos harmonia_mundi.wav)
- **music_night.wav** - Música nocturna
  - Descripción para IA: "Calm ambient night music, ethereal and dreamy"

---

## 🚀 Servicios del Backend

El backend `productos_crud_bkd` tiene varios servicios de IA:

### Ubicación de Servicios:
```
C:\Projects\productos_crud_bkd\src\
├── chatbot/          # Chatbot con OpenAI
├── image/            # Generación de imágenes
├── jarvis/           # Asistente de IA
└── [posible audio/]  # Servicios de audio
```

### APIs Disponibles:

1. **OpenAI API** (si está configurado)
   - Endpoint potencial: `/api/audio/generate`
   - Usa GPT-4 + TTS (Text-to-Speech)

2. **Elevenlabs API** (si está configurado)
   - Para voces y efectos de sonido
   - API key en `.env`

3. **Mubert API** (para música generativa)
   - Música procedural basada en prompts

---

## 🔧 Cómo Generar Audio

### Opción 1: Usando OpenAI TTS (Recomendado)

Si el backend tiene configurado OpenAI:

```bash
# Desde el backend
cd C:\Projects\productos_crud_bkd

# Ejecutar script de generación (crear si no existe)
npm run generate:audio -- --prompt "Soft buzzing bee wings" --output bee_flap.wav
```

### Opción 2: Servicios Online Gratuitos

Mientras se configura el backend:

1. **Freesound.org**
   - Buscar: "bee buzz", "bee flapping wings"
   - Descargar WAV/MP3
   - Licencia: Creative Commons

2. **Zapsplat.com**
   - Biblioteca de efectos gratuitos
   - Buscar: "insect buzz", "bee sound"

3. **FakeYou TTS + ElevenLabs**
   - Generar voces y efectos
   - API gratuita limitada

### Opción 3: Generación Procedural con Tone.js

Crear sonidos sintéticos directamente:

```typescript
// Ejemplo de generación de buzz de abeja
import * as Tone from 'tone'

const synth = new Tone.FMSynth({
  harmonicity: 3,
  modulationIndex: 10,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.001, decay: 0, sustain: 1, release: 0.1 }
}).toDestination()

// Grabar y exportar
const recorder = new Tone.Recorder()
synth.connect(recorder)
recorder.start()
synth.triggerAttackRelease('200', '0.5')
```

---

## 📦 Script de Descarga Rápida

Crear archivo `scripts/download_sounds.ps1`:

```powershell
# Descargar sonidos gratuitos de Freesound
$sounds = @{
    'bee_flap' = 'https://freesound.org/data/previews/...'
    'wind_light' = 'https://freesound.org/data/previews/...'
    'crickets' = 'https://freesound.org/data/previews/...'
}

foreach ($sound in $sounds.Keys) {
    $url = $sounds[$sound]
    $output = "public/audio/$sound.wav"
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "✅ Descargado: $sound"
}
```

---

## 🎵 Conversión de Formatos

Si descargas MP3, convertir a WAV:

```bash
# Usando FFmpeg
ffmpeg -i input.mp3 -acodec pcm_s16le -ar 44100 output.wav

# O en PowerShell
ffmpeg -i "bee_buzz.mp3" -acodec pcm_s16le -ar 44100 "public\audio\bee_flap.wav"
```

---

## 🔗 APIs de IA de Audio

### 1. ElevenLabs (Mejor calidad)
```typescript
const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Soft bee wings flapping sound',
    duration_seconds: 0.5,
    prompt_influence: 0.5
  })
})
```

### 2. Mubert API (Música generativa)
```typescript
const response = await fetch('https://api-b2b.mubert.com/v2/RecordTrack', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'RecordTrack',
    params: {
      pat: process.env.MUBERT_PAT,
      duration: 120,
      tags: 'ambient,calm,nature',
      mode: 'track'
    }
  })
})
```

### 3. Suno AI / Stable Audio (Nuevas opciones)
- Generación de música con prompts
- Aún en beta, pero muy prometedor

---

## ✅ Checklist de Audio

### Efectos de Sonido:
- [ ] bee_flap.wav (aleteo)
- [ ] bee_hover.wav (flotando)
- [ ] wind_light.wav (viento suave)
- [ ] wind_strong.wav (viento fuerte)
- [ ] night_crickets.wav (grillos)

### Música:
- [x] ambient_music.wav (harmonia_mundi.wav - copiado)
- [ ] music_night.wav (opcional)

### Implementación:
- [x] AudioManager.ts creado
- [x] useAudio.ts creado
- [x] Integrado en GameScene
- [ ] Cargar sonidos generados

---

## 🎯 Próximos Pasos

1. **Generar/Descargar sonidos faltantes**
2. **Descomentar líneas en useAudio.ts:**
   ```typescript
   await manager.loadSound('bee_flap', '/audio/bee_flap.wav', { loop: true, volume: 0.3 })
   await manager.loadSound('wind', '/audio/wind_loop.wav', { loop: true, volume: 0.4 })
   ```
3. **Reproducir sonidos según contexto:**
   ```typescript
   // En BeePlayer.tsx
   const audio = getAudioManager()
   audio?.playSound('bee_flap')
   ```
4. **Ajustar volúmenes en HUD/Settings**

---

## 📚 Recursos

- [Freesound.org](https://freesound.org/)
- [Zapsplat.com](https://www.zapsplat.com/)
- [ElevenLabs Docs](https://elevenlabs.io/docs)
- [Mubert API](https://mubert.com/render/)
- [Tone.js](https://tonejs.github.io/)
- [FFmpeg](https://ffmpeg.org/)

---

**Última actualización:** 14 de Octubre de 2026
