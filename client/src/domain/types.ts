// Domain model of the client. Field names are clean English; src/api/mappers.ts translates
// them to/from the .NET API (BL models), whose names come from the legacy database.

export type StudentStatus = 'פעיל' | 'מחכה' | 'גמר';
export type Gender = 'בן' | 'בת';
export type Audience = 'בנים' | 'בנות' | 'מעורב';
export type LessonStatus = 'מתוכנן' | 'התקיים' | 'בוטל';

export interface Family {
  id: number;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  paymentMethod: string;
}

export interface Student {
  id: number;
  idNumber: string;
  familyId: number;
  firstName: string;
  gender: Gender;
  birthDate: string;      // yyyy-mm-dd
  startDate: string;
  lessonsTaken: number;
  makeupLessons: number;
  status: StudentStatus;
  finishDate: string | null;
  notes: string;
}

export interface Teacher {
  id: number;
  idNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  active: boolean;
  gender: Gender;
  notes: string;
}

export interface Course {
  id: number;
  name: string;
  audience: Audience;
  price: number;          // monthly, NIS
  description: string;
  durationMinutes: number;
  fromAge: number;
  toAge: number;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  teacherId: number | null;
}

export interface TeacherCourse {
  id: number;
  teacherId: number;
  courseId: number;
}

export interface Lesson {
  id: number;
  teacherId: number;
  studentId: number;
  date: string;           // yyyy-mm-dd
  hour: string;           // HH:mm
  dayName: string;
  status: LessonStatus;
}

export interface Absence {
  id: number;
  personId: number;       // student or teacher
  from: string;
  to: string;
  reason: string;
}

export interface WaitingEntry {
  id: number;
  studentId: number;
  courseId: number;
  since: string;
  reason: string;
}

export interface EntityMap {
  families: Family;
  students: Student;
  teachers: Teacher;
  courses: Course;
  enrollments: Enrollment;
  teacherCourses: TeacherCourse;
  lessons: Lesson;
  studentAbsences: Absence;
  teacherAbsences: Absence;
  waitingList: WaitingEntry;
}

export type ResourceName = keyof EntityMap;
