import { useState } from 'react';
import { Clock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useAction, useAppSelector } from '../store';
import { remove } from '../store/dataSlice';
import { courseColor, courseEmoji, teacherName } from '../domain/display';
import { shekel } from '../domain/billing';
import type { Course } from '../domain/types';
import { useConfirm } from '../components/ui';
import { CourseForm } from './forms';

export default function Courses() {
  const d = useAppSelector(s => s.data);
  const run = useAction();
  const [confirm, dialog] = useConfirm();
  const [editing, setEditing] = useState<Course | 'new' | null>(null);
  const maxEnrolled = Math.max(1, ...d.courses.map(c => d.enrollments.filter(e => e.courseId === c.id).length));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>קורסים ומסלולים</h1><p>{d.courses.length} קורסים · מחירים, טווחי גילאים, מורים והכנסה חודשית לכל קורס</p></div>
        <button className="btn btn-gold" onClick={() => setEditing('new')}><Plus size={17} />קורס חדש</button>
      </div>
      <div className="grid cols-3">
        {d.courses.map(c => {
          const enrolled = d.enrollments.filter(e => e.courseId === c.id).length;
          const waiting = d.waitingList.filter(w => w.courseId === c.id).length;
          const teachers = d.teacherCourses.filter(t => t.courseId === c.id).map(t => d.teachers.find(x => x.id === t.teacherId));
          return (
            <div key={c.id} className="card entity-card">
              <div className="entity-head">
                <div className="instrument" style={{ '--course': courseColor(c.id) } as React.CSSProperties}>{courseEmoji(c)}</div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 18 }}>{c.name}</b>
                  <div className="row" style={{ gap: 6, marginTop: 4 }}>
                    <span className="badge">{c.audience}</span><span className="badge">גילאי {c.fromAge}–{c.toAge}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}><b className="gold-text num" style={{ fontSize: 22 }}>{shekel(c.price)}</b><div className="faint" style={{ fontSize: 11 }}>לחודש</div></div>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 14, minHeight: 40 }}>{c.description}</p>
              <div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span className="row" style={{ gap: 6 }}><Users size={14} className="faint" /><b className="num">{enrolled}</b> תלמידים{waiting > 0 && <span className="badge warn">+{waiting} ממתינים</span>}</span>
                  <span className="row faint" style={{ gap: 6 }}><Clock size={14} />{c.durationMinutes} דק׳</span>
                </div>
                <div className="progress"><div style={{ width: `${(enrolled / maxEnrolled) * 100}%` }} /></div>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="faint" style={{ fontSize: 13 }}>{teachers.map(t => teacherName(t)).join(' · ') || 'אין מורה משויך/ת'}</span>
                <span className="num" style={{ fontSize: 13 }}>{shekel(enrolled * c.price)}/ח׳</span>
              </div>
              <div className="row">
                <button className="btn btn-sm" onClick={() => setEditing(c)}><Pencil size={14} />עריכה</button>
                <button className="btn btn-sm btn-danger" onClick={async () => {
                  if (await confirm(`למחוק את הקורס ${c.name}?`)) await run(remove('courses', c.id), 'הקורס נמחק');
                }}><Trash2 size={14} />מחיקה</button>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <CourseForm course={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {dialog}
    </div>
  );
}
