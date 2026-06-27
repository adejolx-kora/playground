import { useCallback, useMemo } from "react";

import {
  applyQueryValues,
  defaultQueryStateOptions,
  readQueryValues,
  toSearchString,
  useQueryStateLocation,
  useQueryStateNavigate,
} from "@/lib/query-state";
import type {
  InferSchemaValues,
  QuerySchema,
  QueryStateOptions,
} from "@/lib/query-state";

type QuerySetterOptions = QueryStateOptions;

export const useQueryStates = <TSchema extends QuerySchema>(
  schema: TSchema,
  options?: QueryStateOptions,
) => {
  const location = useQueryStateLocation();
  const navigate = useQueryStateNavigate();

  const mergedOptions = useMemo(
    () => ({ ...defaultQueryStateOptions, ...options }),
    [options],
  );

  const values = useMemo(() => {
    const searchParams = new URLSearchParams(location.searchStr);
    return readQueryValues(searchParams, schema);
  }, [location.searchStr, schema]);

  const setValues = useCallback(
    (
      nextValues:
        | Partial<InferSchemaValues<TSchema>>
        | ((
            previousValues: InferSchemaValues<TSchema>,
          ) => Partial<InferSchemaValues<TSchema>>),
      setterOptions?: QuerySetterOptions,
    ) => {
      const localOptions = { ...mergedOptions, ...setterOptions };
      const searchParams = new URLSearchParams(location.searchStr);

      const resolvedValues =
        typeof nextValues === "function"
          ? nextValues(readQueryValues(searchParams, schema))
          : nextValues;

      applyQueryValues(searchParams, resolvedValues, schema, localOptions);

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
    [location, mergedOptions, navigate, schema],
  );

  return [values, setValues] as const;
};
