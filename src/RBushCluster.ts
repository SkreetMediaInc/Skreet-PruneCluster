// src/IPruneCluster.ts
import ClusterMarker from "./ClusterMarker";
import {Cluster} from "./Cluster";


import Rbush from 'rbush';
import {checkPositionInsideBounds} from "./utils";
import {AbstractCluster} from "./AbstractCluster";
import {Bounds} from "./types";

export class RBushCluster extends AbstractCluster {

    // public ComputeBounds( {
    //     throw new Error("Method not implemented.");
    // }
    public _markers: ClusterMarker[] = [];
    public _markerTree: Rbush<ClusterMarker> = new Rbush();
    public _nbChanges: number = 0;
    public _clusters: Cluster[] = [];

    public Size: number = 166;
    public ViewPadding: number = 0.2;

    public RegisterMarker(marker: ClusterMarker): void {
        if ((<any>marker)._removeFlag) {
            delete (<any>marker)._removeFlag;
        }
        this._markers.push(marker);
        this._markerTree.insert(marker);
        this._nbChanges += 1;
    }

    public RegisterMarkers(markers: ClusterMarker[]): void {
        this._markers.push(...markers);
        this._markerTree.load(markers);
    }

    public RemoveMarkers(markers?: ClusterMarker[]): void {
        if (!markers) {
            this._markers = [];
            this._markerTree.clear();
            return;
        }
        markers.forEach(marker => {
            this._markerTree.remove(marker);
            marker._removeFlag = true;
        });
        this._markers = this._markers.filter(marker => !(<any>marker)._removeFlag);
    }

    public ProcessView(bounds: Bounds): Cluster[] {
        this._resetClusterViews();
        const extendedBounds = this.GetExtendedBounds(bounds);
        const markersInView = this._markerTree.search({
            minX: extendedBounds.minLng,
            minY: extendedBounds.minLat,
            maxX: extendedBounds.maxLng,
            maxY: extendedBounds.maxLat
        });
        return this._clusterMarkersInView(markersInView);
    }

    public FindMarkersInArea(area: Bounds): ClusterMarker[] {
        return this._markerTree.search({
            minX: area.minLng,
            minY: area.minLat,
            maxX: area.maxLng,
            maxY: area.maxLat
        });
    }

    public FindMarkersBoundsInArea(area: Bounds): Bounds | null {
        return this.ComputeBounds(this.FindMarkersInArea(area));
    }

    public ComputeGlobalBounds(withFiltered: boolean = true): Bounds | null {
        return this.ComputeBounds(this._markers, withFiltered);
    }

    public GetMarkers(): ClusterMarker[] {
        return this._markers;
    }

    public GetPopulation(): number {
        return this._markers.length;
    }

    public ResetClusters(): void {
        this._clusters = [];
    }

    private _resetClusterViews() {
        this._clusters.forEach(cluster => cluster.Reset());
    }

    private _clusterMarkersInView(markers: ClusterMarker[]): Cluster[] {
        const clusters: Cluster[] = [];
        const workingClusterList: Cluster[] = [];
        for (const marker of markers) {
            if (marker.filtered) continue;
            let clusterFound = false;
            for (const cluster of workingClusterList) {
                if (checkPositionInsideBounds(marker.position, cluster.bounds)) {
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
        this._clusters = clusters;
        return clusters;
    }

    public ComputeBounds(markers: ClusterMarker[], withFiltered: boolean = true): Bounds | null {
        if (!markers || markers.length === 0) return null;
        let rMinLat = Number.MAX_VALUE, rMaxLat = -Number.MAX_VALUE, rMinLng = Number.MAX_VALUE,
            rMaxLng = -Number.MAX_VALUE;
        markers.forEach(marker => {
            if (!withFiltered && marker.filtered) return;
            const pos = marker.position;
            if (pos.lat < rMinLat) rMinLat = pos.lat;
            if (pos.lat > rMaxLat) rMaxLat = pos.lat;
            if (pos.lng < rMinLng) rMinLng = pos.lng;
            if (pos.lng > rMaxLng) rMaxLng = pos.lng;
        });
        return {minLat: rMinLat, maxLat: rMaxLat, minLng: rMinLng, maxLng: rMaxLng};
    }
}