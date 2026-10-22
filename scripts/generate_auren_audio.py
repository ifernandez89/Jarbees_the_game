import os
import wave
import numpy as np

SAMPLE_RATE = 44100

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def save_wav(filename, samples, sample_rate=SAMPLE_RATE):
    ensure_dir(filename)
    samples = np.clip(samples, -1.0, 1.0)
    int_samples = (samples * 32767).astype(np.int16)
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(int_samples.tobytes())
    print(f"Generated: {filename} ({len(samples)/sample_rate:.2f}s)")

def make_seamless_loop(samples, crossfade_samples=22050):
    """
    Bucle sin saltos con crossfade cosenoidal suave
    """
    length = len(samples)
    cf = min(crossfade_samples, length // 4)
    head = samples[:cf]
    tail = samples[-cf:]
    t = np.linspace(0, 1, cf)
    fade_in = np.sin(t * np.pi / 2)
    fade_out = np.cos(t * np.pi / 2)
    blend = tail * fade_out + head * fade_in
    result = np.zeros(length - cf, dtype=np.float32)
    result[:cf] = blend
    result[cf:] = samples[cf:length - cf]
    return result

def generate_auren_flight_sound(duration=8.0):
    """
    Paisaje acústico 100% original, continuo y de alta fidelidad para Auren (JarBees NEXO-01):
    - CERO zumbido eléctrico de 50-60Hz.
    - CERO modulación intermitente o respiración repetitiva (sin vaivenes oscilatorios molestos).
    - Capa 1: Núcleo cuántico cristalino (Armónicos puros y cálidos en A2 / E3 / A3 / C#4: 110, 165, 220, 277.18 Hz).
    - Capa 2: Resonancia de plasma ionizado etéreo (Acorde estelar 440 Hz y 660 Hz con micro-fase constante).
    - Capa 3: Flujo de micro-propulsión iónica (Ruido rosa aterciopelado con filtrado bicuadrático suave).
    - Capa 4: Shimmer cibernético de alta tecnología (Presencia sutil a 880 Hz a muy bajo volumen).
    - Amplitud constante, sedosa y relajante para el oído durante sesiones prolongadas de vuelo y exploración.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)

    # 1. Armónicos del Núcleo Cuántico (Tonos puros sinusoidales cálidos, sin distorsión armónica)
    # Fundamental elegante A2 (110 Hz) + Quinta justa E3 (165 Hz) + Octava A3 (220 Hz)
    layer_110 = 0.28 * np.sin(2 * np.pi * 110.0 * t)
    layer_165 = 0.18 * np.sin(2 * np.pi * 165.0 * t)
    layer_220 = 0.14 * np.sin(2 * np.pi * 220.0 * t)
    layer_277 = 0.08 * np.sin(2 * np.pi * 277.18 * t) # Tercera mayor C#4, da sensación luminosa/heroica
    core_harmonic = layer_110 + layer_165 + layer_220 + layer_277

    # 2. Resonancia de plasma etéreo (acorde sci-fi superior con fase ultra-lenta para riqueza estéreo/textura)
    chorus = 0.0008 * np.sin(2 * np.pi * 0.04 * t) # micro-chorus casi imperceptible (0.04 Hz = 25 segundos por ciclo)
    plasma_440 = 0.06 * np.sin(2 * np.pi * 440.0 * (t + chorus))
    plasma_660 = 0.035 * np.sin(2 * np.pi * 660.0 * (t - chorus))
    plasma_layer = plasma_440 + plasma_660

    # 3. Flujo aerodinámico iónico sedoso (Ruido filtrado paso-bajo sin siseos ni chasquidos)
    np.random.seed(42) # Reproducibilidad limpia
    raw_noise = np.random.normal(0, 1.0, len(t))
    # Filtro pasa-bajos convolucional suave para eliminar frecuencias medias/altas ásperas
    kernel_size = 120
    kernel = np.hanning(kernel_size)
    kernel /= kernel.sum()
    smooth_noise = np.convolve(raw_noise, kernel, mode='same')
    # Segunda pasada para respuesta aterciopelada
    kernel2 = np.hanning(60)
    kernel2 /= kernel2.sum()
    ion_flow = np.convolve(smooth_noise, kernel2, mode='same') * 2.2

    # 4. Micro-shimmer cibernético de alta tecnología
    shimmer = 0.02 * np.sin(2 * np.pi * 880.0 * t)

    # 5. Mezcla final equilibrada y constante (CERO modulación de volumen, CERO intermitencia)
    mix = (core_harmonic * 0.45 + plasma_layer * 0.35 + ion_flow * 0.28 + shimmer * 0.12) * 0.70

    # Bucle perfecto sin saltos
    seamless = make_seamless_loop(mix, crossfade_samples=SAMPLE_RATE)
    return seamless

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'audio'))
    sound = generate_auren_flight_sound(duration=8.0)

    save_wav(os.path.join(base_dir, 'auren_flight.wav'), sound)
    save_wav(os.path.join(base_dir, 'iron_man_thruster.wav'), sound)
    print("[OK] Nuevo audio original, continuo y libre de zumbidos creado exitosamente para Auren.")
