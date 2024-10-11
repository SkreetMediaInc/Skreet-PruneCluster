import {Bounds, IClusterObject, Position, HasPosition} from "./types";


export function checkPositionInsideBounds(a: Position, b: Bounds): boolean {
    return (a.lat >= b.minLat && a.lat <= b.maxLat) &&
        a.lng >= b.minLng && a.lng <= b.maxLng;
}

export function ComputeBounds(markers: IClusterObject[], withFiltered: boolean = true): Bounds | null {
    return computeBoundsFromList(markers, (marker) => marker.position, withFiltered);
}

export function insertionSort(list: IClusterObject[]) {
    for (let i: number = 1,
             j: number,
             tmp: IClusterObject,
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

// PruneCluster must work on a sorted collection
// the insertion sort is preferred for its stability and its performances
// on sorted or almost sorted collections.
//
// However the insertion sort's worst case is extreme and we should avoid it.
export function shouldUseInsertionSort(total: number, nbChanges: number): boolean {
    if (nbChanges > 300) {
        return false;
    } else {
        return (nbChanges / total) < 0.2;
    }
}

// Shared function for computing bounds from a list of objects with positions
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