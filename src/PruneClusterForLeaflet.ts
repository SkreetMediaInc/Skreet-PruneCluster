import {
    Map,
    LatLng,
    DivIcon,
    Marker,
    Point,
    LatLngBounds,
    Layer,
    Icon,
    Util,
    DomUtil,
    map,
    marker,
    control
} from 'leaflet';
import {Cluster} from "./Cluster";
import ClusterMarker from "./ClusterMarker";
import {PruneCluster} from "./PruneCluster";
import {LeafletMarker} from "./LeafletMarker";
import {Bounds} from "./Bounds";
import {PruneClusterLeafletSpiderfier} from "./LeafletSpiderfier";

// @ts-ignore
export interface LeafletAdapter implements Layer {
    Cluster: PruneCluster;

    onAdd: (map: L.Map) => this;
    onRemove: (map: L.Map) => this;

    RegisterMarker: (marker: Marker) => void;
    RegisterMarkers: (markers: Marker[]) => void;
    RemoveMarkers: (markers: Marker[]) => void;
    ProcessView: () => void;
    FitBounds: (withFiltered?: boolean) => void;
    GetMarkers: () => Marker[];
    RedrawIcons: (processView?: boolean) => void;

    BuildLeafletCluster: (cluster: Cluster, position: LatLng) => Layer;
    BuildLeafletClusterIcon: (cluster: Cluster) => Icon | DivIcon;
    BuildLeafletMarker: (marker: any, position: LatLng) => Marker;
    PrepareLeafletMarker: (marker: any, data: {}, category: number) => void;
}


// What is inside cluster.data objects
export interface ILeafletAdapterData {
    _leafletMarker?: LeafletMarker;
    _leafletCollision?: boolean;
    _leafletOldPopulation?: number;
    _leafletOldHashCode?: number;
    _leafletPosition?: LatLng;
}


export class PruneClusterForLeaflet extends Layer implements LeafletAdapter {
    Cluster: PruneCluster;
    spiderfier: any;
    _objectsOnMap: any[];
    // @ts-ignore
    _map: Map | null;
    _moveInProgress: boolean;
    _zoomInProgress: boolean;
    _hardMove: boolean;
    _resetIcons: boolean;
    _removeTimeoutId: number;
    _markersRemoveListTimeout: any[];
    clusterMargin: number;

    constructor(size: number = 120, clusterMargin: number = 20) {
        super();
        this.Cluster = new PruneCluster();
        this.Cluster.Size = size;

        this.clusterMargin = Math.min(clusterMargin, size / 4);

        // Bind the Leaflet project and unproject methods to the cluster
        this.Cluster.Project = (lat: number, lng: number) => {
            if (!this._map) {
                throw new Error('Map is not defined');
            }

            let projection = this._map!.project(new LatLng(lat, lng), Math.floor(this._map!.getZoom()));
            return projection;
        }

        this.Cluster.UnProject = (x: number, y: number) =>
            this._map!.unproject(new Point(x, y), Math.floor(this._map!.getZoom()));

        this.clusterMargin = Math.min(clusterMargin, size / 4);
        this._objectsOnMap = [];
        this.spiderfier = new PruneClusterLeafletSpiderfier(this);
        this._hardMove = false;
        this._resetIcons = false;
        this._removeTimeoutId = 0;
        this._markersRemoveListTimeout = [];
        this._moveInProgress = false;
        this._zoomInProgress = false;
        this._map = null;
    }

    onAdd(map: Map): this {
        this._map = map;

        // Bind the Leaflet project and unproject methods to the cluster
        this.Cluster.Project = (lat: number, lng: number) =>
            this._map!.project(new LatLng(lat, lng), Math.floor(this._map!.getZoom()));

        this.Cluster.UnProject = (x: number, y: number) =>
            this._map!.unproject(new Point(x, y), Math.floor(this._map!.getZoom()));

        map.on('movestart', this._moveStart.bind(this), this);
        // @ts-ignore
        map.on('moveend', this._moveEnd.bind(this), this);
        map.on('zoomstart', this._zoomStart.bind(this), this);
        map.on('zoomend', this._zoomEnd.bind(this), this);
        this.ProcessView();

        map.addLayer(this.spiderfier);
        return this;
    }

    onRemove(map: Map): any {
        map.off('movestart', this._moveStart, this);
        //@ts-ignore
        map.off('moveend', this._moveEnd, this);
        map.off('zoomstart', this._zoomStart, this);
        map.off('zoomend', this._zoomEnd, this);

        this._objectsOnMap.forEach(object => map.removeLayer(object.data._leafletMarker));
        this._objectsOnMap = [];
        this.Cluster.ResetClusters();

        map.removeLayer(this.spiderfier);
        this._map = null;
        return this;
    }

    RegisterMarker(marker: ClusterMarker | Marker): void {
        // @ts-ignore
        this.Cluster.RegisterMarker(marker);
    }

    RegisterMarkers(markers: ClusterMarker[] | Marker[]): void {
        // @ts-ignore
        this.Cluster.RegisterMarkers(markers);
    }

    RemoveMarkers(markers: Marker[]): void {
        // @ts-ignore
        this.Cluster.RemoveMarkers(markers);
    }

    BuildLeafletCluster(cluster: Cluster, position: LatLng): Layer {
        const marker = new Marker(position, {
            icon: this.BuildLeafletClusterIcon(cluster)
        });

        // @ts-ignore
        marker['_leafletClusterBounds'] = cluster.bounds;

        marker.on('click', () => {
            // @ts-ignore
            const cbounds = marker['_leafletClusterBounds'] as Bounds;
            let markersArea = this.Cluster.FindMarkersInArea(cbounds);
            const bounds = this.Cluster.ComputeBounds(markersArea);

            if (bounds) {
                const leafletBounds = new LatLngBounds(
                    new LatLng(bounds.minLat, bounds.maxLng),
                    new LatLng(bounds.maxLat, bounds.minLng)
                );

                const zoomLevelBefore = this._map!.getZoom();
                let zoomLevelAfter = this._map!.getBoundsZoom(leafletBounds, false, new Point(20, 20));

                // If the zoom level doesn't change
                if (zoomLevelAfter === zoomLevelBefore) {

                    // We need to filter the markers because the may be contained
                    // by other clusters on the map (in case of a cluster merge)
                    var filteredBounds: Bounds[] = [];

                    // The first step is identifying the clusters in the map that are inside the bounds
                    for (var i = 0, l = this._objectsOnMap.length; i < l; ++i) {
                        let o = <Cluster>this._objectsOnMap[i];

                        if (o.data._leafletMarker !== marker) {
                            if (o.bounds.minLat >= cbounds.minLat &&
                                o.bounds.maxLat <= cbounds.maxLat &&
                                o.bounds.minLng >= cbounds.minLng &&
                                o.bounds.maxLng <= cbounds.maxLng) {
                                filteredBounds.push(o.bounds);
                            }
                        }
                    }

                    // Filter the markers
                    if (filteredBounds.length > 0) {
                        const newMarkersArea = [];
                        const ll = filteredBounds.length;
                        for (i = 0, l = markersArea.length; i < l; ++i) {
                            var markerPos = markersArea[i].position;
                            var isFiltered = false;
                            for (let j = 0; j < ll; ++j) {
                                const currentFilteredBounds = filteredBounds[j];
                                if (markerPos.lat >= currentFilteredBounds.minLat &&
                                    markerPos.lat <= currentFilteredBounds.maxLat &&
                                    markerPos.lng >= currentFilteredBounds.minLng &&
                                    markerPos.lng <= currentFilteredBounds.maxLng) {
                                    isFiltered = true;
                                    break;
                                }
                            }
                            if (!isFiltered) {
                                newMarkersArea.push(markersArea[i]);
                            }
                        }
                        markersArea = newMarkersArea;
                    }

                    // TODO use an option registered somewhere
                    if (markersArea.length < 200 || zoomLevelAfter >= this._map!.getMaxZoom()) {

                        // Send an event for the LeafletSpiderfier
                        this._map!.fire('overlappingmarkers', {
                            cluster: this,
                            markers: markersArea,
                            center: marker.getLatLng(),
                            marker: marker
                        });

                    } else {
                        zoomLevelAfter++;
                    }

                    this._map!.setView(marker.getLatLng(), zoomLevelAfter);
                } else {
                    this._map!.fitBounds(leafletBounds);
                }

            }
        });

        return marker;
    }

    BuildLeafletClusterIcon(cluster: Cluster): Icon | DivIcon {
        let className = 'prunecluster prunecluster-';
        let iconSize = 38;
        const maxPopulation = this.Cluster.GetPopulation();

        if (cluster.population < Math.max(10, maxPopulation * 0.01)) {
            className += 'small';
        } else if (cluster.population < Math.max(100, maxPopulation * 0.05)) {
            className += 'medium';
            iconSize = 40;
        } else {
            className += 'large';
            iconSize = 44;
        }

        return new DivIcon({
            html: `<div><span>${cluster.population}</span></div>`,
            className,
            iconSize: new Point(iconSize, iconSize),
        });
    }

    BuildLeafletMarker(marker: ClusterMarker, position: LatLng): Marker {
        const leafletMarker = new Marker(position);
        this.PrepareLeafletMarker(leafletMarker, marker.data, marker.category);
        return leafletMarker;
    }

    PrepareLeafletMarker(marker: Marker, data: any, category: number): void {
        if (data.icon) {
            marker.setIcon(typeof data.icon === 'function' ? data.icon(data, category) : data.icon);
        }

        if (data.popup) {
            const content = typeof data.popup === 'function' ? data.popup(data, category) : data.popup;
            marker.bindPopup(content, data.popupOptions);
        }
    }

    ProcessView() {
        let latMargin;
        let lngMargin;
        let marker: any;
// Don't do anything during the map manipulation
        if (!this._map || this._zoomInProgress || this._moveInProgress) {
            return;
        }

        let map = this._map,
            bounds = map.getBounds(),
            zoom = Math.floor(map.getZoom()),
            marginRatio = this.clusterMargin / this.Cluster.Size,
            resetIcons = this._resetIcons;

        let southWest = bounds.getSouthWest(),
            northEast = bounds.getNorthEast();

// First step : Compute the clusters
        let clusters: Cluster[] = this.Cluster.ProcessView({
            minLat: southWest.lat,
            minLng: southWest.lng,
            maxLat: northEast.lat,
            maxLng: northEast.lng
        });

        let objectsOnMap: Cluster[] = this._objectsOnMap,
            newObjectsOnMap: Cluster[] = [],
            markersOnMap: Marker[] = new Array(objectsOnMap.length);

// Second step : By default, all the leaflet markers should be removed
        for (let i = 0, l = objectsOnMap.length; i < l; ++i) {
            marker = (objectsOnMap[i].data)._leafletMarker;
            markersOnMap[i] = marker;
            marker._removeFromMap = true;
        }

        let clusterCreationList: Cluster[] = [];
        let clusterCreationListPopOne: Cluster[] = [];

        let opacityUpdateList: any[] = [];

// Third step : anti collapsing system
// => merge collapsing cluster using a sweep and prune algorithm
        let workingList: Cluster[] = [];

        for (let i = 0, l = clusters.length; i < l; ++i) {
            let icluster = clusters[i],
                iclusterData = <ILeafletAdapterData>icluster.data;

            latMargin = (icluster.bounds.maxLat - icluster.bounds.minLat) * marginRatio;
            lngMargin = (icluster.bounds.maxLng - icluster.bounds.minLng) * marginRatio;

            for (let j = 0, ll = workingList.length; j < ll; ++j) {
                let c = workingList[j];
                if (c.bounds.maxLng < icluster.bounds.minLng) {
                    workingList.splice(j, 1);
                    --j;
                    --ll;
                    continue;
                }

                let oldMaxLng = c.averagePosition.lng + lngMargin,
                    oldMinLat = c.averagePosition.lat - latMargin,
                    oldMaxLat = c.averagePosition.lat + latMargin,
                    newMinLng = icluster.averagePosition.lng - lngMargin,
                    newMinLat = icluster.averagePosition.lat - latMargin,
                    newMaxLat = icluster.averagePosition.lat + latMargin;

                // Collapsing detected
                if (oldMaxLng > newMinLng && oldMaxLat > newMinLat && oldMinLat < newMaxLat) {
                    iclusterData._leafletCollision = true;
                    c.ApplyCluster(icluster);
                    break;
                }
            }

            // If the object is not in collision, we keep it in the process
            if (!iclusterData._leafletCollision) {
                workingList.push(icluster);
            }

        }

// Fourth step : update the already existing leaflet markers and create
// a list of required new leaflet markers 
        clusters.forEach((cluster: Cluster) => {
            let m = undefined;
            let data = <ILeafletAdapterData>cluster.data;

            // Ignore collapsing clusters detected by the previous step
            if (data._leafletCollision) {
                // Reset these clusters
                data._leafletCollision = false;
                data._leafletOldPopulation = 0;
                data._leafletOldHashCode = 0;
                return;
            }

            let position = new LatLng(cluster.averagePosition.lat, cluster.averagePosition.lng);

            // If the cluster is already attached to a leaflet marker
            let oldMarker = data._leafletMarker;
            if (oldMarker) {

                let hasLeafletPopulationProperty = data._leafletOldPopulation !== undefined;

                // If it's a single marker and it doesn't have changed
                if (cluster.population === 1 && (hasLeafletPopulationProperty && data._leafletOldPopulation === 1) && cluster.hashCode === oldMarker._hashCode) {
                    // Update if the zoom level has changed or if we need to reset the icon
                    if (resetIcons || oldMarker._zoomLevel !== zoom || cluster.lastMarker.data.forceIconRedraw) {
                        this.PrepareLeafletMarker(
                            oldMarker,
                            cluster.lastMarker.data,
                            cluster.lastMarker.category);
                        if (cluster.lastMarker.data.forceIconRedraw) {
                            cluster.lastMarker.data.forceIconRedraw = false;
                        }
                    }
                    // Update the position
                    oldMarker.setLatLng(position);
                    m = oldMarker;

                    // If it's a cluster marker on the same position
                } else if (data._leafletOldPopulation !== undefined && (cluster.population > 1 && data._leafletOldPopulation > 1 && (oldMarker._zoomLevel === zoom || (data._leafletPosition !== undefined && data._leafletPosition.equals(position))))) {

                    // Update the position
                    oldMarker.setLatLng(position);

                    // Update the icon if the population of his content has changed or if we need to reset the icon
                    if (resetIcons || cluster.population != data._leafletOldPopulation ||
                        cluster.hashCode !== data._leafletOldHashCode) {
                        var boundsCopy = {};
                        Util.extend(boundsCopy, cluster.bounds);
                        (<any>oldMarker)._leafletClusterBounds = boundsCopy;
                        oldMarker.setIcon(this.BuildLeafletClusterIcon(cluster));
                    }

                    data._leafletOldPopulation = cluster.population;
                    data._leafletOldHashCode = cluster.hashCode;
                    m = oldMarker;
                }

            }

            // If a leaflet marker is unfound,
            // register it in the creation waiting list
            if (!m) {
                // Clusters with a single marker are placed at the beginning
                // of the cluster creation list, to recycle them in priority
                if (cluster.population === 1) {
                    clusterCreationListPopOne.push(cluster);
                } else {
                    clusterCreationList.push(cluster);
                }

                data._leafletPosition = position;
                data._leafletOldPopulation = cluster.population;
                data._leafletOldHashCode = cluster.hashCode;
            } else {
                // The leafet marker is used, we don't need to remove it anymore
                m._removeFromMap = false;
                newObjectsOnMap.push(cluster);

                // Update the properties
                m._zoomLevel = zoom;
                m._hashCode = cluster.hashCode;
                m._population = cluster.population;
                data._leafletMarker = m;
                data._leafletPosition = position;
            }

        });

// Fifth step : recycle leaflet markers using a sweep and prune algorithm
// The purpose of this step is to make smooth transition when a cluster or a marker
// is moving on the map and its grid cell changes
        clusterCreationList = clusterCreationListPopOne.concat(clusterCreationList);

        let oldMaxLng;
        for (let i = 0, l = objectsOnMap.length; i < l; ++i) {
            let icluster = objectsOnMap[i];
            let idata = <ILeafletAdapterData>icluster.data;
            marker = idata._leafletMarker;

            // We do not recycle markers already in use
            if (idata._leafletMarker && idata._leafletMarker._removeFromMap) {
                // If the sweep and prune algorithm doesn't find anything,
                // the leaflet marker can't be recycled and it will be removed
                let remove = true;

                // Recycle marker only with the same zoom level
                if (marker && marker._zoomLevel === zoom) {
                    let pa = icluster.averagePosition;

                    latMargin = (icluster.bounds.maxLat - icluster.bounds.minLat) * marginRatio,
                        lngMargin = (icluster.bounds.maxLng - icluster.bounds.minLng) * marginRatio;

                    for (let j = 0, ll = clusterCreationList.length; j < ll; ++j) {
                        let jcluster = clusterCreationList[j],
                            jdata = <ILeafletAdapterData>jcluster.data;


                        // If luckily it's the same single marker
                        if (marker._population === 1 && jcluster.population === 1 &&
                            marker._hashCode === jcluster.hashCode) {

                            // I we need to reset the icon
                            if (resetIcons || jcluster.lastMarker.data.forceIconRedraw) {
                                this.PrepareLeafletMarker(
                                    marker,
                                    jcluster.lastMarker.data,
                                    jcluster.lastMarker.category);

                                if (jcluster.lastMarker.data.forceIconRedraw) {
                                    jcluster.lastMarker.data.forceIconRedraw = false;
                                }
                            }

                            // Update the position
                            marker.setLatLng(jdata._leafletPosition);
                            remove = false;

                        } else {

                            let pb = jcluster.averagePosition;
                            let oldMinLng = pa.lng - lngMargin,
                                newMaxLng = pb.lng + lngMargin, oldMinLat, oldMaxLat, newMinLng, newMinLat, newMaxLat;

                            oldMaxLng = pa.lng + lngMargin;
                            oldMinLat = pa.lat - latMargin;
                            oldMaxLat = pa.lat + latMargin;
                            newMinLng = pb.lng - lngMargin;
                            newMinLat = pb.lat - latMargin;
                            newMaxLat = pb.lat + latMargin;

                            // If it's a cluster marker
                            // and if a collapsing leaflet marker is found, it may be recycled
                            if ((marker._population > 1 && jcluster.population > 1) &&
                                (oldMaxLng > newMinLng && oldMinLng < newMaxLng && oldMaxLat > newMinLat && oldMinLat < newMaxLat)) {
                                // Update everything
                                marker.setLatLng(jdata._leafletPosition);
                                marker.setIcon(this.BuildLeafletClusterIcon(jcluster));
                                let poisson = {};
                                Util.extend(poisson, jcluster.bounds);
                                (<any>marker)._leafletClusterBounds = poisson;
                                jdata._leafletOldPopulation = jcluster.population;
                                jdata._leafletOldHashCode = jcluster.hashCode;
                                marker._population = jcluster.population;
                                remove = false;
                            }
                        }

                        // If the leaflet marker is recycled
                        if (!remove) {

                            // Register the new marker
                            jdata._leafletMarker = marker;
                            marker._removeFromMap = false;
                            newObjectsOnMap.push(jcluster);

                            // Remove it from the sweep and prune working list
                            clusterCreationList.splice(j, 1);
                            --j;
                            --ll;

                            break;
                        }
                    }
                }

                // If sadly the leaflet marker can't be recycled
                if (remove) {
                    // @ts-ignore
                    if (!marker._removeFromMap) console.error("wtf");
                }
            }
        }

// Sixth step : Create the new leaflet markers
        for (let i = 0, l = clusterCreationList.length; i < l; ++i) {
            let icluster = clusterCreationList[i],
                idata = <ILeafletAdapterData>icluster.data;

            let iposition = idata._leafletPosition;

            let creationMarker: any;
            if (icluster.population === 1) {
                // @ts-ignore
                creationMarker = this.BuildLeafletMarker(icluster.lastMarker, iposition);
            } else {
                // @ts-ignore
                creationMarker = this.BuildLeafletCluster(icluster, iposition);
            }

            creationMarker.addTo(map);

            // Fading in transition
            // (disabled by default with no-anim)
            // if(creationMarker._icon) L.DomUtil.addClass(creationMarker._icon, "no-anim");
            creationMarker.setOpacity(0);
            opacityUpdateList.push(creationMarker);

            idata._leafletMarker = creationMarker;
            creationMarker._zoomLevel = zoom;
            creationMarker._hashCode = icluster.hashCode;
            creationMarker._population = icluster.population;

            newObjectsOnMap.push(icluster);
        }

// Start the fading in transition
        window.setTimeout(() => {
            for (let i = 0, l = opacityUpdateList.length; i < l; ++i) {
                var m = opacityUpdateList[i];
                if (m._icon) DomUtil.addClass(m._icon, "prunecluster-anim");
                if (m._shadow) DomUtil.addClass(m._shadow, "prunecluster-anim");
                m.setOpacity(1);
            }
        }, 1);

// Remove the remaining unused markers
        if (this._hardMove) {
            for (let i = 0, l = markersOnMap.length; i < l; ++i) {
                marker = markersOnMap[i];
                // @ts-ignore
                if (marker._removeFromMap) {
                    map.removeLayer(marker);
                }
            }
        } else {
            if (this._removeTimeoutId !== 0) {
                window.clearTimeout(this._removeTimeoutId);
                for (let i = 0, l = this._markersRemoveListTimeout.length; i < l; ++i) {
                    map.removeLayer(this._markersRemoveListTimeout[i]);
                }
            }

            var toRemove: any[] = [];
            for (let i = 0, l = markersOnMap.length; i < l; ++i) {
                marker = markersOnMap[i];
                // @ts-ignore
                if (marker._removeFromMap) {
                    marker.setOpacity(0);
                    toRemove.push(marker);
                }
            }
            if (toRemove.length > 0) {
                this._removeTimeoutId = window.setTimeout(() => {
                    for (let i = 0, l = toRemove.length; i < l; ++i) {
                        map.removeLayer(toRemove[i]);
                    }
                    this._removeTimeoutId = 0;
                }, 300);
            }
            this._markersRemoveListTimeout = toRemove;
        }

        this._objectsOnMap = newObjectsOnMap;
        this._hardMove = false;
        this._resetIcons = false;
    }

    FitBounds(withFiltered: boolean = true): void {
        const bounds = this.Cluster.ComputeGlobalBounds(withFiltered);
        if (bounds) {
            this._map!.fitBounds(new LatLngBounds(
                new LatLng(bounds.minLat, bounds.maxLng),
                new LatLng(bounds.maxLat, bounds.minLng)
            ));
        }
    }

    RedrawIcons(processView: boolean = true): void {
        this._resetIcons = true;
        if (processView) {
            this.ProcessView();
        }
    }

    _moveStart = () => {
        this._moveInProgress = true;
    };

    _moveEnd(event?: { hard: boolean }): void {
        this._moveInProgress = false;
        this._hardMove = event?.hard || false;
    }

    _zoomStart = () => {
        this._zoomInProgress = true;
    };

    _zoomEnd = () => {
        this._zoomInProgress = false;
        this.ProcessView();
    };

    GetMarkers(): Marker[] {
        let markers = this._objectsOnMap.map((object: any) => {
            return object.data._leafletMarker;
        });
        console.debug('GetMarkers', markers);
        return markers;
    }
}

export default PruneClusterForLeaflet;
