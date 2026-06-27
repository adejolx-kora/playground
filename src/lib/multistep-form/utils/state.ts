const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const hasFieldError = (error: unknown): boolean => {
  if (error === null || error === undefined || error === false) {
    return false;
  }

  if (typeof error === "string") {
    return error.trim().length > 0;
  }

  if (Array.isArray(error)) {
    return error.some(hasFieldError);
  }

  if (isObject(error)) {
    return Object.values(error).some(hasFieldError);
  }

  return true;
};
