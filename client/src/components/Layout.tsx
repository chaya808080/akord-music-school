import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, CalendarDays, CheckCircle2, CircleAlert, Clock3, CreditCard, GraduationCap, Home, Info, LayoutDashboard, Menu,
  Moon, Music2, RotateCcw, Search, Sparkles, Sun, UserRoundX, Users, UsersRound,
} from 'lucide-react';
import { api } from '../api';
import { loadAll } from '../store/dataSlice';
import { dismissToast, setPalette, setSidebar, toggleTheme } from '../store/uiSlice';
import { selectLookups, useAppDispatch, useAppSelector } from '../store';
import { teacherName } from '../domain/display';
import { Avatar } from './ui';
import Assistant from './Assistant';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe3a3" /><stop offset=".5" stopColor="#e3b54a" /><stop offset="1" stopColor="#a87418" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#lg-gold)" />
      <rect x="11" y="15" width="6" height="20" rx="3" fill="#1b1405" opacity=".9" />
      <rect x="21" y="9" width="6" height="30" rx="3" fill="#1b1405" />
      <rect x="31" y="19" width="6" height="14" rx="3" fill="#1b1405" opacity=".75" />
    </svg>
  );
}

const NAV = [
  { section: 'ראשי' },
  { to: '/app', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
  { to: '/app/schedule', label: 'מערכת שעות', icon: CalendarDays },
  { to: '/app/insights', label: 'תובנות חכמות', icon: Sparkles },
  { section: 'ניהול' },
  { to: '/app/students', label: 'תלמידים', icon: GraduationCap, count: 'students' },
  { to: '/app/families', label: 'משפחות', icon: UsersRound },
  { to: '/app/teachers', label: 'מורים', icon: Users },
  { to: '/app/courses', label: 'קורסים', icon: BookOpen },
  { section: 'תפעול' },
  { to: '/app/waiting', label: 'רשימת המתנה', icon: Clock3, count: 'waiting' },
  { to: '/app/absences', label: 'היעדרויות', icon: UserRoundX },
  { to: '/app/billing', label: 'גבייה וחיובים', icon: CreditCard },
] as const;

function Sidebar() {
  const dispatch = useAppDispatch();
  const open = useAppSelector(s => s.ui.sidebarOpen);
  const activeStudents = useAppSelector(s => s.data.students.filter(x => x.status === 'פעיל').length);
  const waiting = useAppSelector(s => s.data.waitingList.length);
  const counts = { students: activeStudents, waiting };
  const location = useLocation();
  useEffect(() => { dispatch(setSidebar(false)); }, [location.pathname, dispatch]);

  const reset = () => {
    api.resetDemo?.();
    dispatch(loadAll());
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <NavLink to="/" className="brand">
        <Logo />
        <div>
          <div className="brand-name gold-text">אקורד</div>
          <div className="brand-sub">בית ספר לנגינה</div>
        </div>
      </NavLink>
      {NAV.map((item, i) =>
        'section' in item ? <div key={i} className="nav-section">{item.section}</div> : (
          <NavLink key={item.to} to={item.to} end={'end' in item} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <item.icon size={19} />
            {item.label}
            {'count' in item && <span className="count num">{counts[item.count]}</span>}
          </NavLink>
        ),
      )}
      <div className="sidebar-foot">
        {api.mode === 'demo' ? (
          <>
            <div className="row" style={{ gap: 8 }}><span className="badge gold">מצב הדגמה</span></div>
            <p className="faint" style={{ margin: '8px 0' }}>הנתונים בדויים ונשמרים בדפדפן בלבד.</p>
            <button className="btn btn-sm" style={{ width: '100%' }} onClick={reset}><RotateCcw size={14} />איפוס נתוני הדגמה</button>
          </>
        ) : (
          <span className="badge good"><span className="dot" />מחובר לשרת</span>
        )}
      </div>
    </aside>
  );
}

function Topbar() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.ui.theme);
  return (
    <header className="topbar">
      <button className="btn btn-ghost icon-btn menu-btn" onClick={() => dispatch(setSidebar(true))} aria-label="תפריט"><Menu size={20} /></button>
      <button className="search-trigger" onClick={() => dispatch(setPalette(true))}>
        <Search size={17} />
        <span className="search-text">חיפוש תלמיד, מורה, קורס או עמוד…</span>
        <kbd>Ctrl K</kbd>
      </button>
      <span className="spacer" />
      <button className="btn btn-ghost icon-btn" onClick={() => dispatch(toggleTheme())} aria-label="החלפת ערכת צבעים">
        {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
      </button>
      <NavLink to="/" className="btn btn-ghost icon-btn" aria-label="לאתר"><Home size={19} /></NavLink>
      <div className="row" style={{ gap: 10 }}>
        <Avatar name="מנהלת אקורד" id={3} />
        <div className="user-meta" style={{ lineHeight: 1.2 }}><b style={{ fontSize: 14 }}>מנהלת המערכת</b><div className="faint" style={{ fontSize: 12 }}>הנהלה</div></div>
      </div>
    </header>
  );
}

export function Toasts() {
  const toasts = useAppSelector(s => s.ui.toasts);
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => dispatch(dismissToast(t.id)), t.kind === 'error' ? 5500 : 3200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);
  const Icon = { success: CheckCircle2, error: CircleAlert, info: Info };
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map(t => {
        const I = Icon[t.kind];
        return <div key={t.id} className={`toast ${t.kind}`} onClick={() => dispatch(dismissToast(t.id))}><I size={19} />{t.message}</div>;
      })}
    </div>
  );
}

function CommandPalette() {
  const open = useAppSelector(s => s.ui.paletteOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { family } = useAppSelector(selectLookups);
  const students = useAppSelector(s => s.data.students);
  const teachers = useAppSelector(s => s.data.teachers);
  const courses = useAppSelector(s => s.data.courses);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dispatch(setPalette(!open)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dispatch]);
  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 10); } }, [open]);

  const items = useMemo(() => {
    const term = q.trim();
    const match = (s: string) => !term || s.includes(term);
    const pages = NAV.filter(n => 'to' in n).map(n => ({ group: 'עמודים', label: (n as { label: string }).label, to: (n as { to: string }).to, icon: Music2, sub: '' }));
    return [
      ...pages.filter(p => match(p.label)),
      ...students.filter(s => match(`${s.firstName} ${family.get(s.familyId)?.lastName ?? ''} ${s.idNumber}`)).slice(0, 6)
        .map(s => ({ group: 'תלמידים', label: `${s.firstName} ${family.get(s.familyId)?.lastName ?? ''}`, to: `/app/students/${s.id}`, icon: GraduationCap, sub: s.status })),
      ...teachers.filter(t => match(teacherName(t))).slice(0, 4).map(t => ({ group: 'מורים', label: teacherName(t), to: '/app/teachers', icon: Users, sub: t.active ? 'פעיל/ה' : 'לא פעיל/ה' })),
      ...courses.filter(c => match(c.name)).slice(0, 4).map(c => ({ group: 'קורסים', label: c.name, to: '/app/courses', icon: BookOpen, sub: `₪${c.price}` })),
    ].slice(0, 14);
  }, [q, students, teachers, courses, family]);

  if (!open) return null;
  const go = (to: string) => { dispatch(setPalette(false)); navigate(to); };

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && dispatch(setPalette(false))}>
      <div className="modal palette" role="dialog" aria-label="חיפוש מהיר">
        <div className="palette-input">
          <Search size={20} className="faint" />
          <input ref={inputRef} value={q} placeholder="הקלידו לחיפוש…" onChange={e => { setQ(e.target.value); setActive(0); }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
              if (e.key === 'Enter' && items[active]) go(items[active].to);
              if (e.key === 'Escape') dispatch(setPalette(false));
            }} />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list">
          {items.length === 0 && <div className="empty">לא נמצאו תוצאות</div>}
          {items.map((it, i) => (
            <div key={it.group + it.label + i}>
              {(i === 0 || items[i - 1].group !== it.group) && <div className="palette-group">{it.group}</div>}
              <div className={`palette-item ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(it.to)}>
                <it.icon size={17} />{it.label}<small>{it.sub}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const status = useAppSelector(s => s.data.status);
  const dispatch = useAppDispatch();
  useEffect(() => { if (status === 'idle') dispatch(loadAll()); }, [status, dispatch]);

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        {status === 'error' ? (
          <div className="page"><div className="alert bad">לא ניתן לטעון נתונים מהשרת. ודאו שה-API פועל ונסו שוב.</div></div>
        ) : <Outlet />}
      </div>
      <CommandPalette />
      <Assistant />
    </div>
  );
}
