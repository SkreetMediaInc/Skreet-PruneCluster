// The position is the real position of the object
// using a standard coordinate system, as WGS 84
export interface Position {
    lat: number;
    lng: number;
}

// The point is a project position on the client display
export class Point {
    x!: number;
    y!: number;
}

export interface Bounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

export class ClusterObject {
    // Map position of the object
    public position!: Position;

    // An attached javascript object, storing user data
    public data: any;

    // An hashCode identifing the object
    public hashCode!: number;
}

// Hidden letiable counting the number of created hashcode
let hashCodeCounter: number = 1;

// Number.MAX_SAFE_INTEGER
let maxHashCodeValue = Math.pow(2, 53) - 1;

export class PruneClusterMarker extends ClusterObject {

    // The category of the Marker, ideally a number between 0 and 7
    // can also be a string
    public category: number;

    // The weight of a Marker can influence the cluster icon or the cluster position
    public weight: number;

    // If filtered is true, the marker is not included in the clustering
    // With some datasets, it's faster to keep the markers inside PruneCluster and to
    // use the filtering feature. With some other datasets, it's better to remove the
    // markers
    public filtered: boolean;

    constructor(lat: number, lng: number, data: {} = {},
                category?: number, weight: number = 1, filtered: boolean = false) {
        super();
        this.data = data;
        this.position = {lat: +lat, lng: +lng};
        this.weight = weight;
        this.category = category || 0;
        this.filtered = filtered;

        // The hashCode is used to identify the Cluster object
        this.hashCode = hashCodeCounter++;
    }

    public Move(lat: number, lng: number) {
        this.position.lat = +lat;
        this.position.lng = +lng;
    }

    // Apply the data object
    public SetData(data: any) {
        for (let key in data) {
            this.data[key] = data[key];
        }
    }
}

export class Cluster extends ClusterObject {
    // Cluster area
    // @ts-ignore
    public bounds: Bounds;

    // Number of markers clustered
    // @ts-ignore
    public population: number;

    // Average position of the cluster,
    // taking into account the cluster weight
    // @ts-ignore

    public averagePosition: Position;

    // Statistics table
    // The key is the category and the value is the sum
    // of the weights
    public stats: any[] = [];

    // The total weight of the cluster
    // @ts-ignore

    public totalWeight: number;

    // The last marker added in the cluster
    // Usefull when the cluster contains only one marker
    // @ts-ignore

    public lastMarker!: PruneClusterMarker;

    // If enabled, the cluster contains a list of his marker
    // It implies a performance cost, but you can use it
    // for building the icon, if your dataset is not too big
    public static ENABLE_MARKERS_LIST: boolean = false;

    // The list of markers in the cluster
    private _clusterMarkers!: PruneClusterMarker[];

    // @ts-ignore


    constructor(marker?: PruneClusterMarker) {
        super();

        // Create a stats table optimized for categories between 0 and 7
        this.stats = [0, 0, 0, 0, 0, 0, 0, 0];
        this.data = {};


        // You can provide a marker directly in the constructor
        // It's like using AddMarker, but a bit faster
        if (!marker) {
            this.hashCode = 1;
            if (Cluster.ENABLE_MARKERS_LIST) {
                this._clusterMarkers = [];
            }
            return;
        }

        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = [marker];
        }

        this.lastMarker = marker;

        this.hashCode = 31 + marker.hashCode;

        this.population = 1;

        if (marker.category !== undefined) {
            // @ts-ignore
            this.stats[marker.category] = 1;
        }

        this.totalWeight = marker.weight;

        this.position = {
            lat: marker.position.lat,
            lng: marker.position.lng
        };

        this.averagePosition = {
            lat: marker.position.lat,
            lng: marker.position.lng
        };

    }

    public AddMarker(marker: PruneClusterMarker) {

        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers.push(marker);
        }

        let h = this.hashCode;
        h = ((h << 5) - h) + marker.hashCode;
        if (h >= maxHashCodeValue) {
            this.hashCode = h % maxHashCodeValue;
        } else {
            this.hashCode = h;
        }

        this.lastMarker = marker;

        // Compute the weighted arithmetic mean
        const weight = marker.weight,
            currentTotalWeight = this.totalWeight,
            newWeight = weight + currentTotalWeight;

        this.averagePosition.lat =
            (this.averagePosition.lat * currentTotalWeight +
                marker.position.lat * weight) / newWeight;

        this.averagePosition.lng =
            (this.averagePosition.lng * currentTotalWeight +
                marker.position.lng * weight) / newWeight;

        ++this.population;
        this.totalWeight = newWeight;

        // Update the statistics if needed
        if (marker.category !== undefined) {
            this.stats[marker.category] = (this.stats[marker.category] + 1) || 1;
        }
    }

    public Reset() {
        this.hashCode = 1;
        // @ts-ignore
        this.lastMarker = undefined;
        this.population = 0;
        this.totalWeight = 0;
        this.stats = [0, 0, 0, 0, 0, 0, 0, 0];

        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = [];
        }
    }

    // Compute the bounds
    // Settle the cluster to the projected grid
    public ComputeBounds(cluster: PruneCluster) {

        let proj = cluster.Project(this.position.lat, this.position.lng);

        let size = cluster.Size;

        // Compute the position of the cluster
        let nbX = Math.floor(proj.x / size),
            nbY = Math.floor(proj.y / size),
            startX = nbX * size,
            startY = nbY * size;

        // Project it to lat/lng values
        let a = cluster.UnProject(startX, startY),
            b = cluster.UnProject(startX + size, startY + size);

        this.bounds = {
            minLat: b.lat,
            maxLat: a.lat,
            minLng: a.lng,
            maxLng: b.lng
        };
    }

    public GetClusterMarkers() {
        return this._clusterMarkers;
    }

    public ApplyCluster(newCluster: Cluster) {

        this.hashCode = this.hashCode * 41 + newCluster.hashCode * 43;
        if (this.hashCode > maxHashCodeValue) {
            this.hashCode = this.hashCode = maxHashCodeValue;
        }

        let weight = newCluster.totalWeight,
            currentTotalWeight = this.totalWeight,
            newWeight = weight + currentTotalWeight;

        this.averagePosition.lat =
            (this.averagePosition.lat * currentTotalWeight +
                newCluster.averagePosition.lat * weight) / newWeight;

        this.averagePosition.lng =
            (this.averagePosition.lng * currentTotalWeight +
                newCluster.averagePosition.lng * weight) / newWeight;

        this.population += newCluster.population;
        this.totalWeight = newWeight;

        // Merge the bounds
        this.bounds.minLat = Math.min(this.bounds.minLat, newCluster.bounds.minLat);
        this.bounds.minLng = Math.min(this.bounds.minLng, newCluster.bounds.minLng);
        this.bounds.maxLat = Math.max(this.bounds.maxLat, newCluster.bounds.maxLat);
        this.bounds.maxLng = Math.max(this.bounds.maxLng, newCluster.bounds.maxLng);

        // Merge the statistics
        for (let category in newCluster.stats) {
            if (newCluster.stats.hasOwnProperty(category)) {
                if (this.stats.hasOwnProperty(category)) {
                    this.stats[category] += newCluster.stats[category];
                } else {
                    this.stats[category] = newCluster.stats[category];
                }
            }
        }

        // Merge the clusters lists
        if (Cluster.ENABLE_MARKERS_LIST) {
            this._clusterMarkers = this._clusterMarkers.concat(newCluster.GetClusterMarkers());
        }
    }
}

function checkPositionInsideBounds(a: Position, b: Bounds): boolean {
    return (a.lat >= b.minLat && a.lat <= b.maxLat) &&
        a.lng >= b.minLng && a.lng <= b.maxLng;
}

function insertionSort(list: ClusterObject[]) {
    for (let i: number = 1,
             j: number,
             tmp: ClusterObject,
             tmpLng: number,
             length = list.length; i < length; ++i) {
        tmp = list[i];
        tmpLng = tmp.position.lng;
        for (j = i - 1; j >= 0 && list[j].position.lng > tmpLng; --j) {
            list[j + 1] = list[j];
        }
        list[j + 1] = tmp;
    }
}

// PruneCluster must work on a sorted collection
// the insertion sort is preferred for its stability and its performances
// on sorted or almost sorted collections.
//
// However the insertion sort's worst case is extreme and we should avoid it.
function shouldUseInsertionSort(total: number, nbChanges: number): boolean {
    if (nbChanges > 300) {
        return false;
    } else {
        return (nbChanges / total) < 0.2;
    }
}

export class PruneCluster {
    private _markers: PruneClusterMarker[] = [];

    // Represent the number of marker added or deleted since the last sort
    private _nbChanges: number = 0;

    private _clusters: Cluster[] = [];

    // Cluster size in (in pixels)
    public Size: number = 166;

    // View padding (extended size of the view)
    public ViewPadding: number = 0.2;

    // These methods should be defined by the user
    // @ts-ignore
    public Project: (lat: number, lng: number) => Point;
    // @ts-ignore
    public UnProject: (x: number, y: number) => Position;

    public RegisterMarker(marker: PruneClusterMarker) {
        if ((<any>marker)._removeFlag) {
            delete (<any>marker)._removeFlag;
        }
        this._markers.push(marker);
        this._nbChanges += 1;
    }

    public RegisterMarkers(markers: PruneClusterMarker[]) {
        markers.forEach((marker: PruneClusterMarker) => {
            this.RegisterMarker(marker);
        });
    }

    private _sortMarkers() {
        let markers = this._markers,
            length = markers.length;

        if (this._nbChanges && !shouldUseInsertionSort(length, this._nbChanges)) {
            // native (n log n) sort
            this._markers.sort((a: PruneClusterMarker, b: PruneClusterMarker) => a.position.lng - b.position.lng);
        } else {
            insertionSort(markers);  // faster for almost-sorted arrays
        }

        // Now the list is sorted, we can reset the counter
        this._nbChanges = 0;
    }

    private _sortClusters() {
        // Insertion sort because the list is often almost sorted
        // and we want to have a stable list of clusters
        insertionSort(this._clusters);
    }

    private _indexLowerBoundLng(lng: number): number {
        // Inspired by std::lower_bound

        // It's a binary search algorithm
        let markers = this._markers,
            it,
            step,
            first = 0,
            count = markers.length;

        while (count > 0) {
            step = Math.floor(count / 2);
            it = first + step;
            if (markers[it].position.lng < lng) {
                first = ++it;
                count -= step + 1;
            } else {
                count = step;
            }
        }

        return first;
    }

    private _resetClusterViews() {
        // Reset all the clusters
        for (let i = 0, l = this._clusters.length; i < l; ++i) {
            let cluster = this._clusters[i];
            cluster.Reset();

            // The projection changes in accordance with the view's zoom level
            // (at least with Leaflet.js)
            cluster.ComputeBounds(this);
        }
    }

    public ProcessView(bounds: Bounds): Cluster[] {

        let heightBuffer = Math.abs(bounds.maxLat - bounds.minLat) * this.ViewPadding,
            widthBuffer = Math.abs(bounds.maxLng - bounds.minLng) * this.ViewPadding;

        let extendedBounds: Bounds = {
            minLat: bounds.minLat - heightBuffer - heightBuffer,
            maxLat: bounds.maxLat + heightBuffer + heightBuffer,
            minLng: bounds.minLng - widthBuffer - widthBuffer,
            maxLng: bounds.maxLng + widthBuffer + widthBuffer
        };

        this._sortMarkers();
        this._resetClusterViews();

        let firstIndex = this._indexLowerBoundLng(extendedBounds.minLng);
        let markers = this._markers,
            clusters = this._clusters,
            workingClusterList = clusters.slice(0);

        for (let i = firstIndex, l = markers.length; i < l; ++i) {
            let marker = markers[i],
                markerPosition = marker.position;

            if (markerPosition.lng > extendedBounds.maxLng) {
                break;
            }

            if (markerPosition.lat > extendedBounds.minLat &&
                markerPosition.lat < extendedBounds.maxLat &&
                !marker.filtered) {  // Exclude filtered markers

                let clusterFound = false;
                for (let j = 0, ll = workingClusterList.length; j < ll; ++j) {
                    let cluster = workingClusterList[j];

                    // If the cluster is too far, remove it
                    if (cluster.bounds.maxLng < marker.position.lng) {
                        workingClusterList.splice(j, 1);
                        --j;
                        --ll;
                        continue;
                    }

                    // Check if the marker fits inside the cluster bounds or has the exact same position
                    if (checkPositionInsideBounds(markerPosition, cluster.bounds) ||
                        (cluster.position.lat === markerPosition.lat && cluster.position.lng === markerPosition.lng)) {
                        cluster.AddMarker(marker);
                        clusterFound = true;
                        break;
                    }
                }

                if (!clusterFound) {
                    let newCluster = new Cluster(marker);
                    newCluster.ComputeBounds(this);
                    clusters.push(newCluster);
                    workingClusterList.push(newCluster);
                }
            }
        }

        // Filter out clusters with population 0
        let newClustersList: Cluster[] = clusters.filter(c => c.population > 0);

        this._clusters = newClustersList;
        this._sortClusters();

        return this._clusters;
    }


    public RemoveMarkers(markers?: PruneClusterMarker[]) {

        // if markers are undefined, remove all
        if (!markers) {
            this._markers = [];
            return;
        }

        // Mark the markers to be deleted
        for (let i = 0, l = markers.length; i < l; ++i) {
            (<any>markers[i])._removeFlag = true;
        }

        // Create a new list without the marked markers
        let newMarkersList = [];
        for (let i = 0, l = this._markers.length; i < l; ++i) {
            if (!(<any>this._markers[i])._removeFlag) {
                newMarkersList.push(this._markers[i]);
            } else {
                delete (<any>this._markers[i])._removeFlag;
            }
        }

        this._markers = newMarkersList;
    }

    // This method is a bit slow ( O(n)) because it's not worth to make
    // system which will slow down all the clusters just to have
    // this one fast
    public FindMarkersInArea(area: Bounds): PruneClusterMarker[] {
        let result = [];
        let firstIndex = this._indexLowerBoundLng(area.minLng);

        for (let i = firstIndex, l = this._markers.length; i < l; ++i) {
            let marker = this._markers[i],
                pos = marker.position;

            if (pos.lng > area.maxLng) {
                break;
            }

            if (!marker.filtered && pos.lat >= area.minLat && pos.lat <= area.maxLat && pos.lng >= area.minLng) {
                result.push(marker);
            }
        }

        return result;
    }


    // Compute the bounds of the list of markers
    // It's slow O(n)
    public ComputeBounds(markers: PruneClusterMarker[], withFiltered: boolean = true): Bounds | null {

        if (!markers || !markers.length) {
            return null;
        }

        let rMinLat = Number.MAX_VALUE,
            rMaxLat = -Number.MAX_VALUE,
            rMinLng = Number.MAX_VALUE,
            rMaxLng = -Number.MAX_VALUE;

        for (let i = 0, l = markers.length; i < l; ++i) {
            if (!withFiltered && markers[i].filtered) {
                continue;
            }
            let pos = markers[i].position;

            if (pos.lat < rMinLat) rMinLat = pos.lat;
            if (pos.lat > rMaxLat) rMaxLat = pos.lat;
            if (pos.lng < rMinLng) rMinLng = pos.lng;
            if (pos.lng > rMaxLng) rMaxLng = pos.lng;
        }

        return {
            minLat: rMinLat,
            maxLat: rMaxLat,
            minLng: rMinLng,
            maxLng: rMaxLng
        };
    }

    public FindMarkersBoundsInArea(area: Bounds): Bounds | null {
        return this.ComputeBounds(this.FindMarkersInArea(area));
    }

    public ComputeGlobalBounds(withFiltered: boolean = true): Bounds | null {
        return this.ComputeBounds(this._markers, withFiltered);
    }

    public GetMarkers(): PruneClusterMarker[] {
        return this._markers;
    }

    public GetPopulation(): number {
        return this._markers.length;
    }

    public ResetClusters() {
        this._clusters = [];
    }

}