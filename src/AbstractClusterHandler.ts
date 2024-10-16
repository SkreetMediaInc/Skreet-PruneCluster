// src/AbstractPruneCluster.ts
import {VirtualMarker} from "./VirtualMarker.ts";
import {Cluster} from "./Cluster";
import {insertionSort} from "./utils";
import {IClusterHandler} from "./IClusterHandler.ts";
import {Point} from "./Point";
import {Position} from "./Position";
import {Bounds} from "./Bounds";

export abstract class AbstractClusterHandler implements IClusterHandler {

    Project!: (lat: number, lng: number) => Point;
    UnProject!: (x: number, y: number) => Position;
    public Size: number = 166;
    public ViewPadding: number = 0.2;

    public _markers: VirtualMarker[] = [];
    public _clusters: Cluster[] = [];
    public _nbChanges: number = 0;
    private position?: Position;

    public abstract RegisterMarker(marker: VirtualMarker): void;

    public abstract RegisterMarkers(markers: VirtualMarker[]): void;

    public abstract RemoveMarkers(markers?: VirtualMarker[]): void;

    public abstract ProcessView(bounds: Bounds): Cluster[];

    public abstract FindMarkersInArea(area: Bounds): VirtualMarker[];

    public abstract FindMarkersBoundsInArea(area: Bounds): Bounds | null;

    public abstract ComputeGlobalBounds(withFiltered?: boolean): Bounds | null;

    public abstract GetMarkers(): VirtualMarker[];

    public abstract GetPopulation(): number;

    public abstract ResetClusters(): void;

    public SortMarkers(): void {
        if (this._nbChanges) {
                // console.log(`Sorting ${this._markers.length} markers`);
            this._markers.sort((a, b) => {
                return a.position.lng - b.position.lng;
            });
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

export default AbstractClusterHandler;