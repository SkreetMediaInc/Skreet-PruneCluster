// src/PruneCluster.ts
import AbstractCluster from "./AbstractCluster";
import ClusterMarker from "./ClusterMarker";
import {Cluster} from "./Cluster";
import {Bounds} from "./Bounds";
import {checkPositionInsideBounds, ComputeBounds} from "./utils";
import {Position} from "./Position";
import {Point} from "./Point";

export class PruneCluster extends AbstractCluster {
    public Project!: (lat: number, lng: number) => Point;
    public UnProject!: (x: number, y: number) => Position;

    public RegisterMarker(marker: ClusterMarker): void {
        if ((<any>marker)._removeFlag) {
            delete (<any>marker)._removeFlag;
        }
        this._markers.push(marker);
        this._nbChanges += 1;
    }

    public RegisterMarkers(markers: ClusterMarker[]): void {
        markers.forEach(marker => this.RegisterMarker(marker));
    }

    public RemoveMarkers(markers?: ClusterMarker[]): void {
        if (!markers) {
            this._markers = [];
            return;
        }
        markers.forEach(marker => (<any>marker)._removeFlag = true);
        this._markers = this._markers.filter(marker => !(<any>marker)._removeFlag);
    }

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
                console.debug(`Cluster position: ${cluster.position.lat}, ${cluster.position.lng}`);
                console.debug(`Marker position: ${markerPosition.lat}, ${markerPosition.lng}`);
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
                console.debug(`New cluster position: ${newCluster.position.lat}, ${newCluster.position.lng}`);
                newCluster.ComputeBounds(this);
                console.debug(`New Cluster ComputeBounds called`)
                clusters.push(newCluster);
                workingClusterList.push(newCluster);
            }
        }

        this._clusters = clusters.filter(cluster => cluster.population > 0);
        this.SortClusters();
        return this._clusters;
    }

    public FindMarkersInArea(area: Bounds): ClusterMarker[] {
        return this._markers.filter(marker => !marker.filtered && checkPositionInsideBounds(marker.position, area));
    }

    public ComputeBounds(markers: ClusterMarker[], withFiltered: boolean = true): Bounds | null {
        return ComputeBounds(markers, withFiltered);
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
}