// src/AbstractPruneCluster.ts
import {ClusterMarker} from "./ClusterMarker";
import {Cluster} from "./Cluster";
import {insertionSort} from "./utils";
import {ICluster, Position, Point, Bounds} from "./types";

export abstract class AbstractCluster implements ICluster {
    Project!: (lat: number, lng: number) => Point;
    UnProject!: (x: number, y: number) => Position;
    public Size: number = 166;
    public ViewPadding: number = 0.2;

    public _markers: ClusterMarker[] = [];
    public _clusters: Cluster[] = [];
    public _nbChanges: number = 0;
    private position?: Position;

    public abstract RegisterMarker(marker: ClusterMarker): void;

    public abstract RegisterMarkers(markers: ClusterMarker[]): void;

    public abstract RemoveMarkers(markers?: ClusterMarker[]): void;

    public abstract ProcessView(bounds: Bounds): Cluster[];

    public abstract FindMarkersInArea(area: Bounds): ClusterMarker[];

    public abstract FindMarkersBoundsInArea(area: Bounds): Bounds | null;

    public abstract ComputeGlobalBounds(withFiltered?: boolean): Bounds | null;

    public abstract GetMarkers(): ClusterMarker[];

    public abstract GetPopulation(): number;

    public abstract ResetClusters(): void;

    public SortMarkers(): void {
        if (this._nbChanges) {
            this._markers.sort((a, b) => a.position.lng - b.position.lng);
            this._nbChanges = 0;
        }
    }

    public SortClusters(): void {
        insertionSort(this._clusters);
    }

    public IndexLowerBoundLng(lng: number): number {
        return this._markers.findIndex(marker => marker.position.lng >= lng);
    }

    public ResetClusterViews(): void {
        this._clusters.forEach(cluster => cluster.Reset());
    }

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

export default AbstractCluster;