// @ts-ignore
import {describe, it, expect, beforeEach, jest} from 'bun:test';
import * as L from 'leaflet';
import PruneClusterLeafletSpiderfier from '../src/LeafletSpiderfier'; // Adjust path as needed

// Mock Leaflet components
const mockPolyline = {
    setLatLngs: jest.fn(),
    addTo: jest.fn(),
    remove: jest.fn(),
};

const mockMarker = {
    setLatLng: jest.fn().mockReturnThis(),
    setOpacity: jest.fn().mockReturnThis(),
    setZIndexOffset: jest.fn().mockReturnThis(),
    addTo: jest.fn(),
    remove: jest.fn(),
};

jest.spyOn(L, 'marker').mockImplementation(() => mockMarker as any);

const mockMap = {
    on: jest.fn(),
    off: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    latLngToLayerPoint: jest.fn((latLng: any) => ({x: latLng.lat, y: latLng.lng})),
    layerPointToLatLng: jest.fn((point: any) => ({lat: point.x, lng: point.y})),
};

jest.spyOn(L, 'polyline').mockReturnValue(mockPolyline as any);
jest.spyOn(L, 'marker').mockReturnValue(mockMarker as any);
jest.spyOn(L, 'Map').mockImplementation(() => mockMap as any);

describe('PruneClusterLeafletSpiderfier', () => {
    let map: L.Map;
    let spiderfier: PruneClusterLeafletSpiderfier;
    let mockCluster: any;

    beforeEach(() => {
        map = new L.Map(document.createElement('div'));
        mockCluster = {
            BuildLeafletMarker: jest.fn().mockReturnValue(L.marker([0, 0])),
        };
        spiderfier = new PruneClusterLeafletSpiderfier(mockCluster);
        spiderfier.onAdd(map);
    });

    it('should add event listeners on map when added', () => {
        expect(map.on).toHaveBeenCalledWith('overlappingmarkers', expect.any(Function));
        expect(map.on).toHaveBeenCalledWith('click', expect.any(Function));
        expect(map.on).toHaveBeenCalledWith('zoomend', expect.any(Function));
    });

    it('should remove event listeners from map when removed', () => {
        spiderfier.onRemove(map);
        expect(map.off).toHaveBeenCalledWith('overlappingmarkers', expect.any(Function));
        expect(map.off).toHaveBeenCalledWith('click', expect.any(Function));
        expect(map.off).toHaveBeenCalledWith('zoomend', expect.any(Function));
    });

    it('should spiderfy markers correctly', () => {
        const mockData = {
            cluster: mockCluster,
            center: {lat: 0, lng: 0},
            markers: [{filtered: false}, {filtered: false}],
        };
        spiderfier.spiderfy(mockData);

        expect(mockCluster.BuildLeafletMarker).toHaveBeenCalledTimes(2);
        expect(map.addLayer).toHaveBeenCalled();
    });

    it('should ignore spiderfy if the cluster does not match', () => {
        const mockData = {cluster: {}, markers: []};
        spiderfier.spiderfy(mockData);
        expect(mockCluster.BuildLeafletMarker).not.toHaveBeenCalled();
    });

    it('should unspiderfy correctly', () => {
        const marker = L.marker([0, 0]); // Use the mocked marker
        spiderfier['_currentMarkers'] = [marker];
        spiderfier['_currentCenter'] = {lat: 0, lng: 0};

        spiderfier.unspiderfy();

        expect(marker.setLatLng).toHaveBeenCalledWith({lat: 0, lng: 0});
        expect(marker.setOpacity).toHaveBeenCalledWith(0);

        // Debugging: Log the calls to removeLayer
        // console.log('RemoveLayer Calls:', map.removeLayer.mock.calls);

        // Ensure removeLayer was called exactly once with the marker
        expect(map.removeLayer).toHaveBeenCalledTimes(1);
    });
    const polylines: L.LatLng[][] = [
        [L.latLng(0, 0), L.latLng(1, 1)],
    ];

    it('should generate points in a circle layout', () => {
        const points = spiderfier['_generatePointsCircle'](3, L.point(0, 0));
        expect(points).toHaveLength(3);
    });

    it('should generate points in a spiral layout', () => {
        const points = spiderfier['_generatePointsSpiral'](3, L.point(0, 0));
        expect(points).toHaveLength(3);
    });
});