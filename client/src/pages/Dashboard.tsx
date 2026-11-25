import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Clock3, CreditCard, GraduationCap, Plus, Sparkles } from 'lucide-react';
import { selectDb, selectLookups, useAppSelector } from '../store';
import { insights } from '../domain/smart/insights';
import { InsightCard } from './Insights';
import { addDays, addMonths, daysBetween, formatShort, HEBREW_MONTHS, inRange, parse, today, weekStart } from '../domain/dates';
import { familyBills, shekel } from '../domain/billing';
import { courseColor, courseEmoji, studentName, teacherName } from '../domain/display';
import { ColumnChart, HBarList, StackedBar } from '../components/charts';
import { Skeleton } from '../components/ui';

function Kpi({ icon, label, value, foot }: { icon: React.ReactNode; label: string; value: React.ReactNode; foot: React.ReactNode }) {
  return (
    <div className="card kpi">
      <div className="kpi-label"><span className="kpi-icon">{icon}</span>{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">{foot}</div>
    </div>
  );
}

export default function Dashboard() {
  const d = useAppSelector(s => s.data);
  const { student, teacher, course, family } = useAppSelector(selectLookups);
  const db = useAppSelector(selectDb);
  const now = today();
  const smart = useMemo(() => insights(db).slice(0, 3), [db]);

  const m = useMemo(() => {
    const active = d.students.filter(s => s.status === 'פעיל');
    const monthStart = now.slice(0, 8) + '01';
    const bills = familyBills(d.families, d.students, d.courses, d.enrollments);
    const sunday = weekStart(now);
    const weekLessons = d.lessons.filter(l => l.date >= sunday && l.date < addDays(sunday, 7));
    const months = Array.from({ length: 12 }, (_, i) => addMonths(monthStart, i - 11).slice(0, 7));
    const newByMonth = months.map(mo => {
      const value = d.students.filter(s => s.startDate.startsWith(mo)).length;
      const [y, mm] = mo.split('-').map(Number);
      return { label: HEBREW_MONTHS[mm - 1], value, detail: `${HEBREW_MONTHS[mm - 1]} ${y}` };
    });
    const byCourse = d.courses
      .map(c => {
        const n = d.enrollments.filter(e => e.courseId === c.id).length;
        return { label: c.name, value: n, detail: `${n} תלמידים · ${shekel(n * c.price)} בחודש` };
      })
      .sort((a, b) => b.value - a.value);
    const teacherLoad = d.teachers.filter(t => t.active)
      .map(t => ({ label: teacherName(t), value: weekLessons.filter(l => l.teacherId === t.id && l.status !== 'בוטל').length }))
      .sort((a, b) => b.value - a.value);
    let upcoming = d.lessons.filter(l => l.date === now && l.status !== 'בוטל').sort((a, b) => a.hour.localeCompare(b.hour));
    const upcomingTitle = upcoming.length ? 'השיעורים של היום' : 'השיעורים הקרובים';
    if (!upcoming.length) upcoming = d.lessons.filter(l => l.date > now && l.status === 'מתוכנן').sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));

    const alerts = [
      ...d.teacherAbsences.filter(a => a.to >= now && a.from <= addDays(now, 14)).map(a => ({
        kind: 'warn', text: `היעדרות מורה: ${teacherName(teacher.get(a.personId))}, ${formatShort(a.from)}–${formatShort(a.to)} (${a.reason})`,
      })),
      ...d.studentAbsences.filter(a => inRange(now, a.from, a.to)).map(a => ({
        kind: 'info', text: `${studentName(student.get(a.personId), family.get(student.get(a.personId)?.familyId ?? 0))} נעדר/ת היום · ${a.reason}`,
      })),
      ...d.waitingList.filter(w => daysBetween(w.since, now) > 30).map(w => ({
        kind: 'bad', text: `${student.get(w.studentId)?.firstName ?? ''} ממתין/ה ל${course.get(w.courseId)?.name ?? ''} כבר ${daysBetween(w.since, now)} ימים`,
      })),
    ];

    return {
      active, bills, weekLessons, newByMonth, byCourse, teacherLoad, upcoming: upcoming.slice(0, 7), upcomingTitle, alerts,
      revenue: bills.reduce((s, b) => s + b.total, 0),
      newThisMonth: d.students.filter(s => s.startDate >= monthStart).length,
      avgWait: d.waitingList.length ? Math.round(d.waitingList.reduce((s, w) => s + daysBetween(w.since, now), 0) / d.waitingList.length) : 0,
    };
  }, [d, now, student, teacher, course, family]);

  if (d.status !== 'ready') {
    return (
      <div className="page">
        <div className="grid cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="card"><Skeleton h={90} /></div>)}</div>
        <div className="card" style={{ marginTop: 18 }}><Skeleton h={240} /></div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב';
  const held = m.weekLessons.filter(l => l.status === 'התקיים').length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{greeting}, <span className="gold-text">אקורד</span> 🎼</h1>
          <p>{parse(now).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · זו תמונת המצב של בית הספר</p>
        </div>
        <div className="row">
          <Link to="/app/schedule" className="btn"><CalendarDays size={17} />למערכת השעות</Link>
          <Link to="/app/students?new=1" className="btn btn-gold"><Plus size={17} />תלמיד חדש</Link>
        </div>
      </div>

      <div className="grid cols-4">
        <Kpi icon={<GraduationCap size={18} />} label="תלמידים פעילים" value={m.active.length}
          foot={<><span className="trend-up">+{m.newThisMonth}</span> הצטרפו החודש</>} />
        <Kpi icon={<CreditCard size={18} />} label="הכנסה חודשית צפויה" value={shekel(m.revenue)}
          foot={`${m.bills.filter(b => b.total > 0).length} משפחות משלמות, אחרי הנחות אחים`} />
        <Kpi icon={<CalendarDays size={18} />} label="שיעורים השבוע" value={m.weekLessons.filter(l => l.status !== 'בוטל').length}
          foot={`${held} התקיימו · ${m.weekLessons.filter(l => l.status === 'בוטל').length} בוטלו`} />
        <Kpi icon={<Clock3 size={18} />} label="ברשימת המתנה" value={d.waitingList.length}
          foot={`זמן המתנה ממוצע: ${m.avgWait} ימים`} />
      </div>

      {smart.length > 0 && (
        <>
          <div className="row" style={{ margin: '26px 0 12px' }}>
            <Sparkles size={18} style={{ color: 'var(--gold)' }} /><h3>תובנות חכמות</h3>
            <span className="spacer" /><Link to="/app/insights" className="btn btn-sm btn-ghost">לכל התובנות</Link>
          </div>
          <div className="grid cols-3">{smart.map((i, k) => <InsightCard key={k} insight={i} />)}</div>
        </>
      )}

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        <div className="card span-2">
          <div className="card-title"><h3>הצטרפות תלמידים חדשים</h3><span className="faint" style={{ fontSize: 12 }}>12 החודשים האחרונים</span></div>
          <ColumnChart data={m.newByMonth} unit="תלמידים חדשים" />
        </div>
        <div className="card">
          <div className="card-title"><h3>מצב התלמידים</h3></div>
          <StackedBar parts={[
            { label: 'פעילים', value: d.students.filter(s => s.status === 'פעיל').length, color: 'var(--c3)' },
            { label: 'ממתינים', value: d.students.filter(s => s.status === 'מחכה').length, color: 'var(--c2)' },
            { label: 'סיימו', value: d.students.filter(s => s.status === 'גמר').length, color: 'var(--c1)' },
          ]} />
          <div className="divider" />
          <div className="card-title" style={{ marginBottom: 8 }}><h3>תלמידים לפי קורס</h3></div>
          <HBarList data={m.byCourse} unit="תלמידים" />
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="card-title"><h3>{m.upcomingTitle}</h3><Link to="/app/schedule" className="btn btn-sm btn-ghost">הכול</Link></div>
          {m.upcoming.map(l => {
            const s = student.get(l.studentId);
            const enrolled = d.enrollments.find(e => e.studentId === l.studentId && e.teacherId === l.teacherId);
            const c = enrolled ? course.get(enrolled.courseId) : undefined;
            return (
              <div key={l.id} className="list-item">
                <span className="time-pill num">{l.hour}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{studentName(s, family.get(s?.familyId ?? 0))}</b>
                  <div className="faint" style={{ fontSize: 12 }}>{courseEmoji(c)} {c?.name} · {teacherName(teacher.get(l.teacherId))}</div>
                </div>
                {l.date !== now && <span className="badge">{l.dayName} {formatShort(l.date)}</span>}
                {c && <i className="swatch" style={{ background: courseColor(c.id) }} />}
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-title"><h3>עומס מורים השבוע</h3></div>
          <HBarList data={m.teacherLoad} unit="שיעורים" />
        </div>
        <div className="card">
          <div className="card-title"><h3>התראות</h3><span className="badge warn">{m.alerts.length}</span></div>
          {m.alerts.length === 0 && <div className="alert good"><Sparkles size={16} />הכול תקין, אין התראות פתוחות</div>}
          <div className="stack">
            {m.alerts.map((a, i) => <div key={i} className={`alert ${a.kind}`}><AlertTriangle size={16} style={{ flex: 'none' }} />{a.text}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
