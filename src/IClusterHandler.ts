import {Point} from "./Point";
import {Position} from "./Position";
import {Bounds} from "./Bounds";
import {Cluster} from "./Cluster";
import {IMarkerObject} from "./IMarkerObject.ts";

export interface IClusterHandler {
    Size: number;
    ViewPadding: number;
    Project: (lat: number, lng: number) => Point;
    UnProject: (x: number, y: number) => Position;

    RegisterMarker(marker: IMarkerObject): void;

    RegisterMarkers(markers: IMarkerObject[]): void;

    RemoveMarkers(markers?: IMarkerObject[]): void;

    ProcessView(bounds: Bounds): Cluster[];

    FindMarkersInArea(area: Bounds): IMarkerObject[];

    // ComputeBounds(markers?: IClusterObject[], withFiltered?: boolean, cluster?: Cluster): Bounds | null;

    FindMarkersBoundsInArea(area: Bounds): Bounds | null;

    ComputeGlobalBounds(withFiltered?: boolean): Bounds | null;

    GetMarkers(): IMarkerObject[];

    GetPopulation(): number;

    ResetClusters(): void;

    SortMarkers(): void;

    SortClusters(): void;

    IndexLowerBoundLng(lng: number): number;

    ResetClusterViews(): void;

    GetExtendedBounds(bounds: Bounds): Bounds;
}
