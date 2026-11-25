import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpCircle, Clock3, Plus, Trash2 } from 'lucide-react';
import { selectLookups, useAction, useAppSelector } from '../store';
import { create, promoteWaiting, remove } from '../store/dataSlice';
import { daysBetween, formatDate, today } from '../domain/dates';
import { enrollmentProblems } from '../domain/rules';
import { courseColor, courseEmoji, studentName, teacherName } from '../domain/display';
import type { WaitingEntry } from '../domain/types';
import { Avatar, Empty, Field, Modal, useConfirm } from '../components/ui';

function PromoteModal({ entry, onClose }: { entry: WaitingEntry; onClose: () => void }) {
  const d = useAppSelector(s => s.data);
  const { student, course, teacher, family } = useAppSelector(selectLookups);
  const run = useAction();
  const s = student.get(entry.studentId)!;
  const c = course.get(entry.courseId)!;
  const options = d.teacherCourses.filter(t => t.courseId === c.id).map(t => teacher.get(t.teacherId)!).filter(t => t.active);
  const [teacherId, setTeacherId] = useState<number | null>(options[0]?.id ?? null);
  const problems = enrollmentProblems(s, c, d.enrollments);

  return (
    <Modal title="קליטה מרשימת ההמתנה" icon={<ArrowUpCircle size={18} />} onClose={onClose} footer={<>
      <button className="btn btn-gold" disabled={problems.length > 0} onClick={async () => {
        if (await run(promoteWaiting({ waitingId: entry.id, teacherId }), `${s.firstName} נקלט/ה ב${c.name} 🎉`)) onClose();
      }}>קליטה לקורס</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <p style={{ marginTop: 0 }}>
        <b>{studentName(s, family.get(s.familyId))}</b> יירשם/תירשם לקורס <b>{courseEmoji(c)} {c.name}</b>, הסטטוס יעודכן ל"פעיל" והרשומה תוסר מרשימת ההמתנה.
        כל הפעולות מתבצעות יחד בבקשה אחת לשרת.
      </p>
      {problems.length > 0 ? <div className="alert bad">{problems[0]}</div> : (
        <Field label="מורה" hint="מורים פעילים שמלמדים את הקורס">
          <select className="select" value={teacherId ?? ''} onChange={e => setTeacherId(e.target.value ? Number(e.target.value) : null)}>
            {options.map(t => <option key={t.id} value={t.id}>{teacherName(t)}</option>)}
            <option value="">ללא שיבוץ כרגע</option>
          </select>
        </Field>
      )}
    </Modal>
  );
}

function AddWaiting({ onClose }: { onClose: () => void }) {
  const d = useAppSelector(s => s.data);
  const { family } = useAppSelector(selectLookups);
  const run = useAction();
  const candidates = d.students.filter(s => s.status !== 'גמר');
  const [studentId, setStudentId] = useState(candidates[0]?.id ?? 0);
  const [courseId, setCourseId] = useState(d.courses[0]?.id ?? 0);
  const [reason, setReason] = useState('אין מקום פנוי בשעות המבוקשות');
  return (
    <Modal title="הוספה לרשימת ההמתנה" icon={<Clock3 size={18} />} onClose={onClose} footer={<>
      <button className="btn btn-gold" onClick={async () => {
        if (await run(create('waitingList', { studentId, courseId, since: today(), reason }), 'נוסף לרשימת ההמתנה')) onClose();
      }}>הוספה</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <div className="form-grid">
        <Field label="תלמיד/ה"><select className="select" value={studentId} onChange={e => setStudentId(Number(e.target.value))}>
          {candidates.map(s => <option key={s.id} value={s.id}>{studentName(s, family.get(s.familyId))}</option>)}</select></Field>
        <Field label="קורס"><select className="select" value={courseId} onChange={e => setCourseId(Number(e.target.value))}>
          {d.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="סיבה" full><input className="input" maxLength={70} value={reason} onChange={e => setReason(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export default function WaitingList() {
  const d = useAppSelector(s => s.data);
  const { student, course, family } = useAppSelector(selectLookups);
  const run = useAction();
  const [confirm, dialog] = useConfirm();
  const [promoting, setPromoting] = useState<WaitingEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const rows = [...d.waitingList].sort((a, b) => a.since.localeCompare(b.since));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>רשימת המתנה</h1><p>לפי סדר הגעה · קליטה לקורס בלחיצה, כולל בדיקת התאמה לגיל ולקהל היעד</p></div>
        <button className="btn btn-gold" onClick={() => setAdding(true)}><Plus size={17} />הוספה לרשימה</button>
      </div>
      {rows.length === 0 ? <div className="card"><Empty title="רשימת ההמתנה ריקה" text="כל התלמידים שובצו 🎉" /></div> : (
        <div className="stack">
          {rows.map((w, i) => {
            const s = student.get(w.studentId);
            const c = course.get(w.courseId);
            const days = daysBetween(w.since, today());
            const problems = s && c ? enrollmentProblems(s, c, d.enrollments) : [];
            return (
              <div key={w.id} className="card row wrap" style={{ padding: 16 }}>
                <span className="time-pill num">#{i + 1}</span>
                <Avatar name={studentName(s, family.get(s?.familyId ?? 0))} id={w.studentId} />
                <div style={{ minWidth: 180 }}>
                  <Link to={`/app/students/${w.studentId}`}><b>{studentName(s, family.get(s?.familyId ?? 0))}</b></Link>
                  <div className="faint" style={{ fontSize: 13 }}>{w.reason}</div>
                </div>
                <span className="chip"><i className="swatch" style={{ background: courseColor(w.courseId) }} />{courseEmoji(c)} {c?.name}</span>
                <span className={`badge ${days > 30 ? 'bad' : days > 14 ? 'warn' : ''}`}>ממתין/ה {days} ימים · מ-{formatDate(w.since)}</span>
                {problems.length > 0 && <span className="badge bad">{problems[0]}</span>}
                <span className="spacer" />
                <button className="btn btn-gold btn-sm" onClick={() => setPromoting(w)}><ArrowUpCircle size={15} />קליטה לקורס</button>
                <button className="btn btn-ghost icon-btn btn-danger" aria-label="הסרה" onClick={async () => {
                  if (await confirm('להסיר מרשימת ההמתנה?')) await run(remove('waitingList', w.id), 'הוסר מהרשימה');
                }}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      )}
      {promoting && <PromoteModal entry={promoting} onClose={() => setPromoting(null)} />}
      {adding && <AddWaiting onClose={() => setAdding(false)} />}
      {dialog}
    </div>
  );
}
