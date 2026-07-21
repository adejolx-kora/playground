export function formatDateInputValue(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB").format(date);
}

export function parseDateInputValue(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isValid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  return isValid ? date : undefined;
}

export function datesMatch(left: Date | undefined, right: Date | undefined) {
  return left?.getTime() === right?.getTime();
}
