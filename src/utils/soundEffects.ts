// Audio utility using Web Audio API
// 100% reliable, zero external dependencies, works offline and in iframe
// Strictly NO robotic TTS, NO AI voice. Natural, short, gentle acoustic chimes and applause.

const SOUND_STORAGE_KEY = 'almustanir_sound_enabled';

export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// 1. Victory Fanfare / Chime (نغمة الفوز والتألق الملكية)
export function playVictoryChime() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
  const now = ctx.currentTime;

  // Harmonized celebratory chimes with bell shimmer
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

    gain.gain.setValueAtTime(0, now + idx * 0.1);
    gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.1);
    osc.stop(now + idx * 0.1 + 1.5);
  });

  // Final sustained triumphant fifth chord
  setTimeout(() => {
    const ctx2 = getAudioContext();
    if (!ctx2) return;
    const now2 = ctx2.currentTime;
    [1046.5, 1318.51, 1567.98].forEach((freq) => {
      const osc = ctx2.createOscillator();
      const gain = ctx2.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now2);
      gain.gain.setValueAtTime(0.2, now2);
      gain.gain.exponentialRampToValueAtTime(0.001, now2 + 1.2);
      osc.connect(gain);
      gain.connect(ctx2.destination);
      osc.start(now2);
      osc.stop(now2 + 1.3);
    });
  }, 450);
}

// 2. Realistic Applause & Cheering (تصفيق جماعي حماسي واقعي مع هتاف جمهور)
export function playApplause() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 2.8;
  const now = ctx.currentTime;

  // Layer 1: Stereo-like textured handclaps using randomized impulse train
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Density increases in the first 0.4s then holds, then slowly fades
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const envelope = t < 0.3 ? t / 0.3 : Math.exp(-(t - 0.3) / 1.8);

    // Multiple randomized clap impacts
    const isClapBurst = Math.random() < 0.025;
    if (isClapBurst) {
      const amplitude = (Math.random() * 2 - 1) * 2.5 * envelope;
      data[i] = amplitude;
      // Tail decay of individual clap
      if (i + 1 < bufferSize) data[i + 1] = amplitude * 0.6;
      if (i + 2 < bufferSize) data[i + 2] = amplitude * -0.3;
    } else {
      data[i] = (Math.random() * 2 - 1) * 0.15 * envelope;
    }
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.Q.setValueAtTime(0.9, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + duration);

  // Layer 2: Warm cheerful crowd murmur resonance
  const murmurOsc = ctx.createOscillator();
  const murmurGain = ctx.createGain();
  const murmurFilter = ctx.createBiquadFilter();
  murmurOsc.type = 'sawtooth';
  murmurOsc.frequency.setValueAtTime(220, now);
  murmurFilter.type = 'lowpass';
  murmurFilter.frequency.setValueAtTime(400, now);
  murmurGain.gain.setValueAtTime(0.05, now);
  murmurGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  murmurOsc.connect(murmurFilter);
  murmurFilter.connect(murmurGain);
  murmurGain.connect(ctx.destination);
  murmurOsc.start(now);
  murmurOsc.stop(now + duration);

  // Accompanying celebration ding
  setTimeout(() => {
    playSuccessDing();
  }, 120);
}

// 2b. Royal Brass Trumpet Fanfare (نفخ الأبواق الملكية الاحتفالية)
export function playTrumpetFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Trumpet fanfare notes: G4 -> C5 -> E5 -> G5
  const fanfareNotes = [
    { freq: 392.0, time: 0.0, dur: 0.15 },
    { freq: 523.25, time: 0.16, dur: 0.15 },
    { freq: 659.25, time: 0.32, dur: 0.15 },
    { freq: 783.99, time: 0.48, dur: 0.6 },
    { freq: 1046.5, time: 1.1, dur: 0.9 },
  ];

  fanfareNotes.forEach((note) => {
    const startTime = now + note.time;

    // Dual detuned saw for authentic brass tone
    [-2, 2].forEach((detune) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, startTime);
      osc.detune.setValueAtTime(detune, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, startTime);
      filter.Q.setValueAtTime(2, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.05);
    });
  });
}

// 2c. Cheering Ovation (تصفيق حار مع هتاف وأبواق)
export function playCheeringOvation() {
  playApplause();
  setTimeout(() => {
    playTrumpetFanfare();
  }, 150);
}

// 2c-2. Party Cannon Pop / Confetti Blast (صوت مفرقعات وقصاصات الاحتفال)
export function playCelebrationPopper() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Layer 1: Confetti Cannon Air Burst (Noise pop)
  const bufferSize = Math.floor(ctx.sampleRate * 0.18);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 16);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1400, now);
  noiseFilter.Q.setValueAtTime(1.2, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);

  // Layer 2: Sub-bass Timpani Impact (Thump)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(180, now);
  subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

  subGain.gain.setValueAtTime(0.5, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.2);

  // Layer 3: High streamers whistle/shimmer
  const whistleOsc = ctx.createOscillator();
  const whistleGain = ctx.createGain();
  whistleOsc.type = 'triangle';
  whistleOsc.frequency.setValueAtTime(1800, now);
  whistleOsc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

  whistleGain.gain.setValueAtTime(0.12, now);
  whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  whistleOsc.connect(whistleGain);
  whistleGain.connect(ctx.destination);
  whistleOsc.start(now);
  whistleOsc.stop(now + 0.15);
}

// 2c-3. Grand Multi-Layered Celebration Sound (المعزوفة الاحتفالية الكبرى الفخمة)
export function playGrandCelebrationSound(type?: string) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // 1. Immediate dual confetti cannon blasts
  playCelebrationPopper();
  setTimeout(() => {
    playCelebrationPopper();
  }, 160);

  // 2. High-energy celebratory brass fanfare
  const now = ctx.currentTime;
  const brassNotes = [
    { freq: 523.25, time: 0.05, dur: 0.14 }, // C5
    { freq: 659.25, time: 0.18, dur: 0.14 }, // E5
    { freq: 783.99, time: 0.30, dur: 0.14 }, // G5
    { freq: 1046.5, time: 0.44, dur: 0.65 }, // C6 (High triumph climax)
    { freq: 1318.51, time: 0.44, dur: 0.65 }, // E6 harmony
  ];

  brassNotes.forEach((note) => {
    const startTime = now + note.time;
    [-4, 4].forEach((detune) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, startTime);
      osc.detune.setValueAtTime(detune, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, startTime);
      filter.Q.setValueAtTime(1.8, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.05);
    });
  });

  // 3. Cascading Golden Glockenspiel Stardust Bells
  const bells = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0];
  bells.forEach((freq, idx) => {
    const bellTime = now + 0.5 + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, bellTime);

    gain.gain.setValueAtTime(0, bellTime);
    gain.gain.linearRampToValueAtTime(0.18, bellTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, bellTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(bellTime);
    osc.stop(bellTime + 0.9);
  });

  // 4. Warm, rich celebratory crowd applause
  setTimeout(() => {
    playApplause();
  }, 300);
}

// 2d. Natural Gentle Success Bell (جرس نجاح طبيعي نقي وخفيف بدون أي أصوات روبوتية)
export function playGentleSuccessBell() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const harmonics = [880.0, 1320.0, 1760.0]; // Pure acoustic chime bell harmonics

  harmonics.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const amp = 0.15 / (idx + 1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.3);
  });
}

// 2e. Stage Reveal Cue (نغمة كشف المرحلة في المسار السري)
export function playStageRevealCue() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 ascending

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const noteTime = now + idx * 0.09;
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.95);
  });
}

// Legacy alias kept for backwards compatibility but triggers natural gentle bell
export function speakArabicPraise(_message?: string, _studentName?: string) {
  playGentleSuccessBell();
}

// 3. Magic Star Twinkle (نجمة التفوق والتألق)
export function playMagicTwinkle() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0];
  const now = ctx.currentTime;

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.9);
  });
}

// 4. Crown of Dignity / Royal Fanfare (تاج الوقار القرآني)
export function playCrownFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const chords = [
    [440, 554.37, 659.25], // A major
    [554.37, 659.25, 830.61], // C#m
    [659.25, 830.61, 987.77], // E
    [880, 1108.73, 1318.51], // High A major climax
  ];

  const now = ctx.currentTime;

  chords.forEach((chord, step) => {
    const startTime = now + step * 0.28;
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.75);
    });
  });
}

// 5. Success Ding / Correct Answer (رنين الإجابة الصحيحة والتميز)
export function playSuccessDing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [659.25, 1046.5]; // E5, C6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

    gain.gain.setValueAtTime(0, now + idx * 0.1);
    gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.1);
    osc.stop(now + idx * 0.1 + 1.0);
  });
}

// 6. Wheel Spin Tick (تكة دوران العجلة)
export function playWheelTick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.035);
}

// 7. Timer Gong / Bell (جرس انتهاء التحدي والمؤقت)
export function playTimerEndGong() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [392.0, 587.33, 783.99]; // G4, D5, G5

  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.9);
  });
}
