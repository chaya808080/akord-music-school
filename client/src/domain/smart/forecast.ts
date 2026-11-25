// Growth forecast: least-squares regression over the active-student curve of the last 12 months,
// then a what-if layer (price change, waiting-list conversion, churn reduction) on top of it.
import type { Db } from '../../api/seed';
import { addMonths, HEBREW_MONTHS, today } from '../dates';
import { familyBills } from '../billing';

export function linearRegression(ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0) || 1;
  const ssRes = ys.reduce((s, y, i) => s + (y - (intercept + slope * i)) ** 2, 0);
  return { slope, intercept, r2: 1 - ssRes / ssTot };
}

export interface WhatIf { priceChange: number; waitingConversion: number; churnReduction: number }
export interface ForecastPoint { month: string; label: string; students: number; revenue: number; projected: boolean }

export function forecast(db: Db, whatIf: WhatIf, horizon = 6, now = today()): { points: ForecastPoint[]; growthPerMonth: number; r2: number; revenueNow: number; revenueEnd: number } {
  const monthStart = now.slice(0, 8) + '01';
  const months = Array.from({ length: 12 }, (_, i) => addMonths(monthStart, i - 11));
  // active students at the end of each month (joined before, not finished before)
  const activeAt = (m: string) => {
    const end = addMonths(m, 1);
    return db.students.filter(s => s.startDate < end && s.status !== 'מחכה' && (!s.finishDate || s.finishDate >= end)).length;
  };
  const history = months.map(activeAt);
  const { slope, intercept, r2 } = linearRegression(history);

  const revenueNow = familyBills(db.families, db.students, db.courses, db.enrollments).reduce((s, b) => s + b.total, 0);
  const activeNow = db.students.filter(s => s.status === 'פעיל').length || 1;
  const perStudent = revenueNow / activeNow;
  const label = (m: string) => HEBREW_MONTHS[Number(m.slice(5, 7)) - 1];

  const points: ForecastPoint[] = months.map((m, i) => ({ month: m, label: label(m), students: history[i], revenue: Math.round(history[i] * perStudent), projected: false }));
  const converted = Math.round(db.waitingList.length * whatIf.waitingConversion);
  const adjustedSlope = slope + (Math.max(slope, 0.5) * whatIf.churnReduction);
  for (let k = 1; k <= horizon; k++) {
    const m = addMonths(monthStart, k);
    const base = Math.max(0, intercept + adjustedSlope * (11 + k));
    const students = Math.round(base + converted * Math.min(1, k / 2));
    points.push({ month: m, label: label(m), students, revenue: Math.round(students * perStudent * (1 + whatIf.priceChange)), projected: true });
  }
  return { points, growthPerMonth: adjustedSlope, r2, revenueNow, revenueEnd: points[points.length - 1].revenue };
}
