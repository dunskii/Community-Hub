import { describe, it, expect } from 'vitest';

import { deepMerge } from '../config/deep-merge.js';

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3, c: 4 };
    expect(deepMerge(base, override)).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should deep merge nested objects', () => {
    const base = { outer: { a: 1, b: 2 } };
    const override = { outer: { b: 3 } };
    expect(deepMerge(base, override)).toEqual({ outer: { a: 1, b: 3 } });
  });

  it('should replace arrays (not merge them)', () => {
    const base = { tags: ['a', 'b'] };
    const override = { tags: ['c'] };
    expect(deepMerge(base, override)).toEqual({ tags: ['c'] });
  });

  it('should not modify the base object', () => {
    const base = { a: { b: 1 } };
    const override = { a: { b: 2 } };
    deepMerge(base, override);
    expect(base.a.b).toBe(1);
  });

  it('should handle deeply nested overrides', () => {
    const base = { l1: { l2: { l3: { value: 'original' } } } };
    const override = { l1: { l2: { l3: { value: 'changed' } } } };
    expect(deepMerge(base, override)).toEqual({
      l1: { l2: { l3: { value: 'changed' } } },
    });
  });

  it('should handle empty override', () => {
    const base = { a: 1 };
    expect(deepMerge(base, {})).toEqual({ a: 1 });
  });

  it('should correctly merge platform config overrides', () => {
    const base = {
      platform: { id: 'test', version: '1.0.0' },
      limits: { maxBusinessPhotos: 50, maxPhotoSizeMb: 5 },
    };
    const override = {
      platform: { id: 'test-dev' },
      limits: { maxBusinessPhotos: 10 },
    };
    expect(deepMerge(base, override)).toEqual({
      platform: { id: 'test-dev', version: '1.0.0' },
      limits: { maxBusinessPhotos: 10, maxPhotoSizeMb: 5 },
    });
  });

  it('should handle null values in override', () => {
    const base = { a: 1, b: { c: 2 } };
    const override = { a: null, b: { c: null } };
    expect(deepMerge(base, override)).toEqual({ a: null, b: { c: null } });
  });

  it('should handle undefined values in override', () => {
    const base = { a: 1, b: 2 };
    const override = { a: undefined };
    expect(deepMerge(base, override)).toEqual({ a: undefined, b: 2 });
  });

  it('should skip __proto__ keys (prototype pollution protection)', () => {
    const base = { a: 1 };
    const override = JSON.parse('{"__proto__": {"polluted": true}, "b": 2}') as Record<
      string,
      unknown
    >;
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });

  it('should skip constructor keys (prototype pollution protection)', () => {
    const base = { a: 1 };
    const override = { constructor: { polluted: true }, b: 2 } as Record<string, unknown>;
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toHaveProperty('constructor', { polluted: true });
  });

  it('should skip prototype keys (prototype pollution protection)', () => {
    const base = { a: 1 };
    const override = { prototype: { polluted: true }, b: 2 } as Record<string, unknown>;
    const result = deepMerge(base, override);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toHaveProperty('prototype', { polluted: true });
  });

  it('should skip nested __proto__ keys (prototype pollution protection)', () => {
    const base = { outer: { a: 1 } };
    const override = JSON.parse('{"outer": {"__proto__": {"polluted": true}, "b": 2}}') as Record<
      string,
      unknown
    >;
    const result = deepMerge(base, override);
    expect(result).toEqual({ outer: { a: 1, b: 2 } });
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });
});
