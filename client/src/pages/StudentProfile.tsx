import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarCheck, Copy, Flame, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2, Wallet, X } from 'lucide-react';
import { selectDb, selectLookups, useAction, useAppDispatch, useAppSelector } from '../store';
import { pushToast } from '../store/uiSlice';
import { churnRisk } from '../domain/smart/risk';
import { compose, TEMPLATES, whatsappLink, type Template } from '../domain/smart/messages';
import { create, remove } from '../store/dataSlice';
import { enrollmentProblems } from '../domain/rules';
import { courseColor, courseEmoji, studentAge, teacherName } from '../domain/display';
import { formatDate, formatShort, today } from '../domain/dates';
import { familyBills, shekel } from '../domain/billing';
import type { Student } from '../domain/types';
import { Avatar, Empty, Field, Modal, StatusBadge, useConfirm } from '../components/ui';
import { StudentForm } from './forms';

function EnrollModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const courses = useAppSelector(s => s.data.courses);
  const enrollments = useAppSelector(s => s.data.enrollments);
  const teacherCourses = useAppSelector(s => s.data.teacherCourses);
  const { teacher } = useAppSelector(selectLookups);
  const run = useAction();
  const [courseId, setCourseId] = useState<number | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const teachersOfCourse = teacherCourses.filter(t => t.courseId === courseId).map(t => teacher.get(t.teacherId)!).filter(t => t?.active);

  const submit = async () => {
    if (!courseId) return;
    const ok = await run(create('enrollments', { studentId: student.id, courseId, teacherId }), `${student.firstName} נרשם/ה לקורס`);
    if (ok) onClose();
  };

  return (
    <Modal title={`רישום ${student.firstName} לקורס`} icon={<BookOpen size={18} />} onClose={onClose} wide footer={<>
      <button className="btn btn-gold" disabled={!courseId} onClick={submit}>אישור רישום</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <p className="muted" style={{ marginTop: 0 }}>המערכת בודקת התאמה לגיל, לקהל היעד ולרישום קיים. קורסים שאינם מתאימים מוצגים עם הסיבה.</p>
      <div className="grid cols-2">
        {courses.map(c => {
          const problems = enrollmentProblems(student, c, enrollments);
          const selected = courseId === c.id;
          return (
            <button key={c.id} type="button" disabled={problems.length > 0} onClick={() => { setCourseId(c.id); setTeacherId(null); }}
              className="card entity-card" style={{ textAlign: 'start', cursor: problems.length ? 'not-allowed' : 'pointer', opacity: problems.length ? 0.55 : 1,
                borderColor: selected ? 'var(--gold)' : undefined, boxShadow: selected ? '0 0 0 3px var(--gold-soft)' : undefined, padding: 14 }}>
              <div className="entity-head">
                <div className="instrument" style={{ '--course': courseColor(c.id), width: 42, height: 42, fontSize: 21 } as React.CSSProperties}>{courseEmoji(c)}</div>
                <div style={{ flex: 1 }}><b>{c.name}</b><div className="faint" style={{ fontSize: 12 }}>גילאי {c.fromAge}–{c.toAge} · {c.audience} · {shekel(c.price)}</div></div>
              </div>
              {problems.length > 0 && <span className="error-text">{problems[0]}</span>}
            </button>
          );
        })}
      </div>
      {courseId && (
        <div style={{ marginTop: 18 }}>
          <Field label="מורה מלווה" hint="מוצגים רק מורים פעילים שמלמדים את הקורס">
            <select className="select" value={teacherId ?? ''} onChange={e => setTeacherId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">ללא שיבוץ כרגע</option>
              {teachersOfCourse.map(t => <option key={t.id} value={t.id}>{teacherName(t)}</option>)}
            </select>
          </Field>
        </div>
      )}
    </Modal>
  );
}

function MessageModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const db = useAppSelector(selectDb);
  const dispatch = useAppDispatch();
  const phone = db.families.find(f => f.id === student.familyId)?.phone ?? '';
  const [template, setTemplate] = useState<Template>('reminder');
  const [text, setText] = useState(() => compose('reminder', student.id, db));
  const pick = (t: Template) => { setTemplate(t); setText(compose(t, student.id, db)); };
  return (
    <Modal title="הודעה להורים" icon={<MessageCircle size={18} />} onClose={onClose} footer={<>
      <a className="btn btn-gold" href={whatsappLink(phone, text)} target="_blank" rel="noreferrer"><MessageCircle size={16} />שליחה ב-WhatsApp</a>
      <button className="btn" onClick={async () => { await navigator.clipboard.writeText(text); dispatch(pushToast('success', 'ההודעה הועתקה')); }}><Copy size={16} />העתקה</button>
    </>}>
      <div className="tabs" style={{ marginBottom: 14 }}>
        {TEMPLATES.map(t => <button key={t.value} className={`tab ${template === t.value ? 'active' : ''}`} onClick={() => pick(t.value)}>{t.label}</button>)}
      </div>
      <textarea className="textarea" rows={9} value={text} onChange={e => setText(e.target.value)} />
      <p className="faint" style={{ fontSize: 12, marginBottom: 0 }}>ההודעה נבנית אוטומטית מהנתונים: השיעור הבא, פירוט החיוב או מספר הביטולים. אפשר לערוך אותה לפני השליחה.</p>
    </Modal>
  );
}

export default function StudentProfile() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const d = useAppSelector(s => s.data);
  const { family, course, teacher } = useAppSelector(selectLookups);
  const run = useAction();
  const [confirm, dialog] = useConfirm();
  const [editing, setEditing] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const db = useAppSelector(selectDb);

  const s = d.students.find(x => x.id === id);
  if (d.status !== 'ready') return <div className="page" />;
  if (!s) return <div className="page"><Empty title="התלמיד לא נמצא" action={<Link className="btn" to="/app/students">חזרה לרשימה</Link>} /></div>;

  const f = family.get(s.familyId);
  const myEnrollments = d.enrollments.filter(e => e.studentId === s.id);
  const lessons = d.lessons.filter(l => l.studentId === s.id).sort((a, b) => (b.date + b.hour).localeCompare(a.date + a.hour));
  const past = lessons.filter(l => l.date < today());
  const held = past.filter(l => l.status === 'התקיים').length;
  const attendance = past.length ? Math.round((held / past.length) * 100) : 100;
  const next = [...lessons].reverse().find(l => l.date >= today() && l.status === 'מתוכנן');
  const bill = f ? familyBills([f], d.students, d.courses, d.enrollments)[0] : null;
  const absences = d.studentAbsences.filter(a => a.personId === s.id);
  const siblings = d.students.filter(x => x.familyId === s.familyId && x.id !== s.id);
  const risk = s.status === 'פעיל' ? churnRisk(s, db) : null;

  const unenroll = async (enrollmentId: number, name: string) => {
    if (await confirm(`להסיר את ${s.firstName} מהקורס ${name}?`)) await run(remove('enrollments', enrollmentId), 'הרישום הוסר');
  };
  const deleteStudent = async () => {
    if (await confirm(`למחוק את ${s.firstName} לצמיתות? אי אפשר לבטל את הפעולה.`, 'מחיקת תלמיד')) {
      if (await run(remove('students', s.id), 'התלמיד נמחק')) navigate('/app/students');
    }
  };

  return (
    <div className="page">
      <Link to="/app/students" className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }}><ArrowRight size={16} />כל התלמידים</Link>

      <div className="card profile-hero">
        <Avatar name={`${s.firstName} ${f?.lastName ?? ''}`} id={s.id} size="lg" />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="row wrap"><h1 style={{ fontSize: 28 }}>{s.firstName} {f?.lastName}</h1><StatusBadge status={s.status} /></div>
          <p className="muted" style={{ margin: '6px 0 0' }}>{s.gender === 'בת' ? 'בת' : 'בן'} {studentAge(s)} · ת.ז <span className="num">{s.idNumber}</span> · תלמיד/ה מ-{formatDate(s.startDate)}</p>
        </div>
        <div className="stat-row" style={{ minWidth: 330 }}>
          <div><b className="num">{s.lessonsTaken}</b><span>שיעורים</span></div>
          <div><b className="num">{attendance}%</b><span>נוכחות</span></div>
          <div><b className="num">{bill ? shekel(bill.total) : '—'}</b><span>חיוב משפחתי</span></div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setMessaging(true)}><MessageCircle size={16} />הודעה להורים</button>
          <button className="btn" onClick={() => setEditing(true)}><Pencil size={16} />עריכה</button>
          <button className="btn btn-danger icon-btn" onClick={deleteStudent} aria-label="מחיקה"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        <div className="card span-2">
          <div className="card-title">
            <h3>קורסים</h3>
            <button className="btn btn-sm btn-gold" onClick={() => setEnrolling(true)}><Plus size={15} />רישום לקורס</button>
          </div>
          {myEnrollments.length === 0 && <Empty title="עדיין לא רשום/ה לקורס" text="לחצו על 'רישום לקורס' כדי להתחיל" />}
          <div className="grid cols-2">
            {myEnrollments.map(e => {
              const c = course.get(e.courseId);
              return (
                <div key={e.id} className="card" style={{ padding: 16, boxShadow: 'none', background: 'var(--surface-2)' }}>
                  <div className="entity-head">
                    <div className="instrument" style={{ '--course': courseColor(e.courseId) } as React.CSSProperties}>{courseEmoji(c)}</div>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 16 }}>{c?.name}</b>
                      <div className="faint" style={{ fontSize: 13 }}>{e.teacherId ? `עם ${teacherName(teacher.get(e.teacherId))}` : 'טרם שובץ מורה'} · {shekel(c?.price ?? 0)}/חודש</div>
                    </div>
                    <button className="btn btn-ghost icon-btn" onClick={() => unenroll(e.id, c?.name ?? '')} aria-label="הסרה מהקורס"><X size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {next && <div className="alert info" style={{ marginTop: 16 }}><CalendarCheck size={16} />השיעור הבא: יום {next.dayName}, {formatShort(next.date)} בשעה {next.hour} עם {teacherName(teacher.get(next.teacherId))}</div>}
        </div>

        <div className="card">
          <div className="card-title"><h3>משפחת {f?.lastName}</h3></div>
          <div className="stack" style={{ gap: 10, fontSize: 14 }}>
            <span className="row"><Phone size={15} className="faint" /><span className="ltr num">{f?.phone}</span></span>
            <span className="row"><Mail size={15} className="faint" /><span className="ltr">{f?.email}</span></span>
            <span className="row"><MapPin size={15} className="faint" />{f?.address}</span>
            <span className="row"><Wallet size={15} className="faint" />{f?.paymentMethod}</span>
          </div>
          {siblings.length > 0 && <>
            <div className="divider" />
            <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>אחים בבית הספר</div>
            <div className="row wrap">{siblings.map(x => <Link key={x.id} to={`/app/students/${x.id}`} className="chip">{x.firstName} · <StatusBadge status={x.status} /></Link>)}</div>
          </>}
        </div>

        <div className="card span-2">
          <div className="card-title"><h3>היסטוריית שיעורים</h3><span className="faint num" style={{ fontSize: 12 }}>{held} התקיימו מתוך {past.length}</span></div>
          <div className="progress" style={{ marginBottom: 16 }}><div style={{ width: `${attendance}%` }} /></div>
          <div className="timeline">
            {lessons.slice(0, 8).map(l => (
              <div key={l.id} className="tl-item row">
                <b className="num">{formatShort(l.date)}</b><span className="faint">יום {l.dayName} · {l.hour}</span>
                <span className="muted">{teacherName(teacher.get(l.teacherId))}</span>
                <span className="spacer" />
                <span className={`badge ${l.status === 'התקיים' ? 'good' : l.status === 'בוטל' ? 'bad' : 'gold'}`}>{l.status}</span>
              </div>
            ))}
            {lessons.length === 0 && <span className="faint">אין שיעורים במערכת</span>}
          </div>
        </div>

        <div className="card">
          {risk && <>
            <div className="card-title"><h3><Flame size={16} style={{ verticalAlign: -2 }} /> סיכון נשירה</h3>
              <span className={`badge ${risk.level === 'גבוה' ? 'bad' : risk.level === 'בינוני' ? 'warn' : 'good'}`}>{risk.level} · {risk.score}</span></div>
            <div className="risk-meter" style={{ marginBottom: 10 }}><div style={{ width: `${Math.max(4, risk.score)}%`, background: risk.level === 'גבוה' ? 'var(--bad)' : risk.level === 'בינוני' ? 'var(--warn)' : 'var(--good)' }} /></div>
            {risk.factors.slice(0, 3).map(f => <div key={f.label} className="faint" style={{ fontSize: 13 }}>• {f.label}</div>)}
            {risk.level !== 'נמוך' && <div className="alert info" style={{ marginTop: 10, padding: '8px 10px' }}>מומלץ: {risk.action}</div>}
            <div className="divider" />
          </>}
          <div className="card-title"><h3>היעדרויות</h3></div>
          {absences.length === 0 ? <span className="faint">לא נרשמו היעדרויות</span> : absences.map(a => (
            <div key={a.id} className="list-item"><span className="badge warn">{a.reason}</span><span className="num muted">{formatShort(a.from)}–{formatShort(a.to)}</span></div>
          ))}
          {s.notes && <><div className="divider" /><div className="faint" style={{ fontSize: 12 }}>הערות</div><p style={{ margin: '6px 0 0' }}>{s.notes}</p></>}
        </div>
      </div>

      {editing && <StudentForm student={s} onClose={() => setEditing(false)} />}
      {enrolling && <EnrollModal student={s} onClose={() => setEnrolling(false)} />}
      {messaging && <MessageModal student={s} onClose={() => setMessaging(false)} />}
      {dialog}
    </div>
  );
}
