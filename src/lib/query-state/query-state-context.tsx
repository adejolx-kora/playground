import { createContext, useContext, useSyncExternalStore } from "react";

import { toQueryLocationHref } from "./query-state";
import type {
  QueryLocation,
  QueryNavigation,
  QueryStateContextValue,
} from "./query-state-types";

export const QueryStateContext = createContext<QueryStateContextValue | null>(
  null,
);

const getServerLocation = (): QueryLocation => ({
  pathname: "/",
  searchStr: "",
  hash: "",
});

const getWindowLocation = (): QueryLocation => ({
  pathname: window.location.pathname,
  searchStr: window.location.search,
  hash: window.location.hash,
});

const createBrowserLocationStore = () => {
  const subscribers = new Set<() => void>();
  let cachedHref: string | null = null;
  let cachedLocation: QueryLocation | null = null;

  const getSnapshot = (): QueryLocation => {
    if (typeof window === "undefined") {
      return getServerLocation();
    }

    const href = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (cachedHref === href && cachedLocation !== null) {
      return cachedLocation;
    }

    cachedHref = href;
    cachedLocation = getWindowLocation();
    return cachedLocation;
  };

  const emit = () => {
    for (const callback of subscribers) {
      callback();
    }
  };

  const handleBrowserEvent = () => {
    emit();
  };

  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    if (subscribers.size === 0) {
      window.addEventListener("popstate", handleBrowserEvent);
      window.addEventListener("hashchange", handleBrowserEvent);
    }

    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);

      if (subscribers.size === 0) {
        window.removeEventListener("popstate", handleBrowserEvent);
        window.removeEventListener("hashchange", handleBrowserEvent);
      }
    };
  };

  const navigate: QueryNavigation = (nextLocation, options) => {
    if (typeof window === "undefined") {
      return;
    }

    // Browser fallback mode tracks query-state navigation plus native
    // `popstate` / `hashchange` events. Apps that need to observe arbitrary
    // router-driven history writes should provide location and navigate via
    // QueryStateProvider instead of relying on the fallback store.
    const nextUrl = toQueryLocationHref(nextLocation);
    const currentUrl = toQueryLocationHref(getWindowLocation());

    if (nextUrl === currentUrl) {
      return;
    }

    const historyMethod =
      options.history === "replace" ? "replaceState" : "pushState";

    window.history[historyMethod](window.history.state, "", nextUrl);
    emit();
  };

  return {
    getSnapshot,
    navigate,
    subscribe,
  };
};

const browserLocationStore = createBrowserLocationStore();

const subscribeToProvidedLocation = () => () => undefined;

export const useQueryStateLocation = () => {
  const context = useContext(QueryStateContext);
  const isProviderControlled = context !== null;

  return useSyncExternalStore(
    isProviderControlled
      ? subscribeToProvidedLocation
      : browserLocationStore.subscribe,
    () =>
      isProviderControlled
        ? context.location
        : browserLocationStore.getSnapshot(),
    () =>
      isProviderControlled
        ? context.location
        : getServerLocation(),
  );
};

export const useQueryStateNavigate = () => {
  const context = useContext(QueryStateContext);
  return context?.navigate ?? browserLocationStore.navigate;
};
