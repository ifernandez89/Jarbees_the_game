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

def make_seamless_loop(samples, crossfade_samples=17640):
    """
    Seamless loop with generous 0.4s sinusoidal crossfade
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

def generate_auren_flight_sound(duration=6.0):
    """
    Sonido original para Auren (JarBees NEXO-01):
    - Elimina completamente cualquier zumbido agudo o estridente (sin frecuencias molestas de 400-2000Hz tipo mosquito o taladro).
    - Capa 1: Reactor cuántico Hex-Core sub-grave cálido y aterciopelado (58 Hz fundamental + 116 Hz armónico suave).
    - Capa 2: Desplazamiento aerodinámico sedoso (ruido marrón/rosa filtrado pasa-bajos a ~420 Hz).
    - Capa 3: Resonancia armónica etérea (acorde puro en quinta justa 174 Hz y 261 Hz con chorus ultra-lento de 0.2 Hz).
    - Capa 4: Micro-pulsaciones de energía cuántica (respiración suave de propulsión a 0.3 Hz).
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # 1. Sub-grave Hex-Core (cálido, profundo, sin asperezas)
    f_sub = 58.0
    sub_1 = 0.40 * np.sin(2 * np.pi * f_sub * t)
    sub_2 = 0.22 * np.sin(2 * np.pi * (f_sub * 2.0) * t)
    sub_deep = 0.18 * np.sin(2 * np.pi * (f_sub * 0.5) * t)
    core_layer = sub_1 + sub_2 + sub_deep
    
    # 2. Resonancia etérea de energía (Acorde F3 - C4 puro con phasing suave)
    # Sin zumbidos: tonos puros de amplitud baja que dan identidad de ciencia ficción cinematográfica
    chorus_lfo = 0.003 * np.sin(2 * np.pi * 0.25 * t)
    phase_f3 = 2 * np.pi * 174.0 * (t + chorus_lfo)
    phase_c4 = 2 * np.pi * 261.0 * (t - chorus_lfo)
    ether_f3 = 0.12 * np.sin(phase_f3)
    ether_c4 = 0.08 * np.sin(phase_c4)
    ether_layer = ether_f3 + ether_c4
    
    # 3. Flujo aerodinámico ionizado (Ruido marrón ultra-filtrado pasa-bajos, sedoso)
    raw_noise = np.random.normal(0, 1.0, len(t))
    # Doble filtro pasa-bajos por convolución para eliminar todo 'hiss' o siseo agudo
    kernel_size = 90  # ~490 Hz cutoff
    kernel = np.hamming(kernel_size)
    kernel /= kernel.sum()
    smooth_noise = np.convolve(raw_noise, kernel, mode='same')
    # Segunda pasada para pendientes ultra suaves
    kernel2 = np.hamming(45)
    kernel2 /= kernel2.sum()
    velvet_air = np.convolve(smooth_noise, kernel2, mode='same') * 1.8
    
    # 4. Modulación dinámica de respiración aerodinámica
    breathing = 0.88 + 0.12 * np.sin(2 * np.pi * 0.33 * t)
    
    # Mezcla equilibrada: presencia rica, descansada para el oído, poderosa
    full_mix = (core_layer * 0.48 + velvet_air * 0.38 + ether_layer * 0.22) * breathing * 0.72
    
    # Bucle perfecto sin saltos
    seamless = make_seamless_loop(full_mix, crossfade_samples=SAMPLE_RATE // 2)
    return seamless

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'audio'))
    sound = generate_auren_flight_sound(duration=6.0)
    
    # Guardar tanto en auren_flight.wav como sobrescribir iron_man_thruster.wav para compatibilidad total
    save_wav(os.path.join(base_dir, 'auren_flight.wav'), sound)
    save_wav(os.path.join(base_dir, 'iron_man_thruster.wav'), sound)
    print("[OK] Nuevos audios originales para Auren creados exitosamente.")
