// src/PruneCluster.ts
import AbstractClusterHandler from "./AbstractClusterHandler.ts";
import VirtualMarker from "./VirtualMarker.ts";
import {Cluster} from "./Cluster";
import {Bounds} from "./Bounds";
import {checkPositionInsideBounds, ComputeBounds} from "./utils";
import {Position} from "./Position";
import {Point} from "./Point";

/**
 * PruneCluster is responsible for managing and clustering markers on a map.
 * It extends the AbstractClusterHandler and provides methods to register, remove,
 * and process markers, as well as compute bounds and find markers within specific areas.
 */
export class PruneCluster extends AbstractClusterHandler {

    /**
     * Registers a single marker to the cluster.
     * If the marker has a `_removeFlag`, it will be deleted before adding the marker.
     *
     * @param {VirtualMarker} marker - The marker to register.
     */
    public RegisterMarker(marker: VirtualMarker): void {
        if ((<any>marker)._removeFlag) {
            delete (<any>marker)._removeFlag;
        }
        this._markers.push(marker);
        this._nbChanges += 1;
    }

    /**
     * Registers multiple markers to the cluster.
     *
     * @param {VirtualMarker[]} markers - The array of markers to register.
     */
    public RegisterMarkers(markers: VirtualMarker[]): void {
        markers.forEach(marker => this.RegisterMarker(marker));
    }

    /**
     * Removes markers from the cluster.
     * If no markers are provided, all markers will be removed.
     *
     * @param {VirtualMarker[]} [markers] - The array of markers to remove.
     */
    public RemoveMarkers(markers?: VirtualMarker[]): void {
        if (!markers) {
            this._markers = [];
            return;
        }
        markers.forEach(marker => (<any>marker)._removeFlag = true);
        this._markers = this._markers.filter(marker => !(<any>marker)._removeFlag);
    }

    /**
     * Processes the view and clusters markers within the given bounds.
     *
     * @param {Bounds} bounds - The bounds within which to process markers.
     * @returns {Cluster[]} - The array of clusters created.
     */
    public ProcessView(bounds: Bounds): Cluster[] {
        this.SortMarkers();
        this.ResetClusterViews();

        const heightBuffer = Math.abs(bounds.maxLat - bounds.minLat) * this.ViewPadding;
        const widthBuffer = Math.abs(bounds.maxLng - bounds.minLng) * this.ViewPadding;

        const extendedBounds: Bounds = {
            minLat: bounds.minLat - heightBuffer,
            maxLat: bounds.maxLat + heightBuffer,
            minLng: bounds.minLng - widthBuffer,
            maxLng: bounds.maxLng + widthBuffer
        };

        const clusters: Cluster[] = [];
        const workingClusterList: Cluster[] = [];

        for (let marker of this._markers) {
            const markerPosition = marker.position;

            // Ignore markers outside the extended bounds
            if (markerPosition.lng > extendedBounds.maxLng || markerPosition.lng < extendedBounds.minLng ||
                markerPosition.lat > extendedBounds.maxLat || markerPosition.lat < extendedBounds.minLat) {
                continue;
            }

            let clusterFound = false;

            for (let cluster of workingClusterList) {
                // Handle markers with identical positions or close proximity
                if ((cluster.position.lat === markerPosition.lat && cluster.position.lng === markerPosition.lng) ||
                    checkPositionInsideBounds(markerPosition, cluster.bounds)) {
                    cluster.AddMarker(marker);
                    clusterFound = true;
                    break;
                }
            }

            if (!clusterFound) {
                const newCluster = new Cluster(marker);
                newCluster.ComputeBounds(this);
                clusters.push(newCluster);
                workingClusterList.push(newCluster);
            }
        }

        this._clusters = clusters.filter(cluster => cluster.population > 0);
        this.SortClusters();
        return this._clusters;
    }

    /**
     * Finds markers within a specified area.
     *
     * @param {Bounds} area - The bounds within which to find markers.
     * @returns {VirtualMarker[]} - The array of markers found within the area.
     */
    public FindMarkersInArea(area: Bounds): VirtualMarker[] {
        return this._markers.filter(marker => !marker.filtered && checkPositionInsideBounds(marker.position, area));
    }

    /**
     * Computes the bounds of the given markers.
     *
     * @param {VirtualMarker[]} markers - The array of markers to compute bounds for.
     * @param {boolean} [withFiltered=true] - Whether to include filtered markers.
     * @returns {Bounds | null} - The computed bounds or null if no markers are provided.
     */
    public ComputeBounds(markers: VirtualMarker[], withFiltered: boolean = true): Bounds | null {
        return ComputeBounds(markers, withFiltered);
    }

    /**
     * Finds the bounds of markers within a specified area.
     *
     * @param {Bounds} area - The bounds within which to find marker bounds.
     * @returns {Bounds | null} - The computed bounds or null if no markers are found.
     */
    public FindMarkersBoundsInArea(area: Bounds): Bounds | null {
        return this.ComputeBounds(this.FindMarkersInArea(area));
    }

    /**
     * Computes the global bounds of all markers.
     *
     * @param {boolean} [withFiltered=true] - Whether to include filtered markers.
     * @returns {Bounds | null} - The computed global bounds or null if no markers are found.
     */
    public ComputeGlobalBounds(withFiltered: boolean = true): Bounds | null {
        return this.ComputeBounds(this._markers, withFiltered);
    }

    /**
     * Gets all registered markers.
     *
     * @returns {VirtualMarker[]} - The array of all registered markers.
     */
    public GetMarkers(): VirtualMarker[] {
        return this._markers;
    }

    /**
     * Gets the total population of markers.
     *
     * @returns {number} - The total number of registered markers.
     */
    public GetPopulation(): number {
        return this._markers.length;
    }

    /**
     * Resets all clusters.
     */
    public ResetClusters(): void {
        this._clusters = [];
    }
}