// Parent-message generator: personalised Hebrew templates built from live data.
import type { Db } from '../../api/seed';
import { formatShort, today } from '../dates';
import { familyBills, shekel } from '../billing';
import { teacherName } from '../display';

export type Template = 'reminder' | 'payment' | 'checkin';
export const TEMPLATES: { value: Template; label: string }[] = [
  { value: 'reminder', label: 'תזכורת לשיעור' },
  { value: 'payment', label: 'סיכום חיוב חודשי' },
  { value: 'checkin', label: 'בירור על היעדרויות' },
];

export function compose(template: Template, studentId: number, db: Db): string {
  const s = db.students.find(x => x.id === studentId);
  if (!s) return '';
  const f = db.families.find(x => x.id === s.familyId);
  const hi = `שלום למשפחת ${f?.lastName ?? ''},`;
  const sign = '\n\nבברכה,\nצוות אקורד 🎵';

  if (template === 'reminder') {
    const next = db.lessons.filter(l => l.studentId === s.id && l.date >= today() && l.status === 'מתוכנן').sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour))[0];
    if (!next) return `${hi}\nנשמח לתאם ל${s.firstName} את השיעור הבא. אילו ימים ושעות נוחים לכם?${sign}`;
    return `${hi}\nתזכורת: השיעור של ${s.firstName} יתקיים ביום ${next.dayName}, ${formatShort(next.date)} בשעה ${next.hour} עם ${teacherName(db.teachers.find(t => t.id === next.teacherId))}.\nנא להגיע 5 דקות לפני ולהביא את חוברת התרגול.${sign}`;
  }
  if (template === 'payment') {
    const bill = f && familyBills([f], db.students, db.courses, db.enrollments)[0];
    if (!bill) return '';
    const lines = bill.lines.map(l => `• ${l.student.firstName} – ${l.course.name}: ${shekel(l.amount)}`).join('\n');
    return `${hi}\nלהלן פירוט החיוב לחודש הנוכחי:\n${lines}${bill.discount ? `\n• הנחת אחים: −${shekel(bill.discount)}` : ''}\nסה״כ: ${shekel(bill.total)} (${f!.paymentMethod}).${sign}`;
  }
  const cancelled = db.lessons.filter(l => l.studentId === s.id && l.status === 'בוטל' && l.date < today()).length;
  return `${hi}\nשמנו לב ש${s.firstName} החסיר/ה לאחרונה ${cancelled || 'כמה'} שיעורים. חשוב לנו שההתקדמות תימשך בהנאה 🙂\nנשמח לשוחח ולבדוק אם כדאי להתאים את שעת השיעור או את קצב הלימוד.${sign}`;
}

/** wa.me link with the text pre-filled (Israeli number -> 972 prefix). */
export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '972');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
