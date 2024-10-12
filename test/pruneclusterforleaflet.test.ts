// tests/PruneClusterForLeaflet.test.ts

// @ts-ignore
import {describe, test, beforeEach, expect, jest} from "bun:test";
import {Map, LatLng, LatLngBounds, Point} from "leaflet";
import PruneClusterForLeaflet from "../src/PruneClusterForLeaflet";
import ClusterMarker from "../src/ClusterMarker";
import {Bounds} from "../src/Bounds";
import {Position} from "../src/Position";

describe('PruneClusterForLeaflet', () => {
    let pruneClusterForLeaflet: PruneClusterForLeaflet;
    let mockMap: jest.Mocked<Map>;

    beforeEach(() => {
        mockMap = {
            on: jest.fn(),
            off: jest.fn(),
            getBounds: jest.fn().mockReturnValue(new LatLngBounds(new LatLng(0, 0), new LatLng(50, 50))),
            getZoom: jest.fn().mockReturnValue(10),
            getMaxZoom: jest.fn().mockReturnValue(18),
            getBoundsZoom: jest.fn().mockReturnValue(12),
            setView: jest.fn(),
            fitBounds: jest.fn(),
            fire: jest.fn(),
            removeLayer: jest.fn(),
            addLayer: jest.fn(),
            project: jest.fn((lat: number, lng: number) => {
                return {x: lat, y: lng} as Point;
            }),
            unproject: jest.fn((x: number, y: number) => {
                return {lat: x, lng: y} as Position;
            }),
        } as unknown as jest.Mocked<Map>;

        pruneClusterForLeaflet = new PruneClusterForLeaflet();
        pruneClusterForLeaflet.onAdd(mockMap);
    });

    test('should register a marker', () => {
        const marker = new ClusterMarker(10, 20);
        pruneClusterForLeaflet.Cluster.RegisterMarker(marker);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toContain(marker);
    });

    test('should remove all markers', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        pruneClusterForLeaflet.Cluster.RemoveMarkers();
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toHaveLength(0);
    });

    test('should find markers in area', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersInArea = pruneClusterForLeaflet.Cluster.FindMarkersInArea(bounds);
        expect(markersInArea).toContain(marker1);
        expect(markersInArea).toContain(marker2);
    });

    test('should compute global bounds', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const bounds = pruneClusterForLeaflet.Cluster.ComputeGlobalBounds();
        expect(bounds).toEqual({minLat: 10, maxLat: 30, minLng: 20, maxLng: 40});
    });

    test('should reset clusters', () => {
        const marker1 = new ClusterMarker(10, 20);
        pruneClusterForLeaflet.Cluster.RegisterMarker(marker1);
        pruneClusterForLeaflet.Cluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        pruneClusterForLeaflet.Cluster.ResetClusters();
        expect(pruneClusterForLeaflet.Cluster.GetPopulation()).toBe(1);
    });

    test('should process view and create clusters', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneClusterForLeaflet.Cluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(clusters.length).toBeGreaterThan(0);
    });

    test('should remove specific markers', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        pruneClusterForLeaflet.Cluster.RemoveMarkers([marker1]);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).not.toContain(marker1);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toContain(marker2);
    });

    test('should find markers bounds in area', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersBounds = pruneClusterForLeaflet.Cluster.FindMarkersBoundsInArea(bounds);
        expect(markersBounds).toEqual({minLat: 10, maxLat: 30, minLng: 20, maxLng: 40});
    });

    test('should handle markers with filtered flag', () => {
        const marker1 = new ClusterMarker(10, 20, {}, 0, 1, true); // filtered = true
        pruneClusterForLeaflet.Cluster.RegisterMarker(marker1);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersInArea = pruneClusterForLeaflet.Cluster.FindMarkersInArea(bounds);
        expect(markersInArea).toHaveLength(0);
    });

    test('should compute cluster bounds correctly', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const clusterBounds = pruneClusterForLeaflet.Cluster.ComputeBounds([marker1, marker2]);
        expect(clusterBounds).toEqual({minLat: 10, maxLat: 30, minLng: 20, maxLng: 40});
    });

    test('should handle overlapping clusters', () => {
        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(10, 20); // Same position as marker1
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneClusterForLeaflet.Cluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(clusters.length).toBe(1); // Both markers should be in one cluster
        expect(clusters[0].population).toBe(2); // Cluster population should be 2
    });

    test('should remove markers by filter', () => {
        const marker1 = new ClusterMarker(10, 20);
        pruneClusterForLeaflet.Cluster.RegisterMarker(marker1);
        pruneClusterForLeaflet.Cluster.RemoveMarkers([marker1]);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).not.toContain(marker1);
    });

    test('should filter out markers with filtered flag set to true', () => {
        const marker1 = new ClusterMarker(10, 20, {}, 0, 1, true); // filtered
        const marker2 = new ClusterMarker(30, 40, {}, 0, 1, false); // not filtered
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersInArea = pruneClusterForLeaflet.Cluster.FindMarkersInArea(bounds);
        expect(markersInArea).not.toContain(marker1); // Filtered marker should not appear
        expect(markersInArea).toContain(marker2); // Unfiltered marker should appear
    });
});