import PruneClusterForLeaflet from "./PruneClusterForLeaflet";
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

    private _cluster: PruneClusterForLeaflet;
    private _currentMarkers: L.Marker[] = [];
    private _lines = L.polyline([], {weight: 1.5, color: "#222"});
    public _map!: L.Map;
    private _currentCenter?: Position;
    private _clusterMarker?: L.Marker;

    constructor(cluster: PruneClusterForLeaflet) {
        super();
        this._cluster = cluster;
    }

    onAdd(map: L.Map): this {
        this._map = map;
        map.on("overlappingmarkers", this.spiderfy.bind(this));
        map.on("click", this.unspiderfy.bind(this));
        map.on("zoomend", this.unspiderfy.bind(this));
        return this;
    }

    onRemove(map: L.Map): this {
        this.unspiderfy();
        map.off("overlappingmarkers", this.spiderfy.bind(this));
        map.off("click", this.unspiderfy.bind(this));
        map.off("zoomend", this.unspiderfy.bind(this));
        return this;
    }

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

    private _generatePointsCircle(count: number, centerPt: L.Point): L.Point[] {
        const circumference = this.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count);
        const legLength = circumference / this._2PI;
        const angleStep = this._2PI / count;

        return Array.from({length: count}, (_, i) => {
            const angle = this._circleStartAngle + i * angleStep;
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