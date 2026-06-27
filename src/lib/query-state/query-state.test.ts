import { describe, expect, it, vi } from "vitest";

import {
  applyQueryValues,
  defaultQueryStateOptions,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  readQueryValue,
  toQueryLocationHref,
  writeQueryValue,
} from "@/lib/query-state";

describe("query-state utilities", () => {
  it("uses parser defaults only when a query param is missing", () => {
    const invalidSearchParams = new URLSearchParams("page=not-a-number");
    const missingSearchParams = new URLSearchParams("");

    expect(
      readQueryValue(
        invalidSearchParams,
        "page",
        parseAsInteger.withDefault(1),
      ),
    ).toBeNull();

    expect(
      readQueryValue(
        missingSearchParams,
        "page",
        parseAsInteger.withDefault(1),
      ),
    ).toBe(1);
  });

  it("updates only the schema keys that are explicitly provided", () => {
    const touchedParser = {
      ...parseAsString,
      serialize: vi.fn(parseAsString.serialize),
    };
    const untouchedParser = {
      ...parseAsString,
      serialize: vi.fn(parseAsString.serialize),
    };
    const schema = {
      filter: touchedParser,
      sort: untouchedParser,
    };
    const searchParams = new URLSearchParams("sort=desc");

    applyQueryValues(
      searchParams,
      {
        filter: "recent",
      },
      schema,
      defaultQueryStateOptions,
    );

    expect(touchedParser.serialize).toHaveBeenCalledTimes(1);
    expect(untouchedParser.serialize).not.toHaveBeenCalled();
    expect(searchParams.toString()).toBe("sort=desc&filter=recent");
  });

  it("parses integers only from complete safe integer strings", () => {
    expect(parseAsInteger.parse(["12"])).toBe(12);
    expect(parseAsInteger.parse(["-12"])).toBe(-12);
    expect(parseAsInteger.parse(["12abc"])).toBeNull();
    expect(parseAsInteger.parse(["1.5"])).toBeNull();
    expect(parseAsInteger.parse([""])).toBeNull();
    expect(parseAsInteger.parse(["9007199254740992"])).toBeNull();
  });

  it("parses floats only from complete finite numeric strings", () => {
    expect(parseAsFloat.parse(["12"])).toBe(12);
    expect(parseAsFloat.parse(["12.5"])).toBe(12.5);
    expect(parseAsFloat.parse(["-12.5"])).toBe(-12.5);
    expect(parseAsFloat.parse(["1e3"])).toBe(1000);
    expect(parseAsFloat.parse(["12abc"])).toBeNull();
    expect(parseAsFloat.parse([""])).toBeNull();
    expect(parseAsFloat.parse(["Infinity"])).toBeNull();
    expect(parseAsFloat.parse(["-Infinity"])).toBeNull();
    expect(parseAsFloat.parse(["NaN"])).toBeNull();
  });

  it("uses repeated query params for array parsing and serialization", () => {
    const parser = parseAsArrayOf(parseAsString);

    expect(parser.parse(["alpha", "beta"])).toEqual(["alpha", "beta"]);
    expect(parser.serialize(["alpha", "beta"])).toEqual(["alpha", "beta"]);
    expect(parser.parse(["alpha", ""])).toEqual(["alpha", ""]);
    expect(parser.serialize([])).toBeNull();
  });

  it("returns null for array parsing when any repeated value is invalid", () => {
    const parser = parseAsArrayOf(parseAsInteger);

    expect(parser.parse(["1", "oops"])).toBeNull();
  });

  it("removes default values only when clearOnDefault is enabled", () => {
    const parser = parseAsInteger.withDefault(1);
    const clearSearchParams = new URLSearchParams("page=1");
    const keepSearchParams = new URLSearchParams("page=1");

    writeQueryValue(clearSearchParams, "page", 1, parser, {
      ...defaultQueryStateOptions,
      clearOnDefault: true,
    });
    writeQueryValue(keepSearchParams, "page", 1, parser, {
      ...defaultQueryStateOptions,
      clearOnDefault: false,
    });

    expect(clearSearchParams.toString()).toBe("");
    expect(keepSearchParams.toString()).toBe("page=1");
  });

  it("formats query location hrefs consistently", () => {
    expect(
      toQueryLocationHref({
        pathname: "/dashboard",
        searchStr: "page=1",
        hash: "#top",
      }),
    ).toBe("/dashboard?page=1#top");

    expect(
      toQueryLocationHref({
        pathname: "/dashboard",
        searchStr: "?page=1",
        hash: "#top",
      }),
    ).toBe("/dashboard?page=1#top");

    expect(
      toQueryLocationHref({
        pathname: "/dashboard",
        searchStr: "",
        hash: "#top",
      }),
    ).toBe("/dashboard#top");
  });
});
