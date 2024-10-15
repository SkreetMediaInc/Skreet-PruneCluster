
// The adapter store these properties inside L.Marker objects
import {Marker as LMarker} from "leaflet";

export interface LeafletMarker extends LMarker {
    _population?: number;
    _hashCode?: number;
    _zoomLevel?: number;
    _removeFromMap?: boolean;
}