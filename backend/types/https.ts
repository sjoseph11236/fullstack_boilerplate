export type IdParam = { id: string };

export type WithId<T extends object = Record<string, never>> = T & { Params: IdParam };
