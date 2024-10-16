// src/AbstractPruneCluster.ts
import {VirtualMarker} from "./VirtualMarker.ts";
import {Cluster} from "./Cluster";
import {insertionSort} from "./utils";
import {IClusterHandler} from "./IClusterHandler.ts";
import {Point} from "./Point";
import {Position} from "./Position";
import {Bounds} from "./Bounds";

/**
 * Abstract class representing a cluster handler.
 *
 * This class provides the foundational structure and methods for handling clusters of markers on a map.
 * It includes methods for registering, removing, and processing markers, as well as sorting and resetting clusters.
 * Subclasses must implement the abstract methods to provide specific functionality.
 */
export abstract class AbstractClusterHandler implements IClusterHandler {

    /**
     * Projects geographical coordinates (latitude and longitude) to a point.
     * @param {number} lat - The latitude to project.
     * @param {number} lng - The longitude to project.
     * @returns {Point} The projected point.
     */
    Project!: (lat: number, lng: number) => Point;

    /**
     * Unprojects a point to geographical coordinates (latitude and longitude).
     * @param {number} x - The x-coordinate to unproject.
     * @param {number} y - The y-coordinate to unproject.
     * @returns {Position} The unprojected geographical coordinates.
     */
    UnProject!: (x: number, y: number) => Position;

    /**
     * The size of the cluster.
     * @type {number}
     */
    public Size: number = 166;

    /**
     * The padding around the view.
     * @type {number}
     */
    public ViewPadding: number = 0.2;

    /**
     * Array of markers.
     * @type {VirtualMarker[]}
     */
    public _markers: VirtualMarker[] = [];

    /**
     * Array of clusters.
     * @type {Cluster[]}
     */
    public _clusters: Cluster[] = [];

    /**
     * Number of changes.
     * @type {number}
     */
    public _nbChanges: number = 0;

    /**
     * The position.
     * @type {Position | undefined}
     */
    private position?: Position;

    /**
     * Registers a single marker.
     * @param {VirtualMarker} marker - The marker to register.
     */
    public abstract RegisterMarker(marker: VirtualMarker): void;

    /**
     * Registers multiple markers.
     * @param {VirtualMarker[]} markers - The markers to register.
     */
    public abstract RegisterMarkers(markers: VirtualMarker[]): void;

    /**
     * Removes markers.
     * @param {VirtualMarker[]} [markers] - The markers to remove. If not provided, all markers are removed.
     */
    public abstract RemoveMarkers(markers?: VirtualMarker[]): void;

    /**
     * Processes the view within the given bounds and returns clusters.
     * @param {Bounds} bounds - The bounds within which to process the view.
     * @returns {Cluster[]} The clusters within the bounds.
     */
    public abstract ProcessView(bounds: Bounds): Cluster[];

    /**
     * Finds markers within a specified area.
     * @param {Bounds} area - The area within which to find markers.
     * @returns {VirtualMarker[]} The markers within the area.
     */
    public abstract FindMarkersInArea(area: Bounds): VirtualMarker[];

    /**
     * Finds the bounds of markers within a specified area.
     * @param {Bounds} area - The area within which to find marker bounds.
     * @returns {Bounds | null} The bounds of markers within the area, or null if no markers are found.
     */
    public abstract FindMarkersBoundsInArea(area: Bounds): Bounds | null;

    /**
     * Computes the global bounds of all markers.
     * @param {boolean} [withFiltered] - Whether to include filtered markers.
     * @returns {Bounds | null} The global bounds, or null if no markers are found.
     */
    public abstract ComputeGlobalBounds(withFiltered?: boolean): Bounds | null;

    /**
     * Retrieves all markers.
     * @returns {VirtualMarker[]} An array of all markers.
     */
    public abstract GetMarkers(): VirtualMarker[];

    /**
     * Retrieves the population of markers.
     * @returns {number} The population of markers.
     */
    public abstract GetPopulation(): number;

    /**
     * Resets all clusters.
     */
    public abstract ResetClusters(): void;

    /**
     * Sorts the markers by longitude.
     */
    public SortMarkers(): void {
        if (this._nbChanges) {
            this._markers.sort((a, b) => {
                return a.position.lng - b.position.lng;
            });
            this._nbChanges = 0;
        }
    }

    /**
     * Sorts the clusters using insertion sort.
     */
    public SortClusters(): void {
        insertionSort(this._clusters);
    }

    /**
     * Finds the index of the first marker with a longitude greater than or equal to the specified longitude.
     * @param {number} lng - The longitude to compare.
     * @returns {number} The index of the first marker with a longitude greater than or equal to the specified longitude.
     */
    public IndexLowerBoundLng(lng: number): number {
        return this._markers.findIndex(marker => marker.position.lng >= lng);
    }

    /**
     * Resets the views of all clusters.
     */
    public ResetClusterViews(): void {
        this._clusters.forEach(cluster => cluster.Reset());
    }

    /**
     * Extends the bounds by adding padding.
     * @param {Bounds} bounds - The bounds to extend.
     * @returns {Bounds} The extended bounds.
     */
    public GetExtendedBounds(bounds: Bounds): Bounds {
        const heightBuffer = Math.abs(bounds.maxLat - bounds.minLat) * this.ViewPadding;
        const widthBuffer = Math.abs(bounds.maxLng - bounds.minLng) * this.ViewPadding;
        return {
            minLat: bounds.minLat - heightBuffer,
            maxLat: bounds.maxLat + heightBuffer,
            minLng: bounds.minLng - widthBuffer,
            maxLng: bounds.maxLng + widthBuffer
        };
    }
}

export default AbstractClusterHandler;