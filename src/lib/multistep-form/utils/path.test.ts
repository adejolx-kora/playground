import { describe, expect, it } from "vitest";

import {
  getByPath,
  pathToParts,
  setByPathImmutable,
  setManyByPathImmutable,
} from "./path";

describe("path utils", () => {
  it("supports nested dot paths", () => {
    expect(getByPath({ profile: { name: "Ada" } }, "profile.name")).toBe("Ada");
  });

  it("supports bracket array paths", () => {
    expect(getByPath({ items: [{ name: "Ada" }] }, "items[0].name")).toBe("Ada");
    expect(getByPath({ items: [{ name: "Ada" }] }, "items.0.name")).toBe("Ada");
    expect(getByPath({ profile: { name: "Ada" } }, "profile['name']")).toBe("Ada");
  });

  it("preserves unrelated branches when setting immutably", () => {
    const source = {
      profile: { name: "Ada", role: "Engineer" },
      settings: { theme: "light" },
    };
    const next = setByPathImmutable(source, "profile.name", "Grace");

    expect(next).toEqual({
      profile: { name: "Grace", role: "Engineer" },
      settings: { theme: "light" },
    });
    expect(next.settings).toBe(source.settings);
    expect(next.profile).not.toBe(source.profile);
  });

  it("updates many paths in one pass", () => {
    const next = setManyByPathImmutable(
      {
        profile: { name: "", email: "" },
      },
      [
        { path: "profile.name", value: true },
        { path: "profile.email", value: true },
      ],
    );

    expect(next).toEqual({
      profile: {
        name: true,
        email: true,
      },
    });
  });

  it("keeps the path cache bounded", () => {
    const first = pathToParts("field.0");

    for (let index = 0; index < 250; index += 1) {
      pathToParts(`field.${index + 1}`);
    }

    expect(pathToParts("field.0")).not.toBe(first);
  });
});
