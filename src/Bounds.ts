export interface Bounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

export const FULL_MAP_BOUNDS = {minLat: -90, maxLat: 90, minLng: -180, maxLng: 180} as Bounds;
