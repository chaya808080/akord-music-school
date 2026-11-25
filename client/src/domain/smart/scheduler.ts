// Smart scheduler: finds the best weekly slot for an enrollment with an explainable score.
// Hard constraints come from lessonConflicts (same rules as the server); soft constraints are scored.
import type { Enrollment, Lesson } from '../types';
import type { Db } from '../../api/seed';
import { LESSON_HOURS } from '../../api/seed';
import { addDays, ageOn, dayName, today, weekStart } from '../dates';
import { lessonConflicts } from '../rules';

export interface SlotSuggestion {
  date: string;
  hour: string;
  score: number;
  reasons: string[];
}

const hourIndex = (h: string) => LESSON_HOURS.indexOf(h);

/** Ranks every free slot in the week for this enrollment. */
export function suggestSlots(enrollment: Enrollment, db: Db, week = weekStart(today()), planned: Lesson[] = [], limit = 5): SlotSuggestion[] {
  if (!enrollment.teacherId) return [];
  const student = db.students.find(s => s.id === enrollment.studentId);
  if (!student) return [];
  const lessons = [...db.lessons, ...planned];
  const siblings = new Set(db.students.filter(s => s.familyId === student.familyId && s.id !== student.id).map(s => s.id));
  const age = ageOn(student.birthDate);
  const weekLessons = lessons.filter(l => l.date >= week && l.date < addDays(week, 7) && l.status !== 'בוטל');

  const out: SlotSuggestion[] = [];
  for (let day = 0; day < 5; day++) {
    const date = addDays(week, day);
    if (date < today()) continue;
    const dayLessons = weekLessons.filter(l => l.date === date);
    const teacherDay = dayLessons.filter(l => l.teacherId === enrollment.teacherId);
    for (const hour of LESSON_HOURS) {
      const candidate: Lesson = { id: -1, teacherId: enrollment.teacherId, studentId: student.id, date, hour, dayName: dayName(date), status: 'מתוכנן' };
      if (lessonConflicts(candidate, lessons, db.teachers, db.teacherAbsences).length) continue;

      let score = 50;
      const reasons: string[] = [];
      const h = hourIndex(hour);
      const siblingToday = dayLessons.filter(l => siblings.has(l.studentId));
      if (siblingToday.some(l => Math.abs(hourIndex(l.hour) - h) === 1)) { score += 30; reasons.push('צמוד לשיעור של אח/ות – ההורים מגיעים פעם אחת'); }
      else if (siblingToday.length) { score += 12; reasons.push('באותו יום של שיעור אח/ות'); }

      if (teacherDay.some(l => Math.abs(hourIndex(l.hour) - h) === 1)) { score += 15; reasons.push('ממשיך רצף של המורה, בלי חלונות'); }
      else if (teacherDay.length && !teacherDay.some(l => Math.abs(hourIndex(l.hour) - h) <= 2)) { score -= 10; reasons.push('יוצר חלון ארוך ביום של המורה'); }
      if (teacherDay.length >= 5) { score -= 12; reasons.push('יום עמוס במיוחד למורה'); }

      if (age < 9 && h <= 2) { score += 10; reasons.push('שעה מוקדמת שמתאימה לגיל צעיר'); }
      if (age < 9 && h >= 5) { score -= 15; reasons.push('שעה מאוחרת לגיל צעיר'); }
      if (age >= 13 && h >= 3) { score += 6; reasons.push('אחרי שעות הלימודים של בני נוער'); }

      if (lessons.some(l => l.studentId === student.id && l.date === date && l.status !== 'בוטל')) { score -= 8; reasons.push('לתלמיד כבר יש שיעור באותו יום'); }
      if (!reasons.length) reasons.push('משבצת פנויה למורה ולתלמיד');
      out.push({ date, hour, score: Math.max(0, Math.min(100, score)), reasons });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date) || a.hour.localeCompare(b.hour)).slice(0, limit);
}

/** Slots this week (from today on) where the teacher has no lesson and no absence. */
export function teacherFreeSlots(teacherId: number, db: Db, week = weekStart(today())): { date: string; hour: string }[] {
  const out: { date: string; hour: string }[] = [];
  for (let day = 0; day < 5; day++) {
    const date = addDays(week, day);
    if (date < today()) continue;
    for (const hour of LESSON_HOURS) {
      const probe: Lesson = { id: -1, teacherId, studentId: -1, date, hour, dayName: dayName(date), status: 'מתוכנן' };
      if (!lessonConflicts(probe, db.lessons, db.teachers, db.teacherAbsences).length) out.push({ date, hour });
    }
  }
  return out;
}

/** Enrollments that have a teacher but no planned lesson from today on. */
export function unscheduledEnrollments(db: Db): Enrollment[] {
  const now = today();
  return db.enrollments.filter(e => e.teacherId && !db.lessons.some(l =>
    l.studentId === e.studentId && l.teacherId === e.teacherId && l.date >= now && l.status === 'מתוכנן'));
}

export interface PlanItem { enrollment: Enrollment; slot: SlotSuggestion | null }

/**
 * Greedy auto-scheduling: hardest enrollments first (fewest free slots), each placement is
 * added to a virtual timetable so later placements respect it.
 */
export function autoSchedule(db: Db, week = weekStart(today())): PlanItem[] {
  const planned: Lesson[] = [];
  const todo = unscheduledEnrollments(db)
    .map(e => ({ e, options: suggestSlots(e, db, week, [], 100).length }))
    .sort((a, b) => a.options - b.options);
  return todo.map(({ e }) => {
    const [best] = suggestSlots(e, db, week, planned, 1);
    if (best) planned.push({ id: -1 - planned.length, teacherId: e.teacherId!, studentId: e.studentId, date: best.date, hour: best.hour, dayName: dayName(best.date), status: 'מתוכנן' });
    return { enrollment: e, slot: best ?? null };
  });
}
