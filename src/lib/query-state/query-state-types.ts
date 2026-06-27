import type React from "react";

export type QueryHistoryMode = "replace" | "push";

export type QueryStateOptions = {
  history?: QueryHistoryMode;
  clearOnDefault?: boolean;
};

export type QueryLocation = {
  pathname: string;
  searchStr: string;
  hash: string;
};

export type QueryNavigation = (
  nextLocation: QueryLocation,
  options: Required<QueryStateOptions>,
) => void | Promise<void>;

export type QueryParserConfig<T> = {
  parse(value: readonly string[] | null): T | null;
  serialize(value: T): readonly string[] | null;
  eq?(a: T, b: T): boolean;
  defaultValue?: T;
};

export type QueryParser<T> = QueryParserConfig<T> & {
  withDefault(defaultValue: T): QueryParser<T>;
};

export type QuerySchema = Record<string, QueryParser<unknown>>;

export type InferSchemaValues<TSchema extends QuerySchema> = {
  [K in keyof TSchema]: TSchema[K] extends QueryParser<infer TValue>
    ? TValue | null
    : never;
};

export type QueryStateContextValue = {
  location: QueryLocation;
  navigate: QueryNavigation;
};

export type QueryStateProviderProps = {
  children: React.ReactNode;
  location: QueryLocation;
  navigate: QueryNavigation;
};
