import HashCodeCounter from "./HashCodeCounter";
import {Position} from "./Position";
import {IClusterObject} from "./IClusterObject";

export class ClusterMarker implements IClusterObject {

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


    public Move(lat: number, lng: number) {
        this.position.lat = +lat;
        this.position.lng = +lng;
    }

    // Apply the data object
    public SetData(data: any) {
        for (let key in data) {
            this.data[key] = data[key];
        }
    }

}

export default ClusterMarker;

