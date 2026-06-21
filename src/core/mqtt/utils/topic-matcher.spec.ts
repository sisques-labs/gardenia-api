import { topicMatches } from './topic-matcher';

describe('topicMatches', () => {
  it('matches identical topics', () => {
    expect(
      topicMatches('gardenia/s1/plant/p1/state', 'gardenia/s1/plant/p1/state'),
    ).toBe(true);
  });

  it('matches a single-level "+" wildcard', () => {
    expect(
      topicMatches('gardenia/s1/plant/+/set', 'gardenia/s1/plant/p1/set'),
    ).toBe(true);
  });

  it('rejects when a "+" segment spans the wrong depth', () => {
    expect(topicMatches('gardenia/+/set', 'gardenia/s1/plant/set')).toBe(false);
  });

  it('matches a trailing "#" wildcard across multiple levels', () => {
    expect(topicMatches('gardenia/s1/#', 'gardenia/s1/plant/p1/state')).toBe(
      true,
    );
  });

  it('matches "#" against zero remaining levels', () => {
    expect(topicMatches('gardenia/s1/#', 'gardenia/s1')).toBe(true);
  });

  it('rejects different fixed segments', () => {
    expect(topicMatches('gardenia/s1/plant', 'gardenia/s2/plant')).toBe(false);
  });

  it('rejects when topic is shorter than the filter', () => {
    expect(topicMatches('gardenia/s1/plant/p1', 'gardenia/s1/plant')).toBe(
      false,
    );
  });
});
