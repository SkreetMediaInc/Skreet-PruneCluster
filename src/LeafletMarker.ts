// The adapter store these properties inside L.Marker objects
import {Marker as LMarker} from "leaflet";

/**
 * Interface representing a Leaflet marker with additional properties.
 *
 * This interface extends the `L.Marker` class from the Leaflet library to include
 * additional properties that are used for clustering and other functionalities.
 */
export interface LeafletMarker extends LMarker {
    /**
     * The population associated with the marker.
     *
     * This property is optional and can be used to store the number of items or
     * entities represented by this marker in a clustering scenario.
     */
    _population?: number;

    /**
     * A unique hash code for the marker.
     *
     * This property is optional and can be used to uniquely identify the marker,
     * which can be useful for tracking and managing markers in a collection.
     */
    _hashCode?: number;

    /**
     * The zoom level at which the marker was added to the map.
     *
     * This property is optional and can be used to store the zoom level, which can
     * be useful for determining the visibility and clustering behavior of the marker.
     */
    _zoomLevel?: number;

    /**
     * Flag indicating whether the marker should be removed from the map.
     *
     * This property is optional and can be used to mark the marker for removal,
     * which can be useful for managing the lifecycle of markers in dynamic scenarios.
     */
    _removeFromMap?: boolean;
}