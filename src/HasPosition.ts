// Marker-like object interface

import {Position} from "./Position";

/**
 * Interface representing an object with a position.
 * This is typically used for marker-like objects in mapping applications.
 */
export interface HasPosition {
    /**
     * The geographical position of the object.
     * This should be an instance of the `Position` class, which contains latitude and longitude.
     */
    position: Position;

    /**
     * Optional flag indicating whether the object is filtered.
     * If true, the object is considered filtered and may be excluded from certain operations.
     */
    filtered?: boolean;
}
