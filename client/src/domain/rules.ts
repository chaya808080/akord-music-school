// Business rules - the same rules (and the same Hebrew messages) as the .NET BL layer,
// so the demo mode behaves exactly like the real server and the UI can warn before saving.
import type { Absence, Course, Enrollment, Family, Lesson, Student, Teacher, TeacherCourse } from './types';
import { ageOn, inRange, parse, today } from './dates';

export class RuleError extends Error {}

export function require(condition: unknown, message: string): asserts condition {
  if (!condition) throw new RuleError(message);
}

/** Israeli ID check digit (Luhn variant over 9 digits). */
export function isValidIsraeliId(id: string): boolean {
  const s = id.trim();
  if (!/^\d{1,9}$/.test(s)) return false;
  const padded = s.padStart(9, '0');
  if (padded === '000000000') return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = Number(padded[i]) * ((i % 2) + 1);
    sum += d > 9 ? d - 9 : d;
  }
  return sum % 10 === 0;
}

export const isValidPhone = (p: string) => /^0\d{8,9}$/.test(p.replace(/-/g, '').trim());
export const isValidEmail = (m: string) => !m.trim() || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.trim());

export function genderFits(audience: Course['audience'], gender: Student['gender']): boolean {
  return audience === 'מעורב' || (audience === 'בנים' ? gender === 'בן' : gender === 'בת');
}

/** Why a student can't join a course - empty array means eligible. Used to explain disabled options in the UI. */
export function enrollmentProblems(student: Student, course: Course, enrollments: Enrollment[]): string[] {
  const problems: string[] = [];
  if (enrollments.some(e => e.studentId === student.id && e.courseId === course.id)) problems.push('התלמיד כבר רשום לקורס הזה');
  const age = ageOn(student.birthDate);
  if (age < course.fromAge || age > course.toAge)
    problems.push(`גיל התלמיד (${age}) אינו מתאים לטווח הגילאים של הקורס (${course.fromAge}-${course.toAge})`);
  if (!genderFits(course.audience, student.gender)) problems.push(`הקורס מיועד ל${course.audience} בלבד`);
  return problems;
}

export function validateStudent(s: Student, all: Student[], families: Family[]) {
  require(s.firstName.trim(), 'שם התלמיד הוא שדה חובה');
  require(isValidIsraeliId(s.idNumber), 'מספר תעודת הזהות אינו תקין');
  require(!s.birthDate || s.birthDate <= today(), 'תאריך הלידה לא יכול להיות בעתיד');
  require(!s.finishDate || s.finishDate >= s.startDate, 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
  require(families.some(f => f.id === s.familyId), 'המשפחה שנבחרה אינה קיימת');
  require(!all.some(o => Number(o.idNumber) === Number(s.idNumber) && o.id !== s.id), 'קיים כבר תלמיד עם תעודת הזהות הזו');
}

export function validateFamily(f: Family) {
  require(f.lastName.trim(), 'שם המשפחה הוא שדה חובה');
  require(isValidPhone(f.phone), 'מספר הטלפון אינו תקין');
  require(isValidEmail(f.email), 'כתובת המייל אינה תקינה');
}

export function validateTeacher(t: Teacher) {
  require(t.firstName.trim() && t.lastName.trim(), 'שם פרטי ושם משפחה הם שדות חובה');
  require(isValidIsraeliId(t.idNumber), 'מספר תעודת הזהות אינו תקין');
  require(isValidPhone(t.phone), 'מספר הטלפון אינו תקין');
  require(isValidEmail(t.email), 'כתובת המייל אינה תקינה');
}

export function validateCourse(c: Course) {
  require(c.name.trim(), 'שם הקורס הוא שדה חובה');
  require(c.price > 0, 'מחיר הקורס חייב להיות חיובי');
  require(c.fromAge <= c.toAge, 'טווח הגילאים אינו תקין');
  require(c.durationMinutes > 0, 'משך השיעור חייב להיות חיובי');
}

export function validateEnrollment(e: Enrollment, students: Student[], courses: Course[], enrollments: Enrollment[], teacherCourses: TeacherCourse[]) {
  const student = students.find(s => s.id === e.studentId);
  const course = courses.find(c => c.id === e.courseId);
  require(student, 'התלמיד שנבחר אינו קיים');
  require(course, 'הקורס שנבחר אינו קיים');
  const problems = enrollmentProblems(student, course, enrollments.filter(o => o.id !== e.id));
  require(problems.length === 0, problems[0]);
  require(e.teacherId == null || teacherCourses.some(t => t.teacherId === e.teacherId && t.courseId === e.courseId),
    'המורה שנבחר/ה אינו/ה מלמד/ת את הקורס הזה');
}

/** All reasons a lesson can't be placed in its slot - powers live warnings and drag & drop. */
export function lessonConflicts(l: Lesson, lessons: Lesson[], teachers: Teacher[], teacherAbsences: Absence[]): string[] {
  const problems: string[] = [];
  if (!l.date || !l.hour) return ['יש לבחור תאריך ושעה לשיעור'];
  if (parse(l.date).getDay() === 6) problems.push('לא ניתן לקבוע שיעור בשבת');
  const teacher = teachers.find(t => t.id === l.teacherId);
  if (teacher && !teacher.active) problems.push('המורה אינו/ה פעיל/ה כרגע');
  const sameSlot = lessons.filter(o => o.id !== l.id && o.date === l.date && o.hour === l.hour && o.status !== 'בוטל');
  if (sameSlot.some(o => o.teacherId === l.teacherId)) problems.push('למורה כבר יש שיעור בשעה הזו');
  if (sameSlot.some(o => o.studentId === l.studentId)) problems.push('לתלמיד כבר יש שיעור בשעה הזו');
  if (teacherAbsences.some(a => a.personId === l.teacherId && inRange(l.date, a.from, a.to))) problems.push('המורה נעדר/ת בתאריך הזה');
  return problems;
}

export function validateAbsence(a: Absence) {
  require(a.from, 'יש לבחור תאריך התחלה');
  require(!a.to || a.to >= a.from, 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
}
