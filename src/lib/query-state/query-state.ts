import type {
  InferSchemaValues,
  QueryLocation,
  QueryParser,
  QuerySchema,
  QueryStateOptions,
} from "./query-state-types";

export const defaultQueryStateOptions: Required<QueryStateOptions> = {
  history: "replace",
  clearOnDefault: true,
};

const isNullish = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

export const readQueryValue = <T>(
  searchParams: URLSearchParams,
  key: string,
  parser: QueryParser<T>,
): T | null => {
  const values = searchParams.getAll(key);
  const parsed = parser.parse(values.length > 0 ? values : null);

  // Defaults only apply when the query param is absent.
  // Present-but-invalid values intentionally stay null.
  if (
    values.length === 0 &&
    isNullish(parsed) &&
    !isNullish(parser.defaultValue)
  ) {
    return parser.defaultValue;
  }

  return parsed;
};

const getSchemaKeys = <TSchema extends QuerySchema>(schema: TSchema) =>
  Object.keys(schema) as Array<keyof TSchema & string>;

const readSchemaValue = <
  TSchema extends QuerySchema,
  TKey extends keyof TSchema & string,
>(
  searchParams: URLSearchParams,
  schema: TSchema,
  key: TKey,
): InferSchemaValues<TSchema>[TKey] =>
  readQueryValue(
    searchParams,
    key,
    schema[key],
  ) as InferSchemaValues<TSchema>[TKey];

const writeSchemaValue = <
  TSchema extends QuerySchema,
  TKey extends keyof TSchema & string,
>(
  searchParams: URLSearchParams,
  schema: TSchema,
  key: TKey,
  value: InferSchemaValues<TSchema>[TKey],
  options: Required<QueryStateOptions>,
) => {
  writeQueryValue(searchParams, key, value, schema[key], options);
};

export const readQueryValues = <TSchema extends QuerySchema>(
  searchParams: URLSearchParams,
  schema: TSchema,
) => {
  const values = {} as InferSchemaValues<TSchema>;

  for (const key of getSchemaKeys(schema)) {
    values[key] = readSchemaValue(searchParams, schema, key);
  }

  return values;
};

export const writeQueryValue = <T>(
  searchParams: URLSearchParams,
  key: string,
  value: T | null,
  parser: QueryParser<T>,
  options: Required<QueryStateOptions>,
) => {
  const isDefaultValue =
    !isNullish(parser.defaultValue) &&
    !isNullish(value) &&
    (parser.eq ?? Object.is)(value, parser.defaultValue);

  if (isNullish(value) || (options.clearOnDefault && isDefaultValue)) {
    searchParams.delete(key);
    return;
  }

  const serialized = parser.serialize(value);
  searchParams.delete(key);

  if (serialized === null || serialized.length === 0) {
    return;
  }

  for (const serializedValue of serialized) {
    searchParams.append(key, serializedValue);
  }
};

export const applyQueryValues = <TSchema extends QuerySchema>(
  searchParams: URLSearchParams,
  values: Partial<InferSchemaValues<TSchema>>,
  schema: TSchema,
  options: Required<QueryStateOptions>,
) => {
  for (const key of Object.keys(values) as Array<keyof TSchema & string>) {
    if (!(key in schema)) continue;

    writeSchemaValue(
      searchParams,
      schema,
      key,
      values[key] as InferSchemaValues<TSchema>[typeof key],
      options,
    );
  }
};

export const toSearchString = (searchParams: URLSearchParams) => {
  const search = searchParams.toString();
  return search ? `?${search}` : "";
};

export const toQueryLocationHref = (location: QueryLocation) => {
  const normalizedSearchStr =
    location.searchStr.length > 0 && !location.searchStr.startsWith("?")
      ? `?${location.searchStr}`
      : location.searchStr;

  return `${location.pathname}${normalizedSearchStr}${location.hash}`;
};
