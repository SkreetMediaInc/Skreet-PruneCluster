import {Position} from "./Position";
import {Bounds} from "./Bounds";
import {IMarkerObject} from "./IMarkerObject.ts";
import {HasPosition} from "./HasPosition";


/**
 * Checks if a given position is inside the specified bounds.
 *
 * This function determines whether a given position (latitude and longitude)
 * falls within the specified geographical bounds. It is useful for spatial
 * queries, such as determining if a marker is within a certain area on a map.
 *
 * @param {Position} a - The position to check, containing latitude and longitude.
 * @param {Bounds} b - The bounds within which to check the position. The bounds
 *                     are defined by minimum and maximum latitudes and longitudes.
 * @returns {boolean} - Returns true if the position is within the bounds, false otherwise.
 *
 * @example
 * const position = { lat: 40.7128, lng: -74.0060 }; // New York City
 * const bounds = { minLat: 40.0, maxLat: 41.0, minLng: -75.0, maxLng: -73.0 };
 * const isInside = checkPositionInsideBounds(position, bounds);
 * console.log(isInside); // Output: true
 */
export function checkPositionInsideBounds(a: Position, b: Bounds): boolean {
    return (a.lat >= b.minLat && a.lat <= b.maxLat) &&
        (a.lng >= b.minLng && a.lng <= b.maxLng);
}

/**
 * Computes the geographical bounds of a given array of markers.
 *
 * This function calculates the minimum and maximum latitudes and longitudes
 * that encompass all the provided markers. It is useful for determining the
 * bounding box that contains a set of markers on a map.
 *
 * @param {IMarkerObject[]} markers - The array of markers for which to compute bounds.
 *                                    Each marker must have a position property with latitude and longitude.
 * @param {boolean} [withFiltered=true] - Whether to include markers that are filtered out.
 *                                        If true, all markers are considered. If false, only non-filtered markers are included.
 * @returns {Bounds | null} - The computed bounds containing the minimum and maximum latitudes and longitudes,
 *                            or null if no markers are provided.
 *
 * @example
 * const markers = [
 *   { position: { lat: 40.7128, lng: -74.0060 }, filtered: false }, // New York City
 *   { position: { lat: 34.0522, lng: -118.2437 }, filtered: false } // Los Angeles
 * ];
 * const bounds = ComputeBounds(markers);
 * console.log(bounds); // Output: { minLat: 34.0522, maxLat: 40.7128, minLng: -118.2437, maxLng: -74.0060 }
 */
export function ComputeBounds(markers: IMarkerObject[], withFiltered: boolean = true): Bounds | null {
    return computeBoundsFromList(markers, (marker) => marker.position, withFiltered);
}

/**
 * Sorts an array of markers using the insertion sort algorithm.
 *
 * This function sorts an array of markers based on their longitude values
 * using the insertion sort algorithm. Insertion sort is a simple and efficient
 * algorithm for small or nearly sorted arrays. It is stable and has a time
 * complexity of O(n^2) in the worst case, but performs well on small or nearly
 * sorted datasets.
 *
 * @param {IMarkerObject[]} list - The array of markers to be sorted. Each marker
 *                                 must have a position property with latitude and longitude.
 *
 * @example
 * const markers = [
 *   { position: { lat: 40.7128, lng: -74.0060 }, filtered: false }, // New York City
 *   { position: { lat: 34.0522, lng: -118.2437 }, filtered: false } // Los Angeles
 * ];
 * insertionSort(markers);
 * console.log(markers);
 * // Output: [
 * //   { position: { lat: 34.0522, lng: -118.2437 }, filtered: false },
 * //   { position: { lat: 40.7128, lng: -74.0060 }, filtered: false }
 * // ]
 */
export function insertionSort(list: IMarkerObject[]) {
    for (let i: number = 1,
             j: number,
             tmp: IMarkerObject,
             tmpLng: number,
             length = list.length; i < length; ++i) {
        tmp = list[i];
        tmpLng = tmp.position.lng;
        for (j = i - 1; j >= 0 && list[j].position.lng > tmpLng; --j) {
            list[j + 1] = list[j];
        }
        list[j + 1] = tmp;
    }
}

/**
 * Determines whether to use the insertion sort algorithm based on the total number of markers and the number of changes.
 *
 * The insertion sort algorithm is preferred for its stability and performance on small or nearly sorted collections.
 * However, its worst-case time complexity is O(n^2), which can be extreme for large datasets. This function helps
 * decide whether to use insertion sort or an alternative sorting algorithm based on the number of changes in the dataset.
 *
 * @param {number} total - The total number of markers in the collection.
 * @param {number} nbChanges - The number of changes in the collection since the last sort.
 * @returns {boolean} - Returns true if insertion sort should be used, false otherwise.
 *
 * @example
 * const totalMarkers = 1000;
 * const changes = 50;
 * const useInsertionSort = shouldUseInsertionSort(totalMarkers, changes);
 * console.log(useInsertionSort); // Output: true
 *
 * @remarks
 * - If the number of changes exceeds 300, insertion sort is not recommended.
 * - If the ratio of changes to the total number of markers is less than 0.2, insertion sort is recommended.
 */
export function shouldUseInsertionSort(total: number, nbChanges: number): boolean {
    if (nbChanges > 300) {
        return false;
    } else {
        return (nbChanges / total) < 0.2;
    }
}

// Shared function for computing bounds from a list of objects with positions
/**
 * Computes the geographical bounds of a given list of items with positions.
 *
 * This function calculates the minimum and maximum latitudes and longitudes
 * that encompass all the provided items. It is useful for determining the
 * bounding box that contains a set of items on a map.
 *
 * @template T - The type of items in the list, which must extend the HasPosition interface.
 * @param {T[]} items - The array of items for which to compute bounds. Each item must have a position property with latitude and longitude.
 * @param {(item: T) => Position} getPosition - A function that returns the position of an item.
 * @param {boolean} [withFiltered=true] - Whether to include items that are filtered out. If true, all items are considered. If false, only non-filtered items are included.
 * @returns {Bounds | null} - The computed bounds containing the minimum and maximum latitudes and longitudes, or null if no items are provided.
 *
 * @example
 * const items = [
 *   { position: { lat: 40.7128, lng: -74.0060 }, filtered: false }, // New York City
 *   { position: { lat: 34.0522, lng: -118.2437 }, filtered: false } // Los Angeles
 * ];
 * const bounds = computeBoundsFromList(items, item => item.position);
 * console.log(bounds); // Output: { minLat: 34.0522, maxLat: 40.7128, minLng: -118.2437, maxLng: -74.0060 }
 */
function computeBoundsFromList<T extends HasPosition>(
    items: T[],
    getPosition: (item: T) => Position,
    withFiltered: boolean = true
): Bounds | null {
    if (!items || items.length === 0) {
        return null;
    }

    let rMinLat = Number.MAX_VALUE,
        rMaxLat = -Number.MAX_VALUE,
        rMinLng = Number.MAX_VALUE,
        rMaxLng = -Number.MAX_VALUE;

    for (let i = 0, l = items.length; i < l; ++i) {
        const item = items[i];

        if (!withFiltered && item.filtered) {
            continue;
        }

        const pos = getPosition(item);

        if (pos.lat < rMinLat) rMinLat = pos.lat;
        if (pos.lat > rMaxLat) rMaxLat = pos.lat;
        if (pos.lng < rMinLng) rMinLng = pos.lng;
        if (pos.lng > rMaxLng) rMaxLng = pos.lng;
    }

    return {
        minLat: rMinLat,
        maxLat: rMaxLat,
        minLng: rMinLng,
        maxLng: rMaxLng
    };
}