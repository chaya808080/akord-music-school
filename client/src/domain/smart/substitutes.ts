// Substitute finder: for every lesson affected by a teacher absence, ranks teachers who
// teach the same course, are active, not absent themselves and free at that exact slot.
import type { Absence, Lesson, Teacher } from '../types';
import type { Db } from '../../api/seed';
import { inRange } from '../dates';
import { lessonConflicts } from '../rules';

export interface SubstituteOption { teacher: Teacher; score: number; why: string }
export interface AffectedLesson { lesson: Lesson; courseId: number | null; options: SubstituteOption[] }

export function findSubstitutes(absence: Absence, db: Db): AffectedLesson[] {
  const affected = db.lessons.filter(l => l.teacherId === absence.personId && l.status === 'מתוכנן' && inRange(l.date, absence.from, absence.to));
  return affected.map(lesson => {
    const courseId = db.enrollments.find(e => e.studentId === lesson.studentId && e.teacherId === lesson.teacherId)?.courseId ?? null;
    const options = db.teachers
      .filter(t => t.id !== absence.personId && t.active)
      .map(t => {
        const teaches = courseId != null && db.teacherCourses.some(tc => tc.teacherId === t.id && tc.courseId === courseId);
        const conflicts = lessonConflicts({ ...lesson, teacherId: t.id }, db.lessons, db.teachers, db.teacherAbsences);
        const knowsStudent = db.lessons.some(l => l.teacherId === t.id && l.studentId === lesson.studentId);
        const dayLoad = db.lessons.filter(l => l.teacherId === t.id && l.date === lesson.date && l.status !== 'בוטל').length;
        return { t, teaches, ok: conflicts.length === 0, knowsStudent, dayLoad };
      })
      .filter(x => x.ok && x.teaches)
      .map(x => ({
        teacher: x.t,
        score: 60 + (x.knowsStudent ? 25 : 0) - x.dayLoad * 4 + (x.dayLoad > 0 ? 8 : 0),
        why: [x.knowsStudent ? 'כבר לימד/ה את התלמיד/ה' : 'מלמד/ת את אותו כלי', x.dayLoad ? `נמצא/ת בבית הספר באותו יום (${x.dayLoad} שיעורים)` : 'יום פנוי'].join(' · '),
      }))
      .sort((a, b) => b.score - a.score);
    return { lesson, courseId, options };
  });
}
