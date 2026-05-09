type QueryHistoryMode = "replace" | "push";

export type QueryStateOptions = {
  history?: QueryHistoryMode;
  clearOnDefault?: boolean;
};

type QueryParserConfig<T> = {
  parse: (value: string | null) => T | null;
  serialize: (value: T) => string | null;
  eq?: (a: T, b: T) => boolean;
  defaultValue?: T;
};

export type QueryParser<T> = QueryParserConfig<T> & {
  withDefault: (defaultValue: T) => QueryParser<T>;
};

export type QuerySchema = Record<string, QueryParser<unknown>>;

export type InferSchemaValues<TSchema extends QuerySchema> = {
  [K in keyof TSchema]: TSchema[K] extends QueryParser<infer TValue>
    ? TValue | null
    : never;
};

const createParser = <T>(config: QueryParserConfig<T>): QueryParser<T> => {
  const parser = {
    ...config,
    withDefault(defaultValue: T) {
      return createParser({
        ...config,
        defaultValue,
      });
    },
  } satisfies QueryParser<T>;

  return parser;
};

export const parseAsString = createParser<string>({
  parse: (value) => value,
  serialize: (value) => value,
});

export const parseAsInteger = createParser<number>({
  parse: (value) => {
    if (value === null) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  },
  serialize: (value) => Math.trunc(value).toString(10),
});

export const parseAsFloat = createParser<number>({
  parse: (value) => {
    if (value === null) return null;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  serialize: (value) => value.toString(10),
});

export const parseAsBoolean = createParser<boolean>({
  parse: (value) => {
    if (value === null) return null;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return null;
  },
  serialize: (value) => (value ? "true" : "false"),
});

export const parseAsJson = <T>() =>
  createParser<T>({
    parse: (value) => {
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
  });
