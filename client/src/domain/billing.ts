import type { Course, Enrollment, Family, Student } from './types';

export interface BillingLine {
  student: Student;
  course: Course;
  amount: number;
}

export interface FamilyBill {
  family: Family;
  lines: BillingLine[];
  subtotal: number;
  discount: number;      // sibling discount
  total: number;
}

/** 10% off every course after the family's first one (most expensive first). */
export const SIBLING_DISCOUNT = 0.1;

export function familyBills(families: Family[], students: Student[], courses: Course[], enrollments: Enrollment[]): FamilyBill[] {
  const courseById = new Map(courses.map(c => [c.id, c]));
  return families.map(family => {
    const kids = students.filter(s => s.familyId === family.id && s.status === 'פעיל');
    const lines: BillingLine[] = kids.flatMap(student =>
      enrollments
        .filter(e => e.studentId === student.id && courseById.has(e.courseId))
        .map(e => ({ student, course: courseById.get(e.courseId)!, amount: courseById.get(e.courseId)!.price })),
    );
    const sorted = [...lines].sort((a, b) => b.amount - a.amount);
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const discount = Math.round(sorted.slice(1).reduce((s, l) => s + l.amount * SIBLING_DISCOUNT, 0));
    return { family, lines, subtotal, discount, total: subtotal - discount };
  });
}

export const shekel = (n: number) => `₪${Math.round(n).toLocaleString('he-IL')}`;
