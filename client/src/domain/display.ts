import type { Course, Family, Student, Teacher } from './types';
import { ageOn } from './dates';

const EMOJI: Record<string, string> = {
  'פסנתר': '🎹', 'כינור': '🎻', 'גיטרה': '🎸', 'חליל צד': '🪈', 'תופים': '🥁', 'פיתוח קול': '🎤', 'צ׳לו': '🎻', 'חלילית': '🎶',
};
export const courseEmoji = (c?: Course) => (c && EMOJI[c.name]) || '🎵';

/** Color follows the entity (course id), never its rank - so filters never repaint a course. */
export const courseColor = (courseId: number) => `var(--c${((courseId - 1) % 8) + 1})`;

export const teacherName = (t?: Teacher) => (t ? `${t.firstName} ${t.lastName}` : '—');
export const studentName = (s?: Student, f?: Family) => (s ? `${s.firstName}${f ? ' ' + f.lastName : ''}` : '—');
export const studentAge = (s: Student) => ageOn(s.birthDate);
