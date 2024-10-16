// test/IClusterObject.test.ts
import { IMarkerObject } from '../src/IMarkerObject';
import { Position } from '../src/Position';
// @ts-ignore
import {describe, expect, it} from "bun:test";

describe('IClusterObject', () => {
    it('should conform to IClusterObject structure', () => {
        const obj: IMarkerObject = {
            position: { lat: 10, lng: 20 },
            data: { name: 'Test' },
            hashCode: 1,
            filtered: false,
            weight: 2,
            category: 1,
            _removeFlag: false,
        };

        expect(obj.position).toEqual({ lat: 10, lng: 20 });
        expect(obj.data).toEqual({ name: 'Test' });
        expect(obj.hashCode).toBe(1);
        expect(obj.filtered).toBe(false);
        expect(obj.weight).toBe(2);
        expect(obj.category).toBe(1);
        expect(obj._removeFlag).toBe(false);
    });
});