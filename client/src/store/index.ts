import { configureStore, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import data from './dataSlice';
import ui, { pushToast } from './uiSlice';
import type { Db } from '../api/seed';

export const store = configureStore({ reducer: { data, ui } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** All tables as one object - the input of the smart engines (scheduler, risk, forecast, assistant). */
export const selectDb = createSelector(
  [(s: RootState) => s.data],
  (d): Db => ({
    families: d.families, students: d.students, teachers: d.teachers, courses: d.courses, enrollments: d.enrollments,
    teacherCourses: d.teacherCourses, lessons: d.lessons, studentAbsences: d.studentAbsences, teacherAbsences: d.teacherAbsences, waitingList: d.waitingList,
  }),
);

const byId = <T extends { id: number }>(rows: T[]) => new Map(rows.map(r => [r.id, r]));

/** Memoised lookup maps - every page joins tables through these. */
export const selectLookups = createSelector(
  [(s: RootState) => s.data.students, (s: RootState) => s.data.teachers, (s: RootState) => s.data.courses, (s: RootState) => s.data.families],
  (students, teachers, courses, families) => ({
    student: byId(students), teacher: byId(teachers), course: byId(courses), family: byId(families),
  }),
);

/**
 * Runs a thunk and reports the outcome as a toast. Returns true on success,
 * so forms can close only when the server (or demo rules) accepted the change.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncThunkLike = (dispatch: AppDispatch, getState: () => RootState, extra: unknown) => Promise<any>;

export function useAction() {
  const dispatch = useAppDispatch();
  return async (thunk: AsyncThunkLike, success?: string): Promise<boolean> => {
    const result = await dispatch(thunk);
    if (result?.error) {
      dispatch(pushToast('error', result.error.message ?? 'הפעולה נכשלה'));
      return false;
    }
    if (success) dispatch(pushToast('success', success));
    return true;
  };
}
