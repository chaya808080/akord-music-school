

import React, { useRef, useState, useEffect } from 'react';

// --- לוגו SVG יוקרתי ---

// --- אייקונים SVG (שחור/לבן/זהב) ---
const icons = {
  פסנתר: ({ active }) => (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <rect x="5" y="10" width="28" height="18" rx="4" fill={active ? "url(#gold)" : "#fff"} stroke="#222" strokeWidth="2"/>
      <rect x="8" y="10" width="4" height="18" fill={active ? "#bfa14a" : "#222"} />
      <rect x="16" y="10" width="4" height="18" fill={active ? "#bfa14a" : "#222"} />
      <rect x="24" y="10" width="4" height="18" fill={active ? "#bfa14a" : "#222"} />
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffbe7"/>
          <stop offset="40%" stopColor="#ffe082"/>
          <stop offset="100%" stopColor="#bfa14a"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  כינור: ({ active }) => (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <ellipse cx="19" cy="24" rx="10" ry="6" fill={active ? "url(#gold)" : "#fff"} stroke="#222" strokeWidth="2"/>
      <rect x="17" y="8" width="4" height="16" rx="2" fill={active ? "#bfa14a" : "#222"} />
      <circle cx="19" cy="8" r="3" fill={active ? "#bfa14a" : "#222"} />
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffbe7"/>
          <stop offset="40%" stopColor="#ffe082"/>
          <stop offset="100%" stopColor="#bfa14a"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  גיטרה: ({ active }) => (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <ellipse cx="25" cy="25" rx="8" ry="6" fill={active ? "url(#gold)" : "#fff"} stroke="#222" strokeWidth="2"/>
      <rect x="10" y="10" width="14" height="4" rx="2" fill={active ? "#bfa14a" : "#222"} transform="rotate(30 17 12)" />
      <circle cx="10" cy="10" r="3" fill={active ? "#bfa14a" : "#222"} />
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffbe7"/>
          <stop offset="40%" stopColor="#ffe082"/>
          <stop offset="100%" stopColor="#bfa14a"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  חלילית: ({ active }) => (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <rect x="10" y="16" width="18" height="6" rx="3" fill={active ? "url(#gold)" : "#fff"} stroke="#222" strokeWidth="2"/>
      <circle cx="12" cy="19" r="1" fill={active ? "#bfa14a" : "#222"} />
      <circle cx="18" cy="19" r="1" fill={active ? "#bfa14a" : "#222"} />
      <circle cx="24" cy="19" r="1" fill={active ? "#bfa14a" : "#222"} />
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffbe7"/>
          <stop offset="40%" stopColor="#ffe082"/>
          <stop offset="100%" stopColor="#bfa14a"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  תופים: ({ active }) => (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <ellipse cx="19" cy="24" rx="10" ry="6" fill={active ? "url(#gold)" : "#fff"} stroke="#222" strokeWidth="2"/>
      <rect x="14" y="10" width="10" height="6" rx="3" fill={active ? "#bfa14a" : "#222"} />
      <circle cx="19" cy="10" r="3" fill={active ? "#bfa14a" : "#222"} />
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffbe7"/>
          <stop offset="40%" stopColor="#ffe082"/>
          <stop offset="100%" stopColor="#bfa14a"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

// --- נתוני אורגנית ---
const instruments = [
  { name: 'פסנתר', icon: icons["פסנתר"] },
  { name: 'כינור', icon: icons["כינור"] },
  { name: 'גיטרה', icon: icons["גיטרה"] },
  { name: 'חלילית', icon: icons["חלילית"] }
];
const drumIcon = icons["תופים"];

const whiteNotes = [
  { note: "C" }, { note: "D" }, { note: "E" }, { note: "F" },
  { note: "G" }, { note: "A" }, { note: "B" },
  { note: "C2" }, { note: "D2" }, { note: "E2" }, { note: "F2" },
  { note: "G2" }, { note: "A2" }, { note: "B2" }
];
const blackNotes = [
  { note: "C#", pos: 1 }, { note: "D#",
pos: 2 }, { note: "F#", pos: 4 },
  { note: "G#", pos: 5 }, { note: "A#", pos: 6 }, { note: "C#2", pos: 8 },
  { note: "D#2", pos: 9 }, { note: "F#2", pos: 11 }, { note: "G#2", pos: 12 },
  { note: "A#2", pos: 13 }
];
const frequencies = {
  "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
  "E": 329.63, "F": 349.23, "F#": 369.99, "G": 392.00,
  "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88,
  "C2": 523.25, "C#2": 554.37, "D2": 587.33, "D#2": 622.25,
  "E2": 659.25, "F2": 698.46, "F#2": 739.99, "G2": 783.99,
  "G#2": 830.61, "A2": 880.00, "A#2": 932.33, "B2": 987.77
};
// מיפוי מקשים (אפשר לשפר לפי הצורך)
const whiteKeys = [
  'ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'
];
const blackKeys = [
  'CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'
];

export default function Home() {
  const audioCtxRef = useRef(null);
  const drumIntervalRef = useRef(null);
  const [instrument, setInstrument] = useState(instruments[0]);
  const [drumOn, setDrumOn] = useState(false);
  const [activeWhite, setActiveWhite] = useState(null);
  const [activeBlack, setActiveBlack] = useState(null);
  const activeNotes = useRef({});

  // נגינת תו
  function startNote(note) {
    if (activeNotes.current[note]) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = instrument.name === 'פסנתר' ? 'triangle' :
      instrument.name === 'כינור' ? 'sawtooth' :
      instrument.name === 'גיטרה' ? 'square' : 'sine';
    osc.frequency.value = frequencies[note];
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(2, ctx.currentTime);
    osc.start();
    activeNotes.current[note] = { osc, gain };
  }
  function stopNote(note) {
    const playing = activeNotes.current[note];
    if (playing) {
      const { osc, gain } = playing;
      const ctx = audioCtxRef.current;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      }, 220);
      delete activeNotes.current[note];
    }
  }
  // תופים
  function startDrumLoop() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (drumIntervalRef.current) return;
    const ctx = audioCtxRef.current;
    drumIntervalRef.current = setInterval(() => {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, ctx.currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
      kickGain.gain.setValueAtTime(2.2, ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);
      kickOsc.start();
      kickOsc.stop(ctx.currentTime + 0.18);
      kickOsc.onended = () => {
        kickOsc.disconnect();
        kickGain.disconnect();
      };
      setTimeout(() => {
        const bufferSize = ctx.sampleRate * 0.13;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const snare = ctx.createBufferSource();
        snare.buffer = buffer;
        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(1.1, ctx.currentTime);
        snareGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
        snare.connect(snareGain);
        snareGain.connect(ctx.destination);
        snare.start();
        snare.stop(ctx.currentTime + 0.13);
        snare.onended = () => {
          snare.disconnect();
          snareGain.disconnect();
        };
      }, 250);
    }, 500);
  }
  function stopDrumLoop() {
    if (drumIntervalRef.current) {
      clearInterval(drumIntervalRef.current);
      drumIntervalRef.current = null;
    }
  }

  useEffect(() => {
    if (drumOn) {
      startDrumLoop();
    } else {
      stopDrumLoop();
    }
    return stopDrumLoop;
  }, [drumOn]);

  // תמיכה במקלדת + הדגשה
  useEffect(() => {
    function handleKeyDown(e) {
      const whiteIndex = whiteKeys.indexOf(e.code);
      if (whiteIndex !== -1 && whiteIndex < whiteNotes.length) {
        setActiveWhite(whiteIndex);
        startNote(whiteNotes[whiteIndex].note);
        return;
      }
      const blackIndex = blackKeys.indexOf(e.code);
      if (blackIndex !== -1 && blackIndex < blackNotes.length) {
        setActiveBlack(blackIndex);
        startNote(blackNotes[blackIndex].note);
        return;
      }
    }
    function handleKeyUp(e) {
      const whiteIndex = whiteKeys.indexOf(e.code);
      if (whiteIndex !== -1 && whiteIndex < whiteNotes.length) {
        setActiveWhite(null);
        stopNote(whiteNotes[whiteIndex].note);
        return;
      }
      const blackIndex = blackKeys.indexOf(e.code);
      if (blackIndex !== -1 && blackIndex < blackNotes.length) {
        setActiveBlack(null);
        stopNote(blackNotes[blackIndex].note);
        return;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [instrument]);

  // עכבר – לחיצה ארוכה + הדגשה
  function handleMouseDown(note, isWhite, idx) {
    if (isWhite) setActiveWhite(idx);
    else setActiveBlack(idx);
    startNote(note);
  }
  function handleMouseUp(note, isWhite) {
    if (isWhite) setActiveWhite(null);
    else setActiveBlack(null);
    stopNote(note);
  }

  // עיצוב ואנימציות
  const whiteKeyWidth = 100 / whiteNotes.length;
  const style = `
  @keyframes titlePop {
    0% { transform: scale(1) rotate(-2deg);}
    100% { transform: scale(1.08) rotate(2deg);}
  }
  @keyframes pianoGlow {
    0% { box-shadow: 0 0 0 #bfa14a00;}
    100% { box-shadow: 0 0 32px #bfa14a88;}
  }
  @keyframes keyPulse {
    0% { box-shadow: 0 0 0 #ffe08200;}
    100% { box-shadow: 0 0 24px #ffe08288;}
  }
  `;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(120deg,#0f2027,#2c5364 70%,#fffbe7 120%)',
      overflowX: 'hidden',
      position: 'relative',
      fontFamily: "'Varela Round', Arial, sans-serif"
    }}>
      <style>{style}</style>
   
      {/* פריסה: צד ימין פרסומת, צד שמאל רישום/המלצות, למטה אורגנית */}
      <div style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 36,
        maxWidth: 1200,
        margin: '0 auto',
        paddingTop: 110,
        paddingBottom: 60
      }}>
        {/* פרסומת/מידע שיווקי */}
        <div style={{
          flex: 1,
          minWidth: 320,
          maxWidth: 480,
          background: 'rgba(255,255,255,0.13)',
          borderRadius: 22,
          boxShadow: '0 2px 32px #ffe08255',
          padding: '32px 28px',
          marginBottom: 24,
          textAlign: 'right'
        }}>
          <h1 style={{
            fontFamily: "'Rubik Moonrocks', 'Varela Round', 'Orbitron', Arial, sans-serif",
            fontSize: '2.2em',
            color: '#bfa14a',
            letterSpacing: '0.08em',
            textShadow: '0 4px 32px #ffe082, 0 1px 0 #222',
            animation: 'titlePop 2.2s cubic-bezier(.68,-0.55,.27,1.55) infinite alternate',
            margin: 0,
            marginBottom: 18
          }}>
            אקורד מנצח – צלילים של השראה
          </h1>
          <div style={{
            fontSize: '1.15em',
            color: '#222',
            lineHeight: 1.7,
            fontWeight: 500
          }}>
            ברוכים הבאים ל<strong style={{ color: '#bfa14a', fontWeight: 900 }}>אקורד מנצח</strong> – בית הספר המוביל ללימודי נגינה, יצירה והשראה מוזיקלית! אצלנו תמצאו מורים מהשורה הראשונה, קורסים חדשניים, חוויית למידה אישית, הופעות, סדנאות והרבה שמחת חיים.<br />
            למה לבחור דווקא בנו?<br></br>
            <span style={{ color: '#bfa14a', fontWeight: 700 }}>👍 מסלולי לימוד מגוונים – פסנתר, גיטרה, כינור, תופים, שירה ועוד<br />
            👍 יחס אישי, ליווי מקצועי, והשראה לכל תלמיד<br />
            👍 הופעות, הרכבים, סדנאות יצירה, אולפן הקלטות מתקדם<br />
            👍 קהילה מוזיקלית חמה ותומכת<br /></span>
            <span style={{ color: '#222', fontWeight: 700 }}>הגשימו חלום מוזיקלי – הירשמו עוד היום!</span>
          </div>
        </div>

        {/* אזור רישום/המלצות/רווחים */}
        <div style={{
          flex: 1,
          minWidth: 320,
          maxWidth: 420,
          background: 'rgba(255,255,255,0.09)',
          borderRadius: 22,
          boxShadow: '0 2px 32px #bfa14a33',
          padding: '32px 28px',
          marginBottom: 24,
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <h2 style={{
            fontFamily: "'Varela Round', Arial, sans-serif",
            color: '#bfa14a',
            fontWeight: 700,
            fontSize: '1.3em',
            margin: 0
          }}>
            הצטרפו להצלחה!
          </h2>
          <div style={{ color: '#222', fontSize: '1em', lineHeight: 1.6 }}>
            <strong>רוצים להתנסות בשיעור?</strong> השאירו פרטים ונחזור אליכם:<br />
            <form style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="text" placeholder="שם מלא" style={{
                borderRadius: 8, border: '1px solid #bfa14a', padding: '8px 12px', fontSize: '1em'
              }} />
              <input type="tel" placeholder="טלפון" style={{
                borderRadius: 8, border: '1px solid #bfa14a', padding: '8px 12px', fontSize: '1em'
              }} />
              <input type="email" placeholder="אימייל" style={{
                borderRadius: 8, border: '1px solid #bfa14a', padding: '8px 12px', fontSize: '1em'
              }} />
              <button type="submit" style={{
                background: 'linear-gradient(90deg,#ffe082,#bfa14a)',
                color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', fontSize: '1.1em', cursor: 'pointer', marginTop: 8
              }}>
                שלח/י
              </button>
            </form>
          </div>
          <div style={{
            marginTop: 18,
            color: '#222',
            fontSize: '0.98em',
            background: 'rgba(255,255,255,0.13)',
            borderRadius: 10,
            padding: '10px 14px'
          }}>
            <strong style={{ color: '#bfa14a' }}>המלצות:</strong><br />
            "מורים מדהימים, יחס אישי וחוויה מוזיקלית אמיתית!"<br />
            "הבן שלי פורח בזכותכם – תודה על הכל!"<br />
            "הרגשה של בית ומשפחה מוזיקלית."
          </div>
        </div>
      </div>

      {/* מסגרת האורגנית */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 0
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.18)',
          borderRadius: 22,
          boxShadow: '0 2px 32px #bfa14a44',
          padding: '28px 18px 18px 18px',
          minWidth: 340,
          maxWidth: 900,
          width: '90vw',
          margin: '0 auto',
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            fontFamily: "'Varela Round', Arial, sans-serif",
            color: '#bfa14a',
            fontWeight: 700,
            fontSize: '1.15em',
            marginBottom: 10
          }}>
            אורגנית אינטראקטיבית – נסו לנגן!
          </div>
          {/* כפתורי הכלים והתופים */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 18,
            marginBottom: 18,
            marginTop: 0
          }}>
            {instruments.map((ins, idx) => (
              <button
                key={ins.name}
                onClick={() => setInstrument(ins)}
                style={{
                  background: 'none',
                  border: instrument.name === ins.name ? '2px solid #bfa14a' : '1.5px solid #bbb',
                  borderRadius: 10,
                  cursor: 'pointer',
                  width: 48,
                  height: 48,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: '0.18s',
                  boxShadow: instrument.name === ins.name ? '0 0 18px #ffe08288' : 'none'
                }}
                title={ins.name}
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  transform: instrument.name === ins.name ? 'scale(1.18)' : 'scale(1)',
                  transition: '0.18s'
                }}>
                  {React.createElement(ins.icon, { active: instrument.name === ins.name })}
                </span>
              </button>
            ))}
            <button
              onClick={() => setDrumOn((v) => !v)}
              style={{
                background: 'none',                
                border: drumOn ? '2px solid #bfa14a' : '1.5px solid #bbb',
                borderRadius: 10,
                cursor: 'pointer',
                width: 48,
                height: 48,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.18s',
                boxShadow: drumOn ? '0 0 18px #ffe08288' : 'none'
              }}
              title="הפעל/כבה תופים"
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                transform: drumOn ? 'scale(1.18)' : 'scale(1)',
                transition: '0.18s'
              }}>
                {React.createElement(drumIcon, { active: drumOn })}
              </span>
            </button>
          </div>
          {/* קלידים */}
          <div style={{
            position: 'relative',
            width: '98%',
            maxWidth: '820px',
            height: '120px',
            margin: '0 auto',
            background: '#eee',
            borderRadius: '12px',
            boxShadow: '0 2px 16px #bbb',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            overflow: 'hidden',
            direction: 'ltr'
          }}>
            {/* קלידים לבנים */}
            {whiteNotes.map((n, i) => (
              <div
                key={n.note}
                onMouseDown={() => handleMouseDown(n.note, true, i)}
                onMouseUp={() => handleMouseUp(n.note, true)}
                onMouseLeave={() => handleMouseUp(n.note, true)}
                style={{
                  width: `${whiteKeyWidth}%`,
                  height: '100%',
                  background: activeWhite === i ? '#fffbe7' : 'white',
                  border: '1px solid #333',
                  borderRight: i === whiteNotes.length - 1 ? '1px solid #333' : 'none',
                  borderRadius: '0 0 8px 8px',
                  position: 'relative',
                  zIndex: 1,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  userSelect: 'none',
                  transition: 'background 0.1s, box-shadow 0.1s',
                  boxShadow: activeWhite === i ? '0 0 18pxrgba(255, 155, 130, 0.53)' : 'none',
                  animation: activeWhite === i ? 'keyPulse 0.7s linear infinite alternate' : 'none'
                }}
                title={n.note}
              />
            ))}
            {/* קלידים שחורים */}
            {blackNotes.map((n, i) => (
              <div
                key={n.note}
                onMouseDown={() => handleMouseDown(n.note, false, i)}
                onMouseUp={() => handleMouseUp(n.note, false)}
                onMouseLeave={() => handleMouseUp(n.note, false)}
                style={{
                  width: `${whiteKeyWidth * 0.6}%`,
                  height: '60%',
                  background: activeBlack === i ? '#ffe082' : 'black',
                  border: '1px solid #222',
                  borderRadius: '0 0 6px 6px',
                  position: 'absolute',
                  left: `calc(${(n.pos * whiteKeyWidth) - (whiteKeyWidth * 0.3)}%)`,
                  zIndex: 2,
                  cursor: 'pointer',
                  top: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  userSelect: 'none',
                  transition: 'background 0.1s, box-shadow 0.1s',
                  boxShadow: activeBlack === i ? '0 0 18px #ffe08288' : 'none',
                  animation: activeBlack === i ? 'keyPulse 0.7s linear infinite alternate' : 'none'
                }}
                title={n.note}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

