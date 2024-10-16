import {DivIcon, DomUtil, Icon, LatLng, LatLngBounds, Layer, Map, Marker, Point, Util,} from 'leaflet';
import {Cluster} from "./Cluster";
import VirtualMarker from "./VirtualMarker.ts";
import {PruneCluster} from "./PruneCluster";
import {LeafletMarker} from "./LeafletMarker";
import {Bounds} from "./Bounds";
import {PruneClusterLeafletSpiderfier} from "./LeafletSpiderfier";
import {IClusterHandler} from "./IClusterHandler.ts";

// @ts-ignore
/**
 * Interface representing a Leaflet Adapter that implements the Layer interface.
 *
 * This interface defines the structure and methods required for a Leaflet Adapter,
 * which is responsible for managing and interacting with markers and clusters on a Leaflet map.
 */
export interface LeafletAdapter implements Layer {
    /** The PruneCluster instance used for clustering markers. */
    Cluster: PruneCluster;

    /**
     * Adds the adapter to the specified map.
     *
     * This method is called when the adapter is added to a Leaflet map. It initializes
     * the adapter with the map instance and performs any necessary setup.
     *
     * @param map - The Leaflet map instance.
     * @returns The current instance of LeafletAdapter.
     */
    onAdd: (map: L.Map) => this;

    /**
     * Removes the adapter from the specified map.
     *
     * This method is called when the adapter is removed from a Leaflet map. It performs
     * any necessary cleanup and removes the adapter from the map instance.
     *
     * @param map - The Leaflet map instance.
     * @returns The current instance of LeafletAdapter.
     */
    onRemove: (map: L.Map) => this;

    /**
     * Registers a single marker with the adapter.
     *
     * This method adds a single marker to the adapter, allowing it to be managed and
     * displayed on the map.
     *
     * @param marker - The marker to register.
     */
    RegisterMarker: (marker: Marker) => void;

    /**
     * Registers multiple markers with the adapter.
     *
     * This method adds an array of markers to the adapter, allowing them to be managed
     * and displayed on the map.
     *
     * @param markers - The array of markers to register.
     */
    RegisterMarkers: (markers: Marker[]) => void;

    /**
     * Removes multiple markers from the adapter.
     *
     * This method removes an array of markers from the adapter, ensuring they are no
     * longer managed or displayed on the map.
     *
     * @param markers - The array of markers to remove.
     */
    RemoveMarkers: (markers: Marker[]) => void;

    /**
     * Processes the current view of the map.
     *
     * This method updates the adapter's internal state based on the current view of the
     * map. It is typically called after the map view changes, such as during panning or
     * zooming.
     */
    ProcessView: () => void;

    /**
     * Fits the map bounds to the markers.
     *
     * This method adjusts the map view to fit the bounds of all markers registered with
     * the adapter. It computes the global bounds of the markers and then uses Leaflet's
     * `fitBounds` method to adjust the map view.
     *
     * @param withFiltered - Whether to include filtered markers.
     */
    FitBounds: (withFiltered?: boolean) => void;

    /**
     * Retrieves all markers registered with the adapter.
     *
     * This method returns an array of all markers currently registered with the adapter.
     *
     * @returns An array of markers.
     */
    GetMarkers: () => Marker[];

    /**
     * Redraws the icons of the markers.
     *
     * This method triggers a redraw of the icons for all markers registered with the
     * adapter. It can optionally process the view after redrawing the icons.
     *
     * @param processView - Whether to process the view after redrawing icons.
     */
    RedrawIcons: (processView?: boolean) => void;

    /**
     * Builds a Leaflet layer for the specified cluster and position.
     *
     * This method creates a Leaflet layer for a given cluster at a specified position.
     * The layer can be used to represent the cluster on the map.
     *
     * @param cluster - The cluster to build the layer for.
     * @param position - The position of the cluster.
     * @returns The Leaflet layer.
     */
    BuildLeafletLayer: (cluster: Cluster, position: LatLng) => Layer;

    /**
     * Builds a Leaflet cluster icon for the specified cluster.
     *
     * This method creates a Leaflet icon or DivIcon for a given cluster. The icon
     * visually represents the cluster on the map.
     *
     * @param cluster - The cluster to build the icon for.
     * @returns The Leaflet icon or DivIcon.
     */
    BuildLeafletClusterIcon: (cluster: Cluster) => Icon | DivIcon;

    /**
     * Builds a Leaflet marker for the specified marker and position.
     *
     * This method creates a Leaflet marker for a given marker at a specified position.
     * The marker can be used to represent a point of interest on the map.
     *
     * @param marker - The marker to build.
     * @param position - The position of the marker.
     * @returns The Leaflet marker.
     */
    BuildLeafletMarker: (marker: any, position: LatLng) => Marker;

    /**
     * Prepares a Leaflet marker with the specified data and category.
     *
     * This method configures a Leaflet marker with the provided data and category. It
     * can be used to set custom icons, popups, and other properties for the marker.
     *
     * @param marker - The marker to prepare.
     * @param data - The data to associate with the marker.
     * @param category - The category of the marker.
     */
    PrepareLeafletMarker: (marker: any, data: {}, category: number) => void;
}


/**
 * Interface representing the data associated with a Leaflet adapter.
 *
 * This interface defines the structure of the data that is associated with a Leaflet adapter.
 * It includes properties that store information about the Leaflet marker, collision status,
 * previous population count, previous hash code, and the position of the marker.
 */
export interface ILeafletAdapterData {
    /**
     * The Leaflet marker associated with the data.
     * This property holds a reference to the Leaflet marker that is associated with the data.
     * It is optional and can be undefined if no marker is associated.
     */
    _leafletMarker?: LeafletMarker;

    /**
     * Indicates if there is a collision with another marker.
     * This boolean property is used to flag whether the marker is in collision with another marker.
     * It is optional and can be undefined if no collision status is set.
     */
    _leafletCollision?: boolean;

    /**
     * The previous population count of the cluster.
     * This property stores the population count of the cluster from a previous state.
     * It is used to detect changes in the cluster's population.
     * It is optional and can be undefined if no previous population count is available.
     */
    _leafletOldPopulation?: number;

    /**
     * The previous hash code of the cluster.
     * This property stores the hash code of the cluster from a previous state.
     * It is used to detect changes in the cluster's data.
     * It is optional and can be undefined if no previous hash code is available.
     */
    _leafletOldHashCode?: number;

    /**
     * The position of the marker.
     * This property holds the geographical position (latitude and longitude) of the marker.
     * It is optional and can be undefined if no position is set.
     */
    _leafletPosition?: LatLng;
}

/**
 * Options for configuring the LeafletAdapter.
 *
 * This interface defines the configuration options that can be used to customize the behavior
 * and appearance of the LeafletAdapter. These options allow you to control various aspects
 * of clustering, map interaction, and marker management.
 */
export interface LeafletAdapterOptions {
    /**
     * The size of the cluster.
     *
     * This property specifies the size of the cluster in pixels. It determines the area
     * around each marker that will be considered part of the cluster. A larger size will
     * result in fewer, larger clusters, while a smaller size will result in more, smaller clusters.
     *
     * @example
     * // Set the cluster size to 50 pixels
     * const options: LeafletAdapterOptions = {
     *     size: 50
     * };
     */
    size?: number;

    /**
     * The margin around the cluster.
     *
     * This property specifies the margin around each cluster in pixels. It is used to
     * prevent clusters from overlapping and to provide spacing between them. A larger
     * margin will result in more space between clusters, while a smaller margin will
     * result in clusters being closer together.
     *
     * @example
     * // Set the cluster margin to 10 pixels
     * const options: LeafletAdapterOptions = {
     *     clusterMargin: 10
     * };
     */
    clusterMargin?: number;

    /**
     * The Leaflet map instance.
     *
     * This property holds a reference to the Leaflet map instance that the adapter will
     * be added to. It is used to initialize the adapter with the map and to perform
     * operations such as adding and removing markers and clusters.
     *
     * @example
     * // Set the Leaflet map instance
     * const map = L.map('map');
     * const options: LeafletAdapterOptions = {
     *     map: map
     * };
     */
    map?: Map;

    /**
     * Whether to enable spiderfying of clusters.
     *
     * This property specifies whether to enable the spiderfying of clusters. Spiderfying
     * is a technique used to separate overlapping markers in a cluster, making them
     * individually clickable. When enabled, clicking on a cluster will expand the markers
     * in a spider-like pattern.
     *
     * @example
     * // Enable spiderfying of clusters
     * const options: LeafletAdapterOptions = {
     *     spider: true
     * };
     */
    spider: false;

    /**
     * The handler for cluster operations.
     *
     * This property specifies the handler for cluster operations. The handler is an
     * instance of a class that implements the IClusterHandler interface. It is used to
     * manage the creation, updating, and removal of clusters on the map.
     *
     * @example
     * // Set the cluster handler
     * const clusterHandler: IClusterHandler = new CustomClusterHandler();
     * const options: LeafletAdapterOptions = {
     *     clusterHandler: clusterHandler
     * };
     */
    clusterHandler?: IClusterHandler;
}

/**
 * LeafletAdapter class extends the Layer class and implements the LeafletAdapter interface.
 * This class is responsible for managing clusters and markers on a Leaflet map.
 */
export class LeafletAdapter extends Layer implements LeafletAdapter {
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
    spider: boolean = false;

    /**
     * Constructor for the LeafletAdapter class.
     *
     * This constructor initializes a new instance of the LeafletAdapter class, which is responsible for managing clusters and markers on a Leaflet map.
     * It accepts an optional configuration object to customize the behavior and appearance of the adapter.
     *
     * @param {LeafletAdapterOptions} options - Configuration options for the adapter.
     * @param {number} [options.size=166] - The size of the cluster in pixels. Determines the area around each marker that will be considered part of the cluster.
     * @param {number} [options.clusterMargin=0.2] - The margin around each cluster in pixels. Prevents clusters from overlapping and provides spacing between them.
     * @param {Map} [options.map=null] - The Leaflet map instance that the adapter will be added to. Used to initialize the adapter with the map and perform operations such as adding and removing markers and clusters.
     * @param {boolean} [options.spider=false] - Specifies whether to enable the spiderfying of clusters. Spiderfying separates overlapping markers in a cluster, making them individually clickable.
     * @param {IClusterHandler} [options.clusterHandler=new PruneCluster()] - The handler for cluster operations. Manages the creation, updating, and removal of clusters on the map.
     */
    constructor(options: LeafletAdapterOptions = {
        size: 166,
        clusterMargin: 0.2,
        map: null,
        spider: false,
        clusterHandler: new PruneCluster()
    }) {
        super();
        const {size = 166, clusterMargin = 0.2, map} = options;
        this.Cluster = new PruneCluster();
        this.Cluster.Size = options.size;

        // Set the cluster margin, ensuring it does not exceed a quarter of the cluster size
        this.clusterMargin = Math.min(clusterMargin, size / 4);

        // Bind the Leaflet project method to the cluster
        this.Cluster.Project = (lat: number, lng: number) => {
            if (!this._map) {
                throw new Error('Map is not defined');
            }
            return this._map!.project(new LatLng(lat, lng), Math.floor(this._map!.getZoom()));
        }

        // Bind the Leaflet unproject method to the cluster
        this.Cluster.UnProject = (x: number, y: number) => {
            let value = this._map!.unproject(new Point(x, y), Math.floor(this._map!.getZoom()));
            console.log('UnProject', value);
        }

        // Initialize internal properties
        this._objectsOnMap = [];
        this.spiderfier = new PruneClusterLeafletSpiderfier(this);
        this._hardMove = false;
        this._resetIcons = false;
        this._removeTimeoutId = 0;
        this._markersRemoveListTimeout = [];
        this._moveInProgress = false;
        this._zoomInProgress = false;
        this._map = map;

        // If a map instance is provided, add the adapter to the map
        if (map) {
            this.onAdd(map);
        }
    }

    /**
     * Adds the adapter to the map and registers event listeners.
     *
     * This method is called when the adapter is added to a Leaflet map. It initializes
     * the adapter with the map instance, binds necessary methods, registers event listeners,
     * and processes the initial view of the map. If spiderfying is enabled, it also adds
     * the spiderfier layer to the map.
     *
     * @param {Map} map - The Leaflet map instance to which the adapter will be added.
     * @returns {this} - The current instance of the adapter.
     *
     * @example
     * // Create a new Leaflet map instance
     * const map = L.map('map');
     *
     * // Create a new LeafletAdapter instance
     * const adapter = new LeafletAdapter();
     *
     * // Add the adapter to the map
     * adapter.onAdd(map);
     *
     * @example
     * // Add the adapter to the map and register event listeners
     * const map = L.map('map');
     * const adapter = new LeafletAdapter();
     * adapter.onAdd(map);
     *
     * // The adapter is now initialized with the map instance and ready to manage markers and clusters
     */
    onAdd(map: Map): this {
        this._map = map;

        // Bind the Leaflet project and unproject methods to the cluster
        this.Cluster.Project = (lat: number, lng: number) =>
            this._map!.project(new LatLng(lat, lng), Math.floor(this._map!.getZoom()));

        this.Cluster.UnProject = (x: number, y: number) =>
            this._map!.unproject(new Point(x, y), Math.floor(this._map!.getZoom()));

        // Register event listeners for map movements and zooms
        map.on('movestart', this._moveStart, this);
        map.on('moveend', this._moveEnd, this);
        map.on('zoomstart', this._zoomStart, this);
        map.on('zoomend', this._zoomEnd, this);

        console.log(`Registered map events: movestart, moveend, zoomstart, zoomend`);
        this.ProcessView();

        // Add the spiderfier layer to the map if spiderfying is enabled
        if (this.spider) {
            map.addLayer(this.spiderfier);
        }
        return this;
    }

    /**
     * Removes the adapter from the map and unregisters event listeners.
     *
     * This method is called when the adapter is removed from a Leaflet map. It performs
     * any necessary cleanup and removes the adapter from the map instance. Specifically,
     * it unregisters event listeners for map movements and zooms, removes all markers
     * and clusters from the map, and resets the internal state of the adapter.
     *
     * @param {Map} map - The Leaflet map instance from which the adapter will be removed.
     * @returns {this} - The current instance of the adapter.
     *
     * @example
     * // Create a new Leaflet map instance
     * const map = L.map('map');
     *
     * // Create a new LeafletAdapter instance
     * const adapter = new LeafletAdapter();
     *
     * // Add the adapter to the map
     * adapter.onAdd(map);
     *
     * // Remove the adapter from the map
     * adapter.onRemove(map);
     *
     * // The adapter is now removed from the map and all event listeners are unregistered
     */
    onRemove(map: Map): this {
        // Unregister event listeners for map movements and zooms
        map.off('movestart', this._moveStart, this);
        map.off('moveend', this._moveEnd, this);
        map.off('zoomstart', this._zoomStart, this);
        map.off('zoomend', this._zoomEnd, this);

        // Remove all markers from the map
        this._objectsOnMap.forEach(object => map.removeLayer(object.data._leafletMarker));
        this._objectsOnMap = [];

        // Reset clusters
        this.Cluster.ResetClusters();

        // Remove the spiderfier layer if spiderfying is enabled
        if (this.spider || this.spiderfier) {
            map.removeLayer(this.spiderfier);
        }

        // Clear the map reference
        this._map = null;

        return this;
    }

    /**
     * Registers a single marker with the cluster.
     *
     * This method adds a single marker to the cluster managed by the adapter. The marker can be either a `VirtualMarker` or a `Marker` instance.
     * Once registered, the marker will be included in the clustering process and displayed on the map according to the cluster's configuration.
     *
     * @param {VirtualMarker | Marker} marker - The marker to register. This can be an instance of `VirtualMarker` or `Marker`.
     *
     * @example
     * // Create a new Leaflet marker
     * const marker = L.marker([51.5, -0.09]);
     *
     * // Register the marker with the adapter
     * adapter.RegisterMarker(marker);
     *
     * @example
     * // Create a new virtual marker
     * const virtualMarker = new VirtualMarker([51.5, -0.09]);
     *
     * // Register the virtual marker with the adapter
     * adapter.RegisterMarker(virtualMarker);
     */
    RegisterMarker(marker: VirtualMarker | Marker): void {
        this.Cluster.RegisterMarker(marker);
    }

    /**
     * Registers multiple markers with the cluster.
     *
     * This method adds an array of markers to the cluster managed by the adapter. The markers can be either `VirtualMarker` or `Marker` instances.
     * Once registered, the markers will be included in the clustering process and displayed on the map according to the cluster's configuration.
     *
     * @param {VirtualMarker[] | Marker[]} markers - The markers to register. This can be an array of `VirtualMarker` or `Marker` instances.
     *
     * @example
     * // Create an array of Leaflet markers
     * const markers = [
     *     L.marker([51.5, -0.09]),
     *     L.marker([51.51, -0.1]),
     *     L.marker([51.49, -0.08])
     * ];
     *
     * // Register the markers with the adapter
     * adapter.RegisterMarkers(markers);
     *
     * @example
     * // Create an array of virtual markers
     * const virtualMarkers = [
     *     new VirtualMarker([51.5, -0.09]),
     *     new VirtualMarker([51.51, -0.1]),
     *     new VirtualMarker([51.49, -0.08])
     * ];
     *
     * // Register the virtual markers with the adapter
     * adapter.RegisterMarkers(virtualMarkers);
     */
    RegisterMarkers(markers: VirtualMarker[] | Marker[]): void {
        this.Cluster.RegisterMarkers(markers);
    }

    /**
     * Removes multiple markers from the cluster.
     *
     * This method removes an array of markers from the cluster managed by the adapter. The markers will be excluded from the clustering process and will no longer be displayed on the map.
     *
     * @param {Marker[]} markers - The array of markers to remove. Each marker should be an instance of the `Marker` class.
     *
     * @example
     * // Create an array of Leaflet markers
     * const markers = [
     *     L.marker([51.5, -0.09]),
     *     L.marker([51.51, -0.1]),
     *     L.marker([51.49, -0.08])
     * ];
     *
     * // Register the markers with the adapter
     * adapter.RegisterMarkers(markers);
     *
     * // Remove the markers from the adapter
     * adapter.RemoveMarkers(markers);
     *
     * @example
     * // Create a single Leaflet marker
     * const marker = L.marker([51.5, -0.09]);
     *
     * // Register the marker with the adapter
     * adapter.RegisterMarker(marker);
     *
     * // Remove the marker from the adapter
     * adapter.RemoveMarkers([marker]);
     */
    RemoveMarkers(markers: Marker[]): void {
        this.Cluster.RemoveMarkers(markers);
    }

    /**
     * Builds a Leaflet layer for a cluster.
     * @param {Cluster} cluster - The cluster to build the layer for.
     * @param {LatLng} position - The position of the cluster.
     * @returns {Layer} - The created Leaflet layer.
     */
    BuildLeafletLayer(cluster: Cluster, position: LatLng): Layer {
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

    /**
     * Builds a Leaflet icon for a cluster.
     * @param {Cluster} cluster - The cluster to build the icon for.
     * @returns {Icon | DivIcon} - The created Leaflet icon.
     */
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

    /**
     * Builds a Leaflet marker.
     * @param {VirtualMarker} marker - The virtual marker to build.
     * @param {LatLng} position - The position of the marker.
     * @returns {Marker} - The created Leaflet marker.
     */
    BuildLeafletMarker(marker: VirtualMarker, position: LatLng): Marker {
        const leafletMarker = new Marker(position);
        this.PrepareLeafletMarker(leafletMarker, marker.data, marker.category);
        return leafletMarker;
    }

    /**
     * Prepares a Leaflet marker with the given data and category.
     * @param {Marker} marker - The Leaflet marker to prepare.
     * @param {any} data - The data associated with the marker.
     * @param {number} category - The category of the marker.
     */
    PrepareLeafletMarker(marker: Marker, data: any, category: number): void {
        if (data.icon) {
            marker.setIcon(typeof data.icon === 'function' ? data.icon(data, category) : data.icon);
        }

        if (data.popup) {
            const content = typeof data.popup === 'function' ? data.popup(data, category) : data.popup;
            marker.bindPopup(content, data.popupOptions);
        }
    }

    /**
     * Processes the current view of the map, updating clusters and markers.
     */
    ProcessView() {
        let latMargin;
        let lngMargin;
        let marker: any;
// Don't do anything during the map manipulation
        if (!this._map || this._zoomInProgress || this._moveInProgress) {
            console.log('ProcessView: map not ready');
            return;
        }
        console.log(`ProcessView: Map Zoom=${this._map.getZoom()}, Bounds=${this._map.getBounds()}, Markers Count=${this._objectsOnMap.length}`);

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
                    if (!marker._removeFromMap) console.error("wtf");
                }
            }
        }

// Sixth step : Create the new leaflet markers
        for (let i = 0, l = clusterCreationList.length; i < l; ++i) {
            let icluster: Cluster = clusterCreationList[i],
                idata: ILeafletAdapterData = <ILeafletAdapterData>icluster.data;

            let iposition = idata._leafletPosition;

            let creationMarker: any;
            if (icluster.population === 1) {
                // @ts-ignore
                creationMarker = this.BuildLeafletMarker(icluster.lastMarker, iposition);
            } else {
                // @ts-ignore
                creationMarker = this.BuildLeafletLayer(icluster, iposition);
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
            console.log('Hard move');
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

    /**
     * Fits the map bounds to the markers.
     *
     * This method adjusts the map view to fit the bounds of all markers registered with the cluster.
     * It computes the global bounds of the markers and then uses Leaflet's `fitBounds` method to adjust the map view.
     *
     * @param {boolean} [withFiltered=true] - Whether to include filtered markers in the bounds computation.
     *
     * @example
     * // Fit the map bounds to all markers, including filtered ones
     * adapter.FitBounds();
     *
     * @example
     * // Fit the map bounds to all markers, excluding filtered ones
     * adapter.FitBounds(false);
     */
    FitBounds(withFiltered: boolean = true): void {
        const bounds = this.Cluster.ComputeGlobalBounds(withFiltered);
        if (bounds) {
            const leafletLatLngBounds = new LatLngBounds(
                new LatLng(bounds.minLat, bounds.maxLng),
                new LatLng(bounds.maxLat, bounds.minLng)
            );

            console.log('FitBounds', leafletLatLngBounds);
            this._map!.fitBounds(leafletLatLngBounds);
        }
    }

    /**
     * Redraws the icons of the markers.
     *
     * This method sets the `_resetIcons` flag to `true`, indicating that the icons of the markers need to be redrawn.
     * If the `processView` parameter is `true`, it will also call the `ProcessView` method to update the view of the map.
     *
     * @param {boolean} [processView=true] - Whether to process the view after redrawing icons.
     *
     * @example
     * // Redraw the icons and process the view
     * adapter.RedrawIcons();
     *
     * @example
     * // Redraw the icons without processing the view
     * adapter.RedrawIcons(false);
     */
    RedrawIcons(processView: boolean = true): void {
        this._resetIcons = true;
        if (processView) {
            this.ProcessView();
            console.log(`RedrawIcons: ${processView}`);
        }
    }

    /**
     * Event handler for the start of a map move.
     *
     * This method is triggered when the map starts moving. It sets the `_moveInProgress` flag to `true`
     * and logs a message indicating that the move has started.
     *
     * @example
     * // Register the move start event handler
     * map.on('movestart', adapter._moveStart);
     *
     * @example
     * // Check if a move is in progress
     * if (adapter._moveInProgress) {
     *     console.log('A move is currently in progress.');
     * }
     */
    _moveStart = () => {
        console.log(`Move start in progress`);
        this._moveInProgress = true;
    };

    /**
     * Event handler for the end of a map move.
     *
     * This method is triggered when the map stops moving. It sets the `_moveInProgress` flag to `false`,
     * logs a message indicating that the move has ended, and processes the view of the map.
     * If the `event` parameter contains a `hard` property set to `true`, it sets the `_hardMove` flag to `true`.
     *
     * @param {Object} [event] - Optional event object containing additional information about the move end event.
     * @param {boolean} [event.hard] - Indicates if the move was a hard move.
     *
     * @example
     * // Register the move end event handler
     * map.on('moveend', adapter._moveEnd);
     *
     * @example
     * // Trigger the move end event with a hard move
     * adapter._moveEnd({ hard: true });
     */
    _moveEnd(event?: { hard: boolean }): void {
        this._moveInProgress = false;
        console.log(`Move end called with event: ${event}`);
        this._hardMove = event?.hard || false;
        this.ProcessView();
    }


    /**
     * Event handler for the start of a map zoom.
     *
     * This method is triggered when the map starts zooming. It sets the `_zoomInProgress` flag to `true`
     * and logs a message indicating that the zoom has started.
     *
     * @example
     * // Register the zoom start event handler
     * map.on('zoomstart', adapter._zoomStart);
     *
     * @example
     * // Check if a zoom is in progress
     * if (adapter._zoomInProgress) {
     *     console.log('A zoom is currently in progress.');
     * }
     */
    _zoomStart = () => {
        this._zoomInProgress = true;
        console.log(`Zoom start in progress`);
    };
    /**
     * Event handler for the end of a map zoom.
     *
     * This method is triggered when the map stops zooming. It sets the `_zoomInProgress` flag to `false`,
     * logs a message indicating that the zoom has ended, and processes the view of the map.
     *
     * @example
     * // Register the zoom end event handler
     * map.on('zoomend', adapter._zoomEnd);
     *
     * @example
     * // Trigger the zoom end event manually
     * adapter._zoomEnd();
     */
    _zoomEnd = () => {
        this._zoomInProgress = false;
        console.log(`Zoom end in progress`);
        this.ProcessView();
    };

    /**
     * Retrieves all markers currently on the map.
     *
     * This method iterates over the internal `_objectsOnMap` array, which contains clusters and markers,
     * and extracts the Leaflet markers associated with each object. It returns an array of these markers.
     *
     * @returns {Marker[]} An array of Leaflet markers currently on the map.
     *
     * @example
     * // Get all markers on the map
     * const markers = adapter.GetMarkers();
     * console.log(markers);
     *
     * @example
     * // Iterate over the markers and log their positions
     * const markers = adapter.GetMarkers();
     * markers.forEach(marker => {
     *     console.log(marker.getLatLng());
     * });
     */
    GetMarkers(): Marker[] {
        let markers = this._objectsOnMap.map((object: any) => {
            return object.data._leafletMarker;
        });
        console.debug('GetMarkers', markers);
        return markers;
    }
}

export default LeafletAdapter;
