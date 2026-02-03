type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Deep merge two objects. Arrays are replaced, not merged.
 * The override object takes precedence over the base object.
 * Designed for JSON-serializable config objects only.
 */
export function deepMerge<T extends PlainObject>(base: T, override: PlainObject): T {
  const result = { ...base } as PlainObject;

  for (const key of Object.keys(override)) {
    if (DANGEROUS_KEYS.has(key)) continue;

    const baseValue = result[key];
    const overrideValue = override[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }

  return result as T;
}
