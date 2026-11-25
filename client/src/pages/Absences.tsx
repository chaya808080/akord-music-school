import { useMemo, useState } from 'react';
import { Plus, Repeat, Trash2, UserRoundX } from 'lucide-react';
import { selectDb, selectLookups, useAction, useAppDispatch, useAppSelector } from '../store';
import { create, remove, update } from '../store/dataSlice';
import { pushToast } from '../store/uiSlice';
import { findSubstitutes } from '../domain/smart/substitutes';
import { formatShort } from '../domain/dates';
import { addDays, formatDate, inRange, today } from '../domain/dates';
import { studentName, teacherName } from '../domain/display';
import type { Absence } from '../domain/types';
import { Empty, Field, Modal, Tabs } from '../components/ui';

type Kind = 'teacherAbsences' | 'studentAbsences';

function AddAbsence({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const d = useAppSelector(s => s.data);
  const { family } = useAppSelector(selectLookups);
  const run = useAction();
  const people = kind === 'teacherAbsences'
    ? d.teachers.map(t => ({ id: t.id, name: teacherName(t) }))
    : d.students.filter(s => s.status === 'פעיל').map(s => ({ id: s.id, name: studentName(s, family.get(s.familyId)) }));
  const [a, setA] = useState<Omit<Absence, 'id'>>({ personId: people[0]?.id ?? 0, from: today(), to: today(), reason: 'מחלה' });
  const affected = kind === 'teacherAbsences'
    ? d.lessons.filter(l => l.teacherId === a.personId && l.status === 'מתוכנן' && inRange(l.date, a.from, a.to)).length : 0;
  return (
    <Modal title={kind === 'teacherAbsences' ? 'היעדרות מורה' : 'היעדרות תלמיד'} icon={<UserRoundX size={18} />} onClose={onClose} footer={<>
      <button className="btn btn-gold" onClick={async () => { if (await run(create(kind, a), 'ההיעדרות נרשמה')) onClose(); }}>שמירה</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <div className="form-grid">
        <Field label={kind === 'teacherAbsences' ? 'מורה' : 'תלמיד/ה'} full>
          <select className="select" value={a.personId} onChange={e => setA({ ...a, personId: Number(e.target.value) })}>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="מתאריך"><input className="input" type="date" value={a.from} onChange={e => setA({ ...a, from: e.target.value })} /></Field>
        <Field label="עד תאריך" error={a.to && a.to < a.from ? 'תאריך הסיום לפני תאריך ההתחלה' : null}>
          <input className="input" type="date" value={a.to} onChange={e => setA({ ...a, to: e.target.value })} />
        </Field>
        <Field label="סיבה" full><input className="input" maxLength={70} value={a.reason} onChange={e => setA({ ...a, reason: e.target.value })} /></Field>
      </div>
      {affected > 0 && <div className="alert warn" style={{ marginTop: 14 }}>שימו לב: למורה יש {affected} שיעורים מתוכננים בטווח הזה. מומלץ להעביר אותם במערכת השעות.</div>}
    </Modal>
  );
}

function SubstitutesModal({ absence, onClose }: { absence: Absence; onClose: () => void }) {
  const db = useAppSelector(selectDb);
  const { student, teacher, family } = useAppSelector(selectLookups);
  const dispatch = useAppDispatch();
  const affected = useMemo(() => findSubstitutes(absence, db), [absence, db]);
  const [choice, setChoice] = useState<Record<number, number>>(() =>
    Object.fromEntries(affected.filter(a => a.options.length).map(a => [a.lesson.id, a.options[0].teacher.id])));

  const apply = async () => {
    let ok = 0;
    for (const a of affected) {
      const sub = choice[a.lesson.id];
      if (!sub) continue;
      const r = await dispatch(update('lessons', { ...a.lesson, teacherId: sub }));
      if (!('error' in r)) ok++;
    }
    dispatch(pushToast('success', `שובצו מחליפים ל-${ok} שיעורים`));
    onClose();
  };

  return (
    <Modal title={`מחליפים עבור ${teacherName(teacher.get(absence.personId))}`} icon={<Repeat size={18} />} onClose={onClose} wide footer={<>
      <button className="btn btn-gold" disabled={!Object.keys(choice).length} onClick={apply}>שיבוץ מחליפים</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <p className="muted" style={{ marginTop: 0 }}>לכל שיעור שנפגע מההיעדרות נבדקים מורים פעילים שמלמדים את אותו כלי ופנויים בדיוק באותה שעה. עדיפות למי שכבר מכיר/ה את התלמיד/ה ונמצא/ת בבית הספר באותו יום.</p>
      {affected.length === 0 && <div className="alert good">אין שיעורים מתוכננים בטווח ההיעדרות</div>}
      <div className="stack" style={{ gap: 10 }}>
        {affected.map(a => {
          const s = student.get(a.lesson.studentId);
          return (
            <div key={a.lesson.id} className="card row wrap" style={{ padding: 14, boxShadow: 'none', background: 'var(--surface-2)' }}>
              <span className="time-pill num">{a.lesson.hour}</span>
              <div style={{ minWidth: 160 }}><b>{studentName(s, family.get(s?.familyId ?? 0))}</b><div className="faint" style={{ fontSize: 12 }}>יום {a.lesson.dayName}, {formatShort(a.lesson.date)}</div></div>
              {a.options.length ? (
                <>
                  <select className="select" style={{ width: 200 }} value={choice[a.lesson.id] ?? ''} onChange={e => setChoice({ ...choice, [a.lesson.id]: Number(e.target.value) })}>
                    {a.options.map(o => <option key={o.teacher.id} value={o.teacher.id}>{teacherName(o.teacher)} ({o.score})</option>)}
                  </select>
                  <span className="faint" style={{ fontSize: 13, flex: 1 }}>{a.options.find(o => o.teacher.id === choice[a.lesson.id])?.why}</span>
                </>
              ) : <span className="badge bad">אין מחליף/ה פנוי/ה – מומלץ לבטל או להעביר</span>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export default function Absences() {
  const d = useAppSelector(s => s.data);
  const { student, teacher, family } = useAppSelector(selectLookups);
  const run = useAction();
  const [kind, setKind] = useState<Kind>('teacherAbsences');
  const [adding, setAdding] = useState(false);
  const [subFor, setSubFor] = useState<Absence | null>(null);
  const now = today();
  const rows = [...d[kind]].sort((a, b) => b.from.localeCompare(a.from));
  const name = (a: Absence) => kind === 'teacherAbsences'
    ? teacherName(teacher.get(a.personId))
    : studentName(student.get(a.personId), family.get(student.get(a.personId)?.familyId ?? 0));
  const state = (a: Absence) => (inRange(now, a.from, a.to) ? ['bad', 'היום'] : a.from > now ? (a.from <= addDays(now, 14) ? ['warn', 'בקרוב'] : ['info', 'עתידי']) : ['', 'הסתיים']);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>היעדרויות</h1><p>היעדרות מורה חוסמת קביעת שיעורים בתאריכים האלה. המערכת מתריעה על שיעורים שכבר נקבעו.</p></div>
        <button className="btn btn-gold" onClick={() => setAdding(true)}><Plus size={17} />רישום היעדרות</button>
      </div>
      <div className="toolbar">
        <Tabs<Kind> value={kind} onChange={setKind} options={[
          { value: 'teacherAbsences', label: 'מורים', count: d.teacherAbsences.length },
          { value: 'studentAbsences', label: 'תלמידים', count: d.studentAbsences.length },
        ]} />
      </div>
      <div className="card">
        {rows.length === 0 ? <Empty title="אין היעדרויות רשומות" /> : rows.map(a => {
          const [tone, label] = state(a);
          return (
            <div key={a.id} className="list-item">
              <span className={`badge ${tone}`}>{label}</span>
              <b style={{ minWidth: 160 }}>{name(a)}</b>
              <span className="num muted">{formatDate(a.from)}{a.to && a.to !== a.from ? ` – ${formatDate(a.to)}` : ''}</span>
              <span className="muted">{a.reason}</span>
              <span className="spacer" />
              {kind === 'teacherAbsences' && a.to >= now && <button className="btn btn-sm btn-gold" onClick={() => setSubFor(a)}><Repeat size={14} />מציאת מחליפים</button>}
              <button className="btn btn-ghost icon-btn btn-danger" aria-label="מחיקה" onClick={() => run(remove(kind, a.id), 'ההיעדרות נמחקה')}><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>
      {adding && <AddAbsence kind={kind} onClose={() => setAdding(false)} />}
      {subFor && <SubstitutesModal absence={subFor} onClose={() => setSubFor(null)} />}
    </div>
  );
}
