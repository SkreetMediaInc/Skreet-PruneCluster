// test/HashCodeCounter.test.ts
import { HashCodeCounter, MaxHashCodeValue } from '../src/HashCodeCounter';
// @ts-ignore
import {describe, expect, it, beforeEach} from "bun:test";

describe('HashCodeCounter', () => {
    beforeEach(() => {
        (HashCodeCounter as any).hashCodeCounter = 1; // Reset the counter before each test
    });

    it('should return a unique hash code each time', () => {
        const firstHash = HashCodeCounter.getHashCode();
        const secondHash = HashCodeCounter.getHashCode();

        expect(firstHash).toBe(1);
        expect(secondHash).toBe(2);
    });

    it('should reset the counter when reaching the maximum value', () => {
        // Set the counter close to the max value
        (HashCodeCounter as any).hashCodeCounter = MaxHashCodeValue;

        const maxHash = HashCodeCounter.getHashCode();
        const resetHash = HashCodeCounter.getHashCode();

        expect(maxHash).toBe(MaxHashCodeValue);
        expect(resetHash).toBe(1);
    });
});