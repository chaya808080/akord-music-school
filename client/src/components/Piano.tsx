import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';
import { DEMO_TUNE, SOLFEGE, Synth, type Voice } from '../audio/synth';

// Two octaves from C4. Computer keyboard mapping follows the classic "piano on QWERTY" layout.
const WHITE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
const BLACK: Record<string, string> = { C4: 'C#4', D4: 'D#4', F4: 'F#4', G4: 'G#4', A4: 'A#4', C5: 'C#5', D5: 'D#5', F5: 'F#5', G5: 'G#5', A5: 'A#5' };
const KEYMAP: Record<string, string> = {
  a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4', f: 'F4', t: 'F#4', g: 'G4', y: 'G#4', h: 'A4', u: 'A#4', j: 'B4',
  k: 'C5', o: 'C#5', l: 'D5', p: 'D#5', ';': 'E5', "'": 'F5',
};
const LABEL = Object.fromEntries(Object.entries(KEYMAP).map(([k, n]) => [n, k.toUpperCase()]));

const VOICES: { value: Voice; label: string }[] = [
  { value: 'piano', label: '🎹 פסנתר' }, { value: 'organ', label: '⛪ עוגב' }, { value: 'synth', label: '🎛️ סינתיסייזר' }, { value: 'bells', label: '🔔 פעמונים' },
];

export default function Piano() {
  const synth = useMemo(() => new Synth(), []);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [voice, setVoice] = useState<Voice>('piano');
  const [volume, setVolume] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const down = (note: string) => {
    synth.noteOn(note);
    setLast(note);
    setPressed(p => new Set(p).add(note));
  };
  const up = (note: string) => {
    synth.noteOff(note);
    setPressed(p => { const n = new Set(p); n.delete(note); return n; });
  };

  useEffect(() => { synth.voice = voice; }, [voice, synth]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.repeat || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const note = KEYMAP[e.key.toLowerCase()];
      if (note) down(note);
    };
    const onUp = (e: KeyboardEvent) => { const note = KEYMAP[e.key.toLowerCase()]; if (note) up(note); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTune = () => { timers.current.forEach(clearTimeout); timers.current = []; setPlaying(false); };
  const playTune = () => {
    if (playing) return stopTune();
    setPlaying(true);
    const beat = 380;
    let t = 0;
    DEMO_TUNE.forEach(([note, beats]) => {
      timers.current.push(window.setTimeout(() => down(note), t));
      timers.current.push(window.setTimeout(() => up(note), t + beats * beat * 0.85));
      t += beats * beat;
    });
    timers.current.push(window.setTimeout(() => setPlaying(false), t));
  };
  useEffect(() => () => stopTune(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const lastName = last ? `${SOLFEGE[last[0]] ?? ''}${last.includes('#') ? ' דיאז' : ''}` : '—';

  return (
    <div className="piano-wrap">
      <div className="piano-controls">
        <div className="tabs">
          {VOICES.map(v => <button key={v.value} className={`tab ${voice === v.value ? 'active' : ''}`} onClick={() => setVoice(v.value)}>{v.label}</button>)}
        </div>
        <span className="spacer" />
        <div className="now-playing">
          <span className="faint">התו האחרון</span>
          <b className="gold-text">{lastName}</b>
          <span className="faint ltr">{last ?? ''}</span>
        </div>
        <label className="row" style={{ gap: 8 }}>
          <Volume2 size={17} className="faint" />
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => { setVolume(+e.target.value); synth.setVolume(+e.target.value); }} aria-label="עוצמה" />
        </label>
        <button className="btn btn-gold" onClick={playTune}>{playing ? <><Pause size={16} />עצירה</> : <><Play size={16} />נגנו לי מנגינה</>}</button>
      </div>
      {/* the keyboard itself is always left-to-right, like a real piano */}
      <div className="piano" dir="ltr" onPointerLeave={() => pressed.forEach(up)}>
        {WHITE.map(note => (
          <div key={note} className="key-slot">
            <button className={`white-key ${pressed.has(note) ? 'down' : ''}`}
              onPointerDown={e => { e.currentTarget.releasePointerCapture(e.pointerId); down(note); }}
              onPointerUp={() => up(note)} onPointerLeave={() => pressed.has(note) && up(note)}
              onPointerEnter={e => e.buttons === 1 && down(note)} aria-label={note}>
              <span className="key-solfege">{SOLFEGE[note[0]]}</span>
              {LABEL[note] && <kbd>{LABEL[note]}</kbd>}
            </button>
            {BLACK[note] && (
              <button className={`black-key ${pressed.has(BLACK[note]) ? 'down' : ''}`}
                onPointerDown={e => { e.stopPropagation(); e.currentTarget.releasePointerCapture(e.pointerId); down(BLACK[note]); }}
                onPointerUp={() => up(BLACK[note])} onPointerLeave={() => pressed.has(BLACK[note]) && up(BLACK[note])}
                onPointerEnter={e => e.buttons === 1 && down(BLACK[note])} aria-label={BLACK[note]}>
                {LABEL[BLACK[note]] && <kbd>{LABEL[BLACK[note]]}</kbd>}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="faint" style={{ textAlign: 'center', fontSize: 13, margin: '14px 0 0' }}>נגנו בעכבר, במגע או במקלדת המחשב (A–' לקלידים הלבנים, W E T Y U O P לשחורים)</p>
    </div>
  );
}
