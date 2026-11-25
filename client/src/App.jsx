
import './App.css';
import Home from './features/home/Home'
import { Link, Route, Routes } from 'react-router-dom';
import MnagerStudents from './features/students/MnagerStudents';
import ManagerCurses from './features/curses/ManagerCurses';
import ManagerTeachers from './features/teachers/ManagerTeachers';
import ManagerSchedule from './features/schedule/ManagerSchedule';
import ManagerPayments from './features/payments/ManagerPayments';
import React, { useRef, useEffect } from "react";

// לוגו יוקרתי, ברור, עם קונטור זהב ונצנוצי קונפטי
const confettiCount = 18;
function getConfetti() {
  return Array.from({ length: confettiCount }, (_, i) => ({
    key: i,
    x: 60 + Math.random() * 120,
    y: 10 + Math.random() * 50,
    r: 2 + Math.random() * 2.5,
    color: ["#ffe082", "#fffbe7", "#bfa14a", "#fff7b2"][Math.floor(Math.random() * 4)],
    delay: Math.random() * 2
  }));
}

function Logo() {
  const confetti = useRef(getConfetti());

  useEffect(() => {
    const interval = setInterval(() => {
      confetti.current = getConfetti();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="logo-gold"
      style={{
        marginInlineStart: 24,
        display: "flex",
        alignItems: "center",
        height: 80,
        minWidth: 320,
        userSelect: "none",
        cursor: "pointer",
        perspective: 600
      }}
      tabIndex={0}
    >
      <div className="logo-gold-inner">
        <svg
          width="320"
          height="80"
          viewBox="0 0 320 80"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fffbe7" />
              <stop offset="40%" stopColor="#ffe082" />
              <stop offset="100%" stopColor="#bfa14a" />
            </linearGradient>
            <linearGradient id="blackfade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#222" />
              <stop offset="100%" stopColor="#444" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* סמל אקורד – שלושה קווים מוזיקליים */}
          <rect x="18" y="18" width="14" height="44" rx="4" fill="url(#gold)" filter="url(#glow)" />
          <rect x="40" y="8" width="14" height="62" rx="4" fill="url(#blackfade)" filter="url(#glow)" />
          <rect x="62" y="28" width="14" height="32" rx="4" fill="url(#gold)" filter="url(#glow)" />
          {/* שם בית הספר – אותיות כהות עם קונטור מוזהב */}
          <text
            x="300"
            y="55"
            direction="rtl"
            textAnchor="start"
            fontFamily="'Rubik Moonrocks', Arial"
            fontSize="48"
            fontWeight="bold"
            letterSpacing="2"
            fill="#222"
            stroke="url(#gold)"
            strokeWidth="2.5"
            paintOrder="stroke"
            style={{
              filter: "drop-shadow(0 2px 6px #ffe082cc)",
              dominantBaseline: "middle"
            }}
          >
      אקורד
          </text>
          {/* נצנוצי זהב */}
          {confetti.current.map((c, i) => (
            <circle
              key={c.key}
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill={c.color}
              opacity="0.7"
              className="logo-confetti"
              style={{
                animationDelay: `${c.delay}s`
              }}
            />
          ))}
        </svg>
      </div>
      <style>{`
      .logo-gold-inner {
        transition: transform 0.7s cubic-bezier(.68,-0.55,.27,1.55);
        will-change: transform;
        display: block;
      }
      .logo-gold:hover .logo-gold-inner,
      .logo-gold:focus .logo-gold-inner {
        transform: rotateY(180deg) scale(1.07);
      }
      .logo-confetti {
        animation: logoConfetti 3.5s linear infinite;
        transform-origin: center;
      }
      @keyframes logoConfetti {
        0% { opacity: 0.7; transform: translateY(0) scale(1);}
        60% { opacity: 1; transform: translateY(-18px) scale(1.3);}
        100% { opacity: 0; transform: translateY(-32px) scale(0.7);}
      }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <div className="App" style={{
      background: 'linear-gradient(120deg,#0f2027,#2c5364 70%,#fffbe7 120%)',
      minHeight: '100vh'
    }}>
      {/* תפריט ניווט מעוצב עם לוגו */}
      <header>
        <nav className="main-nav" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(90deg,#fffbe7,#ffe082 60%,#bfa14a 100%)',
          boxShadow: '0 2px 16px #ffe08255',
          borderRadius: '0 0 18px 18px',
          marginBottom: 36,
          padding: '0 0 0 12px',
          minHeight: 80
        }}>
          <Logo />
          <div style={{
            display: 'flex',
            gap: 32,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Link to="/" className="nav-link">דף הבית</Link>
            <Link to="/students" className="nav-link">תלמידים</Link>
            <Link to="/teachers" className="nav-link">מורים/ות</Link>
            <Link to="/curses" className="nav-link">קורסים</Link>
            <Link to="/schedule" className="nav-link">מערכת שעות</Link>
            <Link to="/payments" className="nav-link">תשלומים</Link>
          </div>
        </nav>
      </header>
      <Routes>
        <Route path="/students" element={<MnagerStudents />} />
        <Route path="/curses" element={<ManagerCurses />} />
        <Route path="/teachers" element={<ManagerTeachers />} />
        <Route path="/schedule" element={<ManagerSchedule />} />
        <Route path="/payments" element={<ManagerPayments />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
