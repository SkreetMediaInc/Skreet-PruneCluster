// tests/utils.test.ts
//@ts-ignore
import {expect, it, describe, beforeEach, afterEach, mock, jest} from "bun:test";

import {checkPositionInsideBounds, ComputeBounds, insertionSort, shouldUseInsertionSort} from '../src/utils';
import {Position} from '../src/Position';
import {Bounds} from '../src/Bounds';
import {IMarkerObject} from '../src/IMarkerObject';

describe('utils', () => {
    describe('checkPositionInsideBounds', () => {
        it('should return true if position is inside bounds', () => {
            const position: Position = {lat: 10, lng: 20};
            const bounds: Bounds = {minLat: 5, maxLat: 15, minLng: 15, maxLng: 25};
            expect(checkPositionInsideBounds(position, bounds)).toBe(true);
        });

        it('should return false if position is outside bounds', () => {
            const position: Position = {lat: 10, lng: 30};
            const bounds: Bounds = {minLat: 5, maxLat: 15, minLng: 15, maxLng: 25};
            expect(checkPositionInsideBounds(position, bounds)).toBe(false);
        });
    });

    describe('ComputeBounds', () => {
        it('should compute bounds for a list of markers', () => {
            const markers: IMarkerObject[] = [
                {
                    position: {lat: 10, lng: 20},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                },
                {
                    position: {lat: 15, lng: 25},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                },
                {
                    position: {lat: 5, lng: 15},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                }
            ];
            const bounds = ComputeBounds(markers);
            expect(bounds).toEqual({minLat: 5, maxLat: 15, minLng: 15, maxLng: 25});
        });

        it('should ignore filtered markers if withFiltered is false', () => {
            const markers: IMarkerObject[] = [
                {
                    position: {lat: 10, lng: 20},
                    filtered: true,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                },
                {
                    position: {lat: 15, lng: 25},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                },
                {
                    position: {lat: 5, lng: 15},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                }
            ];
            const bounds = ComputeBounds(markers, false);
            expect(bounds).toEqual({minLat: 5, maxLat: 15, minLng: 15, maxLng: 25});
        });

        it('should return null for an empty list', () => {
            const markers: IMarkerObject[] = [];
            const bounds = ComputeBounds(markers);
            expect(bounds).toBeNull();
        });
    });

    describe('insertionSort', () => {
        it('should sort a list of markers by longitude', () => {
            const markers: IMarkerObject[] = [
                {
                    position: {lat: 10, lng: 30},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                },
                {
                    position: {lat: 15, lng: 20},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                },
                {
                    position: {lat: 5, lng: 25},
                    filtered: false,
                    data: null,
                    hashCode: 0,
                    weight: 0,
                    category: 0,
                    _removeFlag: false
                }
            ];
            insertionSort(markers);
            expect(markers.map(marker => marker.position.lng)).toEqual([20, 25, 30]);
        });
    });

    describe('shouldUseInsertionSort', () => {
        it('should return true if changes are less than 20% of total', () => {
            expect(shouldUseInsertionSort(1000, 100)).toBe(true);
        });

        it('should return false if changes are more than 20% of total', () => {
            expect(shouldUseInsertionSort(1000, 300)).toBe(false);
        });

        it('should return false if changes are more than 300', () => {
            expect(shouldUseInsertionSort(1000, 301)).toBe(false);
        });
    });
});