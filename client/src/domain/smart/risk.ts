// Explainable churn-risk model: a weighted sum of behavioural signals, each reported as a factor,
// so the office knows not only WHO is at risk but WHY and what to do.
import type { Student } from '../types';
import type { Db } from '../../api/seed';
import { addDays, daysBetween, today } from '../dates';

export interface RiskFactor { label: string; points: number }
export interface Risk { student: Student; score: number; level: 'גבוה' | 'בינוני' | 'נמוך'; factors: RiskFactor[]; action: string }

export function churnRisk(student: Student, db: Db, now = today()): Risk {
  const factors: RiskFactor[] = [];
  const lessons = db.lessons.filter(l => l.studentId === student.id);
  const recent = lessons.filter(l => l.date < now && l.date >= addDays(now, -28));
  const earlier = lessons.filter(l => l.date < addDays(now, -28) && l.date >= addDays(now, -56));
  const cancelled = recent.filter(l => l.status === 'בוטל').length;

  if (recent.length && cancelled / recent.length >= 0.25) {
    factors.push({ label: `${cancelled} מתוך ${recent.length} השיעורים בחודש האחרון בוטלו`, points: Math.round(40 * (cancelled / recent.length)) + 10 });
  }
  const held = (ls: typeof lessons) => ls.filter(l => l.status === 'התקיים').length;
  if (earlier.length >= 2 && held(recent) < held(earlier) - 1) {
    factors.push({ label: `ירידה בנוכחות: ${held(recent)} שיעורים לעומת ${held(earlier)} בחודש שלפני`, points: 15 });
  }
  const absences = db.studentAbsences.filter(a => a.personId === student.id && a.from >= addDays(now, -30) && a.from <= now).length;
  if (absences) factors.push({ label: `${absences} היעדרויות ב-30 הימים האחרונים`, points: Math.min(20, absences * 10) });
  if (student.makeupLessons >= 2) factors.push({ label: `${student.makeupLessons} שיעורי השלמה פתוחים`, points: 12 });
  if (!lessons.some(l => l.date >= now && l.status === 'מתוכנן')) factors.push({ label: 'אין שיעור מתוכנן בהמשך', points: 20 });
  if (daysBetween(student.startDate, now) < 60) factors.push({ label: 'תלמיד/ה חדש/ה (פחות מחודשיים)', points: 8 });
  if (!db.enrollments.some(e => e.studentId === student.id)) factors.push({ label: 'לא רשום/ה לאף קורס', points: 25 });

  const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  const level = score >= 45 ? 'גבוה' : score >= 22 ? 'בינוני' : 'נמוך';
  const top = [...factors].sort((a, b) => b.points - a.points)[0];
  const action = !top ? 'אין צורך בפעולה'
    : top.label.includes('בוטלו') || top.label.includes('נוכחות') ? 'שיחה עם ההורים ובדיקת התאמת שעת השיעור'
    : top.label.includes('אין שיעור') ? 'שיבוץ שיעור במערכת השעות'
    : top.label.includes('השלמה') ? 'תיאום שיעורי השלמה'
    : top.label.includes('חדש') ? 'שיחת היכרות ומעקב אחרי החודש הראשון'
    : 'מעקב שוטף';
  return { student, score, level, factors: factors.sort((a, b) => b.points - a.points), action };
}

export function riskReport(db: Db, now = today()): Risk[] {
  return db.students.filter(s => s.status === 'פעיל').map(s => churnRisk(s, db, now)).sort((a, b) => b.score - a.score);
}
