// Web Audio API Procedural Typing Sound Synthesizer
// Zero external files, ultra-responsive, supports mechanical switch click, soft thock, and error beep.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundType = 'mechanical'; // 'mechanical' | 'soft' | 'off'
    this.volume = 0.2; // Default quiet
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundType(type) {
    this.soundType = type;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  playKeypress(isSpace = false) {
    if (this.soundType === 'off') return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (this.soundType === 'mechanical') {
      // Mechanical switch: Crisp high-frequency snap followed by body resonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSpace ? 1200 : 2400 + (Math.random() * 400 - 200), t);
      filter.Q.setValueAtTime(3, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpace ? 180 : 320 + (Math.random() * 60 - 30), t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

      // Noise click burst
      const bufferSize = this.ctx.sampleRate * 0.02;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * 0.6, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      gain.gain.setValueAtTime(this.volume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.connect(filter);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
      noise.start(t);
      noise.stop(t + 0.02);

    } else if (this.soundType === 'soft') {
      // Soft thock sound: low mellow pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 120 : 180 + (Math.random() * 40 - 20), t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  playError() {
    if (this.soundType === 'off') return;
    this.init();
    if (!this.ctx) return;

    // Distinct subtle low-thud tap for errors (soft, non-fatiguing)
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);

    gain.gain.setValueAtTime(this.volume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playSuccess() {
    if (this.soundType === 'off') return;
    this.init();
    if (!this.ctx) return;

    // Distinct subtle harmonic chime chord (E major arpeggio, sparkling & pleasant)
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }
}

export const sound = new SoundEngine();
