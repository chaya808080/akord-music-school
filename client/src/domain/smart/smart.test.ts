import { describe, expect, it } from 'vitest';
import { createSeed } from '../../api/seed';
import { lessonConflicts } from '../rules';
import { addDays, dayName, today, weekStart } from '../dates';
import { autoSchedule, suggestSlots, teacherFreeSlots, unscheduledEnrollments } from './scheduler';
import { churnRisk, riskReport } from './risk';
import { forecast, linearRegression } from './forecast';
import { findSubstitutes } from './substitutes';
import { ask } from './assistant';
import { insights } from './insights';
import { compose, whatsappLink } from './messages';

const db = createSeed();

describe('smart scheduler', () => {
  it('finds the seeded unscheduled enrollments', () => expect(unscheduledEnrollments(db).length).toBeGreaterThan(0));

  it('auto-schedule never produces a conflict, even between its own placements', () => {
    const week = addDays(weekStart(today()), 7); // next week: every weekday is in the future
    const plan = autoSchedule(db, week);
    const placed = plan.filter(p => p.slot).map((p, i) => ({
      id: -1 - i, teacherId: p.enrollment.teacherId!, studentId: p.enrollment.studentId, date: p.slot!.date, hour: p.slot!.hour,
      dayName: dayName(p.slot!.date), status: 'מתוכנן' as const,
    }));
    expect(placed.length).toBeGreaterThan(0);
    for (const l of placed) expect(lessonConflicts(l, [...db.lessons, ...placed], db.teachers, db.teacherAbsences)).toEqual([]);
  });

  it('scores are sorted and explained', () => {
    const e = unscheduledEnrollments(db)[0];
    const slots = suggestSlots(e, db, addDays(weekStart(today()), 7), [], 10);
    expect(slots.length).toBeGreaterThan(0);
    for (let i = 1; i < slots.length; i++) expect(slots[i - 1].score).toBeGreaterThanOrEqual(slots[i].score);
    expect(slots.every(s => s.reasons.length > 0)).toBe(true);
  });

  it('prefers the slot right next to a sibling lesson', () => {
    const sib = db.lessons.find(l => l.date > addDays(today(), 7) && l.hour === '15:00')!;
    const sibling = db.students.find(s => s.id === sib.studentId)!;
    const kid = { ...db.students[0], id: 999, familyId: sibling.familyId, birthDate: sibling.birthDate };
    const teacher = db.teachers.find(t => t.active && t.id !== sib.teacherId)!;
    const local = { ...db, students: [...db.students, kid] };
    const [best] = suggestSlots({ id: 999, studentId: 999, courseId: 1, teacherId: teacher.id }, local, weekStart(sib.date), [], 1);
    if (best.date === sib.date) expect(['14:00', '16:00']).toContain(best.hour);
    expect(best.reasons.join()).toMatch(/אח/);
  });

  it('teacher free slots exclude busy hours', () => {
    const week = addDays(weekStart(today()), 7);
    const busy = db.lessons.find(l => l.date >= week && l.date < addDays(week, 7))!;
    expect(teacherFreeSlots(busy.teacherId, db, week)).not.toContainEqual({ date: busy.date, hour: busy.hour });
  });
});

describe('churn risk', () => {
  it('flags the seeded drop-out pattern with explanations', () => {
    const high = riskReport(db).filter(r => r.level === 'גבוה');
    expect(high.length).toBeGreaterThan(0);
    expect(high[0].factors.length).toBeGreaterThan(0);
    expect(high[0].action).not.toBe('');
  });
  it('a student with no lessons and no enrollment scores high', () => {
    const s = { ...db.students[0], id: 4242 };
    expect(churnRisk(s, { ...db, students: [...db.students, s] }).level).toBe('גבוה');
  });
});

describe('forecast', () => {
  it('linear regression recovers a perfect line', () => {
    const r = linearRegression([2, 4, 6, 8]);
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(2);
    expect(r.r2).toBeCloseTo(1);
  });
  it('a price increase raises projected revenue', () => {
    const base = forecast(db, { priceChange: 0, waitingConversion: 0, churnReduction: 0 });
    const up = forecast(db, { priceChange: 0.1, waitingConversion: 0, churnReduction: 0 });
    expect(up.revenueEnd).toBeGreaterThan(base.revenueEnd);
    expect(base.points.filter(p => p.projected)).toHaveLength(6);
  });
});

describe('substitutes', () => {
  it('only proposes free teachers of the same course', () => {
    for (const a of db.teacherAbsences) {
      for (const affected of findSubstitutes(a, db)) {
        for (const o of affected.options) {
          expect(db.teacherCourses.some(t => t.teacherId === o.teacher.id && t.courseId === affected.courseId)).toBe(true);
          expect(lessonConflicts({ ...affected.lesson, teacherId: o.teacher.id }, db.lessons, db.teachers, db.teacherAbsences)).toEqual([]);
        }
      }
    }
  });
});

describe('assistant', () => {
  it('answers counts, revenue and risk questions', () => {
    expect(ask('כמה תלמידים פעילים יש?', db).text).toMatch(/\d+ תלמידים פעילים/);
    expect(ask('מה ההכנסה החודשית?', db).text).toMatch(/₪/);
    expect(ask('כמה תלמידים לומדים פסנתר?', db).text).toMatch(/פסנתר/);
    expect(ask('מי בסיכון נשירה?', db).links?.[0].to).toBe('/app/insights');
  });
  it('recognises a student by first name', () => {
    const s = db.students.find(x => x.status === 'פעיל')!;
    expect(ask(`מתי השיעור הבא של ${s.firstName}?`, db).text).toContain(s.firstName);
  });
  it('falls back politely', () => expect(ask('מה מזג האוויר', db).text).toMatch(/לא בטוח/));
});

describe('insights & messages', () => {
  it('produces actionable insights', () => {
    const list = insights(db);
    expect(list.length).toBeGreaterThan(2);
    expect(list.some(i => i.action)).toBe(true);
  });
  it('composes personal messages and a WhatsApp link', () => {
    const s = db.students.find(x => x.status === 'פעיל')!;
    expect(compose('payment', s.id, db)).toMatch(/סה״כ/);
    expect(whatsappLink('050-123-4567', 'היי')).toBe('https://wa.me/972501234567?text=%D7%94%D7%99%D7%99');
  });
});
