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

def generate_iron_man_thruster(output_path, duration=4.0):
    """
    Iconic Iron Man repulsor / thruster sound:
    - High-frequency turbine whistle (480 Hz with harmonics and FM)
    - Low-frequency rumbling plasma exhaust (60-120 Hz)
    - Filtered turbulent air/plasma rush
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # 1. Jet turbine core (high tech whine)
    core_freq = 420.0
    fm = 1.0 + 0.015 * np.sin(2 * np.pi * 7.5 * t) + 0.008 * np.sin(2 * np.pi * 19.0 * t)
    phase_core = 2 * np.pi * core_freq * np.cumsum(fm) / SAMPLE_RATE
    turbine = (
        0.35 * np.sin(phase_core) +
        0.22 * np.sin(phase_core * 2.0) +
        0.12 * np.sin(phase_core * 3.0) +
        0.08 * np.sin(phase_core * 4.0)
    )
    
    # 2. Sub-bass plasma rumble
    sub_phase = 2 * np.pi * 68.0 * t
    sub_rumble = 0.45 * np.sin(sub_phase) + 0.25 * np.sin(sub_phase * 1.5)
    
    # 3. Plasma jet noise (white noise filtered)
    noise = np.random.normal(0, 1.0, len(t))
    # Bandpass filter around 200-800 Hz via moving average
    box1 = np.ones(25) / 25
    box2 = np.ones(120) / 120
    sm_fast = np.convolve(noise, box1, mode='same')
    sm_slow = np.convolve(noise, box2, mode='same')
    plasma_noise = (sm_fast - sm_slow) * 1.6
    
    # Slight micro-surge / pulse
    surge = 0.9 + 0.1 * np.sin(2 * np.pi * 2.2 * t)
    
    sound = (turbine * 0.45 + sub_rumble * 0.35 + plasma_noise * 0.5) * surge * 0.7
    seamless = make_seamless_loop(sound)
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
    generate_colibri_flutter(os.path.join(base_dir, 'colibri_flutter.wav'))
    generate_butterfly_flutter(os.path.join(base_dir, 'butterfly_flutter.wav'))
