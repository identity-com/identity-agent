export type EventPayload = { [k: string]: any };

// @ts-ignore
export type TaskEvent<ET extends string, S> = Partial<S>;
