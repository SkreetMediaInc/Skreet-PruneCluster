// tests/Cluster.test.ts
import { Cluster } from '../src/Cluster';
import ClusterMarker from '../src/ClusterMarker';
// @ts-ignore
import { describe, expect, it, beforeEach } from "bun:test";

describe('Cluster', () => {
    let cluster: Cluster;
    let marker: ClusterMarker;

    beforeEach(() => {
        marker = new ClusterMarker(10, 20);
        cluster = new Cluster(marker);
    });

    // Covers lines 146-155: AddMarker Method
    it('should add a marker and update cluster properties', () => {
        const newMarker = new ClusterMarker(15, 25);
        cluster.AddMarker(newMarker);

        expect(cluster.population).toBe(2);
        expect(cluster.totalWeight).toBe(newMarker.weight + marker.weight);
        expect(cluster.averagePosition.lat).toBeCloseTo((marker.position.lat + newMarker.position.lat) / 2);
        expect(cluster.averagePosition.lng).toBeCloseTo((marker.position.lng + newMarker.position.lng) / 2);
    });

    // Covers line 185: Reset Method
    it('should reset the cluster', () => {
        Cluster.ENABLE_MARKERS_LIST = true; // Ensure markers list is enabled
        cluster.Reset();

        expect(cluster.population).toBe(0);
        expect(cluster.totalWeight).toBe(0);
        expect(cluster.stats).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
        expect(cluster.GetClusterMarkers()).toEqual([]);
    });
    it('should apply another cluster and merge properties', () => {
        const newCluster = new Cluster(new ClusterMarker(30, 40));
        newCluster.population = 3;
        newCluster.totalWeight = 5;
        newCluster.averagePosition = { lat: 25, lng: 35 };
        newCluster.bounds = { minLat: 20, maxLat: 30, minLng: 30, maxLng: 40 };

        // Ensure the stats in the new cluster are properly initialized
        newCluster.stats = [1, 2, 3, 4, 5, 6, 7, 8];

        // Set the category of the original marker to 0 for proper stats merging
        marker.category = 0;
        marker.weight = 1;

        cluster.ApplyCluster(newCluster);

        const expectedLat =
            (marker.position.lat * marker.weight + newCluster.averagePosition.lat * newCluster.totalWeight) /
            (marker.weight + newCluster.totalWeight);

        const expectedLng =
            (marker.position.lng * marker.weight + newCluster.averagePosition.lng * newCluster.totalWeight) /
            (marker.weight + newCluster.totalWeight);

        expect(cluster.population).toBe(4);
        expect(cluster.totalWeight).toBe(marker.weight + newCluster.totalWeight);
        expect(cluster.averagePosition.lat).toBeCloseTo(expectedLat);
        expect(cluster.averagePosition.lng).toBeCloseTo(expectedLng);
        expect(cluster.bounds.minLat).toBe(10);
        expect(cluster.bounds.maxLat).toBe(30);
        expect(cluster.bounds.minLng).toBe(20);
        expect(cluster.bounds.maxLng).toBe(40);

        // Adjust expected stats to reflect proper merging logic
        const expectedStats = [2, 2, 3, 4, 5, 6, 7, 8];
        expect(cluster.stats).toEqual(expectedStats);
    });


});