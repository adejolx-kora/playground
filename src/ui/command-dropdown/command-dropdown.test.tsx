import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  CommandDropdownContent,
  CommandDropdownEmpty,
  CommandDropdownInput,
  CommandDropdownItem,
  CommandDropdownList,
  CommandDropdownRoot,
  CommandDropdownTrigger,
  CommandDropdownValue,
} from "./index";

const items = [
  { label: "First Bank", value: "first-bank" },
  { label: "Access Bank", value: "access-bank" },
  { label: "GTB", value: "gtb" },
];

describe("CommandDropdown", () => {
  it("shows every item for an empty search and only matches while typing", async () => {
    const user = userEvent.setup();

    render(
      <>
        <label htmlFor="bank">Bank</label>
        <CommandDropdownRoot items={items} value={null} onValueChange={vi.fn()}>
          <CommandDropdownTrigger id="bank">
            <CommandDropdownValue placeholder="Select bank" />
          </CommandDropdownTrigger>
          <CommandDropdownContent>
            <CommandDropdownInput
              placeholder="Search banks"
              aria-label="Search banks"
            />
            <CommandDropdownEmpty>No banks found.</CommandDropdownEmpty>
            <CommandDropdownList>
              {(item: (typeof items)[number]) => (
                <CommandDropdownItem key={item.value} value={item}>
                  {item.label}
                </CommandDropdownItem>
              )}
            </CommandDropdownList>
          </CommandDropdownContent>
        </CommandDropdownRoot>
      </>,
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Bank" }));

    expect(await screen.findAllByRole("option")).toHaveLength(3);

    const searchInput = screen.getByRole("combobox", { name: "Search banks" });
    await user.type(searchInput, "acc");

    expect(screen.getByRole("option", { name: "Access Bank" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "First Bank" })).toBeNull();
    expect(screen.queryByRole("option", { name: "GTB" })).toBeNull();

    await user.clear(searchInput);

    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.type(searchInput, "missing");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No banks found.")).toBeDefined();
  });
});
