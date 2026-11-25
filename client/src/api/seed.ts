// Invented demo data, generated deterministically relative to "today" so the demo always looks alive.
import type { Absence, Course, Enrollment, EntityMap, Family, Lesson, Student, Teacher, TeacherCourse, WaitingEntry } from '../domain/types';
import { addDays, addMonths, dayName, today, weekStart } from '../domain/dates';
import { enrollmentProblems } from '../domain/rules';

export type Db = { [K in keyof EntityMap]: EntityMap[K][] };

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Appends a valid Israeli-ID check digit to an 8-digit base. */
export function israeliId(base8: number): string {
  const digits = String(base8).padStart(8, '0');
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = Number(digits[i]) * ((i % 2) + 1);
    sum += d > 9 ? d - 9 : d;
  }
  return digits + ((10 - (sum % 10)) % 10);
}

export const LESSON_HOURS = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export function createSeed(): Db {
  const r = rng(20251125);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const now = today();

  const families: Family[] = [
    ['כהן', 'רמת גן'], ['לוי', 'בני ברק'], ['מזרחי', 'פתח תקווה'], ['פרץ', 'גבעתיים'], ['ביטון', 'תל אביב'], ['אברהם', 'חולון'],
    ['פרידמן', 'רמת גן'], ['שפירא', 'בני ברק'], ['דהן', 'ראשון לציון'], ['קליין', 'גבעת שמואל'], ['אזולאי', 'רמת השרון'], ['רוזנברג', 'הרצליה'],
  ].map(([lastName, city], i) => ({
    id: i + 1, lastName, address: `רח׳ הנרקיס ${3 + i * 4}, ${city}`, phone: `05${i % 9}-000${String(1000 + i * 37).slice(-4)}`,
    email: `family${i + 1}@demo.co.il`, paymentMethod: ['הוראת קבע', 'כרטיס אשראי', 'העברה בנקאית'][i % 3],
  }));

  const courses: Course[] = ([
    ['פסנתר', 'מעורב', 320, 6, 18, 'נגינה קלאסית ומודרנית, קריאת תווים והרמוניה'],
    ['כינור', 'בנות', 300, 6, 16, 'טכניקת קשת, אינטונציה ונגינה בהרכב קאמרי'],
    ['גיטרה', 'מעורב', 280, 8, 18, 'אקורדים, ליווי שירים וגיטרה קלאסית'],
    ['חליל צד', 'בנות', 260, 8, 16, 'נשימה, טון וקריאת תווים, הכנה לתזמורת'],
    ['תופים', 'בנים', 290, 9, 18, 'קצב, קואורדינציה ונגינה עם להקה'],
    ['פיתוח קול', 'בנות', 310, 10, 18, 'טכניקה ווקאלית, הרמוניות והופעה'],
    ['צ׳לו', 'מעורב', 330, 7, 18, 'צליל עמוק, טכניקת יד שמאל ונגינה בתזמורת'],
    ['חלילית', 'מעורב', 180, 5, 8, 'מבוא למוזיקה לגיל הרך'],
  ] as const).map(([name, audience, price, fromAge, toAge, description], i) => ({
    id: i + 1, name, audience, price, fromAge, toAge, description, durationMinutes: name === 'חלילית' ? 30 : 45,
  }));

  const teachers: Teacher[] = ([
    ['מיכל', 'אורן', 'בת'], ['דניאל', 'רוזן', 'בן'], ['נועה', 'גל', 'בת'], ['יעקב', 'שטרן', 'בן'],
    ['רות', 'נחום', 'בת'], ['אלה', 'ברק', 'בת'], ['שמעון', 'טל', 'בן'],
  ] as const).map(([firstName, lastName, gender], i) => ({
    id: i + 1, firstName, lastName, gender, idNumber: israeliId(31000000 + i * 7919), phone: `052-111${String(100 + i * 11).slice(-4).padStart(4, '0')}`,
    email: `teacher${i + 1}@akord.co.il`, active: i !== 6, notes: i === 6 ? 'בחופשת שבתון' : '',
  }));

  // course -> teachers
  const tcPairs: [number, number][] = [[1, 1], [1, 3], [2, 2], [3, 4], [3, 1], [4, 5], [5, 4], [6, 6], [7, 2], [8, 3], [8, 7]];
  const teacherCourses: TeacherCourse[] = tcPairs.map(([courseId, teacherId], i) => ({ id: i + 1, courseId, teacherId }));

  const boys = ['איתי', 'יונתן', 'אורי', 'דוד', 'משה', 'אליה', 'נתנאל', 'יוסף', 'אריאל', 'עידו', 'נועם', 'שלמה'];
  const girls = ['נועה', 'שירה', 'תמר', 'אביגיל', 'מיכל', 'הדס', 'רחל', 'יעל', 'אסתר', 'חנה', 'מרים', 'אילה', 'שקד', 'הילה'];
  const students: Student[] = [];
  for (let i = 0; i < 44; i++) {
    const gender = r() < 0.6 ? 'בת' : 'בן';
    const age = 6 + Math.floor(r() * 11);
    // join dates spread over three years, so the growth curve (and the forecast) is realistic
    const startDate = addDays(addMonths(now, -Math.floor(r() * 36)), -Math.floor(r() * 25));
    const status = i % 11 === 5 ? 'מחכה' : i % 13 === 7 ? 'גמר' : 'פעיל';
    students.push({
      id: i + 1, idNumber: israeliId(21000000 + i * 104729), familyId: (i % families.length) + 1,
      firstName: gender === 'בת' ? pick(girls) : pick(boys), gender,
      birthDate: addDays(addMonths(now, -age * 12 - Math.floor(r() * 11)), -Math.floor(r() * 27)),
      startDate, lessonsTaken: 4 + Math.floor(r() * 30), makeupLessons: Math.floor(r() * 3), status,
      finishDate: status === 'גמר' ? addDays(now, -Math.floor(r() * 60)) : null, notes: i % 9 === 0 ? 'מתכוננת לרסיטל סוף שנה' : '',
    });
  }

  const enrollments: Enrollment[] = [];
  for (const s of students.filter(s => s.status === 'פעיל')) {
    const options = courses.filter(c => c.id !== 8 || r() < 0.5).filter(c => enrollmentProblems(s, c, enrollments).length === 0);
    if (!options.length) { s.status = 'מחכה'; continue; }
    const take = options.length > 1 && r() < 0.18 ? 2 : 1;
    for (const c of [...options].sort(() => r() - 0.5).slice(0, take)) {
      const tId = pick(teacherCourses.filter(t => t.courseId === c.id && teachers.find(x => x.id === t.teacherId)!.active)).teacherId;
      enrollments.push({ id: enrollments.length + 1, studentId: s.id, courseId: c.id, teacherId: tId });
    }
  }

  // Each enrollment gets a fixed weekly slot; lessons are generated for 4 weeks back and 3 ahead.
  const lessons: Lesson[] = [];
  const busy = new Set<string>();
  const sunday = weekStart(now);
  // the three newest enrollments are left unscheduled - the smart scheduler places them
  const unscheduled = new Set(enrollments.slice(-3).map(e => e.id));
  for (const e of enrollments.filter(x => !unscheduled.has(x.id))) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const day = Math.floor(r() * 5);
      const hour = pick(LESSON_HOURS);
      const tKey = `t${e.teacherId}-${day}-${hour}`;
      const sKey = `s${e.studentId}-${day}-${hour}`;
      if (busy.has(tKey) || busy.has(sKey)) continue;
      busy.add(tKey); busy.add(sKey);
      for (let w = -4; w <= 3; w++) {
        const date = addDays(sunday, w * 7 + day);
        const past = date < now;
        lessons.push({
          id: lessons.length + 1, teacherId: e.teacherId!, studentId: e.studentId, date, hour, dayName: dayName(date),
          status: past ? (r() < 0.07 ? 'בוטל' : 'התקיים') : 'מתוכנן',
        });
      }
      break;
    }
  }

  // a few students show a drop-out pattern: most of their recent lessons were cancelled
  const atRisk = new Set(students.filter(s => s.status === 'פעיל' && s.id % 10 === 3).map(s => s.id));
  for (const l of lessons) {
    if (atRisk.has(l.studentId) && l.date < now && l.date >= addDays(now, -24) && r() < 0.75) l.status = 'בוטל';
  }

  const waitingList: WaitingEntry[] = students.filter(s => s.status === 'מחכה').map((s, i) => {
    const course = courses.find(c => enrollmentProblems(s, c, []).length === 0) ?? courses[0];
    return { id: i + 1, studentId: s.id, courseId: course.id, since: addDays(now, -(6 + i * 9)), reason: i % 2 ? 'אין מקום פנוי בשעות המבוקשות' : 'ממתין לפתיחת קבוצה' };
  });

  const teacherAbsences: Absence[] = [
    // next Sunday-Tuesday: overlaps real lessons, so the substitute finder has work to do
    { id: 1, personId: 1, from: addDays(sunday, 7), to: addDays(sunday, 9), reason: 'השתלמות מקצועית' },
    { id: 2, personId: 2, from: addDays(now, -20), to: addDays(now, -18), reason: 'מחלה' },
  ];
  const studentAbsences: Absence[] = [
    { id: 1, personId: 2, from: addDays(now, -1), to: addDays(now, 1), reason: 'מחלה' },
    { id: 2, personId: 9, from: addDays(now, 5), to: addDays(now, 7), reason: 'טיול שנתי' },
    { id: 3, personId: 14, from: addDays(now, -12), to: addDays(now, -12), reason: 'אירוע משפחתי' },
  ];

  return { families, students, teachers, courses, enrollments, teacherCourses, lessons, studentAbsences, teacherAbsences, waitingList };
}
