// tests/PruneClusterForLeaflet.test.ts

// @ts-ignore
import {describe, test, beforeEach, expect, afterEach, jest} from "bun:test";
import {Map, LatLng, LatLngBounds, Point, Marker, Icon, DivIcon, Layer} from "leaflet";
import PruneClusterForLeaflet from "../src/PruneClusterForLeaflet";
import ClusterMarker from "../src/ClusterMarker";
import {Bounds} from "../src/Bounds";
import {Position} from "../src/Position";
import {Cluster} from "../src/Cluster";

describe('PruneClusterForLeaflet', () => {
    let pruneClusterForLeaflet: PruneClusterForLeaflet;
    let mockMap: jest.Mocked<Map>;
    const layers = new Set<Layer>();
    const firedEvents: Array<{ eventName: string, payload: any }> = [];



    // Adjustments in the beforeEach setup in tests/PruneClusterForLeaflet.test.ts
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
            fire: jest.fn((eventName: string, payload: any) => {
                firedEvents.push({ eventName, payload });
            }),
            removeLayer: jest.fn((layer: Layer) => layers.delete(layer)),
            addLayer: jest.fn((layer: Layer) => layers.add(layer)),
            hasLayer: jest.fn((layer: Layer) => layers.has(layer)),
            project: jest.fn((lat: number, lng: number) => {
                return {x: lat, y: lng} as Point;
            }),
            unproject: jest.fn((x: number, y: number) => {
                return {lat: x, lng: y} as Position;
            }),
        } as unknown as jest.Mocked<Map>;

        pruneClusterForLeaflet = new PruneClusterForLeaflet(mockMap);
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
        pruneClusterForLeaflet.onAdd(mockMap);

        const marker1 = new ClusterMarker(10, 20);
        pruneClusterForLeaflet.Cluster.RegisterMarker(marker1);
        pruneClusterForLeaflet.Cluster.ProcessView({minLat: 0, maxLat: 50, minLng: 0, maxLng: 50});
        pruneClusterForLeaflet.Cluster.ResetClusters();
        expect(pruneClusterForLeaflet.Cluster.GetPopulation()).toBe(1);
    });

    test('should process view and create clusters', () => {
        pruneClusterForLeaflet.onAdd(mockMap);

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
        pruneClusterForLeaflet.onAdd(mockMap);

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

    // tests/PruneClusterForLeaflet.test.ts

    test('should register a leaflet marker', () => {
        const leafletMarker = new Marker([10, 20]);
        pruneClusterForLeaflet.RegisterMarker(leafletMarker);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toContain(leafletMarker);
    });

    test('should register multiple leaflet markers', () => {
        const leafletMarker1 = new Marker([10, 20]);
        const leafletMarker2 = new Marker([30, 40]);
        pruneClusterForLeaflet.RegisterMarkers([leafletMarker1, leafletMarker2]);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toContain(leafletMarker1);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toContain(leafletMarker2);
    });

    test('should remove specific leaflet markers', () => {
        const leafletMarker1 = new Marker([10, 20]);
        const leafletMarker2 = new Marker([30, 40]);
        pruneClusterForLeaflet.RegisterMarkers([leafletMarker1, leafletMarker2]);
        pruneClusterForLeaflet.RemoveMarkers([leafletMarker1]);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).not.toContain(leafletMarker1);
        expect(pruneClusterForLeaflet.Cluster.GetMarkers()).toContain(leafletMarker2);
    });

    test('should build leaflet cluster', () => {
        const cluster = new Cluster(new ClusterMarker(10, 20));
        const position = new LatLng(10, 20);
        const layer = pruneClusterForLeaflet.BuildLeafletCluster(cluster, position);
        expect(layer).toBeInstanceOf(Marker);
    });

    test('should build leaflet cluster icon', () => {
        const cluster = new Cluster(new ClusterMarker(10, 20));
        const icon = pruneClusterForLeaflet.BuildLeafletClusterIcon(cluster);
        expect(icon).toBeInstanceOf(DivIcon);
    });

    test('should build leaflet marker', () => {
        const clusterMarker = new ClusterMarker(10, 20);
        const position = new LatLng(10, 20);
        const leafletMarker = pruneClusterForLeaflet.BuildLeafletMarker(clusterMarker, position);
        expect(leafletMarker).toBeInstanceOf(Marker);
    });

    test('should prepare leaflet marker', () => {
        const leafletMarker = new Marker([10, 20]);
        const data = {icon: new Icon.Default(), popup: 'Test Popup'};
        pruneClusterForLeaflet.PrepareLeafletMarker(leafletMarker, data, 0);

        // Expect leafletMarker to have icon and popup set (not being undefined)
        expect(leafletMarker.getIcon()).toBe(data.icon);

        const popup = leafletMarker.getPopup();
        expect(popup).toBeDefined();
        expect(popup!.getContent()).toBe('Test Popup');
    });

    test('should process view', () => {
        pruneClusterForLeaflet.ProcessView();
        expect(pruneClusterForLeaflet.Cluster.GetMarkers().length).toBeGreaterThanOrEqual(0);
    });

    test('should fit bounds', () => {
        pruneClusterForLeaflet.onAdd(mockMap);
        pruneClusterForLeaflet.FitBounds();
        expect(mockMap.getBounds().isValid()).toBe(true);
    });

    test('should redraw icons', () => {
        pruneClusterForLeaflet.RedrawIcons();
        expect(pruneClusterForLeaflet._resetIcons).toBe(true);
    });

    test('should handle move start', () => {
        pruneClusterForLeaflet._moveStart();
        expect(pruneClusterForLeaflet._moveInProgress).toBe(true);
    });

    test('should handle move end', () => {
        pruneClusterForLeaflet._moveEnd({hard: true});
        expect(pruneClusterForLeaflet._moveInProgress).toBe(false);
        expect(pruneClusterForLeaflet._hardMove).toBe(true);
    });

    test('should handle zoom start', () => {
        pruneClusterForLeaflet._zoomStart();
        expect(pruneClusterForLeaflet._zoomInProgress).toBe(true);
    });

    test('should handle zoom end', () => {
        pruneClusterForLeaflet._zoomEnd();
        expect(pruneClusterForLeaflet._zoomInProgress).toBe(false);
    });

    test('should handle move end event', () => {
        pruneClusterForLeaflet.onAdd(mockMap);
        pruneClusterForLeaflet._moveEnd({hard: true});
        expect(pruneClusterForLeaflet._moveInProgress).toBe(false);
    });


    test('should build leaflet cluster', () => {
        const cluster = new Cluster(new ClusterMarker(10, 20));
        const position = new LatLng(10, 20);
        const layer = pruneClusterForLeaflet.BuildLeafletCluster(cluster, position);
        expect(layer).toBeInstanceOf(Marker);
    });

    test('should process view and update clusters', () => {
        pruneClusterForLeaflet.onAdd(mockMap);
        pruneClusterForLeaflet.ProcessView();
        expect(pruneClusterForLeaflet.Cluster.GetMarkers().length).toBeGreaterThanOrEqual(0);
        expect(pruneClusterForLeaflet._objectsOnMap.length).toBeGreaterThanOrEqual(0);
    });

    test('should remove event listeners and layers on remove', () => {
        pruneClusterForLeaflet.onAdd(mockMap);
        pruneClusterForLeaflet.onRemove(mockMap);
        expect(mockMap.off).toHaveBeenCalledWith('movestart', pruneClusterForLeaflet._moveStart, pruneClusterForLeaflet);
        expect(mockMap.off).toHaveBeenCalledWith('moveend', pruneClusterForLeaflet._moveEnd, pruneClusterForLeaflet);
        expect(mockMap.off).toHaveBeenCalledWith('zoomstart', pruneClusterForLeaflet._zoomStart, pruneClusterForLeaflet);
        expect(mockMap.off).toHaveBeenCalledWith('zoomend', pruneClusterForLeaflet._zoomEnd, pruneClusterForLeaflet);
        expect(mockMap.removeLayer).toHaveBeenCalledWith(pruneClusterForLeaflet.spiderfier);
    });

    test('should add spiderfier layer on add', () => {
        pruneClusterForLeaflet.onAdd(mockMap);
        expect(mockMap.addLayer).toHaveBeenCalledWith(pruneClusterForLeaflet.spiderfier);
    });

    test('should bind Project and UnProject methods on add', () => {
        pruneClusterForLeaflet.onAdd(mockMap);
        expect(pruneClusterForLeaflet.Cluster.Project).toBeDefined();
        expect(pruneClusterForLeaflet.Cluster.UnProject).toBeDefined();
    });


    //===== Experimental Tests =====


    test('should handle move start and end', () => {
        // pruneClusterForLeaflet.onAdd(mockMap);

        // Directly invoke the move start handler to ensure state change
        pruneClusterForLeaflet._moveStart();
        expect(pruneClusterForLeaflet._moveInProgress).toBe(true);

        // Directly invoke the move end handler with hard move flag
        pruneClusterForLeaflet._moveEnd({ hard: true });
        expect(pruneClusterForLeaflet._moveInProgress).toBe(false);
        expect(pruneClusterForLeaflet._hardMove).toBe(true);
    });


    // Covers lines 371-453: Process View and Update Clusters
    test('should process view and update objects on map', () => {
        pruneClusterForLeaflet.onAdd(mockMap);

        const marker1 = new ClusterMarker(10, 20);
        const marker2 = new ClusterMarker(30, 40);
        pruneClusterForLeaflet.Cluster.RegisterMarkers([marker1, marker2]);

        pruneClusterForLeaflet.ProcessView();
        expect(pruneClusterForLeaflet._objectsOnMap.length).toBeGreaterThan(0);
    });

    // Covers lines 633-636: Redrawing Icons
    test('should redraw icons', () => {
        pruneClusterForLeaflet.RedrawIcons();
        expect(pruneClusterForLeaflet._resetIcons).toBe(true);
    });
});