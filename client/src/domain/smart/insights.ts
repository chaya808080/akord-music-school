// Auto-generated management insights: each one is computed from the data, phrased in Hebrew
// and carries a concrete next action (a link into the relevant screen).
import type { Db } from '../../api/seed';
import { LESSON_HOURS } from '../../api/seed';
import { addDays, addMonths, HEBREW_DAYS, parse, today, weekStart } from '../dates';
import { teacherName } from '../display';
import { riskReport } from './risk';
import { unscheduledEnrollments } from './scheduler';
import { findSubstitutes } from './substitutes';

export interface Insight {
  tone: 'good' | 'warn' | 'bad' | 'info';
  title: string;
  text: string;
  action?: { label: string; to: string };
}

/** Average lessons per day×hour over the last `weeks` weeks, divided by active teachers (0..1). */
export function utilization(db: Db, weeks = 4, now = today()) {
  const from = addDays(weekStart(now), -7 * weeks);
  const to = weekStart(now);
  const teachers = Math.max(1, db.teachers.filter(t => t.active).length);
  const grid = [0, 1, 2, 3, 4].map(day => LESSON_HOURS.map(hour => {
    const n = db.lessons.filter(l => l.date >= from && l.date < to && l.hour === hour && parse(l.date).getDay() === day && l.status !== 'בוטל').length;
    return n / weeks / teachers;
  }));
  return { grid, days: HEBREW_DAYS.slice(0, 5), hours: LESSON_HOURS };
}

export function insights(db: Db, now = today()): Insight[] {
  const out: Insight[] = [];

  const unscheduled = unscheduledEnrollments(db);
  if (unscheduled.length) out.push({
    tone: 'warn', title: `${unscheduled.length} רישומים ללא שיעור מתוכנן`,
    text: 'תלמידים רשומים לקורס אבל אין להם שיעור בהמשך. השיבוץ האוטומטי ימצא להם את המשבצות הטובות ביותר.',
    action: { label: 'שיבוץ אוטומטי', to: '/app/schedule?auto=1' },
  });

  for (const c of db.courses) {
    const waiting = db.waitingList.filter(w => w.courseId === c.id).length;
    const enrolled = db.enrollments.filter(e => e.courseId === c.id).length;
    const teachers = db.teacherCourses.filter(t => t.courseId === c.id && db.teachers.find(x => x.id === t.teacherId)?.active).length;
    if (waiting >= 2 || (waiting >= 1 && teachers <= 1 && enrolled >= 6)) out.push({
      tone: 'bad', title: `ביקוש עודף ל${c.name}`,
      text: `${waiting} ממתינים לעומת ${teachers} מורה/ים פעילים ו-${enrolled} תלמידים. כדאי לפתוח שעות נוספות או לגייס מורה, הכנסה פוטנציאלית של ₪${(waiting * c.price).toLocaleString('he-IL')} בחודש.`,
      action: { label: 'לרשימת ההמתנה', to: '/app/waiting' },
    });
  }

  const risks = riskReport(db, now).filter(r => r.level === 'גבוה');
  if (risks.length) out.push({
    tone: 'bad', title: `${risks.length} תלמידים בסיכון נשירה גבוה`,
    text: `${risks.slice(0, 3).map(r => r.student.firstName).join(', ')}${risks.length > 3 ? ' ועוד' : ''}. הסיבה העיקרית: ${risks[0].factors[0]?.label ?? ''}.`,
    action: { label: 'לניתוח הסיכון', to: '/app/insights' },
  });

  for (const a of db.teacherAbsences.filter(a => a.to >= now)) {
    const affected = findSubstitutes(a, db);
    if (affected.length) out.push({
      tone: 'warn', title: `היעדרות של ${teacherName(db.teachers.find(t => t.id === a.personId))} משפיעה על ${affected.length} שיעורים`,
      text: `נמצאו מחליפים פנויים ל-${affected.filter(x => x.options.length).length} מהם.`,
      action: { label: 'מציאת מחליפים', to: '/app/absences' },
    });
  }

  const past = (from: string, to: string) => db.lessons.filter(l => l.date >= from && l.date < to && l.date < now);
  const thisWeek = past(weekStart(now), addDays(weekStart(now), 7));
  const prev = past(addDays(weekStart(now), -28), weekStart(now));
  const rate = (ls: typeof thisWeek) => (ls.length ? ls.filter(l => l.status === 'בוטל').length / ls.length : 0);
  if (thisWeek.length >= 5 && rate(thisWeek) > rate(prev) * 1.5 && rate(thisWeek) > 0.08) out.push({
    tone: 'warn', title: 'עלייה בביטולים השבוע',
    text: `${Math.round(rate(thisWeek) * 100)}% מהשיעורים בוטלו, לעומת ממוצע של ${Math.round(rate(prev) * 100)}% בחודש האחרון.`,
    action: { label: 'למערכת השעות', to: '/app/schedule' },
  });

  const monthStart = now.slice(0, 8) + '01';
  const joined = (from: string, to: string) => db.students.filter(s => s.startDate >= from && s.startDate < to).length;
  const recent = joined(addMonths(monthStart, -2), addMonths(monthStart, 1));
  const before = joined(addMonths(monthStart, -5), addMonths(monthStart, -2));
  if (before > 0) {
    const pct = Math.round(((recent - before) / before) * 100);
    out.push({
      tone: pct >= 0 ? 'good' : 'warn', title: pct >= 0 ? `צמיחה של ${pct}% בהצטרפות` : `ירידה של ${-pct}% בהצטרפות`,
      text: `${recent} תלמידים הצטרפו בשלושת החודשים האחרונים לעומת ${before} בשלושה שלפניהם.`,
      action: { label: 'לתחזית', to: '/app/insights' },
    });
  }

  const sunday = weekStart(now);
  const loads = db.teachers.filter(t => t.active).map(t => ({ t, n: db.lessons.filter(l => l.teacherId === t.id && l.date >= sunday && l.date < addDays(sunday, 7) && l.status !== 'בוטל').length }));
  const avg = loads.reduce((s, x) => s + x.n, 0) / Math.max(1, loads.length);
  const busiest = loads.sort((a, b) => b.n - a.n)[0];
  if (busiest && busiest.n > avg * 1.4 && busiest.n >= 8) out.push({
    tone: 'info', title: `${teacherName(busiest.t)} עמוס/ה במיוחד השבוע`,
    text: `${busiest.n} שיעורים לעומת ממוצע של ${avg.toFixed(1)}. כדאי לשקול העברת תלמידים חדשים למורים אחרים.`,
    action: { label: 'לצוות המורים', to: '/app/teachers' },
  });

  const { grid, days, hours } = utilization(db, 4, now);
  let peak = { v: 0, d: 0, h: 0 };
  grid.forEach((row, d) => row.forEach((v, h) => { if (v > peak.v) peak = { v, d, h }; }));
  if (peak.v > 0) out.push({
    tone: 'info', title: `שעת השיא: יום ${days[peak.d]} ב-${hours[peak.h]}`,
    text: `${Math.round(peak.v * 100)}% מהמורים מלמדים בשעה הזו. שעות שקטות יותר מתאימות לשיבוץ תלמידים חדשים.`,
    action: { label: 'למפת החום', to: '/app/insights' },
  });

  const order = { bad: 0, warn: 1, info: 2, good: 3 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}
