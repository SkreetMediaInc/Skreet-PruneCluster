import {Point} from "./Point";
import {Position} from "./Position";
import {Bounds} from "./Bounds";
import {Cluster} from "./Cluster";
import {IClusterObject} from "./IClusterObject";

export interface ICluster {
    Size: number;
    ViewPadding: number;
    Project: (lat: number, lng: number) => Point;
    UnProject: (x: number, y: number) => Position;

    RegisterMarker(marker: IClusterObject): void;

    RegisterMarkers(markers: IClusterObject[]): void;

    RemoveMarkers(markers?: IClusterObject[]): void;

    ProcessView(bounds: Bounds): Cluster[];

    FindMarkersInArea(area: Bounds): IClusterObject[];

    // ComputeBounds(markers?: IClusterObject[], withFiltered?: boolean, cluster?: Cluster): Bounds | null;

    FindMarkersBoundsInArea(area: Bounds): Bounds | null;

    ComputeGlobalBounds(withFiltered?: boolean): Bounds | null;

    GetMarkers(): IClusterObject[];

    GetPopulation(): number;

    ResetClusters(): void;

    SortMarkers(): void;

    SortClusters(): void;

    IndexLowerBoundLng(lng: number): number;

    ResetClusterViews(): void;

    GetExtendedBounds(bounds: Bounds): Bounds;
}
