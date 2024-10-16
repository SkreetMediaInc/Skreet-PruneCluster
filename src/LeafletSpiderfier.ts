import LeafletAdapter from "./LeafletAdapter.ts";
import * as L from "leaflet";
import {Position} from "./Position";

export class PruneClusterLeafletSpiderfier extends L.Layer {
    private readonly _2PI = Math.PI * 2;
    private readonly _circleFootSeparation = 25;
    private readonly _circleStartAngle = Math.PI / 6;
    private readonly _spiralFootSeparation = 28;
    private readonly _spiralLengthStart = 11;
    private readonly _spiralLengthFactor = 5;
    private readonly _spiralCountTrigger = 8;

    public spiderfyDistanceMultiplier = 1;

    private _cluster: LeafletAdapter;
    private _currentMarkers: L.Marker[] = [];
    private _lines = L.polyline([], {weight: 1.5, color: "#222"});
    private _currentCenter?: Position;
    private _clusterMarker?: L.Marker;

    /**
     * Creates an instance of `PruneClusterLeafletSpiderfier`.
     *
     * This constructor initializes the spiderfier with a given cluster adapter. The cluster adapter
     * is used to manage and interact with the markers on the map. The constructor performs the following actions:
     *
     * 1. Calls the parent class constructor using `super()`.
     * 2. Stores the provided `LeafletAdapter` instance in the `_cluster` property for later use.
     *
     * @param cluster - An instance of `LeafletAdapter` that manages the markers on the map.
     */
    constructor(cluster: LeafletAdapter) {
        super();
        this._cluster = cluster;
    }

    /**
     * Adds the spiderfier layer to the map and binds event listeners.
     *
     * This method is called when the spiderfier layer is added to the map. It performs
     * the following actions:
     * 1. Stores the reference to the Leaflet map instance.
     * 2. Binds the `spiderfy` method to the "overlappingmarkers" event, which is triggered
     *    when markers overlap and need to be spread out for better visibility.
     * 3. Binds the `unspiderfy` method to the "click" event, which is triggered when the
     *    map is clicked, reverting any spiderfied markers back to their original state.
     * 4. Binds the `unspiderfy` method to the "zoomend" event, which is triggered when the
     *    map zoom level changes, reverting any spiderfied markers back to their original state.
     *
     * @param map - The Leaflet map instance to which the spiderfier layer is being added.
     * @returns The current instance of `PruneClusterLeafletSpiderfier`.
     */
    onAdd(map: L.Map): this {
        this._map = map;
        map.on("overlappingmarkers", this.spiderfy.bind(this));
        map.on("click", this.unspiderfy.bind(this));
        map.on("zoomend", this.unspiderfy.bind(this));
        return this;
    }

    /**
     * Removes the spiderfier layer from the map.
     *
     * This method is called when the spiderfier layer is removed from the map. It performs
     * the following actions:
     * 1. Calls the `unspiderfy` method to revert any spiderfied markers back to their original state.
     * 2. Unbinds the event listeners for "overlappingmarkers", "click", and "zoomend" events.
     *
     * @param map - The Leaflet map instance from which the spiderfier layer is being removed.
     * @returns The current instance of `PruneClusterLeafletSpiderfier`.
     */
    onRemove(map: L.Map): this {
        this.unspiderfy();
        map.off("overlappingmarkers", this.spiderfy.bind(this));
        map.off("click", this.unspiderfy.bind(this));
        map.off("zoomend", this.unspiderfy.bind(this));
        return this;
    }

    /**
     * Handles the spiderfying of overlapping markers on the map.
     *
     * This method is triggered when markers overlap and need to be spread out
     * for better visibility. It first unspiderfies any existing spiderfied markers,
     * then filters the markers to exclude any that are marked as filtered.
     *
     * Depending on the number of markers, it generates their positions in either
     * a spiral or circular pattern around the center point. It then creates Leaflet
     * markers at these positions, adds them to the map, and animates the lines
     * connecting the original center to the new positions.
     *
     * @param data - The data object containing information about the cluster and markers.
     * @param data.cluster - The cluster to which the markers belong.
     * @param data.markers - The array of markers to be spiderfied.
     * @param data.center - The center position around which the markers will be arranged.
     * @param data.marker - (Optional) The cluster marker that triggered the spiderfy.
     */
    spiderfy(data: any): void {
        if (data.cluster !== this._cluster) return;

        this.unspiderfy();
        const markers = data.markers.filter((marker: any) => !marker.filtered);

        this._currentCenter = data.center;
        const centerPoint = this._map.latLngToLayerPoint(data.center);

        const points = markers.length >= this._spiralCountTrigger
            ? this._generatePointsSpiral(markers.length, centerPoint)
            : this._generatePointsCircle(markers.length, centerPoint);

        const leafletMarkers: L.Marker[] = [];
        const projectedPoints: L.LatLng[] = [];
        const polylines: L.LatLng[][] = [];

        points.forEach((point, i) => {
            const pos = this._map.layerPointToLatLng(point);
            const marker = this._cluster.BuildLeafletMarker(markers[i], data.center)
                .setZIndexOffset(5000)
                .setOpacity(0);

            this._currentMarkers.push(marker);
            this._map.addLayer(marker);
            leafletMarkers.push(marker);
            projectedPoints.push(pos);

            polylines.push([data.center, pos]); // Directly store polylines here
        });

        setTimeout(() => {
            leafletMarkers.forEach((marker, i) => {
                marker.setLatLng(projectedPoints[i]).setOpacity(1);
            });

            this._animateLines(polylines);
        }, 1);

        if (data.marker) {
            this._clusterMarker = data.marker.setOpacity(0.3);
        }
    }

    /**
     * Generates an array of points arranged in a circular pattern around a center point.
     *
     * This method calculates the positions of markers in a circular layout, which is useful
     * for visualizing clusters of markers that overlap. The markers are evenly distributed
     * around the circumference of a circle centered at the given point.
     *
     * @param count - The number of points to generate.
     * @param centerPt - The center point around which the points will be arranged.
     * @returns An array of `L.Point` objects representing the positions of the markers.
     */
    private _generatePointsCircle(count: number, centerPt: L.Point): L.Point[] {
        // Calculate the circumference of the circle based on the number of points and the foot separation
        const circumference = this.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count);

        // Calculate the length of each leg (distance from the center to each point)
        const legLength = circumference / this._2PI;

        // Calculate the angle step between each point
        const angleStep = this._2PI / count;

        // Generate the points in a circular pattern
        return Array.from({length: count}, (_, i) => {
            // Calculate the angle for the current point
            const angle = this._circleStartAngle + i * angleStep;

            // Calculate the x and y coordinates of the point based on the angle and leg length
            return new L.Point(
                Math.round(centerPt.x + legLength * Math.cos(angle)),
                Math.round(centerPt.y + legLength * Math.sin(angle))
            );
        });
    }

    private _generatePointsSpiral(count: number, centerPt: L.Point): L.Point[] {
        let legLength = this.spiderfyDistanceMultiplier * this._spiralLengthStart;
        const separation = this.spiderfyDistanceMultiplier * this._spiralFootSeparation;
        const lengthFactor = this.spiderfyDistanceMultiplier * this._spiralLengthFactor;
        let angle = 0;

        return Array.from({length: count}, (_, i) => {
            angle += separation / legLength + i * 0.0005;
            const point = new L.Point(
                Math.round(centerPt.x + legLength * Math.cos(angle)),
                Math.round(centerPt.y + legLength * Math.sin(angle))
            );
            legLength += (this._2PI * lengthFactor) / angle;
            return point;
        });
    }

    private _animateLines(polylines: L.LatLng[][]): void {
        const startTime = Date.now();
        const interval = 42;
        const duration = 290;

        const anim = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const stepRatio = Math.min(elapsed / duration, 1);

            const updatedPolylines = polylines.map(([start, end]) => {
                const diffLat = end.lat - start.lat;
                const diffLng = end.lng - start.lng;
                return [
                    start,
                    new L.LatLng(start.lat + diffLat * stepRatio, start.lng + diffLng * stepRatio),
                ];
            });

            this._lines.setLatLngs(updatedPolylines);

            if (stepRatio === 1) clearInterval(anim);
        }, interval);

        this._map.addLayer(this._lines);
    }

    unspiderfy(): void {
        if (this._currentMarkers.length === 0) return; // Prevent redundant unspiderfy calls

        this._currentMarkers.forEach((marker) => {
            marker.setLatLng(this._currentCenter!).setOpacity(0);
        });

        setTimeout(() => {
            this._currentMarkers.forEach((marker) => {
                this._map.removeLayer(marker);
            });
            this._currentMarkers = [];
        }, 300);

        this._map.removeLayer(this._lines);
        if (this._clusterMarker) {
            this._clusterMarker.setOpacity(1);
        }
    }
}

export default PruneClusterLeafletSpiderfier;