// Web Audio API Synthesizer for gothic castle horror reality game sound effects
// 100% offline, zero asset download latency, highly optimized for mobile devices

import { SoundType } from './types';

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

  // 1. Accelerating Heartbeat (Hjertebanken)
  public playHeartbeat(beats = 6) {
    try {
      this.initContext();
      if (!this.ctx) return;
      let time = this.ctx.currentTime;
      let interval = 0.8;

      for (let b = 0; b < beats; b++) {
        this.synthHeartThump(time, 58, 0.75, 0.12);
        this.synthHeartThump(time + 0.14, 72, 0.6, 0.1);
        time += interval;
        interval = Math.max(0.42, interval * 0.9);
      }
    } catch (e) {
      console.warn('Heartbeat audio failed:', e);
    }
  }

  private synthHeartThump(startTime: number, freq: number, volume: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(32, startTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, startTime);
    filter.frequency.exponentialRampToValueAtTime(50, startTime + duration);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // 2. Murder Knife Slash & Blood Impact
  public playKnife() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(2400, now);
      metalOsc.frequency.exponentialRampToValueAtTime(800, now + 0.25);

      const metalFilter = this.ctx.createBiquadFilter();
      metalFilter.type = 'bandpass';
      metalFilter.frequency.setValueAtTime(2000, now);
      metalFilter.Q.setValueAtTime(8, now);

      metalGain.gain.setValueAtTime(0.6, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      metalOsc.connect(metalFilter);
      metalFilter.connect(metalGain);
      metalGain.connect(this.ctx.destination);

      metalOsc.start(now);
      metalOsc.stop(now + 0.25);

      const stabOsc = this.ctx.createOscillator();
      const stabGain = this.ctx.createGain();
      stabOsc.type = 'triangle';
      stabOsc.frequency.setValueAtTime(110, now + 0.12);
      stabOsc.frequency.exponentialRampToValueAtTime(35, now + 0.9);

      stabGain.gain.setValueAtTime(0, now + 0.12);
      stabGain.gain.linearRampToValueAtTime(0.8, now + 0.14);
      stabGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      stabOsc.connect(stabGain);
      stabGain.connect(this.ctx.destination);

      stabOsc.start(now + 0.12);
      stabOsc.stop(now + 1.2);

      setTimeout(() => this.playWhisper(), 350);
    } catch (e) {
      console.warn('Knife audio failed:', e);
    }
  }

  // 3. Castle Thunder Strike
  public playThunder() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 2.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.9, now + 0.04);
      gain.gain.setValueAtTime(0.7, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.5);

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 2.0);

      subGain.gain.setValueAtTime(0.8, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 2.2);
    } catch (e) {
      console.warn('Thunder audio failed:', e);
    }
  }

  // 4. Dissonant Ghost / Horror Drone
  public playHorrorDrone() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [146.83, 207.65, 246.94, 311.13];

      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i % 2 === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * (i % 2 === 0 ? 1.02 : 0.98), now + 1.8);
        osc.frequency.linearRampToValueAtTime(f, now + 3.5);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(250, now + 3.0);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 3.8);
      });
    } catch (e) {
      console.warn('Drone audio failed:', e);
    }
  }

  // 5. Shield Ward Sound (Beskyttelse)
  public playShield() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Heavy golden chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(260, now + 1.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {
      console.warn('Shield audio failed:', e);
    }
  }

  // 6. Silver Bars Clink / Coins
  public playCoins() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [1400, 1800, 2200, 2600];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const time = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.25);
      });
    } catch (e) {
      console.warn('Coins audio failed:', e);
    }
  }

  // 7. Deep Gothic Cathedral Bell
  public playBell() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const freqs = [145, 290, 435, 650, 1100, 1550];
      const gains = [0.65, 0.45, 0.35, 0.22, 0.15, 0.08];
      const decays = [4.8, 3.8, 3.0, 2.2, 1.4, 0.9];

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
      console.warn('Bell audio failed:', e);
    }
  }

  // 8. Dark Sub-Bass Doom Gong
  public playGong() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(65, now);
      subOsc.frequency.exponentialRampToValueAtTime(36, now + 3.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.exponentialRampToValueAtTime(65, now + 3.2);

      subGain.gain.setValueAtTime(0.75, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

      subOsc.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 3.6);

      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'triangle';
      metalOsc.frequency.setValueAtTime(210, now);
      metalGain.gain.setValueAtTime(0.35, now);
      metalGain.exponentialRampToValueAtTime(0.001, now + 2.2);

      metalOsc.connect(metalGain);
      metalGain.connect(this.ctx.destination);

      metalOsc.start(now);
      metalOsc.stop(now + 2.2);
    } catch (e) {
      console.warn('Gong audio failed:', e);
    }
  }

  // 9. Urgent Castle Alarm
  public playAlarm() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      for (let p = 0; p < 3; p++) {
        const pulseTime = now + p * 0.45;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(220, pulseTime);
        osc2.frequency.setValueAtTime(440, pulseTime);

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
      console.warn('Alarm audio failed:', e);
    }
  }

  // 10. Eerie Whisper
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
      gain.gain.linearRampToValueAtTime(0.35, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.8);
    } catch (e) {
      console.warn('Whisper audio failed:', e);
    }
  }

  // 11. Royal Victory Fanfare
  public playVictory() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];

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
      console.warn('Victory audio failed:', e);
    }
  }

  // 12. Clock Tick Tension
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
      console.warn('Tick audio failed:', e);
    }
  }

  public playBySoundType(type: SoundType) {
    switch (type) {
      case 'heartbeat':
        this.playHeartbeat(7);
        break;
      case 'knife':
        this.playKnife();
        break;
      case 'thunder':
        this.playThunder();
        break;
      case 'drone':
        this.playHorrorDrone();
        break;
      case 'shield':
        this.playShield();
        break;
      case 'coins':
        this.playCoins();
        break;
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
