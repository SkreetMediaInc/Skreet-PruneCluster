import HashCodeCounter from "./HashCodeCounter";
import {Position} from "./Position";
import {IMarkerObject} from "./IMarkerObject.ts";

export class VirtualMarker implements IMarkerObject {

    // The category of the Marker, ideally a number between 0 and 7
    // can also be a string
    public category: number;

    // The weight of a Marker can influence the cluster icon or the cluster position
    public weight: number;

    // If filtered is true, the marker is not included in the clustering
    // With some datasets, it's faster to keep the markers inside PruneCluster and to
    // use the filtering feature. With some other datasets, it's better to remove the
    // markers
    public filtered: boolean;
    public _removeFlag: boolean = false;

    public position: Position;
    public data: any;
    public hashCode: number;

    /**
     * Constructs a new `VirtualMarker` instance.
     *
     * @param {number} lat - The latitude of the marker's position.
     * @param {number} lng - The longitude of the marker's position.
     * @param {Object} [data={}] - An optional data object associated with the marker.
     * @param {number} [category=0] - An optional category for the marker, ideally a number between 0 and 7. Defaults to 0 if not provided.
     * @param {number} [weight=1] - The weight of the marker, which can influence the cluster icon or position. Defaults to 1.
     * @param {boolean} [filtered=false] - Indicates whether the marker is filtered out. Defaults to false.
     *
     * @example
     * const marker = new VirtualMarker(40.7128, -74.0060, { name: "New York City" }, 1, 5, false);
     *
     * @remarks
     * - The `position` property is set using the provided latitude and longitude.
     * - The `data` property is initialized with the provided data object.
     * - The `weight` property is set to the provided weight or defaults to 1.
     * - The `category` property is set to the provided category or defaults to 0.
     * - The `filtered` property is set to the provided filtered value or defaults to false.
     * - The `hashCode` property is generated using the `HashCodeCounter` to uniquely identify the marker.
     */
    constructor(lat: number, lng: number, data: {} = {},
                category?: number, weight: number = 1, filtered: boolean = false) {
        this.position = {lat: lat, lng: lng};
        this.data = data;
        this.weight = weight;
        this.category = category || 0;
        this.filtered = filtered;

        // The hashCode is used to identify the Cluster object
        this.hashCode = HashCodeCounter.getHashCode();
    }


    /**
     * Moves the marker to a new position.
     *
     * This method updates the latitude and longitude of the marker's position.
     * It is useful for repositioning the marker on the map.
     *
     * @param {number} lat - The new latitude for the marker's position.
     * @param {number} lng - The new longitude for the marker's position.
     *
     * @example
     * const marker = new VirtualMarker(40.7128, -74.0060);
     * marker.Move(34.0522, -118.2437);
     * console.log(marker.position); // Output: { lat: 34.0522, lng: -118.2437 }
     *
     * @remarks
     * - The latitude and longitude are converted to numbers using the unary plus operator.
     * - This method directly modifies the `position` property of the marker.
     */
    public Move(lat: number, lng: number) {
        this.position.lat = +lat;
        this.position.lng = +lng;
    }

    /**
     * Updates the marker's data with the provided data object.
     *
     * This method iterates over the keys of the provided data object and assigns
     * each key-value pair to the marker's `data` property. It effectively merges
     * the new data into the existing data of the marker.
     *
     * @param {Object} data - The data object containing key-value pairs to be applied to the marker.
     *
     * @example
     * const marker = new VirtualMarker(40.7128, -74.0060, { name: "New York City" });
     * marker.SetData({ population: 8000000, area: 468.9 });
     * console.log(marker.data); // Output: { name: "New York City", population: 8000000, area: 468.9 }
     *
     * @remarks
     * - This method does not remove existing keys in the `data` property that are not present in the provided data object.
     * - If a key in the provided data object already exists in the marker's `data` property, its value will be overwritten.
     * - This method performs a shallow copy of the provided data object.
     */
    public SetData(data: any) {
        for (let key in data) {
            this.data[key] = data[key];
        }
    }

}

export default VirtualMarker;

