import type { EntityMap, ResourceName } from '../domain/types';

export interface Resource<T extends { id: number }> {
  list(): Promise<T[]>;
  create(item: Omit<T, 'id'>): Promise<T>;
  update(item: T): Promise<T>;
  remove(id: number): Promise<void>;
}

export type Resources = { [K in ResourceName]: Resource<EntityMap[K]> };

/** One contract, two implementations: the .NET Web API (httpApi) and the in-browser demo (demoApi). */
export interface AkordApi {
  mode: 'server' | 'demo';
  resources: Resources;
  promoteWaiting(waitingId: number, teacherId: number | null): Promise<void>;
  resetDemo?(): void;
}

/** Error carrying the Hebrew business-rule message to the UI. */
export class ApiError extends Error {}
