import {Position} from "./Position";

export interface IMarkerObject {
    position: Position;
    data: any;
    hashCode: number;
    filtered: boolean;
    weight: number;
    category: number;
    _removeFlag: boolean;
}

