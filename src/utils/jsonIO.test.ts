import { describe, it, expect } from 'vitest';
import { validateAndParseState } from './jsonIO';

describe('validateAndParseState', () => {
  const validState = {
    schemaVersion: 1,
    students: [],
    classes: [],
    sortingConfig: { numberOfClasses: 3 },
    sourceClasses: [],
  };

  it('accepts a valid state object', () => {
    const result = validateAndParseState(validState);
    expect(result.schemaVersion).toBe(1);
    expect(result.students).toEqual([]);
    expect(result.classes).toEqual([]);
  });

  it('throws for null input', () => {
    expect(() => validateAndParseState(null)).toThrow('not a JSON object');
  });

  it('throws for non-object input', () => {
    expect(() => validateAndParseState('string')).toThrow('not a JSON object');
    expect(() => validateAndParseState(42)).toThrow('not a JSON object');
  });

  it('throws for wrong schema version', () => {
    expect(() => validateAndParseState({ ...validState, schemaVersion: 2 })).toThrow('schema version');
  });

  it('throws when students is missing', () => {
    const { students: _s, ...rest } = validState;
    expect(() => validateAndParseState(rest)).toThrow('missing students');
  });

  it('throws when classes is missing', () => {
    const { classes: _c, ...rest } = validState;
    expect(() => validateAndParseState(rest)).toThrow('missing classes');
  });

  it('throws when sortingConfig is missing', () => {
    const { sortingConfig: _sc, ...rest } = validState;
    expect(() => validateAndParseState(rest)).toThrow('missing sortingConfig');
  });

  it('defaults sourceClasses to empty array when missing', () => {
    const { sourceClasses: _sc, ...rest } = validState;
    const result = validateAndParseState(rest);
    expect(result.sourceClasses).toEqual([]);
  });
});
