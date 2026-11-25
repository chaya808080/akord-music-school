// In-browser implementation of the API contract. It enforces the same business rules as the
// .NET server, persists to localStorage and adds a small latency so loading states are real.
import type { EntityMap, Lesson, ResourceName } from '../domain/types';
import { dayName, today } from '../domain/dates';
import {
  RuleError, lessonConflicts, require, validateAbsence, validateCourse, validateEnrollment, validateFamily,
  validateStudent, validateTeacher,
} from '../domain/rules';
import { ApiError, type AkordApi, type Resource, type Resources } from './api';
import { createSeed, type Db } from './seed';

const STORAGE_KEY = 'akord-demo-v5';

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch { /* private mode / corrupted - fall back to a fresh seed */ }
  return createSeed();
}

export function createDemoApi(latency = 220): AkordApi {
  let db = load();
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* ignore */ } };
  const wait = () => new Promise(r => setTimeout(r, latency * (0.6 + Math.random() * 0.8)));
  const clone = <T,>(v: T): T => structuredClone(v);

  type Hooks<K extends ResourceName> = {
    normalize?: (item: EntityMap[K]) => void;
    validate?: (item: EntityMap[K]) => void;
    beforeDelete?: (id: number) => void;
  };

  const hooks: { [K in ResourceName]?: Hooks<K> } = {
    families: {
      validate: validateFamily,
      beforeDelete: id => require(!db.students.some(s => s.familyId === id), 'לא ניתן למחוק משפחה שיש לה תלמידים רשומים'),
    },
    students: {
      normalize: s => { if (s.status === 'גמר') s.finishDate ??= today(); },
      validate: s => validateStudent(s, db.students, db.families),
      beforeDelete: id => require(!db.enrollments.some(e => e.studentId === id), 'לא ניתן למחוק תלמיד שרשום לקורס. יש להסיר קודם את הרישום'),
    },
    teachers: { validate: validateTeacher },
    courses: {
      validate: validateCourse,
      beforeDelete: id => require(!db.enrollments.some(e => e.courseId === id), 'לא ניתן למחוק קורס שיש בו תלמידים רשומים'),
    },
    enrollments: { validate: e => validateEnrollment(e, db.students, db.courses, db.enrollments, db.teacherCourses) },
    teacherCourses: {
      validate: t => require(!db.teacherCourses.some(o => o.teacherId === t.teacherId && o.courseId === t.courseId && o.id !== t.id), 'המורה כבר משויך/ת לקורס הזה'),
    },
    lessons: {
      normalize: (l: Lesson) => { l.dayName = dayName(l.date); l.status ||= 'מתוכנן'; },
      validate: (l: Lesson) => {
        const problems = lessonConflicts(l, db.lessons, db.teachers, db.teacherAbsences);
        require(problems.length === 0, problems[0]);
      },
    },
    studentAbsences: { validate: validateAbsence },
    teacherAbsences: { validate: validateAbsence },
    waitingList: {
      validate: w => require(!db.waitingList.some(o => o.studentId === w.studentId && o.courseId === w.courseId && o.id !== w.id), 'התלמיד כבר ממתין לקורס הזה'),
    },
  };

  /** Turns a RuleError into an ApiError, exactly like the server's 400 ProblemDetails. */
  async function run<T>(fn: () => T): Promise<T> {
    await wait();
    try {
      const result = fn();
      save();
      return clone(result);
    } catch (e) {
      if (e instanceof RuleError) throw new ApiError(e.message);
      throw e;
    }
  }

  function resource<K extends ResourceName>(name: K): Resource<EntityMap[K]> {
    type T = EntityMap[K];
    const table = () => db[name] as T[];
    const h = (hooks[name] ?? {}) as Hooks<K>;
    return {
      list: () => run(() => table()),
      create: input => run(() => {
        const item = { ...clone(input), id: Math.max(0, ...table().map(x => x.id)) + 1 } as T;
        h.normalize?.(item);
        h.validate?.(item);
        table().push(item);
        return item;
      }),
      update: input => run(() => {
        const idx = table().findIndex(x => x.id === input.id);
        require(idx >= 0, 'הרשומה לא נמצאה');
        const item = clone(input);
        h.normalize?.(item);
        h.validate?.(item);
        table()[idx] = item;
        return item;
      }),
      remove: id => run(() => {
        h.beforeDelete?.(id);
        const idx = table().findIndex(x => x.id === id);
        require(idx >= 0, 'הרשומה לא נמצאה');
        table().splice(idx, 1);
      }),
    };
  }

  const resources = Object.fromEntries(
    (Object.keys(db) as ResourceName[]).map(name => [name, resource(name)]),
  ) as unknown as Resources;

  return {
    mode: 'demo',
    resources,
    promoteWaiting: (waitingId, teacherId) => run(() => {
      const w = db.waitingList.find(x => x.id === waitingId);
      require(w, 'רשומת ההמתנה לא נמצאה');
      const enrollment = { id: Math.max(0, ...db.enrollments.map(e => e.id)) + 1, studentId: w.studentId, courseId: w.courseId, teacherId };
      validateEnrollment(enrollment, db.students, db.courses, db.enrollments, db.teacherCourses);
      db.enrollments.push(enrollment);
      const student = db.students.find(s => s.id === w.studentId)!;
      student.status = 'פעיל';
      student.finishDate = null;
      db.waitingList = db.waitingList.filter(x => x.id !== waitingId);
    }),
    resetDemo: () => {
      db = createSeed();
      save();
    },
  };
}
