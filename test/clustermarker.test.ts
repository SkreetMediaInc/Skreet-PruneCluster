// test/ClusterMarker.test.ts
import ClusterMarker from '../src/ClusterMarker';
import { Position } from '../src/Position';
import { HashCodeCounter } from '../src/HashCodeCounter';
// @ts-ignore
import {beforeEach, describe, expect, it} from "bun:test";

describe('ClusterMarker', () => {
    let marker: ClusterMarker;

    beforeEach(() => {
        marker = new ClusterMarker(10, 20, { name: 'Test' }, 1, 2, false);
    });

    it('should initialize correctly', () => {
        expect(marker.position).toEqual({ lat: 10, lng: 20 });
        expect(marker.data).toEqual({ name: 'Test' });
        expect(marker.category).toBe(1);
        expect(marker.weight).toBe(2);
        expect(marker.filtered).toBe(false);
    });

    it('should generate a unique hash code on initialization', () => {
        const firstMarker = new ClusterMarker(0, 0);
        const secondMarker = new ClusterMarker(0, 0);
        expect(firstMarker.hashCode).not.toBe(secondMarker.hashCode);
    });

    it('should move to a new position', () => {
        marker.Move(30, 40);
        expect(marker.position).toEqual({ lat: 30, lng: 40 });
    });

    it('should update data correctly', () => {
        marker.SetData({ age: 25 });
        expect(marker.data).toEqual({ name: 'Test', age: 25 });
    });
});