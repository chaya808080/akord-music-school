import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, CircleSlash, GripVertical, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { selectDb, selectLookups, useAction, useAppDispatch, useAppSelector } from '../store';
import { create, remove, update } from '../store/dataSlice';
import { pushToast } from '../store/uiSlice';
import { addDays, dayName, formatShort, HEBREW_DAYS, today, weekStart } from '../domain/dates';
import { lessonConflicts } from '../domain/rules';
import { courseColor, courseEmoji, studentName, teacherName } from '../domain/display';
import { LESSON_HOURS } from '../api/seed';
import type { Lesson } from '../domain/types';
import { Field, Modal, useConfirm } from '../components/ui';
import { autoSchedule, suggestSlots } from '../domain/smart/scheduler';

const DAYS = [0, 1, 2, 3, 4, 5];

function NewLessonModal({ date, hour, onClose }: { date: string; hour: string; onClose: () => void }) {
  const d = useAppSelector(s => s.data);
  const { family, teacher } = useAppSelector(selectLookups);
  const run = useAction();
  const active = d.students.filter(s => s.status === 'פעיל');
  const [studentId, setStudentId] = useState(active[0]?.id ?? 0);
  const studentTeachers = [...new Set(d.enrollments.filter(e => e.studentId === studentId && e.teacherId).map(e => e.teacherId!))];
  const [teacherId, setTeacherId] = useState<number>(studentTeachers[0] ?? d.teachers[0]?.id ?? 0);
  const [slot, setSlot] = useState({ date, hour });
  const draft: Lesson = { id: 0, studentId, teacherId, date: slot.date, hour: slot.hour, dayName: dayName(slot.date), status: 'מתוכנן' };
  const problems = lessonConflicts(draft, d.lessons, d.teachers, d.teacherAbsences);
  const db = useAppSelector(selectDb);
  const enrollment = d.enrollments.find(e => e.studentId === studentId && e.teacherId === teacherId) ?? { id: 0, studentId, courseId: 0, teacherId };
  const suggestions = suggestSlots(enrollment, db, weekStart(date), [], 4);

  const submit = async () => {
    const { id: _ignored, ...item } = draft;
    void _ignored;
    if (await run(create('lessons', item), 'השיעור נקבע ✓')) onClose();
  };

  return (
    <Modal title="קביעת שיעור" icon={<CalendarPlus size={18} />} onClose={onClose} footer={<>
      <button className="btn btn-gold" disabled={problems.length > 0} onClick={submit}>קביעת השיעור</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <div className="form-grid">
        <Field label="תלמיד/ה">
          <select className="select" value={studentId} onChange={e => {
            const sid = Number(e.target.value);
            setStudentId(sid);
            const t = d.enrollments.find(x => x.studentId === sid && x.teacherId)?.teacherId;
            if (t) setTeacherId(t);
          }}>
            {active.map(s => <option key={s.id} value={s.id}>{studentName(s, family.get(s.familyId))}</option>)}
          </select>
        </Field>
        <Field label="מורה" hint={studentTeachers.length ? 'המורים של התלמיד/ה מופיעים ראשונים' : undefined}>
          <select className="select" value={teacherId} onChange={e => setTeacherId(Number(e.target.value))}>
            {[...studentTeachers.map(id => teacher.get(id)!), ...d.teachers.filter(t => !studentTeachers.includes(t.id))]
              .map(t => <option key={t.id} value={t.id}>{teacherName(t)}{!t.active ? ' (לא פעיל/ה)' : ''}</option>)}
          </select>
        </Field>
        <Field label="תאריך"><input className="input" type="date" value={slot.date} onChange={e => setSlot(x => ({ ...x, date: e.target.value }))} /></Field>
        <Field label="שעה">
          <select className="select" value={slot.hour} onChange={e => setSlot(x => ({ ...x, hour: e.target.value }))}>
            {LESSON_HOURS.map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
      </div>
      {suggestions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="row faint" style={{ fontSize: 13, marginBottom: 8 }}><Sparkles size={14} />משבצות מומלצות השבוע (לפי ציון התאמה)</div>
          <div className="grid cols-2" style={{ gap: 8 }}>
            {suggestions.map(sg => (
              <button key={sg.date + sg.hour} type="button" className={`suggest-chip ${slot.date === sg.date && slot.hour === sg.hour ? 'active' : ''}`}
                onClick={() => setSlot({ date: sg.date, hour: sg.hour })}>
                <span className="row"><b>יום {dayName(sg.date)} · {sg.hour}</b><span className="spacer" /><span className="score num">{sg.score}</span></span>
                <span className="faint" style={{ fontSize: 12 }}>{sg.reasons[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {problems.length ? (
          <div className="stack" style={{ gap: 8 }}>{problems.map(p => <div key={p} className="alert bad"><CircleSlash size={16} />{p}</div>)}</div>
        ) : <div className="alert good"><Check size={16} />המשבצת פנויה: אין התנגשויות למורה ולתלמיד/ה</div>}
      </div>
    </Modal>
  );
}

function AutoScheduleModal({ week, onClose }: { week: string; onClose: () => void }) {
  const db = useAppSelector(selectDb);
  const { student, family, teacher, course } = useAppSelector(selectLookups);
  const dispatch = useAppDispatch();
  const ready = useAppSelector(st => st.data.status === 'ready');
  // recomputed when the data arrives (the modal can be opened straight from a deep link)
  const plan = useMemo(() => (ready ? autoSchedule(db, week) : []), [ready, db, week]);
  const [busy, setBusy] = useState(false);
  const placeable = plan.filter(p => p.slot);

  const apply = async () => {
    setBusy(true);
    let ok = 0;
    for (const { enrollment: e, slot } of placeable) {
      for (let w = 0; w < 4; w++) {
        const date = addDays(slot!.date, w * 7);
        const r = await dispatch(create('lessons', { teacherId: e.teacherId!, studentId: e.studentId, date, hour: slot!.hour, dayName: dayName(date), status: 'מתוכנן' }));
        if (!('error' in r)) ok++;
      }
    }
    setBusy(false);
    dispatch(pushToast('success', `נקבעו ${ok} שיעורים ל-${placeable.length} תלמידים (4 שבועות קדימה) ✨`));
    onClose();
  };

  return (
    <Modal title="שיבוץ אוטומטי חכם" icon={<Wand2 size={18} />} onClose={onClose} wide footer={<>
      <button className="btn btn-gold" disabled={!placeable.length || busy} onClick={apply}>{busy ? 'משבץ…' : `אישור ושיבוץ ${placeable.length} תלמידים`}</button>
      <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
    </>}>
      <p className="muted" style={{ marginTop: 0 }}>
        האלגוריתם עובר על כל הרישומים שאין להם שיעור מתוכנן, מהקשה לשבץ אל הקל. לכל אחד הוא בוחר את המשבצת עם ציון ההתאמה הגבוה ביותר:
        שיעורים צמודים לאחים, רצף בלי חלונות למורה, שעה שמתאימה לגיל, ובלי התנגשויות או היעדרויות.
      </p>
      {ready && plan.length === 0 && <div className="alert good"><Check size={16} />לכל הרישומים כבר יש שיעור מתוכנן</div>}
      <div className="stack" style={{ gap: 10 }}>
        {plan.map(({ enrollment: e, slot }) => {
          const s = student.get(e.studentId);
          const c = course.get(e.courseId);
          return (
            <div key={e.id} className="card row wrap" style={{ padding: 14, boxShadow: 'none', background: 'var(--surface-2)' }}>
              <span className="instrument" style={{ '--course': courseColor(e.courseId), width: 40, height: 40, fontSize: 20 } as React.CSSProperties}>{courseEmoji(c)}</span>
              <div style={{ minWidth: 170 }}><b>{studentName(s, family.get(s?.familyId ?? 0))}</b><div className="faint" style={{ fontSize: 12 }}>{c?.name} · {teacherName(teacher.get(e.teacherId ?? 0))}</div></div>
              {slot ? <>
                <span className="badge gold">יום {dayName(slot.date)} · {slot.hour}</span>
                <span className="score num">{slot.score}</span>
                <span className="faint" style={{ fontSize: 13, flex: 1 }}>{slot.reasons.join(' · ')}</span>
              </> : <span className="badge bad">אין משבצת פנויה השבוע</span>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function LessonModal({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { student, teacher, family } = useAppSelector(selectLookups);
  const run = useAction();
  const [confirm, dialog] = useConfirm();
  const s = student.get(lesson.studentId);
  const setStatus = async (status: Lesson['status']) => {
    if (await run(update('lessons', { ...lesson, status }), status === 'התקיים' ? 'סומן כהתקיים ✓' : status === 'בוטל' ? 'השיעור בוטל' : 'השיעור חזר לתכנון')) onClose();
  };
  return (
    <Modal title={studentName(s, family.get(s?.familyId ?? 0))} onClose={onClose}>
      <dl className="kv">
        <dt>מורה</dt><dd>{teacherName(teacher.get(lesson.teacherId))}</dd>
        <dt>מועד</dt><dd>יום {lesson.dayName}, {formatShort(lesson.date)} · {lesson.hour}</dd>
        <dt>סטטוס</dt><dd><span className={`badge ${lesson.status === 'התקיים' ? 'good' : lesson.status === 'בוטל' ? 'bad' : 'gold'}`}>{lesson.status}</span></dd>
      </dl>
      <div className="row wrap" style={{ marginTop: 20 }}>
        {lesson.status !== 'התקיים' && <button className="btn" onClick={() => setStatus('התקיים')}><Check size={16} />התקיים</button>}
        {lesson.status !== 'בוטל' && <button className="btn" onClick={() => setStatus('בוטל')}><CircleSlash size={16} />ביטול שיעור</button>}
        {lesson.status !== 'מתוכנן' && <button className="btn" onClick={() => setStatus('מתוכנן')}>החזרה לתכנון</button>}
        <span className="spacer" />
        <button className="btn btn-danger" onClick={async () => {
          if (await confirm('למחוק את השיעור מהמערכת?')) { if (await run(remove('lessons', lesson.id), 'השיעור נמחק')) onClose(); }
        }}><Trash2 size={16} />מחיקה</button>
      </div>
      {dialog}
    </Modal>
  );
}

export default function Schedule() {
  const d = useAppSelector(s => s.data);
  const { student, teacher, course, family } = useAppSelector(selectLookups);
  const run = useAction();
  const dispatch = useAppDispatch();
  const [week, setWeek] = useState(weekStart(today()));
  const [teacherFilter, setTeacherFilter] = useState(0);
  const [courseFilter, setCourseFilter] = useState(0);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ key: string; ok: boolean } | null>(null);
  const [newSlot, setNewSlot] = useState<{ date: string; hour: string } | null>(null);
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const [params, setParams] = useSearchParams();
  const showAuto = params.get('auto') === '1';

  /** The course of a lesson = the enrollment that pairs this student with this teacher. */
  const courseOf = useMemo(() => {
    const m = new Map<string, number>();
    d.enrollments.forEach(e => m.set(`${e.studentId}-${e.teacherId}`, e.courseId));
    return (l: Lesson) => m.get(`${l.studentId}-${l.teacherId}`) ?? 0;
  }, [d.enrollments]);

  const weekLessons = d.lessons.filter(l => l.date >= week && l.date < addDays(week, 7)
    && (!teacherFilter || l.teacherId === teacherFilter) && (!courseFilter || courseOf(l) === courseFilter));
  const cell = (date: string, hour: string) => weekLessons.filter(l => l.date === date && l.hour === hour);
  const absentToday = (date: string) => d.teacherAbsences.filter(a => date >= a.from && date <= a.to).map(a => a.personId);

  const conflictsFor = (lessonId: number, date: string, hour: string) => {
    const l = d.lessons.find(x => x.id === lessonId)!;
    return lessonConflicts({ ...l, date, hour }, d.lessons, d.teachers, d.teacherAbsences);
  };

  const onDrop = async (date: string, hour: string) => {
    setDropTarget(null);
    const l = d.lessons.find(x => x.id === dragId);
    setDragId(null);
    if (!l || (l.date === date && l.hour === hour)) return;
    const problems = conflictsFor(l.id, date, hour);
    if (problems.length) { dispatch(pushToast('error', problems[0])); return; }
    await run(update('lessons', { ...l, date, hour, dayName: dayName(date) }), `השיעור הועבר ליום ${dayName(date)} ${hour}`);
  };

  const counts = {
    total: weekLessons.filter(l => l.status !== 'בוטל').length,
    held: weekLessons.filter(l => l.status === 'התקיים').length,
    cancelled: weekLessons.filter(l => l.status === 'בוטל').length,
  };
  const usedCourses = d.courses.filter(c => weekLessons.some(l => courseOf(l) === c.id));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>מערכת שעות</h1>
          <p>גררו שיעור למשבצת אחרת כדי להעביר אותו. המערכת בודקת התנגשויות של מורים ותלמידים בזמן אמת.</p>
        </div>
        <div className="row">
          <button className="btn icon-btn" onClick={() => setWeek(addDays(week, -7))} aria-label="שבוע קודם"><ChevronRight size={18} /></button>
          <button className="btn" onClick={() => setWeek(weekStart(today()))}>השבוע</button>
          <button className="btn icon-btn" onClick={() => setWeek(addDays(week, 7))} aria-label="שבוע הבא"><ChevronLeft size={18} /></button>
          <b className="num" style={{ marginInline: 8 }}>{formatShort(week)} – {formatShort(addDays(week, 5))}</b>
          <button className="btn btn-gold" onClick={() => setParams({ auto: '1' })}><Wand2 size={17} />שיבוץ אוטומטי</button>
        </div>
      </div>

      <div className="toolbar">
        <select className="select" style={{ width: 200 }} value={teacherFilter} onChange={e => setTeacherFilter(Number(e.target.value))}>
          <option value={0}>כל המורים</option>
          {d.teachers.map(t => <option key={t.id} value={t.id}>{teacherName(t)}</option>)}
        </select>
        <select className="select" style={{ width: 180 }} value={courseFilter} onChange={e => setCourseFilter(Number(e.target.value))}>
          <option value={0}>כל הקורסים</option>
          {d.courses.map(c => <option key={c.id} value={c.id}>{courseEmoji(c)} {c.name}</option>)}
        </select>
        <span className="spacer" />
        <span className="badge gold num">{counts.total} שיעורים</span>
        <span className="badge good num">{counts.held} התקיימו</span>
        {counts.cancelled > 0 && <span className="badge bad num">{counts.cancelled} בוטלו</span>}
      </div>

      <div className="schedule" role="grid" aria-label="מערכת שעות שבועית">
        <div className="sch-head" />
        {DAYS.map(i => {
          const date = addDays(week, i);
          return <div key={i} className={`sch-head ${date === today() ? 'today' : ''}`}>{HEBREW_DAYS[i]}<small className="num">{formatShort(date)}</small></div>;
        })}
        {LESSON_HOURS.map(hour => (
          <div key={hour} style={{ display: 'contents' }}>
            <div className="sch-hour num">{hour}</div>
            {DAYS.map(i => {
              const date = addDays(week, i);
              const key = `${date}-${hour}`;
              const off = i === 5;
              const absent = absentToday(date);
              return (
                <div key={key} role="gridcell"
                  className={`sch-cell ${off ? 'off' : ''} ${dropTarget?.key === key ? (dropTarget.ok ? 'drop-ok' : 'drop-bad') : ''}`}
                  onDragOver={e => {
                    if (dragId == null) return;
                    e.preventDefault();
                    if (dropTarget?.key !== key) setDropTarget({ key, ok: conflictsFor(dragId, date, hour).length === 0 });
                  }}
                  onDragLeave={() => setDropTarget(t => (t?.key === key ? null : t))}
                  onDrop={() => onDrop(date, hour)}>
                  {cell(date, hour).map(l => {
                    const cid = courseOf(l);
                    const s = student.get(l.studentId);
                    return (
                      <button key={l.id} draggable className={`lesson ${l.status === 'בוטל' ? 'cancelled' : l.status === 'התקיים' ? 'done' : ''}`}
                        style={{ '--course': cid ? courseColor(cid) : 'var(--text-3)' } as React.CSSProperties}
                        onDragStart={e => { setDragId(l.id); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragEnd={() => { setDragId(null); setDropTarget(null); }}
                        onClick={() => setOpenLesson(l)}
                        title={`${studentName(s, family.get(s?.familyId ?? 0))} · ${teacherName(teacher.get(l.teacherId))}`}>
                        <b>{courseEmoji(course.get(cid))} {s?.firstName} {family.get(s?.familyId ?? 0)?.lastName}</b>
                        <span className="faint">{teacher.get(l.teacherId)?.firstName}{absent.includes(l.teacherId) ? ' · ⚠ נעדר/ת' : ''}</span>
                      </button>
                    );
                  })}
                  {!off && <button className="add-slot" onClick={() => setNewSlot({ date, hour })}>+ שיעור</button>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend" style={{ marginTop: 14 }}>
        {usedCourses.map(c => <span key={c.id}><i className="swatch" style={{ background: courseColor(c.id) }} />{c.name}</span>)}
        <span className="faint"><GripVertical size={13} /> גרירה להעברה · לחיצה לפרטים</span>
      </div>

      {newSlot && <NewLessonModal {...newSlot} onClose={() => setNewSlot(null)} />}
      {openLesson && <LessonModal lesson={openLesson} onClose={() => setOpenLesson(null)} />}
      {showAuto && <AutoScheduleModal week={week} onClose={() => setParams({})} />}
    </div>
  );
}
