import { Transform } from 'class-transformer';

export function ToNumber() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return value;
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  });
}

export function ToBoolean() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return value;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });
}

export function EmptyToUndefined() {
  return Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  );
}

export function JsonArray() {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  });
}
