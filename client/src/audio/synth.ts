// Small Web Audio synthesizer: every instrument is a recipe of oscillators + an ADSR envelope.
// No samples are loaded - all sound is generated in the browser.

export type Voice = 'piano' | 'organ' | 'synth' | 'bells';

interface Recipe {
  partials: { ratio: number; gain: number; type: OscillatorType }[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filter?: number;
}

const RECIPES: Record<Voice, Recipe> = {
  piano: { partials: [{ ratio: 1, gain: 0.6, type: 'triangle' }, { ratio: 2, gain: 0.18, type: 'sine' }, { ratio: 3, gain: 0.06, type: 'sine' }], attack: 0.005, decay: 0.9, sustain: 0.12, release: 0.5 },
  organ: { partials: [{ ratio: 1, gain: 0.35, type: 'sine' }, { ratio: 2, gain: 0.25, type: 'sine' }, { ratio: 4, gain: 0.12, type: 'sine' }, { ratio: 0.5, gain: 0.2, type: 'sine' }], attack: 0.03, decay: 0.1, sustain: 0.85, release: 0.15 },
  synth: { partials: [{ ratio: 1, gain: 0.32, type: 'sawtooth' }, { ratio: 1.005, gain: 0.25, type: 'sawtooth' }], attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.35, filter: 2200 },
  bells: { partials: [{ ratio: 1, gain: 0.4, type: 'sine' }, { ratio: 2.76, gain: 0.22, type: 'sine' }, { ratio: 5.4, gain: 0.1, type: 'sine' }], attack: 0.002, decay: 1.8, sustain: 0, release: 1.2 },
};

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const SOLFEGE: Record<string, string> = { C: 'דו', D: 'רה', E: 'מי', F: 'פה', G: 'סול', A: 'לה', B: 'סי' };

/** Equal temperament, A4 = 440Hz. `note` like "C4", "F#5". */
export function frequency(note: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) throw new Error(`bad note ${note}`);
  const semitone = NAMES.indexOf(m[1]) + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semitone - 69) / 12);
}

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private active = new Map<string, { stop: () => void }>();
  voice: Voice = 'piano';

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return { ctx: this.ctx, master: this.master! };
  }

  setVolume(v: number) {
    const { master } = this.ensure();
    master.gain.value = v;
  }

  noteOn(note: string) {
    if (this.active.has(note)) return;
    const { ctx, master } = this.ensure();
    const r = RECIPES[this.voice];
    const t = ctx.currentTime;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + r.attack);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, r.sustain), t + r.attack + r.decay);
    let out: AudioNode = env;
    if (r.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = r.filter;
      env.connect(f);
      out = f;
    }
    out.connect(master);
    const f0 = frequency(note);
    const oscs = r.partials.map(p => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = p.type;
      o.frequency.value = f0 * p.ratio;
      g.gain.value = p.gain;
      o.connect(g).connect(env);
      o.start(t);
      return o;
    });
    this.active.set(note, {
      stop: () => {
        const now = ctx.currentTime;
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(Math.max(0.0001, env.gain.value), now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + r.release);
        oscs.forEach(o => o.stop(now + r.release + 0.05));
      },
    });
  }

  noteOff(note: string) {
    this.active.get(note)?.stop();
    this.active.delete(note);
  }
}

/** "Ode to Joy" (Beethoven, public domain) - [note, beats]. */
export const DEMO_TUNE: [string, number][] = [
  ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
  ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1.5], ['D4', 0.5], ['D4', 2],
  ['E4', 1], ['E4', 1], ['F4', 1], ['G4', 1], ['G4', 1], ['F4', 1], ['E4', 1], ['D4', 1],
  ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1.5], ['C4', 0.5], ['C4', 2],
];
