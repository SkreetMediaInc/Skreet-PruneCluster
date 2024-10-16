/**
 * Represents the geographical bounds with minimum and maximum latitude and longitude.
 */
export interface Bounds {
    /**
     * The minimum latitude of the bounds.
     * @type {number}
     */
    minLat: number;

    /**
     * The maximum latitude of the bounds.
     * @type {number}
     */
    maxLat: number;

    /**
     * The minimum longitude of the bounds.
     * @type {number}
     */
    minLng: number;

    /**
     * The maximum longitude of the bounds.
     * @type {number}
     */
    maxLng: number;
}

export const FULL_MAP_BOUNDS = {minLat: -90, maxLat: 90, minLng: -180, maxLng: 180} as Bounds;
