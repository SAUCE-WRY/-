import type { GestureId } from './gestureClassifier';

interface NoteStep {
  freq: number;
  bass?: number;
  beats: number;
}

// Public-domain festive melody medley (Jingle Bells chorus + We Wish You a Merry Christmas phrase)
// Frequencies in Hz (C major / G major bright holiday music-box register)
const N = {
  REST: 0,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
};

const HOLIDAY_MEDLEY: NoteStep[] = [
  // Jingle Bells Chorus
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.E5, bass: N.G3, beats: 2 },
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.E5, bass: N.G3, beats: 2 },
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.G5, beats: 1 },
  { freq: N.C5, bass: N.G3, beats: 1.5 },
  { freq: N.D5, beats: 0.5 },
  { freq: N.E5, bass: N.C4, beats: 3 },
  { freq: N.REST, beats: 1 },

  { freq: N.F5, bass: N.F4, beats: 1 },
  { freq: N.F5, beats: 1 },
  { freq: N.F5, bass: N.C4, beats: 1.5 },
  { freq: N.F5, beats: 0.5 },
  { freq: N.F5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.E5, bass: N.G3, beats: 1 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.E5, bass: N.G3, beats: 1 },
  { freq: N.D5, beats: 1 },
  { freq: N.D5, bass: N.G3, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.D5, bass: N.G3, beats: 2 },
  { freq: N.G5, bass: N.G3, beats: 2 },

  // Second half
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.E5, bass: N.G3, beats: 2 },
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.E5, bass: N.G3, beats: 2 },
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.G5, beats: 1 },
  { freq: N.C5, bass: N.G3, beats: 1.5 },
  { freq: N.D5, beats: 0.5 },
  { freq: N.E5, bass: N.C4, beats: 3 },
  { freq: N.REST, beats: 1 },

  { freq: N.F5, bass: N.F4, beats: 1 },
  { freq: N.F5, beats: 1 },
  { freq: N.F5, bass: N.C4, beats: 1.5 },
  { freq: N.F5, beats: 0.5 },
  { freq: N.F5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 1 },
  { freq: N.E5, bass: N.G3, beats: 1 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.G5, bass: N.G3, beats: 1 },
  { freq: N.G5, beats: 1 },
  { freq: N.F5, bass: N.G3, beats: 1 },
  { freq: N.D5, beats: 1 },
  { freq: N.C5, bass: N.C4, beats: 3.5 },
  { freq: N.REST, beats: 0.5 },

  // We Wish You a Merry Christmas (bright music-box transition)
  { freq: N.G4, bass: N.C4, beats: 1 },
  { freq: N.C5, bass: N.C4, beats: 1 },
  { freq: N.C5, beats: 0.5 },
  { freq: N.D5, beats: 0.5 },
  { freq: N.C5, beats: 0.5 },
  { freq: N.B4, beats: 0.5 },
  { freq: N.A4, bass: N.A3, beats: 1 },
  { freq: N.A4, beats: 1 },
  { freq: N.A4, bass: N.F4, beats: 1 },
  { freq: N.D5, bass: N.D4, beats: 1 },
  { freq: N.D5, beats: 0.5 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.D5, beats: 0.5 },
  { freq: N.C5, beats: 0.5 },
  { freq: N.B4, bass: N.G3, beats: 1 },
  { freq: N.G4, beats: 1 },
  { freq: N.G4, beats: 1 },
  { freq: N.E5, bass: N.C4, beats: 1 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.F5, beats: 0.5 },
  { freq: N.E5, beats: 0.5 },
  { freq: N.D5, beats: 0.5 },
  { freq: N.C5, bass: N.A3, beats: 1 },
  { freq: N.A4, beats: 1 },
  { freq: N.G4, beats: 0.5 },
  { freq: N.G4, beats: 0.5 },
  { freq: N.A4, bass: N.F4, beats: 1 },
  { freq: N.D5, bass: N.G3, beats: 1 },
  { freq: N.B4, beats: 1 },
  { freq: N.C5, bass: N.C4, beats: 3 },
  { freq: N.REST, beats: 1 },
];

const SPARKLE_SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

export class FestiveAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMusicPlaying = false;
  private isMuted = false;
  private volume = 0.72;
  private melodyTimer: number | null = null;
  private stepIndex = 0;
  private lastSfxTime: Record<string, number> = {};
  private sparkleIndex = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.42;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.78;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public startMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.scheduleNextMelodyStep();
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.melodyTimer !== null) {
      window.clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    }
    this.startMusic();
    return true;
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  private scheduleNextMelodyStep(): void {
    if (!this.isMusicPlaying) return;
    const step = HOLIDAY_MEDLEY[this.stepIndex % HOLIDAY_MEDLEY.length];
    this.stepIndex = (this.stepIndex + 1) % HOLIDAY_MEDLEY.length;

    const beatDurationMs = 310; // Cheerful 193 eighth/quarter festive tempo
    const durationSec = (step.beats * beatDurationMs) / 1000;

    if (step.freq > 0) {
      this.playMusicBoxTone(step.freq, durationSec * 1.35, 0.24);
    }
    if (step.bass && step.bass > 0) {
      this.playWarmBassTone(step.bass, durationSec * 1.4, 0.14);
    }

    this.melodyTimer = window.setTimeout(() => {
      this.scheduleNextMelodyStep();
    }, step.beats * beatDurationMs);
  }

  private playMusicBoxTone(freq: number, duration: number, peakGain: number, delaySec = 0): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    const now = ctx.currentTime + delaySec;

    // Fundamental celesta sine + delicate 2nd/3rd crystalline bell harmonics
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const overtoneGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.22, duration));

    overtoneGain.gain.setValueAtTime(0.0001, now);
    overtoneGain.gain.linearRampToValueAtTime(peakGain * 0.22, now + 0.01);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.14, duration * 0.55));

    osc1.connect(gain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.08);
    osc2.stop(now + duration + 0.08);
  }

  private playWarmBassTone(freq: number, duration: number, peakGain: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.3, duration));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.08);
  }

  private playSfxBell(freq: number, duration: number, peak: number, delaySec = 0, type: OscillatorType = 'sine'): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime + delaySec;

    const osc = ctx.createOscillator();
    const shimmer = ctx.createOscillator();
    const gain = ctx.createGain();
    const shimmerGain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(freq * 3.01, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.linearRampToValueAtTime(peak * 0.16, now + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);

    osc.connect(gain);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    shimmer.start(now);
    osc.stop(now + duration + 0.05);
    shimmer.stop(now + duration + 0.05);
  }

  /**
   * Synchronized interactive audio feedback matched to each gesture.
   */
  public playGestureSfx(gesture: GestureId): void {
    if (gesture === 'idle') return;
    const nowMs = performance.now();
    const cooldownMs = gesture === 'pointing' ? 220 : gesture === 'multi_person_easter_egg' ? 2600 : 520;
    if (nowMs - (this.lastSfxTime[gesture] ?? 0) < cooldownMs) return;
    this.lastSfxTime[gesture] = nowMs;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    switch (gesture) {
      case 'open_palm': {
        // Shimmering open wind-chime cascade
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.playSfxBell(f, 0.9, 0.16, i * 0.055);
        });
        break;
      }
      case 'closed_fist': {
        // Warm velvet gravitational swell
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.42);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.5);
        this.playSfxBell(392, 0.55, 0.11, 0.04);
        break;
      }
      case 'pointing': {
        // Sparkling harp/glockenspiel notes ascending the pentatonic holiday scale
        const f = SPARKLE_SCALE[this.sparkleIndex % SPARKLE_SCALE.length];
        this.sparkleIndex++;
        this.playSfxBell(f, 0.55, 0.17, 0);
        this.playSfxBell(f * 1.5, 0.35, 0.07, 0.04);
        break;
      }
      case 'victory': {
        // Festive firework whoosh + shimmering high chimes
        const now = ctx.currentTime;
        const bufferSize = Math.floor(ctx.sampleRate * 0.25);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(4200, now + 0.22);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.11, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now);

        [783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => {
          this.playSfxBell(f, 0.75, 0.16, 0.07 + i * 0.05);
        });
        break;
      }
      case 'thumbs_up': {
        // Triumphant golden crown ascending celesta & bell fanfare
        const crownNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
        crownNotes.forEach((f, i) => {
          this.playSfxBell(f, 1.05, 0.16, i * 0.052, 'sine');
          if (i >= 3) this.playSfxBell(f * 0.5, 0.85, 0.08, i * 0.052, 'triangle');
        });
        break;
      }
      case 'pinch': {
        // Upgraded OK gesture: sacred crystal prism celesta & diamond harmonic resonance
        [1046.5, 1318.51, 1567.98, 2093.0, 2637.02].forEach((f, i) => {
          this.playSfxBell(f, 1.25, 0.14, i * 0.062, 'sine');
          this.playSfxBell(f * 1.5, 0.72, 0.048, i * 0.062 + 0.025, 'triangle');
        });
        this.playSfxBell(523.25, 1.5, 0.09, 0, 'sine');
        break;
      }
      case 'heart_gesture': {
        // Romantic rose-gold music-box & warm harp tenderness
        const heartChord = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51];
        heartChord.forEach((f, i) => {
          this.playSfxBell(f, 1.25, 0.15, i * 0.075, 'sine');
        });
        break;
      }
      case 'two_hand_halo': {
        // Ethereal dual-star halo chord
        [392.0, 523.25, 659.25, 987.77, 1174.66].forEach((f, i) => {
          this.playSfxBell(f, 1.3, 0.14, i * 0.045, 'triangle');
        });
        break;
      }
      case 'two_hand_snowglobe': {
        // Shimmering crystal snowglobe glass-harmonica dome chord
        [440.0, 523.25, 659.25, 880.0, 1046.5, 1318.51].forEach((f, i) => {
          this.playSfxBell(f, 1.6, 0.12, i * 0.06, 'sine');
        });
        break;
      }
      case 'two_hand_meteor_shower': {
        // Sparkling cascading shooting-star harp glissando
        const meteorRun = [1567.98, 1318.51, 1174.66, 1046.5, 880.0, 783.99, 1046.5, 1318.51, 1567.98];
        meteorRun.forEach((f, i) => {
          this.playSfxBell(f, 0.72, 0.14, i * 0.045, 'sine');
        });
        break;
      }
      case 'multi_person_easter_egg': {
        // Grand cathedral Christmas fanfare!
        const fanfare = [
          { f: 523.25, d: 0.0 },
          { f: 659.25, d: 0.08 },
          { f: 783.99, d: 0.16 },
          { f: 1046.5, d: 0.24 },
          { f: 1318.51, d: 0.34 },
          { f: 1567.98, d: 0.44 },
          { f: 1046.5, d: 0.56 },
          { f: 1567.98, d: 0.68 },
          { f: 2093.0, d: 0.82 },
        ];
        fanfare.forEach(({ f, d }) => {
          this.playSfxBell(f, 1.45, 0.18, d, 'sine');
          this.playSfxBell(f * 0.5, 1.25, 0.09, d, 'triangle');
        });
        break;
      }
    }
  }

  public playBlessingChord(): void {
    const chord = [523.25, 659.25, 783.99, 987.77, 1318.51, 1567.98];
    chord.forEach((f, i) => {
      this.playSfxBell(f, 1.4, 0.16, i * 0.065, 'sine');
    });
  }

  public playGiftUnwrapChime(): void {
    const unwrapNotes = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0];
    unwrapNotes.forEach((f, i) => {
      this.playSfxBell(f, 1.35, 0.17, i * 0.06, 'sine');
    });
  }

  public playGenesisStageChime(stageId: number): void {
    const chords: number[][] = [
      [392.0, 523.25],
      [440.0, 587.33, 659.25],
      [523.25, 659.25, 783.99],
      [587.33, 783.99, 987.77, 1174.66],
      [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98],
    ];
    const notes = chords[Math.min(chords.length - 1, Math.max(0, stageId))];
    notes.forEach((f, i) => {
      this.playSfxBell(f, 1.35, 0.15, i * 0.07);
    });
  }

  public dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
