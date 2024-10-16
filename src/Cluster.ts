import {MaxHashCodeValue} from "./HashCodeCounter";
import VirtualMarker from "./VirtualMarker.ts";
import {Bounds} from "./Bounds";
import {Position} from "./Position";
import {PruneCluster} from "./PruneCluster";
import {IMarkerObject} from "./IMarkerObject.ts";

export class Cluster implements IMarkerObject {
    // Cluster area
    public bounds: Bounds = {minLat: 0, maxLat: 0, minLng: 0, maxLng: 0};

    // Number of markers clustered
    // @ts-ignore
    public population: number;

    public position!: Position;
    public data: any;
    public hashCode: number;
    public filtered!: boolean;
    public weight!: number;
    public category!: number;
    public _removeFlag!: boolean;

    // Average position of the cluster,
    // taking into account the cluster weight

    public averagePosition: Position = {lat: 0, lng: 0};

    // Statistics table
    // The key is the category and the value is the sum
    // of the weights
    public stats: any[] = [];

    // The total weight of the cluster
    // @ts-ignore

    public totalWeight: number;

    // The last marker added in the cluster
    // Usefull when the cluster contains only one marker

    public lastMarker!: VirtualMarker;

    // If enabled, the cluster contains a list of his marker
    // It implies a performance cost, but you can use it
    // for building the icon, if your dataset is not too big
    public static ENABLE_MARKERS_LIST: boolean = false;

    // The list of markers in the cluster
    private _clusterMarkers!: VirtualMarker[];
    markers: any;

    // @ts-ignore


    constructor(marker?: VirtualMarker) {
        this.stats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.data = {};

        if (!marker) {
            this.hashCode = 1;
            if (Cluster.ENABLE_MARKERS_LIST) {
                this._clusterMarkers = [];
            }
            return;
        }

        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = [marker];
        }

        this.lastMarker = marker;
        this.hashCode = 31 + marker.hashCode;
        this.population = 1;

        if (marker.category !== undefined) {
            this.stats[marker.category] = 1;
        }

        this.totalWeight = marker.weight;

        if (!marker.position) {
            throw new Error(`position is required: ${JSON.stringify(marker)}`);
        }

        this.position = {lat: marker.position.lat, lng: marker.position.lng};
        this.averagePosition = {lat: marker.position.lat, lng: marker.position.lng};

        // Set initial bounds based on the marker's position
        this.bounds = {
            minLat: marker.position.lat,
            maxLat: marker.position.lat,
            minLng: marker.position.lng,
            maxLng: marker.position.lng,
        };
    }

    public AddMarker(marker: VirtualMarker) {

        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers.push(marker);
        }

        let h = this.hashCode;
        h = ((h << 5) - h) + marker.hashCode;
        if (h >= MaxHashCodeValue) {
            this.hashCode = h % MaxHashCodeValue;
        } else {
            this.hashCode = h;
        }

        this.lastMarker = marker;

        // Compute the weighted arithmetic mean
        const weight = marker.weight,
            currentTotalWeight = this.totalWeight,
            newWeight = weight + currentTotalWeight;

        this.averagePosition.lat =
            (this.averagePosition.lat * currentTotalWeight +
                marker.position.lat * weight) / newWeight;

        this.averagePosition.lng =
            (this.averagePosition.lng * currentTotalWeight +
                marker.position.lng * weight) / newWeight;

        ++this.population;
        this.totalWeight = newWeight;

        // Update the statistics if needed
        if (marker.category !== undefined) {
            this.stats[marker.category] = (this.stats[marker.category] + 1) || 1;
        }
    }

    public Reset() {
        this.hashCode = 1;
        // @ts-ignore
        this.lastMarker = undefined;
        this.population = 0;
        this.totalWeight = 0;
        this.stats = [0, 0, 0, 0, 0, 0, 0, 0];

        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = [];
        }
    }

    // Compute the bounds
    // Settle the cluster to the projected grid
    public ComputeBounds(cluster: PruneCluster) {

        let proj = cluster.Project(+this.position.lat, +this.position.lng);

        let size = cluster.Size;

        // Compute the position of the cluster
        let nbX = Math.floor(proj.x / size),
            nbY = Math.floor(proj.y / size),
            startX = nbX * size,
            startY = nbY * size;

        // Project it to lat/lng values
        let a = cluster.UnProject(startX, startY),
            b = cluster.UnProject(startX + size, startY + size);

        this.bounds = {
            minLat: b.lat,
            maxLat: a.lat,
            minLng: a.lng,
            maxLng: b.lng
        };
    }

    public GetClusterMarkers() {
        return this._clusterMarkers;
    }

    public ApplyCluster(newCluster: Cluster) {

        this.hashCode = this.hashCode * 41 + newCluster.hashCode * 43;
        if (this.hashCode > MaxHashCodeValue) {
            this.hashCode = this.hashCode = MaxHashCodeValue;
        }

        let weight = newCluster.totalWeight,
            currentTotalWeight = this.totalWeight,
            newWeight = weight + currentTotalWeight;

        this.averagePosition.lat =
            (this.averagePosition.lat * currentTotalWeight +
                newCluster.averagePosition.lat * weight) / newWeight;

        this.averagePosition.lng =
            (this.averagePosition.lng * currentTotalWeight +
                newCluster.averagePosition.lng * weight) / newWeight;

        this.population += newCluster.population;
        this.totalWeight = newWeight;

        // Merge the bounds
        this.bounds.minLat = Math.min(this.bounds.minLat, newCluster.bounds.minLat);
        this.bounds.minLng = Math.min(this.bounds.minLng, newCluster.bounds.minLng);
        this.bounds.maxLat = Math.max(this.bounds.maxLat, newCluster.bounds.maxLat);
        this.bounds.maxLng = Math.max(this.bounds.maxLng, newCluster.bounds.maxLng);

        // Merge the statistics
        for (let category in newCluster.stats) {
            if (newCluster.stats.hasOwnProperty(category)) {
                if (this.stats.hasOwnProperty(category)) {
                    this.stats[category] += newCluster.stats[category];
                } else {
                    this.stats[category] = newCluster.stats[category];
                }
            }
        }

        // Merge the clusters lists
        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = this._clusterMarkers.concat(newCluster.GetClusterMarkers());
        }
    }

}
