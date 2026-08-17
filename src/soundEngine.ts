// Web Audio API Synthesizer for gothic castle reality game sound effects
// 100% offline, zero asset download latency, reliable across iOS Safari and Android Chrome

class CastleSoundEngine {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Deep Gothic Cathedral Bell with authentic strike harmonics and long decay
  public playBell() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Bell harmonics frequencies
      const freqs = [150, 300, 450, 680, 1150, 1600];
      const gains = [0.6, 0.4, 0.3, 0.2, 0.15, 0.08];
      const decays = [4.5, 3.5, 2.8, 2.0, 1.2, 0.8];

      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === 0 ? 'sine' : (i % 2 === 0 ? 'triangle' : 'sine');
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[i], now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[i]);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decays[i]);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Dark Sub-Bass Doom Gong
  public playGong() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Low sub bass
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(65, now);
      subOsc.frequency.exponentialRampToValueAtTime(38, now + 3.0);

      // Lowpass filter for dark thud
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + 3.0);

      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      subOsc.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 3.5);

      // Metallic shimmer
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'triangle';
      metalOsc.frequency.setValueAtTime(210, now);
      metalGain.gain.setValueAtTime(0.3, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      metalOsc.connect(metalGain);
      metalGain.connect(this.ctx.destination);

      metalOsc.start(now);
      metalOsc.stop(now + 2.0);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Urgent Castle Alarm / War Horn
  public playAlarm() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Repeating 3-pulse dramatic brass horn
      for (let p = 0; p < 3; p++) {
        const pulseTime = now + p * 0.45;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(220, pulseTime);
        osc2.frequency.setValueAtTime(440, pulseTime);

        // Lowpass to give warm brass feel
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, pulseTime);

        gain.gain.setValueAtTime(0, pulseTime);
        gain.gain.linearRampToValueAtTime(0.5, pulseTime + 0.05);
        gain.gain.setValueAtTime(0.5, pulseTime + 0.28);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.4);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(pulseTime);
        osc2.start(pulseTime);
        osc1.stop(pulseTime + 0.4);
        osc2.stop(pulseTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Whisper / Eerie Murder Revelation
  public playWhisper() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(220, now + 1.2);
      osc.frequency.linearRampToValueAtTime(110, now + 2.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.8);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Royal Golden Fanfare / Victory
  public playVictory() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        const duration = idx === notes.length - 1 ? 1.5 : 0.4;
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + duration);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Ticking Tension (Grandfather Clock)
  public playTick() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  public playBySoundType(type: 'bell' | 'gong' | 'alarm' | 'whisper' | 'victory') {
    switch (type) {
      case 'bell':
        this.playBell();
        break;
      case 'gong':
        this.playGong();
        break;
      case 'alarm':
        this.playAlarm();
        break;
      case 'whisper':
        this.playWhisper();
        break;
      case 'victory':
        this.playVictory();
        break;
      default:
        this.playBell();
    }
  }
}

export const soundEngine = new CastleSoundEngine();
