import {Cluster} from "./Cluster";
import {Point} from "./Point";
import {Position} from "./Position";
import {Bounds} from "./Bounds";
import {Marker as LMarker} from "leaflet";


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

    ComputeBounds(markers?: IClusterObject[], withFiltered?: boolean, cluster?: Cluster): Bounds | null;

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

export interface IClusterObject {
    position: Position;
    data: any;
    hashCode: number;
    filtered: boolean;
    weight: number;
    category: number;
    _removeFlag: boolean;
}


// The adapter store these properties inside L.Marker objects
export interface LeafletMarker extends LMarker {
    _population?: number;
    _hashCode?: number;
    _zoomLevel?: number;
    _removeFromMap?: boolean;
}