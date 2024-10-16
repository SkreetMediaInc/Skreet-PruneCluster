// tests/PruneCluster.test.ts

// @ts-ignore
import {describe, test, beforeEach, expect, mock} from "bun:test";
import {PruneCluster} from "../src/PruneCluster";
import VirtualMarker from "../src/VirtualMarker";
import {Bounds} from "../src/Bounds";


describe('PruneCluster', () => {
    let pruneCluster: PruneCluster;

    beforeEach(() => {
        pruneCluster = new PruneCluster();
        pruneCluster.Project = (lat, lng) => ({x: lat, y: lng});
        pruneCluster.UnProject = (x, y) => ({lat: x, lng: y});
    });

    test('should register a marker', () => {
        const marker = new VirtualMarker(10, 20);
        pruneCluster.RegisterMarker(marker);
        expect(pruneCluster.GetMarkers()).toContain(marker);
    });

    test('should remove all markers', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        pruneCluster.RemoveMarkers();
        expect(pruneCluster.GetMarkers()).toHaveLength(0);
    });

    test('should find markers in area', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersInArea = pruneCluster.FindMarkersInArea(bounds);
        expect(markersInArea).toContain(marker1);
        expect(markersInArea).toContain(marker2);
    });

    test('should compute global bounds', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const bounds = pruneCluster.ComputeGlobalBounds();
        expect(bounds).toEqual({minLat: 10, maxLat: 30, minLng: 20, maxLng: 40});
    });

    test('should reset clusters', () => {
        const marker1 = new VirtualMarker(10, 20);
        pruneCluster.RegisterMarker(marker1);
        pruneCluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        pruneCluster.ResetClusters();
        expect(pruneCluster.GetPopulation()).toBe(1);
    });

    test('should process view and create clusters', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneCluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(clusters.length).toBeGreaterThan(0);
    });

    test('should remove specific markers', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        pruneCluster.RemoveMarkers([marker1]);
        expect(pruneCluster.GetMarkers()).not.toContain(marker1);
        expect(pruneCluster.GetMarkers()).toContain(marker2);
    });

    test('should find markers bounds in area', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersBounds = pruneCluster.FindMarkersBoundsInArea(bounds);
        expect(markersBounds).toEqual({minLat: 10, maxLat: 30, minLng: 20, maxLng: 40});
    });

    test('should handle empty markers list in ComputeBounds', () => {
        const bounds = pruneCluster.ComputeBounds([]);
        expect(bounds).toBeNull();
    });

    test('should handle markers with filtered flag in ComputeBounds', () => {
        const marker1 = new VirtualMarker(10, 20, {}, 0, 1, true);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const bounds = pruneCluster.ComputeBounds(pruneCluster.GetMarkers(), false);
        expect(bounds).toEqual({minLat: 30, maxLat: 30, minLng: 40, maxLng: 40});
    });


    test('should handle markers with different categories', () => {
        const marker1 = new VirtualMarker(10, 20, {}, 1); // category 1
        const marker2 = new VirtualMarker(30, 40, {}, 2); // category 2
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneCluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(clusters.length).toBe(2); // Two separate clusters
        expect(clusters[0].stats[1]).toBe(1); // First cluster stats for category 1
        expect(clusters[1].stats[2]).toBe(1); // Second cluster stats for category 2
    });


    test('should handle markers with different weights', () => {
        const marker1 = new VirtualMarker(10, 20, {}, 0, 2); // weight: 2
        const marker2 = new VirtualMarker(30, 40, {}, 0, 3); // weight: 3
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneCluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(clusters.length).toBe(2); // Two clusters, one for each marker
        expect(clusters[0].totalWeight).toBe(2); // First cluster has weight 2
        expect(clusters[1].totalWeight).toBe(3); // Second cluster has weight 3
    });


    test('should handle markers with the same position', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(10, 20); // Same position as marker1
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneCluster.ProcessView({ minLat: 0, maxLat: 50, minLng: 0, maxLng: 50 });

        // Ensure both markers are clustered together
        expect(clusters.length).toBe(1); // Only one cluster for both markers
        expect(clusters[0].population).toBe(2); // Population of the cluster should be 2
    });
    test('should handle markers with forceIconRedraw flag', () => {
        const marker1 = new VirtualMarker(10, 20);
        marker1.data.forceIconRedraw = true;
        pruneCluster.RegisterMarker(marker1);
        pruneCluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(marker1.data.forceIconRedraw).toBe(true);
    });

    test('should handle markers with custom data', () => {
        const marker1 = new VirtualMarker(10, 20, {name: 'Marker 1'});
        pruneCluster.RegisterMarker(marker1);
        const markers = pruneCluster.GetMarkers();
        expect(markers[0].data.name).toBe('Marker 1');
    });

    test('should handle markers with custom icon and popup', () => {
        const marker1 = new VirtualMarker(10, 20);
        marker1.data.icon = 'custom-icon';
        marker1.data.popup = 'custom-popup';
        pruneCluster.RegisterMarker(marker1);
        const markers = pruneCluster.GetMarkers();
        expect(markers[0].data.icon).toBe('custom-icon');
        expect(markers[0].data.popup).toBe('custom-popup');
    });


    test('should handle markers with filtered flag', () => {
        const marker1 = new VirtualMarker(10, 20, {}, 0, 1, true); // filtered = true
        pruneCluster.RegisterMarker(marker1);
        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersInArea = pruneCluster.FindMarkersInArea(bounds);

        // Marker should be filtered out and not appear in the area
        expect(markersInArea).toHaveLength(0);
    });


    test('should compute cluster bounds correctly', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const clusterBounds = pruneCluster.ComputeBounds([marker1, marker2]);
        expect(clusterBounds).toEqual({minLat: 10, maxLat: 30, minLng: 20, maxLng: 40});
    });

    test('should handle overlapping clusters', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(10, 20); // Same position as marker1
        pruneCluster.RegisterMarkers([marker1, marker2]);
        const clusters = pruneCluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        expect(clusters.length).toBe(1); // Both markers should be in one cluster
        expect(clusters[0].population).toBe(2); // Cluster population should be 2
    });


    test('should remove markers by filter', () => {
        const marker1 = new VirtualMarker(10, 20);
        pruneCluster.RegisterMarker(marker1);
        pruneCluster.RemoveMarkers([marker1]);
        expect(pruneCluster.GetMarkers()).not.toContain(marker1);
    });

    test('should use native sort when nbChanges exceeds 300', () => {
        for (let i = 0; i < 350; i++) {
            const marker = new VirtualMarker(i, i);
            pruneCluster.RegisterMarker(marker);
        }
        pruneCluster.ProcessView({minLat: 0, maxLat: 500, minLng: 0, maxLng: 500});
        expect(pruneCluster.GetMarkers().length).toBe(350); // Check markers are sorted
    });

    test('should use insertion sort when changes are less than 300', () => {
        for (let i = 0; i < 150; i++) {
            const marker = new VirtualMarker(i, i);
            pruneCluster.RegisterMarker(marker);
        }
        pruneCluster.ProcessView({minLat: 0, maxLat: 200, minLng: 0, maxLng: 200});
        expect(pruneCluster.GetMarkers().length).toBe(150);
    });

    test('should compute bounds for clusters at the edge of view', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(50, 60);
        pruneCluster.RegisterMarkers([marker1, marker2]);

        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const clusters = pruneCluster.ProcessView(bounds);

        expect(clusters.length).toBeGreaterThan(0);
        const computedBounds = pruneCluster.ComputeBounds(clusters.map(c => c.lastMarker));
        expect(computedBounds!.minLat).toBe(10); // Confirm bounds
        expect(computedBounds!.maxLng).toBe(60);
    });

    test('should remove markers with _removeFlag', () => {
        const marker1 = new VirtualMarker(10, 20);
        const marker2 = new VirtualMarker(30, 40);
        pruneCluster.RegisterMarkers([marker1, marker2]);

        marker1["_removeFlag"] = true;
        pruneCluster.RemoveMarkers([marker1]);
        expect(pruneCluster.GetMarkers()).not.toContain(marker1);
        expect(pruneCluster.GetMarkers()).toContain(marker2);
    });

    test('should filter out markers with filtered flag set to true', () => {
        const marker1 = new VirtualMarker(10, 20, {}, 0, 1, true); // filtered
        const marker2 = new VirtualMarker(30, 40, {}, 0, 1, false); // not filtered
        pruneCluster.RegisterMarkers([marker1, marker2]);

        const bounds: Bounds = {minLat: 0, maxLat: 50, minLng: 0, maxLng: 50};
        const markersInArea = pruneCluster.FindMarkersInArea(bounds);
        expect(markersInArea).not.toContain(marker1); // Filtered marker should not appear
        expect(markersInArea).toContain(marker2); // Unfiltered marker should appear
    });

});