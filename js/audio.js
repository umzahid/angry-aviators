// Tiny synthesized soundtrack and sound-effect kit.
// No audio files: every sound is generated with the Web Audio API.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.noiseBuffer = null;
    this.enabled = true;
    this.musicRunning = false;
    this.musicTimer = null;
    this.nextNoteTime = 0;
    this.step = 0;
    this.musicDuck = 1;
    this.lastImpact = { wood: 0, stone: 0, ice: 0, tnt: 0 };
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.9 : 0;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.72;
      this.sfx.connect(this.master);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.12;
      this.music.connect(this.master);
      this.noiseBuffer = this.makeNoiseBuffer(2);
      if (this.enabled) this.startMusic();
    } catch (error) {
      console.warn('Audio unavailable', error);
    }
  }

  makeNoiseBuffer(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  arm() {
    const unlock = () => {
      this.init();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  setEnabled(value) {
    this.enabled = !!value;
    if (!this.ctx) {
      if (this.enabled) this.arm();
      return;
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(this.enabled ? 0.9 : 0, now + 0.12);
    if (this.enabled) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setMusicDuck(amount) {
    if (!this.ctx) return;
    this.musicDuck = amount;
    const now = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.linearRampToValueAtTime(0.12 * amount, now + 0.3);
  }

  startMusic() {
    if (!this.enabled || !this.ctx || this.musicRunning) return;
    this.musicRunning = true;
    this.nextNoteTime = this.ctx.currentTime + 0.12;
    this.step = 0;
    const schedule = () => {
      if (!this.musicRunning || !this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + 0.28) {
        this.scheduleStep(this.step, this.nextNoteTime);
        this.step += 1;
        this.nextNoteTime += 0.5;
      }
    };
    schedule();
    this.musicTimer = setInterval(schedule, 90);
    this.music.gain.cancelScheduledValues(this.ctx.currentTime);
    this.music.gain.setTargetAtTime(0.12 * this.musicDuck, this.ctx.currentTime, 0.4);
  }

  stopMusic() {
    this.musicRunning = false;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.music && this.ctx) {
      const now = this.ctx.currentTime;
      this.music.gain.cancelScheduledValues(now);
      this.music.gain.setTargetAtTime(0, now, 0.08);
    }
  }

  scheduleStep(step, time) {
    // Four-bar ukulele campfire loop in C major.
    const chords = [
      [48, 55, 60, 64], // C
      [45, 52, 57, 60], // Am
      [41, 48, 53, 57], // F
      [43, 50, 55, 59]  // G
    ];
    const chord = chords[Math.floor(step / 8) % 4];
    const eighth = step % 8;
    const barBeat = step % 8;

    // Bass pluck.
    if (barBeat === 0 || barBeat === 4) {
      this.musicPluck(this.midiToHz(chord[0] - 12), time, 0.7, 0.055, 'triangle');
    }

    // Ukulele-like arpeggio on every eighth note.
    const arp = [0, 1, 2, 3, 2, 1, 3, 2];
    const note = chord[arp[eighth]] + 12;
    this.musicPluck(this.midiToHz(note), time + 0.01, 0.32, eighth % 2 === 0 ? 0.032 : 0.022, 'triangle');

    // A little whistled melody in the second half of each bar.
    const melody = [72, null, 76, 79, null, 76, 74, null, 69, null, 72, 76, null, 74, 72, null];
    const m = melody[step % 16];
    if (m) {
      this.musicPluck(this.midiToHz(m + 12), time + 0.04, 0.55, 0.017, 'sine');
    }

    // Soft shaker on off-beats.
    if (eighth % 2 === 1 && this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.playbackRate.value = 1.6;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6500;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.009, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);
      src.connect(filter).connect(gain).connect(this.music);
      src.start(time);
      src.stop(time + 0.07);
    }
  }

  midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  musicPluck(freq, time, duration, volume, type) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(900, freq * 3.5), time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.4), time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(filter).connect(gain).connect(this.music);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  tone({ type = 'sine', freq = 440, freqEnd = null, duration = 0.2, volume = 0.12, delay = 0, attack = 0.008, filterFreq = null }) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    if (filterFreq) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      osc.connect(filter).connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this.sfx);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  noise({ duration = 0.2, volume = 0.1, type = 'bandpass', freq = 800, freqEnd = null, q = 0.9, delay = 0, rate = 1 }) {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = rate;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, now);
    if (freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter).connect(gain).connect(this.sfx);
    src.start(now);
    src.stop(now + duration + 0.03);
  }

  click() {
    this.tone({ type: 'triangle', freq: 680, freqEnd: 880, duration: 0.075, volume: 0.045 });
  }

  hover() {
    this.tone({ type: 'sine', freq: 420, freqEnd: 470, duration: 0.04, volume: 0.014 });
  }

  stretch(amount) {
    if (!this.enabled) return;
    this.tone({ type: 'sawtooth', freq: 120 + amount * 45, freqEnd: 150 + amount * 55, duration: 0.07, volume: 0.012, filterFreq: 700 });
  }

  launch() {
    this.noise({ duration: 0.33, volume: 0.11, type: 'bandpass', freq: 300, freqEnd: 1700, q: 0.6 });
    this.tone({ type: 'sine', freq: 460, freqEnd: 220, duration: 0.18, volume: 0.03 });
    this.tone({ type: 'square', freq: 1200, freqEnd: 1700, duration: 0.07, volume: 0.02, delay: 0.04 });
  }

  impact(material, strength = 1) {
    if (!this.enabled || !this.ctx) return;
    const now = performance.now();
    const cooldown = material === 'ice' ? 38 : 62;
    if (now - (this.lastImpact[material] || 0) < cooldown) return;
    this.lastImpact[material] = now;
    const s = Math.min(1.4, strength);
    if (material === 'ice') {
      this.noise({ duration: 0.13, volume: 0.055 + s * 0.035, type: 'highpass', freq: 1800, freqEnd: 4400, q: 0.5 });
      this.tone({ type: 'triangle', freq: 2200, freqEnd: 3200, duration: 0.08, volume: 0.02 });
    } else if (material === 'stone') {
      this.noise({ duration: 0.16, volume: 0.06 + s * 0.05, type: 'lowpass', freq: 300, freqEnd: 100, q: 0.6 });
      this.tone({ type: 'sine', freq: 95, freqEnd: 55, duration: 0.16, volume: 0.06 * s });
    } else if (material === 'tnt') {
      this.explode(0.75);
    } else {
      this.noise({ duration: 0.14, volume: 0.05 + s * 0.04, type: 'bandpass', freq: 500, freqEnd: 220, q: 1.2 });
      this.tone({ type: 'sine', freq: 160, freqEnd: 90, duration: 0.1, volume: 0.025 * s });
    }
  }

  pigHit() {
    this.tone({ type: 'square', freq: 340, freqEnd: 510, duration: 0.08, volume: 0.028 });
    this.tone({ type: 'square', freq: 500, freqEnd: 390, duration: 0.08, volume: 0.018, delay: 0.06 });
  }

  pigPop() {
    this.tone({ type: 'sine', freq: 280, freqEnd: 710, duration: 0.12, volume: 0.08 });
    this.tone({ type: 'triangle', freq: 900, freqEnd: 520, duration: 0.19, volume: 0.05, delay: 0.05 });
    this.noise({ duration: 0.12, volume: 0.04, type: 'bandpass', freq: 1200, freqEnd: 500 });
  }

  explode(strength = 1) {
    this.noise({ duration: 0.75, volume: 0.28 * strength, type: 'lowpass', freq: 1500, freqEnd: 75, q: 0.8, rate: 0.75 });
    this.tone({ type: 'sine', freq: 95, freqEnd: 36, duration: 0.7, volume: 0.22 * strength });
    this.tone({ type: 'sawtooth', freq: 220, freqEnd: 48, duration: 0.28, volume: 0.07, filterFreq: 500 });
  }

  ability(type) {
    if (type === 'chuck') {
      this.noise({ duration: 0.3, volume: 0.13, type: 'bandpass', freq: 1400, freqEnd: 3200, q: 1.2 });
      this.tone({ type: 'square', freq: 700, freqEnd: 1600, duration: 0.2, volume: 0.04 });
    } else if (type === 'bomb') {
      this.explode(1.2);
    } else if (type === 'blues') {
      for (let i = 0; i < 3; i += 1) {
        this.tone({ type: 'triangle', freq: 1300 + i * 180, freqEnd: 1800 + i * 200, duration: 0.09, volume: 0.026, delay: i * 0.035 });
      }
      this.noise({ duration: 0.18, volume: 0.05, type: 'highpass', freq: 2000, q: 0.6 });
    } else {
      this.tone({ type: 'sawtooth', freq: 260, freqEnd: 740, duration: 0.28, volume: 0.055, filterFreq: 1200 });
      this.tone({ type: 'sine', freq: 120, freqEnd: 48, duration: 0.4, volume: 0.11 });
      this.noise({ duration: 0.24, volume: 0.06, type: 'lowpass', freq: 900, freqEnd: 200 });
    }
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.tone({ type: 'triangle', freq, freqEnd: freq * 1.01, duration: 0.42, volume: 0.075, delay: i * 0.12 });
      this.tone({ type: 'sine', freq: freq * 2, duration: 0.26, volume: 0.022, delay: i * 0.12 });
    });
    this.tone({ type: 'sine', freq: 1046.5, duration: 1.1, volume: 0.03, delay: 0.55 });
  }

  lose() {
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      this.tone({ type: 'sawtooth', freq, freqEnd: freq * 0.94, duration: 0.5, volume: 0.04, delay: i * 0.22, filterFreq: 900 });
    });
    this.tone({ type: 'sine', freq: 110, freqEnd: 70, duration: 0.9, volume: 0.08, delay: 0.5 });
  }

  star() {
    this.tone({ type: 'triangle', freq: 1318.5, freqEnd: 1568, duration: 0.24, volume: 0.04 });
    this.tone({ type: 'sine', freq: 1975.5, duration: 0.35, volume: 0.02, delay: 0.06 });
  }

  unlock() {
    [523.25, 659.25, 880, 1174.66].forEach((f, i) => {
      this.tone({ type: 'triangle', freq: f, duration: 0.25, volume: 0.035, delay: i * 0.06 });
    });
  }
}

export const Sound = new SoundEngine();
