import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "@/lib/query-state";

import { useQueryState } from "./use-query-state";
import { useQueryStates } from "./use-query-states";

describe("query state hooks", () => {
  it("supports repeated query params through array parsers", async () => {
    window.history.replaceState(
      null,
      "",
      "/?tag=alpha&tag=beta&tag=gamma",
    );

    const { result } = renderHook(() =>
      useQueryState("tag", parseAsArrayOf(parseAsString)),
    );

    expect(result.current[0]).toEqual(["alpha", "beta", "gamma"]);

    await act(async () => {
      await result.current[1](["delta", "epsilon"]);
    });

    await waitFor(() => {
      expect(window.location.search).toBe("?tag=delta&tag=epsilon");
    });
  });

  it("avoids navigation work when the next query state matches the current URL", async () => {
    window.history.replaceState(null, "", "/?q=stable");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    const { result } = renderHook(() =>
      useQueryState("q", parseAsString.withDefault("")),
    );

    await act(async () => {
      await result.current[1]("stable");
    });

    expect(replaceStateSpy).not.toHaveBeenCalled();
    replaceStateSpy.mockRestore();
  });

  it("parses previous values only for functional single-value updates", async () => {
    window.history.replaceState(null, "", "/?page=2");

    const pageParser = {
      ...parseAsInteger,
      parse: vi.fn(parseAsInteger.parse),
    };

    const { result } = renderHook(() => useQueryState("page", pageParser));

    const initialParseCallCount = pageParser.parse.mock.calls.length;

    await act(async () => {
      await result.current[1](3);
    });

    expect(pageParser.parse.mock.calls.length).toBe(initialParseCallCount + 1);

    await act(async () => {
      await result.current[1]((previousValue) => (previousValue ?? 0) + 1);
    });

    expect(pageParser.parse.mock.calls.length).toBeGreaterThan(
      initialParseCallCount + 1,
    );
  });

  it("parses previous values only for functional schema updates", async () => {
    window.history.replaceState(null, "", "/?page=2&filter=recent");

    const pageParser = {
      ...parseAsInteger,
      parse: vi.fn(parseAsInteger.parse),
    };

    const schema = {
      page: pageParser,
      filter: parseAsString,
    };

    const { result } = renderHook(() => useQueryStates(schema));

    const initialParseCallCount = pageParser.parse.mock.calls.length;

    await act(async () => {
      await result.current[1]({
        filter: "archived",
      });
    });

    expect(pageParser.parse.mock.calls.length).toBe(initialParseCallCount + 1);

    await act(async () => {
      await result.current[1]((previousValues) => ({
        page: (previousValues.page ?? 0) + 1,
      }));
    });

    expect(pageParser.parse.mock.calls.length).toBeGreaterThan(
      initialParseCallCount + 1,
    );
  });
});
