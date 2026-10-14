import math
import struct
import wave
import os
import numpy as np

SAMPLE_RATE = 44100

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def save_wav(filename, samples, sample_rate=SAMPLE_RATE):
    """Save float numpy array (-1.0 to 1.0) as 16-bit PCM WAV."""
    ensure_dir(filename)
    # Clip to -1.0 to 1.0
    samples = np.clip(samples, -1.0, 1.0)
    int_samples = (samples * 32767).astype(np.int16)
    
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes = 16 bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(int_samples.tobytes())
    print(f"Generated: {filename} ({len(samples)/sample_rate:.2f}s)")

def make_seamless_loop(samples, crossfade_samples=4410):
    """Apply equal-power crossfade between the end and the start to make a 100% seamless loop."""
    length = len(samples)
    cf = min(crossfade_samples, length // 4)
    head = samples[:cf]
    tail = samples[-cf:]
    
    t = np.linspace(0, 1, cf)
    fade_in = np.sin(t * np.pi / 2)
    fade_out = np.cos(t * np.pi / 2)
    
    # Blended seam
    blend = tail * fade_out + head * fade_in
    
    # Loopable array of length (length - cf)
    result = np.zeros(length - cf, dtype=np.float32)
    result[:cf] = blend
    result[cf:] = samples[cf:length - cf]
    return result

def generate_bee_buzz(output_path, duration=3.0):
    """
    Synthesize realistic bee wing buzz:
    Honeybee wingbeat is ~220-240 Hz with rich harmonic content,
    slight FM flutter (vibrato) and AM amplitude flutter.
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    # Vibrato / jitter (8 to 15 Hz subtle flight jitter)
    fm = 1.0 + 0.025 * np.sin(2 * np.pi * 11.5 * t) + 0.012 * np.sin(2 * np.pi * 23.0 * t)
    base_freq = 225.0
    phase = 2 * np.pi * base_freq * np.cumsum(fm) / SAMPLE_RATE
    
    # Harmonics: fundamental and overtone series typical of insect wing buzz
    # Wing displacement behaves like a sawtooth / pulse wave with resonance
    harmonics = [
        (1.0, 0.45),   # 225 Hz
        (2.0, 0.35),   # 450 Hz
        (3.0, 0.28),   # 675 Hz
        (4.0, 0.20),   # 900 Hz
        (5.0, 0.15),   # 1125 Hz
        (6.0, 0.10),   # 1350 Hz
        (7.0, 0.08),   # 1575 Hz
        (8.0, 0.05),   # 1800 Hz
    ]
    
    buzz = np.zeros_like(t)
    for mult, weight in harmonics:
        buzz += weight * np.sin(phase * mult)
        
    # Add slight aerodynamic fluttering noise (air turbulence from wing edges)
    noise = np.random.normal(0, 0.08, len(t))
    # Low-pass filter noise around 1000 Hz
    window_size = 30
    filtered_noise = np.convolve(noise, np.ones(window_size)/window_size, mode='same')
    
    # Flutter envelope (fast AM micro-bursts of wingbeats)
    am = 0.85 + 0.15 * np.sin(phase)
    
    final_sound = (buzz * am + filtered_noise * 0.4) * 0.7
    
    # Ensure seamless looping
    seamless = make_seamless_loop(final_sound, crossfade_samples=8820)
    save_wav(output_path, seamless)

def generate_wind_loop(output_path, duration=6.0):
    """
    Synthesize soothing organic ambient wind:
    Bandpass filtered brownian noise with slow gusts and breathing.
    """
    num_samples = int(SAMPLE_RATE * duration)
    # Generate pink/brownian noise
    white = np.random.normal(0, 1.0, num_samples)
    # Integrate to brownian noise
    brown = np.cumsum(white)
    brown = brown - np.mean(brown)
    brown = brown / (np.max(np.abs(brown)) + 1e-6)
    
    # Filter for wind character (resonance between 200 Hz and 700 Hz)
    # Simple moving average filters
    smooth_fast = np.convolve(brown, np.ones(25)/25, mode='same')
    smooth_slow = np.convolve(brown, np.ones(120)/120, mode='same')
    wind_raw = smooth_fast - smooth_slow * 0.6
    
    t = np.linspace(0, duration, num_samples, endpoint=False)
    # Slow dynamic gusts (0.15 Hz and 0.35 Hz)
    gusts = 0.65 + 0.25 * np.sin(2 * np.pi * 0.18 * t) + 0.10 * np.sin(2 * np.pi * 0.37 * t + 1.2)
    
    wind = wind_raw * gusts
    # Normalize
    wind = wind / (np.max(np.abs(wind)) + 1e-6) * 0.45
    
    seamless = make_seamless_loop(wind, crossfade_samples=SAMPLE_RATE)
    save_wav(output_path, seamless)

def generate_night_crickets(output_path, duration=5.0):
    """
    Synthesize soothing summer night crickets:
    Rhythmic chirp clusters at ~4.8 kHz with chirping cycles and subtle background chorus.
    """
    num_samples = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    
    # Carrier frequency around 4.7 kHz
    carrier = np.sin(2 * np.pi * 4750 * t) + 0.25 * np.sin(2 * np.pi * 9500 * t)
    
    # Cricket chirp rhythm:
    # A chirp consists of 3-4 pulses of 20ms duration each, repeating every 0.6 seconds
    chirp_cycle = 0.7  # seconds per chirp cycle
    pulse_freq = 50.0  # Hz within a chirp
    
    # Envelope
    env = np.zeros(num_samples)
    for cycle_start in np.arange(0, duration, chirp_cycle):
        # 3 pulses in each chirp
        for p in range(3):
            p_start = cycle_start + p * 0.022
            p_end = p_start + 0.016
            mask = (t >= p_start) & (t < p_end)
            if np.any(mask):
                sub_t = t[mask] - p_start
                # Smooth bell curve pulse
                pulse_env = np.sin(np.pi * (sub_t / 0.016)) ** 2
                env[mask] += pulse_env * 0.75
                
    # Distant second cricket (lower pitch ~4.3 kHz, offset in time)
    carrier2 = np.sin(2 * np.pi * 4300 * t)
    env2 = np.zeros(num_samples)
    for cycle_start in np.arange(0.35, duration, 0.85):
        for p in range(3):
            p_start = cycle_start + p * 0.025
            p_end = p_start + 0.018
            mask = (t >= p_start) & (t < p_end)
            if np.any(mask):
                sub_t = t[mask] - p_start
                pulse_env = np.sin(np.pi * (sub_t / 0.018)) ** 2
                env2[mask] += pulse_env * 0.35

    crickets = (carrier * env + carrier2 * env2) * 0.35
    seamless = make_seamless_loop(crickets, crossfade_samples=int(SAMPLE_RATE * 0.8))
    save_wav(output_path, seamless)

def generate_pause_sound(output_path):
    """Synthesize clean, pleasant acoustic chime for pause/unpause."""
    duration = 0.35
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Two harmonic tones (C5 & G5)
    tone1 = np.sin(2 * np.pi * 523.25 * t)
    tone2 = np.sin(2 * np.pi * 783.99 * t) * 0.6
    
    envelope = np.exp(-12.0 * t)
    sound = (tone1 + tone2) * envelope * 0.4
    save_wav(output_path, sound)

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'audio'))
    print(f"Generating audio assets in: {base_dir}")
    
    generate_bee_buzz(os.path.join(base_dir, 'bee_buzz.wav'))
    generate_wind_loop(os.path.join(base_dir, 'wind_loop.wav'))
    generate_night_crickets(os.path.join(base_dir, 'night_crickets.wav'))
    generate_pause_sound(os.path.join(base_dir, 'pause.wav'))
    print("All audio assets generated successfully!")
