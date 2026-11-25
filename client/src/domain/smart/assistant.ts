// Hebrew natural-language assistant. A small intent classifier + entity recognizer (course,
// teacher, student and family names are matched against live data) that answers from the database.
import type { Db } from '../../api/seed';
import { addDays, daysBetween, formatShort, inRange, today, weekStart } from '../dates';
import { familyBills, shekel } from '../billing';
import { teacherName } from '../display';
import { riskReport } from './risk';
import { teacherFreeSlots } from './scheduler';

export interface Answer { text: string; links?: { label: string; to: string }[] }

export const SUGGESTIONS = [
  'כמה תלמידים פעילים יש?',
  'מה ההכנסה החודשית?',
  'מי בסיכון נשירה?',
  'איזה מורה הכי עמוס השבוע?',
  'כמה תלמידים לומדים פסנתר?',
  'מתי השיעור הבא של נועה?',
  'מי ממתין הכי הרבה זמן?',
  'כמה שיעורים יש היום?',
];

const norm = (s: string) => s.replace(/[?!.,״"׳']/g, ' ').replace(/\s+/g, ' ').trim();
const has = (q: string, ...words: string[]) => words.some(w => q.includes(w));

export function ask(question: string, db: Db, now = today()): Answer {
  const q = norm(question);
  if (!q) return { text: 'שאלו אותי כל דבר על בית הספר: תלמידים, מורים, שיעורים, הכנסות או רשימת ההמתנה.' };

  const course = db.courses.find(c => q.includes(c.name.replace('׳', '')) || q.includes(c.name));
  const teacher = db.teachers.find(t => q.includes(t.firstName) && (q.includes(t.lastName) || has(q, 'מורה', 'המורה', 'פנוי', 'זמין')));
  const family = db.families.find(f => q.includes(`משפחת ${f.lastName}`) || q.includes(`משפחה ${f.lastName}`));
  const student = db.students.find(s => q.split(' ').includes(s.firstName) || q.split(' ').some(w => w === `של${s.firstName}`));
  const active = db.students.filter(s => s.status === 'פעיל');

  // --- next lesson of a student
  if (student && has(q, 'שיעור', 'מתי', 'הבא')) {
    const next = db.lessons.filter(l => l.studentId === student.id && l.date >= now && l.status === 'מתוכנן').sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour))[0];
    const lastName = db.families.find(f => f.id === student.familyId)?.lastName ?? '';
    return next
      ? { text: `השיעור הבא של ${student.firstName} ${lastName}: יום ${next.dayName}, ${formatShort(next.date)} בשעה ${next.hour} עם ${teacherName(db.teachers.find(t => t.id === next.teacherId))}.`, links: [{ label: 'לכרטיס התלמיד', to: `/app/students/${student.id}` }] }
      : { text: `ל${student.firstName} ${lastName} אין שיעור מתוכנן. אפשר לשבץ אוטומטית במערכת השעות.`, links: [{ label: 'שיבוץ אוטומטי', to: '/app/schedule?auto=1' }] };
  }

  // --- free slots of a teacher
  if (teacher && has(q, 'פנוי', 'זמין', 'חלון', 'מקום')) {
    const slots = teacherFreeSlots(teacher.id, db, weekStart(now)).slice(0, 5);
    return slots.length
      ? { text: `ל${teacherName(teacher)} יש משבצות פנויות השבוע: ${slots.map(s => `${formatShort(s.date)} ${s.hour}`).join(', ')}.`, links: [{ label: 'למערכת השעות', to: '/app/schedule' }] }
      : { text: `ל${teacherName(teacher)} אין משבצות פנויות השבוע.` };
  }

  // --- family bill
  if (family) {
    const bill = familyBills([family], db.students, db.courses, db.enrollments)[0];
    return { text: `החיוב החודשי של משפחת ${family.lastName}: ${shekel(bill.total)} (${bill.lines.length} קורסים${bill.discount ? `, כולל הנחת אחים של ${shekel(bill.discount)}` : ''}). אמצעי תשלום: ${family.paymentMethod}.`, links: [{ label: 'לגבייה', to: '/app/billing' }] };
  }

  if (has(q, 'נשיר', 'סיכון', 'עוזב', 'לעזוב')) {
    const risks = riskReport(db, now).filter(r => r.level !== 'נמוך').slice(0, 4);
    if (!risks.length) return { text: 'אין כרגע תלמידים בסיכון נשירה משמעותי 🎉' };
    return { text: `תלמידים בסיכון: ${risks.map(r => `${r.student.firstName} (${r.score}, ${r.factors[0]?.label})`).join(' · ')}.`, links: [{ label: 'לניתוח המלא', to: '/app/insights' }] };
  }

  if (has(q, 'הכנס', 'כסף', 'גביי', 'תשלומ', 'מחזור')) {
    const bills = familyBills(db.families, db.students, db.courses, db.enrollments);
    const total = bills.reduce((s, b) => s + b.total, 0);
    return { text: `ההכנסה החודשית הצפויה היא ${shekel(total)} מ-${bills.filter(b => b.total).length} משפחות, אחרי הנחות אחים של ${shekel(bills.reduce((s, b) => s + b.discount, 0))}.`, links: [{ label: 'לגבייה', to: '/app/billing' }] };
  }

  if (has(q, 'עמוס', 'הכי הרבה שיעורים', 'עומס')) {
    const sunday = weekStart(now);
    const loads = db.teachers.filter(t => t.active).map(t => ({ t, n: db.lessons.filter(l => l.teacherId === t.id && l.date >= sunday && l.date < addDays(sunday, 7) && l.status !== 'בוטל').length })).sort((a, b) => b.n - a.n);
    return { text: `השבוע ${teacherName(loads[0].t)} הכי עמוס/ה עם ${loads[0].n} שיעורים, ו${teacherName(loads[loads.length - 1].t)} הכי פנוי/ה עם ${loads[loads.length - 1].n}.`, links: [{ label: 'לצוות', to: '/app/teachers' }] };
  }

  if (has(q, 'ממתין', 'המתנה', 'מחכה', 'מחכים')) {
    const list = [...db.waitingList].sort((a, b) => a.since.localeCompare(b.since));
    if (!list.length) return { text: 'רשימת ההמתנה ריקה.' };
    const first = list[0];
    const s = db.students.find(x => x.id === first.studentId);
    return { text: `${list.length} ממתינים. הוותיק/ה ביותר: ${s?.firstName} ל${db.courses.find(c => c.id === first.courseId)?.name}, כבר ${daysBetween(first.since, now)} ימים.`, links: [{ label: 'לרשימת ההמתנה', to: '/app/waiting' }] };
  }

  if (has(q, 'היום') && has(q, 'שיעור')) {
    const todays = db.lessons.filter(l => l.date === now && l.status !== 'בוטל');
    const absent = db.teacherAbsences.filter(a => inRange(now, a.from, a.to)).length;
    return { text: `היום מתוכננים ${todays.length} שיעורים${absent ? `, ו-${absent} מורים נעדרים` : ''}.`, links: [{ label: 'למערכת השעות', to: '/app/schedule' }] };
  }

  if (course && has(q, 'כמה', 'מספר', 'תלמידים', 'לומד')) {
    const n = db.enrollments.filter(e => e.courseId === course.id).length;
    const w = db.waitingList.filter(x => x.courseId === course.id).length;
    return { text: `${n} תלמידים לומדים ${course.name}${w ? ` ו-${w} ממתינים` : ''}. מחיר חודשי: ${shekel(course.price)}.`, links: [{ label: 'לקורסים', to: '/app/courses' }] };
  }

  if (has(q, 'כמה') && has(q, 'תלמיד')) {
    return { text: `יש ${active.length} תלמידים פעילים, ${db.students.filter(s => s.status === 'מחכה').length} ממתינים ו-${db.students.filter(s => s.status === 'גמר').length} שסיימו.`, links: [{ label: 'לתלמידים', to: '/app/students' }] };
  }

  if (has(q, 'כמה') && has(q, 'מור')) {
    return { text: `בצוות ${db.teachers.length} מורים, מתוכם ${db.teachers.filter(t => t.active).length} פעילים.`, links: [{ label: 'לצוות', to: '/app/teachers' }] };
  }

  return { text: 'לא בטוח שהבנתי 🤔 נסו לשאול למשל: ' + SUGGESTIONS.slice(0, 3).join(' / ') };
}
