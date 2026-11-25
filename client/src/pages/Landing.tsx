import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, LayoutDashboard, Moon, ShieldCheck, Sparkles, Sun, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { loadAll } from '../store/dataSlice';
import { pushToast, toggleTheme } from '../store/uiSlice';
import { courseColor, courseEmoji, teacherName } from '../domain/display';
import { isValidPhone } from '../domain/rules';
import { shekel } from '../domain/billing';
import { Logo } from '../components/Layout';
import { Avatar, Field } from '../components/ui';
import Piano from '../components/Piano';
import '../styles/landing.css';

function TrialForm() {
  const courses = useAppSelector(s => s.data.courses);
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ name: '', phone: '', course: '' });
  const [sent, setSent] = useState(false);
  const phoneBad = form.phone.length > 3 && !isValidPhone(form.phone);

  if (sent) {
    return <div className="alert good" style={{ fontSize: 15 }}><Check size={18} />תודה {form.name}! נחזור אליכם תוך יום עסקים לתיאום שיעור ניסיון.</div>;
  }
  return (
    <form className="stack" onSubmit={e => {
      e.preventDefault();
      if (!form.name.trim() || !isValidPhone(form.phone)) return dispatch(pushToast('error', 'נא למלא שם וטלפון תקין'));
      setSent(true);
      dispatch(pushToast('success', 'הפנייה התקבלה 🎵'));
    }}>
      <Field label="שם מלא"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="טלפון" error={phoneBad ? 'מספר טלפון לא תקין' : null}>
        <input className="input num" dir="ltr" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="כלי מבוקש">
        <select className="select" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
          <option value="">עדיין לא החלטנו</option>
          {courses.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <button className="btn btn-gold" style={{ padding: 13 }}>קבעו לי שיעור ניסיון חינם</button>
    </form>
  );
}

export default function Landing() {
  const d = useAppSelector(s => s.data);
  const theme = useAppSelector(s => s.ui.theme);
  const dispatch = useAppDispatch();
  useEffect(() => { if (d.status === 'idle') dispatch(loadAll()); }, [d.status, dispatch]);

  const active = d.students.filter(s => s.status === 'פעיל').length;

  return (
    <div className="landing">
      <nav className="land-nav">
        <Link to="/" className="brand" style={{ padding: 0 }}><Logo size={42} /><span className="brand-name gold-text">אקורד</span></Link>
        <div className="land-links">
          <a href="#play">נגנו עכשיו</a><a href="#courses">מסלולים</a><a href="#team">הצוות</a><a href="#trial">שיעור ניסיון</a>
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost icon-btn" onClick={() => dispatch(toggleTheme())} aria-label="החלפת ערכת צבעים">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
        <Link to="/app" className="btn btn-gold"><LayoutDashboard size={17} />כניסה למערכת הניהול</Link>
      </nav>

      <header className="hero">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        <div className="hero-notes" aria-hidden="true">{'♪♫♩♬♪♫'.split('').map((n, i) => <span key={i} style={{ '--i': i } as React.CSSProperties}>{n}</span>)}</div>
        <div className="hero-content">
          <span className="badge gold"><Sparkles size={13} />בית ספר לנגינה · משנת 2010</span>
          <h1 className="hero-title">המוזיקה <span className="gold-text">מתחילה כאן</span></h1>
          <p className="hero-sub">שיעורים פרטניים בפסנתר, כינור, גיטרה, תופים, פיתוח קול ועוד. מורים מקצועיים, יחס אישי וקהילה מוזיקלית חמה לכל גיל.</p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <a href="#trial" className="btn btn-gold btn-lg">לשיעור ניסיון חינם<ArrowLeft size={18} /></a>
            <a href="#play" className="btn btn-lg">🎹 נסו לנגן עכשיו</a>
          </div>
          <div className="hero-stats">
            <div><b className="num">{active || '—'}</b><span>תלמידים פעילים</span></div>
            <div><b className="num">{d.courses.length || '—'}</b><span>מסלולי לימוד</span></div>
            <div><b className="num">{d.teachers.filter(t => t.active).length || '—'}</b><span>מורים מקצועיים</span></div>
          </div>
        </div>
      </header>

      <section id="play" className="land-section">
        <div className="section-head"><h2>הפסנתר <span className="gold-text">שלכם</span></h2><p>ארבעה צלילים שנוצרים ישירות בדפדפן עם Web Audio API. בלי הקלטות, רק מתמטיקה ומוזיקה.</p></div>
        <div className="card"><Piano /></div>
      </section>

      <section id="courses" className="land-section">
        <div className="section-head"><h2>מסלולי <span className="gold-text">הלימוד</span></h2><p>כל מסלול מותאם לגיל ולרמה, עם שיעור פרטני שבועי והופעה בסוף שנה</p></div>
        <div className="grid cols-4">
          {d.courses.map(c => (
            <div key={c.id} className="card entity-card course-tile" style={{ '--course': courseColor(c.id) } as React.CSSProperties}>
              <div className="instrument">{courseEmoji(c)}</div>
              <b style={{ fontSize: 18 }}>{c.name}</b>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>{c.description}</p>
              <div className="row" style={{ marginTop: 'auto' }}>
                <span className="badge">גילאי {c.fromAge}–{c.toAge}</span><span className="spacer" /><b className="gold-text num">{shekel(c.price)}<small className="faint">/ח׳</small></b>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="land-section">
        <div className="section-head"><h2>הצוות <span className="gold-text">שלנו</span></h2><p>מוזיקאים ומורים עם ניסיון בהוראה ובהופעות</p></div>
        <div className="team-strip">
          {d.teachers.filter(t => t.active).map(t => (
            <div key={t.id} className="card team-card">
              <Avatar name={teacherName(t)} id={t.id + 2} size="lg" />
              <b>{teacherName(t)}</b>
              <span className="faint" style={{ fontSize: 13 }}>
                {d.teacherCourses.filter(l => l.teacherId === t.id).map(l => d.courses.find(c => c.id === l.courseId)?.name).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="trial" className="land-section">
        <div className="grid cols-2 trial">
          <div>
            <h2 style={{ fontSize: 36 }}>שיעור ניסיון <span className="gold-text">חינם</span></h2>
            <p className="muted" style={{ fontSize: 17 }}>השאירו פרטים ונתאם שיעור היכרות עם המורה המתאים/ה. בלי התחייבות.</p>
            <div className="stack" style={{ marginTop: 20 }}>
              {[[Users, 'מורים מנוסים עם תעודת הוראה'], [CalendarDays, 'שעות גמישות אחר הצהריים'], [ShieldCheck, 'הנחת אחים של 10% מהקורס השני']].map(([Icon, text], i) => {
                const I = Icon as typeof Users;
                return <div key={i} className="row"><span className="kpi-icon"><I size={17} /></span>{text as string}</div>;
              })}
            </div>
          </div>
          <div className="card"><TrialForm /></div>
        </div>
      </section>

      <footer className="land-foot">
        <Logo size={28} /><span>אקורד · בית ספר לנגינה</span><span className="spacer" />
        <span className="faint">פרויקט הדגמה · כל הנתונים בדויים</span>
      </footer>
    </div>
  );
}
