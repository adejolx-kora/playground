import { useRouter, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import {
  type InferSchemaValues,
  type QuerySchema,
  type QueryStateOptions,
} from "@/lib/query-state";

type QuerySetterOptions = QueryStateOptions;

const defaultOptions: Required<QueryStateOptions> = {
  history: "replace",
  clearOnDefault: true,
};

const isNullish = (value: unknown) => value === null || value === undefined;

const readValue = <
  TSchema extends QuerySchema,
  TKey extends keyof TSchema & string,
>(
  searchParams: URLSearchParams,
  key: TKey,
  schema: TSchema,
): InferSchemaValues<TSchema>[TKey] => {
  const parser = schema[key];
  const parsed = parser.parse(searchParams.get(key));

  if (isNullish(parsed) && !isNullish(parser.defaultValue)) {
    return parser.defaultValue as InferSchemaValues<TSchema>[TKey];
  }

  return parsed as InferSchemaValues<TSchema>[TKey];
};

export const useQueryStates = <TSchema extends QuerySchema>(
  schema: TSchema,
  options?: QueryStateOptions,
) => {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });

  const mergedOptions = useMemo(
    () => ({ ...defaultOptions, ...options }),
    [options],
  );

  const values = useMemo(() => {
    const searchParams = new URLSearchParams(location.searchStr);

    return Object.keys(schema).reduce((acc, key) => {
      const typedKey = key as keyof TSchema & string;
      acc[typedKey] = readValue(searchParams, typedKey, schema);
      return acc;
    }, {} as InferSchemaValues<TSchema>);
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
      const searchParams = new URLSearchParams(router.state.location.searchStr);

      const previousValues = Object.keys(schema).reduce((acc, key) => {
        const typedKey = key as keyof TSchema & string;
        acc[typedKey] = readValue(searchParams, typedKey, schema);
        return acc;
      }, {} as InferSchemaValues<TSchema>);

      const resolvedValues =
        typeof nextValues === "function"
          ? nextValues(previousValues)
          : nextValues;

      for (const [key, nextValue] of Object.entries(resolvedValues)) {
        if (!(key in schema)) continue;

        const parser = schema[key as keyof TSchema & string];
        const isDefaultValue =
          !isNullish(parser.defaultValue) &&
          !isNullish(nextValue) &&
          (parser.eq ?? Object.is)(nextValue, parser.defaultValue);

        if (
          isNullish(nextValue) ||
          (localOptions.clearOnDefault && isDefaultValue)
        ) {
          searchParams.delete(key);
          continue;
        }

        const serialized = parser.serialize(nextValue);

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
    [mergedOptions, router, schema],
  );

  return [values, setValues] as const;
};
