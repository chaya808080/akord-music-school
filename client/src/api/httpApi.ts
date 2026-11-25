// Implementation of the API contract over the ASP.NET Core Web API (see /server).
import axios, { AxiosError } from 'axios';
import type { EntityMap, ResourceName } from '../domain/types';
import { ApiError, type AkordApi, type Resource, type Resources } from './api';
import { mappers, type Mapper } from './mappers';

const ROUTES: Record<ResourceName, string> = {
  families: 'families',
  students: 'students',
  teachers: 'teachers',
  courses: 'courses',
  enrollments: 'enrollments',
  teacherCourses: 'teacher-courses',
  lessons: 'lessons',
  studentAbsences: 'student-absences',
  teacherAbsences: 'teacher-absences',
  waitingList: 'waiting-list',
};

export function createHttpApi(baseURL: string): AkordApi {
  const http = axios.create({ baseURL, timeout: 15_000 });

  // ProblemDetails.title carries the Hebrew business-rule message from the BL layer.
  http.interceptors.response.use(undefined, (error: AxiosError<{ title?: string }>) => {
    const message = error.response?.data?.title ?? (error.response ? `שגיאת שרת (${error.response.status})` : 'אין חיבור לשרת');
    return Promise.reject(new ApiError(message));
  });

  function resource<K extends ResourceName>(name: K): Resource<EntityMap[K]> {
    const url = ROUTES[name];
    const m = mappers[name] as unknown as Mapper<EntityMap[K]>;
    return {
      list: async () => (await http.get<unknown[]>(url)).data.map(m.fromApi),
      create: async item => m.fromApi((await http.post(url, m.toApi({ ...item, id: 0 } as EntityMap[K]))).data),
      update: async item => m.fromApi((await http.put(`${url}/${item.id}`, m.toApi(item))).data),
      remove: async id => { await http.delete(`${url}/${id}`); },
    };
  }

  const resources = Object.fromEntries(
    (Object.keys(ROUTES) as ResourceName[]).map(name => [name, resource(name)]),
  ) as unknown as Resources;

  return {
    mode: 'server',
    resources,
    promoteWaiting: async (waitingId, teacherId) => {
      await http.post(`waiting-list/${waitingId}/promote`, null, { params: teacherId ? { teacherId } : {} });
    },
  };
}
