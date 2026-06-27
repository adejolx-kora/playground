import type { QueryParser, QueryParserConfig } from "./query-state-types";

const firstValue = (value: readonly string[] | null) =>
  value === null || value.length === 0 ? null : value[0];

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
  parse: (value) => firstValue(value),
  serialize: (value) => [value],
});

export const parseAsInteger = createParser<number>({
  parse: (value) => {
    const resolvedValue = firstValue(value);
    if (resolvedValue === null) return null;
    if (!/^-?\d+$/.test(resolvedValue)) return null;

    const parsed = Number(resolvedValue);
    return Number.isSafeInteger(parsed) ? parsed : null;
  },
  serialize: (value) => [Math.trunc(value).toString(10)],
});

export const parseAsFloat = createParser<number>({
  parse: (value) => {
    const resolvedValue = firstValue(value);
    if (resolvedValue === null) return null;
    if (resolvedValue.trim() === "") return null;

    const parsed = Number(resolvedValue);
    return Number.isFinite(parsed) ? parsed : null;
  },
  serialize: (value) => [value.toString(10)],
});

export const parseAsBoolean = createParser<boolean>({
  parse: (value) => {
    const resolvedValue = firstValue(value);
    if (resolvedValue === null) return null;
    if (resolvedValue === "true" || resolvedValue === "1") return true;
    if (resolvedValue === "false" || resolvedValue === "0") return false;
    return null;
  },
  serialize: (value) => [value ? "true" : "false"],
});

export const parseAsJson = <T>() =>
  createParser<T>({
    parse: (value) => {
      const resolvedValue = firstValue(value);
      if (resolvedValue === null) return null;
      try {
        return JSON.parse(resolvedValue) as T;
      } catch {
        return null;
      }
    },
    serialize: (value) => [JSON.stringify(value)],
  });

export const parseAsArrayOf = <T>(
  itemParser: QueryParser<T>,
): QueryParser<T[]> =>
  createParser<T[]>({
    // Arrays map to repeated query params like `?tag=alpha&tag=beta`.
    // Comma-separated values are not expanded by this parser.
    parse: (value) => {
      if (value === null || value.length === 0) return null;

      const parsedValues: T[] = [];

      for (const item of value) {
        const parsedItem = itemParser.parse([item]);

        if (parsedItem === null) {
          return null;
        }

        parsedValues.push(parsedItem);
      }

      return parsedValues;
    },
    serialize: (value) => {
      const serializedValues = value.flatMap(
        (item) => itemParser.serialize(item) ?? [],
      );
      return serializedValues.length > 0 ? serializedValues : null;
    },
    eq: itemParser.eq
      ? (left, right) =>
          left.length === right.length &&
          left.every(
            (item, index) =>
              itemParser.eq?.(item, right[index]) ??
              Object.is(item, right[index]),
          )
      : (left, right) =>
          left.length === right.length &&
          left.every((item, index) => Object.is(item, right[index])),
  });
