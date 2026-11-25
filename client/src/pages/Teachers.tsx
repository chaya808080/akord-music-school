import { useState } from 'react';
import { Link2, Mail, Pencil, Phone, Plus, X } from 'lucide-react';
import { selectLookups, useAction, useAppSelector } from '../store';
import { create, remove } from '../store/dataSlice';
import { addDays, formatShort, today, weekStart } from '../domain/dates';
import { courseColor, courseEmoji, teacherName } from '../domain/display';
import type { Teacher } from '../domain/types';
import { Avatar, Field, Modal, SearchBox } from '../components/ui';
import { TeacherForm } from './forms';

function AssignCourse({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const courses = useAppSelector(s => s.data.courses);
  const links = useAppSelector(s => s.data.teacherCourses);
  const run = useAction();
  const available = courses.filter(c => !links.some(l => l.teacherId === teacher.id && l.courseId === c.id));
  const [courseId, setCourseId] = useState(available[0]?.id ?? 0);
  return (
    <Modal title={`שיוך קורס ל${teacher.firstName}`} icon={<Link2 size={18} />} onClose={onClose} footer={<>
      <button className="btn btn-gold" disabled={!courseId} onClick={async () => {
        if (await run(create('teacherCourses', { teacherId: teacher.id, courseId }), 'הקורס שויך')) onClose();
      }}>שיוך</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <Field label="קורס">
        <select className="select" value={courseId} onChange={e => setCourseId(Number(e.target.value))}>
          {available.map(c => <option key={c.id} value={c.id}>{courseEmoji(c)} {c.name}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

export default function Teachers() {
  const d = useAppSelector(s => s.data);
  const { course } = useAppSelector(selectLookups);
  const run = useAction();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Teacher | 'new' | null>(null);
  const [assigning, setAssigning] = useState<Teacher | null>(null);
  const sunday = weekStart(today());

  const teachers = d.teachers.filter(t => !q.trim() || teacherName(t).includes(q.trim()));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>צוות המורים</h1><p>{d.teachers.filter(t => t.active).length} מורים פעילים · עומס, קורסים והיעדרויות במבט אחד</p></div>
        <button className="btn btn-gold" onClick={() => setEditing('new')}><Plus size={17} />מורה חדש/ה</button>
      </div>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="חיפוש מורה" /></div>
      <div className="grid cols-3">
        {teachers.map(t => {
          const links = d.teacherCourses.filter(l => l.teacherId === t.id);
          const students = new Set(d.enrollments.filter(e => e.teacherId === t.id).map(e => e.studentId)).size;
          const week = d.lessons.filter(l => l.teacherId === t.id && l.date >= sunday && l.date < addDays(sunday, 7) && l.status !== 'בוטל').length;
          const absence = d.teacherAbsences.find(a => a.personId === t.id && a.to >= today());
          return (
            <div key={t.id} className="card entity-card" style={{ opacity: t.active ? 1 : 0.7 }}>
              <div className="entity-head">
                <Avatar name={teacherName(t)} id={t.id + 2} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 16 }}>{teacherName(t)}</b>
                  <div className="row" style={{ gap: 6, marginTop: 4 }}>
                    {t.active ? <span className="badge good"><span className="dot" />פעיל/ה</span> : <span className="badge">לא פעיל/ה</span>}
                    {absence && <span className="badge warn">היעדרות {formatShort(absence.from)}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost icon-btn" onClick={() => setEditing(t)} aria-label="עריכה"><Pencil size={16} /></button>
              </div>
              <div className="stat-row">
                <div><b className="num">{students}</b><span>תלמידים</span></div>
                <div><b className="num">{week}</b><span>שיעורים השבוע</span></div>
                <div><b className="num">{links.length}</b><span>קורסים</span></div>
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {links.map(l => (
                  <span key={l.id} className="chip">
                    <i className="swatch" style={{ background: courseColor(l.courseId) }} />{courseEmoji(course.get(l.courseId))} {course.get(l.courseId)?.name}
                    <button className="btn-ghost" style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      onClick={() => run(remove('teacherCourses', l.id), 'השיוך הוסר')} aria-label="הסרת שיוך"><X size={12} /></button>
                  </span>
                ))}
                <button className="chip" style={{ cursor: 'pointer', borderStyle: 'dashed' }} onClick={() => setAssigning(t)}><Plus size={12} />קורס</button>
              </div>
              <div className="divider" style={{ margin: 0 }} />
              <div className="row faint" style={{ fontSize: 13, justifyContent: 'space-between' }}>
                <span className="row" style={{ gap: 6 }}><Phone size={14} /><span className="ltr num">{t.phone}</span></span>
                <span className="row" style={{ gap: 6 }}><Mail size={14} /><span className="ltr">{t.email}</span></span>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <TeacherForm teacher={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {assigning && <AssignCourse teacher={assigning} onClose={() => setAssigning(null)} />}
    </div>
  );
}
