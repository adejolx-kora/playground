const isArrayIndex = (value: string) => /^\d+$/.test(value);
const pathPartsCache = new Map<string, readonly string[]>();
const MAX_CACHED_PATH_PARTS = 200;

export const pathToParts = (path: string) => {
  const cached = pathPartsCache.get(path);

  if (cached) {
    return cached;
  }

  const parts = path
    .replace(/\[['"]?([^'"\]]+)['"]?\]/g, ".$1")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  if (pathPartsCache.size >= MAX_CACHED_PATH_PARTS) {
    const oldestPath = pathPartsCache.keys().next().value;

    if (oldestPath) {
      pathPartsCache.delete(oldestPath);
    }
  }

  pathPartsCache.set(path, parts);
  return parts;
};

export const getByPath = (value: unknown, path: string) => {
  const parts = pathToParts(path);
  let current = value;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      if (!isArrayIndex(part)) return undefined;
      current = current[Number(part)];
      continue;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

export const setByPath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
) => {
  const parts = pathToParts(path);

  if (parts.length === 0) {
    return target;
  }

  let current: Record<string | number, unknown> | unknown[] = target;

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    const key =
      Array.isArray(current) && isArrayIndex(part) ? Number(part) : part;

    if (isLast) {
      (current as Record<string | number, unknown>)[key] = value;
      return;
    }

    const nextPart = parts[index + 1];
    const nextShouldBeArray = isArrayIndex(nextPart);
    const container = current as Record<string | number, unknown>;
    const existing = container[key];

    if (
      existing === null ||
      existing === undefined ||
      typeof existing !== "object"
    ) {
      container[key] = nextShouldBeArray ? [] : {};
    }

    current = container[key] as Record<string | number, unknown> | unknown[];
  });

  return target;
};

const cloneContainer = (value: unknown) => {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (value !== null && typeof value === "object") {
    return { ...value };
  }

  return {};
};

export const setByPathImmutable = (
  source: Record<string, unknown> | undefined,
  path: string,
  value: unknown,
) => {
  const parts = pathToParts(path);

  if (parts.length === 0) {
    return source ?? {};
  }

  const root = cloneContainer(source) as Record<string | number, unknown>;
  let currentSource: unknown = source;
  let currentTarget = root;

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    const isLast = index === parts.length - 1;
    const key =
      Array.isArray(currentTarget) && isArrayIndex(part) ? Number(part) : part;

    if (isLast) {
      currentTarget[key] = value;
      return root as Record<string, unknown>;
    }

    const nextPart = parts[index + 1];
    const nextSource =
      currentSource !== null && typeof currentSource === "object"
        ? (currentSource as Record<string | number, unknown>)[key]
        : undefined;

    const fallbackContainer = isArrayIndex(nextPart) ? [] : {};
    currentTarget[key] = cloneContainer(nextSource ?? fallbackContainer);
    currentTarget = currentTarget[key] as Record<string | number, unknown>;
    currentSource = nextSource;
  }

  return root as Record<string, unknown>;
};

export const setManyByPathImmutable = (
  source: Record<string, unknown> | undefined,
  entries: readonly { path: string; value: unknown }[],
) => {
  if (entries.length === 0) {
    return source ?? {};
  }

  const root = cloneContainer(source) as Record<string | number, unknown>;

  for (const entry of entries) {
    const parts = pathToParts(entry.path);

    if (parts.length === 0) {
      continue;
    }

    let currentSource: unknown = source;
    let currentTarget = root;

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const isLast = index === parts.length - 1;
      const key =
        Array.isArray(currentTarget) && isArrayIndex(part) ? Number(part) : part;

      if (isLast) {
        currentTarget[key] = entry.value;
        break;
      }

      const nextPart = parts[index + 1];
      const nextSource =
        currentSource !== null && typeof currentSource === "object"
          ? (currentSource as Record<string | number, unknown>)[key]
          : undefined;
      const existingTarget = currentTarget[key];
      const nextTarget =
        existingTarget !== null &&
        typeof existingTarget === "object" &&
        existingTarget !== nextSource
          ? existingTarget
          : cloneContainer(nextSource ?? (isArrayIndex(nextPart) ? [] : {}));

      currentTarget[key] = nextTarget;
      currentTarget = nextTarget as Record<string | number, unknown>;
      currentSource = nextSource;
    }
  }

  return root as Record<string, unknown>;
};
