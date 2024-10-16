import {Point} from "./Point";
import {Position} from "./Position";
import {Bounds} from "./Bounds";
import {Cluster} from "./Cluster";
import {IMarkerObject} from "./IMarkerObject.ts";

/**
 * Interface representing a cluster handler.
 * This interface defines methods and properties for managing and processing clusters of markers.
 */
export interface IClusterHandler {
    /**
     * The size of the cluster.
     * @type {number}
     */
    Size: number;

    /**
     * The padding around the view for clustering.
     * @type {number}
     */
    ViewPadding: number;

    /**
     * Projects geographical coordinates (latitude and longitude) to a point.
     * @param {number} lat - The latitude.
     * @param {number} lng - The longitude.
     * @returns {Point} The projected point.
     */
    Project(lat: number, lng: number): Point;

    /**
     * Unprojects a point to geographical coordinates (latitude and longitude).
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @returns {Position} The geographical position.
     */
    UnProject(x: number, y: number): Position;

    /**
     * Registers a single marker with the cluster handler.
     * @param {IMarkerObject} marker - The marker to register.
     */
    RegisterMarker(marker: IMarkerObject): void;

    /**
     * Registers multiple markers with the cluster handler.
     * @param {IMarkerObject[]} markers - The markers to register.
     */
    RegisterMarkers(markers: IMarkerObject[]): void;

    /**
     * Removes markers from the cluster handler.
     * If no markers are specified, all markers are removed.
     * @param {IMarkerObject[]} [markers] - The markers to remove.
     */
    RemoveMarkers(markers?: IMarkerObject[]): void;

    /**
     * Processes the view within the specified bounds and returns clusters.
     * @param {Bounds} bounds - The bounds of the view to process.
     * @returns {Cluster[]} The clusters within the view.
     */
    ProcessView(bounds: Bounds): Cluster[];

    /**
     * Finds markers within the specified area.
     * @param {Bounds} area - The area to search for markers.
     * @returns {IMarkerObject[]} The markers within the area.
     */
    FindMarkersInArea(area: Bounds): IMarkerObject[];

    /**
     * Finds the bounds of markers within the specified area.
     * @param {Bounds} area - The area to search for marker bounds.
     * @returns {Bounds | null} The bounds of the markers within the area, or null if no markers are found.
     */
    FindMarkersBoundsInArea(area: Bounds): Bounds | null;

    /**
     * Computes the global bounds of all markers.
     * @param {boolean} [withFiltered] - Whether to include filtered markers.
     * @returns {Bounds | null} The global bounds of all markers, or null if no markers are found.
     */
    ComputeGlobalBounds(withFiltered?: boolean): Bounds | null;

    /**
     * Gets all registered markers.
     * @returns {IMarkerObject[]} The registered markers.
     */
    GetMarkers(): IMarkerObject[];

    /**
     * Gets the total population of markers.
     * @returns {number} The total population of markers.
     */
    GetPopulation(): number;

    /**
     * Resets all clusters.
     */
    ResetClusters(): void;

    /**
     * Sorts the markers.
     */
    SortMarkers(): void;

    /**
     * Sorts the clusters.
     */
    SortClusters(): void;

    /**
     * Finds the index of the lower bound for the specified longitude.
     * @param {number} lng - The longitude to find the lower bound index for.
     * @returns {number} The index of the lower bound.
     */
    IndexLowerBoundLng(lng: number): number;

    /**
     * Resets the views of all clusters.
     */
    ResetClusterViews(): void;

    /**
     * Gets the extended bounds of the specified bounds.
     * @param {Bounds} bounds - The bounds to extend.
     * @returns {Bounds} The extended bounds.
     */
    GetExtendedBounds(bounds: Bounds): Bounds;
}
