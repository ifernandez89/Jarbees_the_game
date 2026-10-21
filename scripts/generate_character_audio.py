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

def make_seamless_loop(samples, crossfade_samples=8820):
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

def generate_iron_man_thruster(output_path, duration=6.0):
    """
    Original Auren (JarBees NEXO-01) quantum flight propulsion:
    - Deep sub-bass Hex-Core resonance (58 Hz + 116 Hz)
    - Velvety low-pass aerodynamic ion stream (~420 Hz cutoff)
    - Ethereal quantum chord shimmer (F3 - C4 pure tones, 174 & 261 Hz)
    - Zero harsh high-frequency buzzes or whines
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # 1. Warm sub-bass Hex-Core
    f_sub = 58.0
    sub_1 = 0.40 * np.sin(2 * np.pi * f_sub * t)
    sub_2 = 0.22 * np.sin(2 * np.pi * (f_sub * 2.0) * t)
    sub_deep = 0.18 * np.sin(2 * np.pi * (f_sub * 0.5) * t)
    core_layer = sub_1 + sub_2 + sub_deep
    
    # 2. Celestial energy shimmer (F3 / C4 pure intervals with soft chorus)
    chorus_lfo = 0.003 * np.sin(2 * np.pi * 0.25 * t)
    phase_f3 = 2 * np.pi * 174.0 * (t + chorus_lfo)
    phase_c4 = 2 * np.pi * 261.0 * (t - chorus_lfo)
    ether_f3 = 0.12 * np.sin(phase_f3)
    ether_c4 = 0.08 * np.sin(phase_c4)
    ether_layer = ether_f3 + ether_c4
    
    # 3. Velvety ion airflow (double lowpass filtered noise, no high-frequency hiss)
    raw_noise = np.random.normal(0, 1.0, len(t))
    kernel = np.hamming(90)
    kernel /= kernel.sum()
    smooth_noise = np.convolve(raw_noise, kernel, mode='same')
    kernel2 = np.hamming(45)
    kernel2 /= kernel2.sum()
    velvet_air = np.convolve(smooth_noise, kernel2, mode='same') * 1.8
    
    # 4. Gentle dynamic breathing
    breathing = 0.88 + 0.12 * np.sin(2 * np.pi * 0.33 * t)
    
    full_mix = (core_layer * 0.48 + velvet_air * 0.38 + ether_layer * 0.22) * breathing * 0.72
    seamless = make_seamless_loop(full_mix, crossfade_samples=SAMPLE_RATE // 2)
    save_wav(output_path, seamless)

def generate_colibri_flutter(output_path, duration=3.0):
    """
    Hummingbird wing flutter:
    ~75 Hz wingbeats with high harmonics and airy flutter bursts.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    wing_freq = 72.0
    fm = 1.0 + 0.02 * np.sin(2 * np.pi * 14.0 * t)
    phase = 2 * np.pi * wing_freq * np.cumsum(fm) / SAMPLE_RATE
    
    wings = (
        0.40 * np.sin(phase) +
        0.30 * np.sin(phase * 2) +
        0.20 * np.sin(phase * 3) +
        0.15 * np.sin(phase * 4) +
        0.10 * np.sin(phase * 5)
    )
    
    noise = np.random.normal(0, 0.5, len(t))
    box = np.ones(40) / 40
    air = np.convolve(noise, box, mode='same')
    
    am = 0.75 + 0.25 * np.sin(phase)
    sound = (wings * am + air * 0.3) * 0.6
    seamless = make_seamless_loop(sound)
    save_wav(output_path, seamless)

def generate_butterfly_flutter(output_path, duration=4.0):
    """
    Butterfly gentle wing flaps:
    Soft ~10 Hz gentle air swooshes.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    flap_freq = 11.0
    flap_env = np.maximum(0, np.sin(2 * np.pi * flap_freq * t)) ** 2
    
    noise = np.random.normal(0, 0.4, len(t))
    box = np.ones(80) / 80
    whisper = np.convolve(noise, box, mode='same')
    
    sound = whisper * flap_env * 0.8
    seamless = make_seamless_loop(sound)
    save_wav(output_path, seamless)

if __name__ == '__main__':
    base_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
    generate_iron_man_thruster(os.path.join(base_dir, 'iron_man_thruster.wav'))
    generate_iron_man_thruster(os.path.join(base_dir, 'auren_flight.wav'))
    generate_colibri_flutter(os.path.join(base_dir, 'colibri_flutter.wav'))
    generate_butterfly_flutter(os.path.join(base_dir, 'butterfly_flutter.wav'))
