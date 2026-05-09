import { useRouter, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import {
  parseAsString,
  type QueryParser,
  type QueryStateOptions,
} from "@/lib/query-state";

type QuerySetterOptions = QueryStateOptions;

const defaultOptions: Required<QueryStateOptions> = {
  history: "replace",
  clearOnDefault: true,
};

const isNullish = (value: unknown) => value === null || value === undefined;

const readValue = <T>(
  searchParams: URLSearchParams,
  key: string,
  parser: QueryParser<T>,
) => {
  const parsed = parser.parse(searchParams.get(key));

  if (isNullish(parsed) && !isNullish(parser.defaultValue)) {
    return parser.defaultValue;
  }

  return parsed;
};

export const useQueryState = <T>(
  key: string,
  parser: QueryParser<T> = parseAsString as QueryParser<T>,
  options?: QueryStateOptions,
) => {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });

  const mergedOptions = useMemo(
    () => ({ ...defaultOptions, ...options }),
    [options],
  );

  const value = useMemo(() => {
    const searchParams = new URLSearchParams(location.searchStr);
    return readValue(searchParams, key, parser);
  }, [key, parser, location.searchStr]);

  const setValue = useCallback(
    (
      nextValue: T | null | ((previousValue: T | null) => T | null),
      setterOptions?: QuerySetterOptions,
    ) => {
      const localOptions = { ...mergedOptions, ...setterOptions };
      const searchParams = new URLSearchParams(router.state.location.searchStr);
      const currentValue = readValue(searchParams, key, parser);

      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (previousValue: T | null) => T | null)(currentValue)
          : nextValue;

      const isDefaultValue =
        !isNullish(parser.defaultValue) &&
        !isNullish(resolvedValue) &&
        (parser.eq ?? Object.is)(resolvedValue, parser.defaultValue);

      if (
        isNullish(resolvedValue) ||
        (localOptions.clearOnDefault && isDefaultValue)
      ) {
        searchParams.delete(key);
      } else {
        const serialized = parser.serialize(resolvedValue);

        if (serialized === null) {
          searchParams.delete(key);
        } else {
          searchParams.set(key, serialized);
        }
      }

      const nextSearch = Object.fromEntries(searchParams.entries());

      void router.navigate({
        to: router.state.location.pathname,
        hash: router.state.location.hash,
        search: nextSearch,
        replace: localOptions.history === "replace",
      });
    },
    [key, mergedOptions, parser, router],
  );

  return [value, setValue] as const;
};
