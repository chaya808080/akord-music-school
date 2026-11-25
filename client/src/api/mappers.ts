// Translates between the client's domain model and the .NET BL models (camelCase JSON),
// whose field names come from the legacy database schema.
import type { Absence, Course, Enrollment, EntityMap, Family, Lesson, Student, Teacher, TeacherCourse, WaitingEntry } from '../domain/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Api = Record<string, any>;

export interface Mapper<T> {
  fromApi(raw: unknown): T;
  toApi(item: T): Api;
}

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const digits = (v: string) => v.replace(/\D/g, '');
const hhmm = (v: unknown) => str(v).slice(0, 5);

const family: Mapper<Family> = {
  fromApi: (r: any) => ({ id: r.codeFamily, lastName: str(r.lastName), address: str(r.address), phone: str(r.phone), email: str(r.mail), paymentMethod: str(r.paiy) }),
  toApi: f => ({ codeFamily: f.id, lastName: f.lastName, address: f.address, phone: digits(f.phone), mail: f.email, paiy: f.paymentMethod }),
};

const student: Mapper<Student> = {
  fromApi: (r: any) => ({
    id: r.codeOfStudent, idNumber: String(r.idOfStudents).padStart(9, '0'), familyId: r.codeFamily, firstName: str(r.firstName),
    gender: str(r.sexOfStudent) === 'בן' ? 'בן' : 'בת', birthDate: str(r.birsDate), startDate: str(r.beginDate),
    lessonsTaken: r.countLessonAct ?? 0, makeupLessons: r.fixLesson ?? 0, status: (str(r.actOrWaitOrFinish) || 'פעיל') as Student['status'],
    finishDate: r.finishDate ?? null, notes: str(r.coments),
  }),
  toApi: s => ({
    codeOfStudent: s.id, idOfStudents: Number(s.idNumber), codeFamily: s.familyId, firstName: s.firstName, sexOfStudent: s.gender,
    birsDate: s.birthDate || null, beginDate: s.startDate || null, countLessonAct: s.lessonsTaken, fixLesson: s.makeupLessons,
    actOrWaitOrFinish: s.status, finishDate: s.finishDate || null, coments: s.notes,
  }),
};

const teacher: Mapper<Teacher> = {
  fromApi: (r: any) => ({
    id: r.codeOfTeacher, idNumber: str(r.idOfTeacher), firstName: str(r.firstNameOfTeacher), lastName: str(r.lastNameOfTeacher),
    phone: str(r.phoneOfTeacher), email: str(r.mail), active: str(r.actOrNot) !== 'false', gender: str(r.sexOfTeacher) === 'בן' ? 'בן' : 'בת', notes: str(r.comentTeacher),
  }),
  toApi: t => ({
    codeOfTeacher: t.id, idOfTeacher: t.idNumber, firstNameOfTeacher: t.firstName, lastNameOfTeacher: t.lastName, phoneOfTeacher: digits(t.phone),
    mail: t.email, actOrNot: String(t.active), sexOfTeacher: t.gender, comentTeacher: t.notes,
  }),
};

const course: Mapper<Course> = {
  fromApi: (r: any) => ({
    id: r.codeOfCourse, name: str(r.nameOfCourse), audience: str(r.sexOfCourse) as Course['audience'], price: r.priceOfCourse,
    description: str(r.descriptionOfCourse), durationMinutes: r.duretionTimeOfCourse ?? 45, fromAge: r.fromAge ?? 0, toAge: r.toAge ?? 120,
  }),
  toApi: c => ({
    codeOfCourse: c.id, nameOfCourse: c.name, sexOfCourse: c.audience, priceOfCourse: c.price, descriptionOfCourse: c.description,
    duretionTimeOfCourse: c.durationMinutes, fromAge: c.fromAge, toAge: c.toAge,
  }),
};

const enrollment: Mapper<Enrollment> = {
  fromApi: (r: any) => ({ id: r.codeSc, studentId: r.codeOfStudentSc, courseId: r.codeOfCourseSc, teacherId: r.codeOfTeacherSc ?? null }),
  toApi: e => ({ codeSc: e.id, codeOfStudentSc: e.studentId, codeOfCourseSc: e.courseId, codeOfTeacherSc: e.teacherId }),
};

const teacherCourse: Mapper<TeacherCourse> = {
  fromApi: (r: any) => ({ id: r.codeTc, teacherId: r.codeOfTeacherTc, courseId: r.codeOfCourseTc }),
  toApi: t => ({ codeTc: t.id, codeOfTeacherTc: t.teacherId, codeOfCourseTc: t.courseId }),
};

const lesson: Mapper<Lesson> = {
  fromApi: (r: any) => ({
    id: r.annualHoursSystemCode, teacherId: r.teacherCode, studentId: r.studentCode, date: str(r.date), hour: hhmm(r.hour),
    dayName: str(r.dayInWeek), status: (str(r.status) || 'מתוכנן') as Lesson['status'],
  }),
  toApi: l => ({ annualHoursSystemCode: l.id, teacherCode: l.teacherId, studentCode: l.studentId, date: l.date, hour: `${l.hour}:00`, status: l.status }),
};

const studentAbsence: Mapper<Absence> = {
  fromApi: (r: any) => ({ id: r.studentIsAbsentCode, personId: r.studentCode, from: str(r.fromDate), to: str(r.toDate), reason: str(r.reasonAbsentS) }),
  toApi: a => ({ studentIsAbsentCode: a.id, studentCode: a.personId, fromDate: a.from, toDate: a.to || null, reasonAbsentS: a.reason }),
};

const teacherAbsence: Mapper<Absence> = {
  fromApi: (r: any) => ({ id: r.teacherIsAbsentCode, personId: r.codeOfTeacher, from: str(r.fromDate), to: str(r.toDate), reason: str(r.reasonAbsentT) }),
  toApi: a => ({ teacherIsAbsentCode: a.id, codeOfTeacher: a.personId, fromDate: a.from, toDate: a.to || null, reasonAbsentT: a.reason }),
};

const waiting: Mapper<WaitingEntry> = {
  fromApi: (r: any) => ({ id: r.studentWaitingCode, studentId: r.studentCode, courseId: r.courseCode, since: str(r.waitingDate), reason: str(r.waitingReason) }),
  toApi: w => ({ studentWaitingCode: w.id, studentCode: w.studentId, courseCode: w.courseId, waitingDate: w.since || null, waitingReason: w.reason }),
};

export const mappers: { [K in keyof EntityMap]: Mapper<EntityMap[K]> } = {
  families: family,
  students: student,
  teachers: teacher,
  courses: course,
  enrollments: enrollment,
  teacherCourses: teacherCourse,
  lessons: lesson,
  studentAbsences: studentAbsence,
  teacherAbsences: teacherAbsence,
  waitingList: waiting,
};
