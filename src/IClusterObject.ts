import {Position} from "./Position";

export interface IClusterObject {
    position: Position;
    data: any;
    hashCode: number;
    filtered: boolean;
    weight: number;
    category: number;
    _removeFlag: boolean;
}

