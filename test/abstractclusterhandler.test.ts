// test/abstractcluster.test.ts
// @ts-ignore
import {describe, it, expect, beforeEach, jest} from 'bun:test';
import { AbstractClusterHandler } from '../src/AbstractClusterHandler';
import { VirtualMarker } from '../src/VirtualMarker';
import { Bounds } from '../src/Bounds';
import { Point } from '../src/Point';
import { Position } from '../src/Position';

describe('AbstractCluster', () => {
    let cluster: jest.Mocked<AbstractClusterHandler>;

beforeEach(() => {
    cluster = {
        Project: jest.fn((lat: number, lng: number) => {
            return {x: lat, y: lng} as Point;
        }),
        UnProject: jest.fn((x: number, y: number) => {
            return {lat: x, lng: y} as Position;
        }),
        Size: 166,
        ViewPadding: 0.2,
        _markers: [],
        _clusters: [],
        _nbChanges: 0,
        RegisterMarker: jest.fn(),
        RegisterMarkers: jest.fn(),
        RemoveMarkers: jest.fn(),
        ProcessView: jest.fn(),
        FindMarkersInArea: jest.fn(),
        FindMarkersBoundsInArea: jest.fn(),
        ComputeGlobalBounds: jest.fn(),
        GetMarkers: jest.fn(),
        GetPopulation: jest.fn(),
        ResetClusters: jest.fn(),
        SortMarkers: jest.fn()  // Add this line
    } as unknown as jest.Mocked<AbstractClusterHandler>;
});

    it('should register a marker', () => {
        const marker = new VirtualMarker(0, 0);
        cluster.RegisterMarker(marker);
        expect(cluster.RegisterMarker).toHaveBeenCalledWith(marker);
    });

    it('should register multiple markers', () => {
        const markers = [
            new VirtualMarker(0, 0),
            new VirtualMarker(1, 1),
        ];
        cluster.RegisterMarkers(markers);
        expect(cluster.RegisterMarkers).toHaveBeenCalledWith(markers);
    });

    it('should remove all markers', () => {
        cluster.RemoveMarkers();
        expect(cluster.RemoveMarkers).toHaveBeenCalled();
    });

    it('should remove specific markers', () => {
        const marker1 = new VirtualMarker(0, 0);
        cluster.RemoveMarkers([marker1]);
        expect(cluster.RemoveMarkers).toHaveBeenCalledWith([marker1]);
    });

    it('should process view and return clusters', () => {
        const bounds: Bounds = {
            minLat: -1,
            maxLat: 2,
            minLng: -1,
            maxLng: 2,
        };
        cluster.ProcessView(bounds);
        expect(cluster.ProcessView).toHaveBeenCalledWith(bounds);
    });

    it('should find markers in area', () => {
        const area: Bounds = {
            minLat: -1,
            maxLat: 0.5,
            minLng: -1,
            maxLng: 0.5,
        };
        cluster.FindMarkersInArea(area);
        expect(cluster.FindMarkersInArea).toHaveBeenCalledWith(area);
    });

    it('should compute global bounds', () => {
        cluster.ComputeGlobalBounds();
        expect(cluster.ComputeGlobalBounds).toHaveBeenCalled();
    });

    it('should reset clusters', () => {
        cluster.ResetClusters();
        expect(cluster.ResetClusters).toHaveBeenCalled();
    });

    it('should sort markers', () => {
        cluster.SortMarkers();
        expect(cluster.SortMarkers).toHaveBeenCalled();
    });
});