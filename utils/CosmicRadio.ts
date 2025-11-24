export class CosmicRadio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  public isPlaying: boolean = false;

  constructor() {
    // Lazy initialization in init()
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.createNoiseBuffer();
    }
  }

  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTypewriterSound() {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const t = this.ctx.currentTime;

    // 1. The "Body" (Clean Sine Wave Drop)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);

    // 2. The "Impact" (Soft Filtered Noise)
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.05);
  }

  playPlanetTone(planetIndex: number) {
    if (!this.ctx) return;
    this.stop();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const safeIndex = typeof planetIndex === 'number' ? planetIndex : 0;
    const baseFreq = 40 + (safeIndex * 10);

    const createOsc = (freq: number, type: OscillatorType, pan: number, vol: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.ctx.destination);
      panner.pan.value = pan;

      osc.start();
      this.oscillators.push(osc);
      this.gainNodes.push(gain);
    };

    createOsc(baseFreq, 'sine', -0.3, 0.05);
    createOsc(baseFreq * 1.5, 'triangle', 0.3, 0.03);
    this.isPlaying = true;
  }

  playPageReturnSound() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const t = this.ctx.currentTime;

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.35);
  }

  playTransmissionSound() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  stop() {
    if (!this.ctx) return;
    this.gainNodes.forEach(g => {
      try {
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
      } catch (e) { }
    });
    setTimeout(() => {
      this.oscillators.forEach(o => { try { o.stop(); } catch (e) { } });
      this.oscillators = [];
      this.gainNodes = [];
    }, 1000);
    this.isPlaying = false;
  }
}

// Singleton instance
export const radio = new CosmicRadio();