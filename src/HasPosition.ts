// Marker-like object interface

import {Position} from "./Position";

export interface HasPosition {
    position: Position;
    filtered?: boolean;  // Optional filtered flag for markers
}
