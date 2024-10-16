import {MaxHashCodeValue} from "./HashCodeCounter";
import VirtualMarker from "./VirtualMarker.ts";
import {Bounds} from "./Bounds";
import {Position} from "./Position";
import {PruneCluster} from "./PruneCluster";
import {IMarkerObject} from "./IMarkerObject.ts";

export class Cluster implements IMarkerObject {
    // for building the icon, if your dataset is not too big
    public static ENABLE_MARKERS_LIST: boolean = false;

    // Number of markers clustered
    // Cluster area
    public bounds: Bounds = {minLat: 0, maxLat: 0, minLng: 0, maxLng: 0};
    // @ts-ignore
    public population: number;
    public position!: Position;
    public data: any;
    public hashCode: number;
    public filtered!: boolean;
    public weight!: number;
    public category!: number;

    // Average position of the cluster,
    // taking into account the cluster weight
    public _removeFlag!: boolean;

    // Statistics table
    // The key is the category and the value is the sum
    public averagePosition: Position = {lat: 0, lng: 0};

    // The total weight of the cluster
    // @ts-ignore
    // of the weights
    public stats: any[] = [];

    // The last marker added in the cluster
    // Usefull when the cluster contains only one marker
    public totalWeight: number;

    // If enabled, the cluster contains a list of his marker
    // It implies a performance cost, but you can use it
    public lastMarker!: VirtualMarker;
    markers: any;
    // The list of markers in the cluster
    private _clusterMarkers!: VirtualMarker[];

    // @ts-ignore

    /**
     * Constructs a new Cluster instance.
     * @param {VirtualMarker} [marker] - An optional marker to initialize the cluster with.
     * If no marker is provided, the cluster is initialized with default values.
     *
     * @throws {Error} Throws an error if the provided marker does not have a position.
     */
    constructor(marker?: VirtualMarker) {
        // Initialize statistics array with zeros
        this.stats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.data = {};

        // If no marker is provided, initialize with default values
        if (!marker) {
            this.hashCode = 1;
            if (Cluster.ENABLE_MARKERS_LIST) {
                this._clusterMarkers = [];
            }
            return;
        }

        // If markers list is enabled, initialize the list with the provided marker
        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = [marker];
        }

        this.lastMarker = marker;
        this.hashCode = 31 + marker.hashCode;
        this.population = 1;

        // Update statistics based on the marker's category
        if (marker.category !== undefined) {
            this.stats[marker.category] = 1;
        }

        this.totalWeight = marker.weight;

        // Ensure the marker has a position
        if (!marker.position) {
            throw new Error(`position is required: ${JSON.stringify(marker)}`);
        }

        // Set the cluster's position and average position to the marker's position
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

    /**
     * Adds a marker to the cluster.
     *
     * If the `ENABLE_MARKERS_LIST` flag is set to true, the marker is added to the internal list of markers.
     * The hash code of the cluster is updated based on the marker's hash code.
     * The cluster's position and average position are updated using a weighted arithmetic mean.
     * The population and total weight of the cluster are incremented.
     * The statistics of the cluster are updated based on the marker's category.
     *
     * @param {VirtualMarker} marker - The marker to add to the cluster.
     *
     * @throws {Error} Throws an error if the provided marker does not have a position.
     */
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

    /**
     * Resets the cluster to its initial state.
     *
     * This method resets the cluster's hash code, last marker, population, total weight, and statistics.
     * If the `ENABLE_MARKERS_LIST` flag is set to true, the internal list of markers is also cleared.
     *
     * @example
     * const cluster = new Cluster();
     * cluster.AddMarker(marker);
     * cluster.Reset();
     * console.log(cluster.population); // Output: 0
     *
     * @throws {Error} Throws an error if the cluster cannot be reset.
     */
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

    /**
     * Computes the bounds of the cluster and sets the cluster to the projected grid.
     *
     * This method calculates the geographical bounds of the cluster by projecting its position
     * onto a grid defined by the `PruneCluster` instance. The bounds are then determined based
     * on the grid size and the projected coordinates.
     *
     * @param {PruneCluster} cluster - The `PruneCluster` instance used for projection and unprojection.
     *
     * @example
     * const cluster = new Cluster();
     * cluster.ComputeBounds(pruneClusterInstance);
     * console.log(cluster.bounds); // Output: { minLat: ..., maxLat: ..., minLng: ..., maxLng: ... }
     *
     * @throws {Error} Throws an error if the cluster's position is not defined.
     */
    public ComputeBounds(cluster: PruneCluster) {
        // Project the cluster's position to grid coordinates
        let proj = cluster.Project(+this.position.lat, +this.position.lng);

        // Get the size of the grid
        let size = cluster.Size;

        // Compute the position of the cluster on the grid
        let nbX = Math.floor(proj.x / size),
            nbY = Math.floor(proj.y / size),
            startX = nbX * size,
            startY = nbY * size;

        // Project the grid coordinates back to geographical coordinates
        let a = cluster.UnProject(startX, startY),
            b = cluster.UnProject(startX + size, startY + size);

        // Set the bounds of the cluster based on the projected coordinates
        this.bounds = {
            minLat: b.lat,
            maxLat: a.lat,
            minLng: a.lng,
            maxLng: b.lng
        };
    }

    /**
     * Retrieves the list of markers in the cluster.
     *
     * This method returns the internal list of markers that are part of the cluster.
     * The list is only maintained if the `ENABLE_MARKERS_LIST` flag is set to true.
     * If the flag is not set, the list will be empty or undefined.
     *
     * @returns {VirtualMarker[]} The list of markers in the cluster.
     *
     * @example
     * const cluster = new Cluster();
     * cluster.AddMarker(marker1);
     * cluster.AddMarker(marker2);
     * const markers = cluster.GetClusterMarkers();
     * console.log(markers); // Output: [marker1, marker2]
     */
    public GetClusterMarkers(): VirtualMarker[] {
        return this._clusterMarkers;
    }

    /**
     * Applies the properties of another cluster to this cluster.
     *
     * This method merges the properties of the provided `newCluster` into the current cluster.
     * It updates the hash code, average position, population, total weight, bounds, statistics,
     * and the list of markers if the `ENABLE_MARKERS_LIST` flag is set to true.
     *
     * @param {Cluster} newCluster - The cluster whose properties are to be applied to this cluster.
     *
     * @example
     * const cluster1 = new Cluster(marker1);
     * const cluster2 = new Cluster(marker2);
     * cluster1.ApplyCluster(cluster2);
     * console.log(cluster1.population); // Output: combined population of cluster1 and cluster2
     *
     * @throws {Error} Throws an error if the provided cluster is invalid.
     */
    public ApplyCluster(newCluster: Cluster) {

        // Update the hash code by combining the hash codes of both clusters
        this.hashCode = this.hashCode * 41 + newCluster.hashCode * 43;
        if (this.hashCode > MaxHashCodeValue) {
            this.hashCode = this.hashCode = MaxHashCodeValue;
        }

        // Calculate the new total weight of the cluster
        let weight = newCluster.totalWeight,
            currentTotalWeight = this.totalWeight,
            newWeight = weight + currentTotalWeight;

        // Update the average position using a weighted arithmetic mean
        this.averagePosition.lat =
            (this.averagePosition.lat * currentTotalWeight +
                newCluster.averagePosition.lat * weight) / newWeight;

        this.averagePosition.lng =
            (this.averagePosition.lng * currentTotalWeight +
                newCluster.averagePosition.lng * weight) / newWeight;

        // Update the population and total weight
        this.population += newCluster.population;
        this.totalWeight = newWeight;

        // Merge the bounds of both clusters
        this.bounds.minLat = Math.min(this.bounds.minLat, newCluster.bounds.minLat);
        this.bounds.minLng = Math.min(this.bounds.minLng, newCluster.bounds.minLng);
        this.bounds.maxLat = Math.max(this.bounds.maxLat, newCluster.bounds.maxLat);
        this.bounds.maxLng = Math.max(this.bounds.maxLng, newCluster.bounds.maxLng);

        // Merge the statistics of both clusters
        for (let category in newCluster.stats) {
            if (newCluster.stats.hasOwnProperty(category)) {
                if (this.stats.hasOwnProperty(category)) {
                    this.stats[category] += newCluster.stats[category];
                } else {
                    this.stats[category] = newCluster.stats[category];
                }
            }
        }

        // Merge the list of markers if the ENABLE_MARKERS_LIST flag is set
        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = this._clusterMarkers.concat(newCluster.GetClusterMarkers());
        }
    }

}
