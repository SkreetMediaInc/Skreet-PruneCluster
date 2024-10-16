import {Position} from "./Position";

/**
 * Represents a marker object with various properties.
 */
export interface IMarkerObject {
    /**
     * The geographical position of the marker.
     */
    position: Position;

    /**
     * Additional data associated with the marker.
     */
    data: any;

    /**
     * A unique hash code for the marker.
     */
    hashCode: number;

    /**
     * Indicates whether the marker is filtered.
     */
    filtered: boolean;

    /**
     * The weight of the marker, used for clustering.
     */
    weight: number;

    /**
     * The category of the marker.
     */
    category: number;

    /**
     * A flag indicating whether the marker is marked for removal.
     */
    _removeFlag: boolean;
}
