import { describe, expect, it } from 'vitest';
import { enrollmentProblems, genderFits, isValidIsraeliId, isValidPhone, lessonConflicts } from './rules';
import { familyBills } from './billing';
import { addDays, ageOn, dayName, weekStart } from './dates';
import { createSeed, israeliId } from '../api/seed';
import type { Course, Lesson, Student } from './types';

describe('Israeli ID', () => {
  it.each([['123456782', true], ['000000018', true], ['18', true], ['123456789', false], ['12345678a', false], ['', false]])(
    '%s -> %s', (id, ok) => expect(isValidIsraeliId(id)).toBe(ok));
  it('generator always produces valid ids', () => {
    for (let i = 0; i < 300; i++) expect(isValidIsraeliId(israeliId(10_000_000 + i * 37))).toBe(true);
  });
});

describe('dates', () => {
  it('computes age with birthday not yet reached', () => expect(ageOn('2010-12-31', '2025-12-30')).toBe(14));
  it('week starts on Sunday', () => expect(dayName(weekStart('2025-11-27'))).toBe('ראשון'));
  it('phone validation accepts dashes', () => expect(isValidPhone('050-123-4567')).toBe(true));
});

const course = (over: Partial<Course> = {}): Course => ({ id: 1, name: 'כינור', audience: 'בנות', price: 300, description: '', durationMinutes: 45, fromAge: 7, toAge: 12, ...over });
const student = (over: Partial<Student> = {}): Student => ({
  id: 1, idNumber: '123456782', familyId: 1, firstName: 'נועה', gender: 'בת', birthDate: addDays(new Date().toISOString().slice(0, 10), -365 * 9 - 10),
  startDate: '2024-09-01', lessonsTaken: 0, makeupLessons: 0, status: 'פעיל', finishDate: null, notes: '', ...over,
});

describe('enrollment eligibility', () => {
  it('accepts a fitting student', () => expect(enrollmentProblems(student(), course(), [])).toEqual([]));
  it('rejects age out of range', () => expect(enrollmentProblems(student(), course({ fromAge: 13, toAge: 18 }), [])[0]).toMatch(/גיל התלמיד/));
  it('rejects gender mismatch', () => expect(enrollmentProblems(student({ gender: 'בן' }), course(), [])).toContain('הקורס מיועד לבנות בלבד'));
  it('rejects duplicates', () => expect(enrollmentProblems(student(), course(), [{ id: 1, studentId: 1, courseId: 1, teacherId: null }])).toContain('התלמיד כבר רשום לקורס הזה'));
  it('mixed courses fit everyone', () => expect(genderFits('מעורב', 'בן')).toBe(true));
});

describe('lesson conflicts', () => {
  const sunday = weekStart('2030-01-08');
  const base: Lesson = { id: 1, teacherId: 1, studentId: 1, date: sunday, hour: '14:00', dayName: 'ראשון', status: 'מתוכנן' };
  const teachers = [{ id: 1, active: true }, { id: 2, active: false }] as never;

  it('detects teacher double booking', () =>
    expect(lessonConflicts({ ...base, id: 2, studentId: 2 }, [base], teachers, [])).toContain('למורה כבר יש שיעור בשעה הזו'));
  it('ignores cancelled lessons', () =>
    expect(lessonConflicts({ ...base, id: 2, studentId: 2 }, [{ ...base, status: 'בוטל' }], teachers, [])).toEqual([]));
  it('blocks shabbat, inactive teachers and absences', () => {
    expect(lessonConflicts({ ...base, date: addDays(sunday, 6) }, [], teachers, [])).toContain('לא ניתן לקבוע שיעור בשבת');
    expect(lessonConflicts({ ...base, teacherId: 2 }, [], teachers, [])).toContain('המורה אינו/ה פעיל/ה כרגע');
    expect(lessonConflicts(base, [], teachers, [{ id: 1, personId: 1, from: sunday, to: sunday, reason: '' }])).toContain('המורה נעדר/ת בתאריך הזה');
  });
});

describe('billing', () => {
  it('applies 10% sibling discount on every course after the most expensive one', () => {
    const fam = { id: 1, lastName: 'כהן', address: '', phone: '', email: '', paymentMethod: '' };
    const kids = [student({ id: 1 }), student({ id: 2 })];
    const courses = [course({ id: 1, price: 300 }), course({ id: 2, price: 200 })];
    const [bill] = familyBills([fam], kids, courses, [
      { id: 1, studentId: 1, courseId: 1, teacherId: null }, { id: 2, studentId: 2, courseId: 2, teacherId: null },
    ]);
    expect(bill.subtotal).toBe(500);
    expect(bill.discount).toBe(20);
    expect(bill.total).toBe(480);
  });
});

describe('demo seed', () => {
  const db = createSeed();
  it('every enrollment satisfies the business rules', () => {
    for (const e of db.enrollments) {
      const s = db.students.find(x => x.id === e.studentId)!;
      const c = db.courses.find(x => x.id === e.courseId)!;
      expect(enrollmentProblems(s, c, db.enrollments.filter(o => o.id !== e.id))).toEqual([]);
    }
  });
  it('the generated timetable has no conflicts', () => {
    const conflicts = db.lessons.filter(l => lessonConflicts(l, db.lessons, db.teachers, []).some(p => p.includes('כבר יש שיעור')));
    expect(conflicts).toEqual([]);
  });
  it('all ids are valid', () => {
    expect(db.students.every(s => isValidIsraeliId(s.idNumber))).toBe(true);
    expect(db.teachers.every(t => isValidIsraeliId(t.idNumber))).toBe(true);
  });
});
