import type React from "react";

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  defaultQueryStateOptions,
  QueryStateProvider,
  useQueryStateLocation,
  useQueryStateNavigate,
} from "@/lib/query-state";

describe("query-state context", () => {
  it("does not subscribe to browser events when a provider controls location", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryStateProvider
        location={{
          pathname: "/dashboard",
          searchStr: "?tag=alpha&tag=beta",
          hash: "#panel",
        }}
        navigate={vi.fn()}
      >
        {children}
      </QueryStateProvider>
    );

    const { result } = renderHook(() => useQueryStateLocation(), {
      wrapper,
    });

    expect(result.current).toEqual({
      pathname: "/dashboard",
      searchStr: "?tag=alpha&tag=beta",
      hash: "#panel",
    });

    const subscribedEvents = addEventListenerSpy.mock.calls.map(
      ([eventName]) => eventName,
    );

    expect(subscribedEvents).not.toContain("popstate");
    expect(subscribedEvents).not.toContain("hashchange");

    addEventListenerSpy.mockRestore();
  });

  it("updates browser history and subscribers after query-state navigation", async () => {
    window.history.replaceState(null, "", "/reports?page=1#summary");

    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => ({
      location: useQueryStateLocation(),
      navigate: useQueryStateNavigate(),
    }));

    await act(async () => {
      await result.current.navigate(
        {
          pathname: "/reports",
          searchStr: "page=2",
          hash: "#summary",
        },
        defaultQueryStateOptions,
      );
    });

    expect(replaceStateSpy).toHaveBeenCalledOnce();

    await waitFor(() => {
      expect(result.current.location).toEqual({
        pathname: "/reports",
        searchStr: "?page=2",
        hash: "#summary",
      });
    });

    replaceStateSpy.mockRestore();
  });

  it("does not notify subscribers when navigation keeps the same URL", async () => {
    window.history.replaceState(null, "", "/reports?page=2#summary");

    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => ({
      location: useQueryStateLocation(),
      navigate: useQueryStateNavigate(),
    }));

    await act(async () => {
      await result.current.navigate(
        {
          pathname: "/reports",
          searchStr: "?page=2",
          hash: "#summary",
        },
        defaultQueryStateOptions,
      );
    });

    expect(replaceStateSpy).not.toHaveBeenCalled();
    expect(result.current.location).toEqual({
      pathname: "/reports",
      searchStr: "?page=2",
      hash: "#summary",
    });

    replaceStateSpy.mockRestore();
  });

  it("reacts to popstate and hashchange in browser fallback mode", async () => {
    window.history.replaceState(null, "", "/reports?page=2#summary");

    const { result } = renderHook(() => useQueryStateLocation());

    window.history.pushState(null, "", "/reports?page=3#details");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        pathname: "/reports",
        searchStr: "?page=3",
        hash: "#details",
      });
    });

    window.location.hash = "#print";
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        pathname: "/reports",
        searchStr: "?page=3",
        hash: "#print",
      });
    });
  });

  it("removes native browser listeners when the last subscriber unsubscribes", () => {
    window.history.replaceState(null, "", "/");

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const first = renderHook(() => useQueryStateLocation());
    const second = renderHook(() => useQueryStateLocation());

    expect(
      addEventListenerSpy.mock.calls.filter(
        ([eventName]) => eventName === "popstate" || eventName === "hashchange",
      ),
    ).toHaveLength(2);

    first.unmount();

    expect(
      removeEventListenerSpy.mock.calls.filter(
        ([eventName]) => eventName === "popstate" || eventName === "hashchange",
      ),
    ).toHaveLength(0);

    second.unmount();

    expect(
      removeEventListenerSpy.mock.calls.filter(
        ([eventName]) => eventName === "popstate" || eventName === "hashchange",
      ),
    ).toHaveLength(2);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
