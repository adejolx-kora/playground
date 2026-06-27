import { useCallback, useMemo } from "react";

import {
  defaultQueryStateOptions,
  parseAsString,
  readQueryValue,
  toSearchString,
  useQueryStateLocation,
  useQueryStateNavigate,
  writeQueryValue,
} from "@/lib/query-state";
import type { QueryParser, QueryStateOptions } from "@/lib/query-state";

type QuerySetterOptions = QueryStateOptions;

export const useQueryState = <T>(
  key: string,
  parser: QueryParser<T> = parseAsString as QueryParser<T>,
  options?: QueryStateOptions,
) => {
  const location = useQueryStateLocation();
  const navigate = useQueryStateNavigate();

  const mergedOptions = useMemo(
    () => ({ ...defaultQueryStateOptions, ...options }),
    [options],
  );

  const value = useMemo(() => {
    const searchParams = new URLSearchParams(location.searchStr);
    return readQueryValue(searchParams, key, parser);
  }, [key, location.searchStr, parser]);

  const setValue = useCallback(
    (
      nextValue: T | null | ((previousValue: T | null) => T | null),
      setterOptions?: QuerySetterOptions,
    ) => {
      const localOptions = { ...mergedOptions, ...setterOptions };
      const searchParams = new URLSearchParams(location.searchStr);

      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (previousValue: T | null) => T | null)(
              readQueryValue(searchParams, key, parser),
            )
          : nextValue;

      writeQueryValue(searchParams, key, resolvedValue, parser, localOptions);

      const nextSearchStr = toSearchString(searchParams);

      if (nextSearchStr === location.searchStr) {
        return;
      }

      void navigate(
        {
          pathname: location.pathname,
          searchStr: nextSearchStr,
          hash: location.hash,
        },
        localOptions,
      );
    },
    [key, location, mergedOptions, navigate, parser],
  );

  return [value, setValue] as const;
};
