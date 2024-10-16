![Leaflet Clustering](https://sintef-9012.github.io/PruneCluster/logo.png)
============


While upgrading the original codebase an abstraction was created & the library was restructured to allow for easier integration with other libraries. This library is now a full clustering library that can be used with other geospatial algorithms.

*Example 1:* [150 000 randomly moving markers](https://github.com/WogwonSociety/leaflet-clustering/blob/master/index.html).
 
*The library is designed for large datasets or live situations.* The memory consumption is kept low and the library is fast on mobile devices, thanks to a new algorithm inspired by collision detection in physical engines.

### 🔧 This readme is under heavy reconstruction to match our updated syntax


TODO:
- Simplify the weight system
- Simplify the category system
- 

=================================

#### Weight
You can specify the weight of each marker.

For example, you may want to add more importance to a marker representing an incident, than a marker representing a tweet.

#### Categories

You can specify a category for the markers. Then a small object representing the number of markers for each category is attached to the clusters. This way, you can create cluster icons adapted to their content.

[![](https://sintef-9012.github.io/PruneCluster/clustering_a.png)](http://sintef-9012.github.io/PruneCluster/examples/random.10000-categories.html) [![](https://sintef-9012.github.io/PruneCluster/clustering_b.png)](http://sintef-9012.github.io/PruneCluster/examples/random.10000-categories-2.html)

#### Dynamic cluster size

The size of a cluster can be adjusted on the fly *([Example](http://sintef-9012.github.io/PruneCluster/examples/random.10000-size.html))*

#### Filtering
The markers can be filtered easily with no performance cost.


### Usage

#### Using IIFE module
```html

<!--Include leaflet-->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""></script>

<!--Include leaflet-clustering-->
    <script src="dist/leaflet-clustering.mjs"></script>

<!--In Body -->

<!-- Leaflet map object -->
<div id="map"></div> 

<script>
    let LeafletAdapter = LeafletClustering.LeafletAdapter;
    let ClusterMarker = LeafletClustering.ClusterMarker;
    
//     On document loaded, for example
    document.addEventListener('DOMContentLoaded',(event)=>{
        // Setup your map object 
        const map = L.map("map", {
            attributionControl: false,
            zoomControl: false
        }).setView(new L.LatLng(59.911111, 10.752778), 8);

        // Add a tile layer
        L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            detectRetina: true,
            maxNativeZoom: 17
        }).addTo(map);

        // Initialize your implementation. e.g: LeafletAdapter
        const leafletView = new LeafletAdapter();
        leafletView.onAdd(map);
        console.log('LeafletAdapter Loaded & added to map');
        const size = 150000;
        const markers = []; //Array of ClusterMarker

        console.log('Adding Markers');
        for (let i = 0; i < size; ++i) {
            const marker = new ClusterMarker(
                    59.91111 + (Math.random() - 0.5) * Math.random() * 0.00001 * size,
                    10.752778 + (Math.random() - 0.5) * Math.random() * 0.00002 * size
            );

            // Local storage for markers here.
            markers.push(marker);
            
            // Handle your markers registration through our layer now.
            leafletView.RegisterMarker(marker);
        }

        console.log(`Added ${size} Markers to map.`);
        console.log('Processing View');
        
        //When anything changes, process the view here.
        leafletView.ProcessView();
        
        // Interval assigned to simulate moving markers to show for the example
        window.setInterval(() => {
            for (let i = 0; i < size / 2; ++i) {
                const coef = i < size / 8 ? 10 : 1;
                markers[i].position = {
                    ...markers[i].position,
                    lat: markers[i].position.lat + (Math.random() - 0.5) * 0.00001 * coef,
                    lng: markers[i].position.lng + (Math.random() - 0.5) * 0.00002 * coef
                };
                // const ll = markers[i].position;
                // ll.lat += (Math.random() - 0.5) * 0.00001 * coef;
                // ll.lng += (Math.random() - 0.5) * 0.00002 * coef;
            }

            leafletView.ProcessView();
        }, 3000);
    });


</script>
```

#### NPM (BUN)

`bun add @wogwonsociety/leaflet-clustering`

```javascript
import { PruneCluster, LeafletAdapter } from '@wogwon/leaflet-clustering';

```

#### Example

```javascript
// Prune cluster
var pruneCluster = new LeafletAdapter();

// Provide a custom clusterHandler
// var adapter = new LeafletAdapter({clusterHandler: new CustomClusterHandler()});

...
var marker = new VirtualMarker(59.8717, 11.1909);
pruneCluster.RegisterMarker(marker);
...

leafletMap.addLayer(pruneCluster);
```

### LeafletAdapter constructor

```javascript
LeafletAdapter([size](#set - the - clustering - size), margin);
```

You can specify the size and margin which affect when your clusters and markers will be merged.

size defaults to 120 and margin to 20.

#### Update a position
```javascript
marker.Move(lat, lng);
```

#### Deletions
```javascript
// Remove all the markers
pruneCluster.RemoveMarkers();

// Remove a list of markers
pruneCluster.RemoveMarkers([markerA,markerB,...]);
```

#### Set the category
The category can be a number or a string, but in order to minimize the performance cost, it is recommended to use numbers between 0 and 7.
```javascript
marker.category = 5;
```

#### Set the weight
```javascript
marker.weight = 4;
```

#### Filtering
```javascript
marker.filtered = true|false;
```

#### Set the clustering size
You can specify a number indicating the area of the cluster. Higher number means more markers "merged". *([Example](http://sintef-9012.github.io/PruneCluster/examples/random.10000-size.html))*
```javascript
pruneCluster.Cluster.Size = 87;
```

#### Apply the changes

**Must be called when ANY changes are made.**

```javascript
pruneCluster.ProcessView();
```

#### Add custom data to marker object

Each marker has a data object where you can specify your data.
```javascript
marker.data.name = 'Roger';
marker.data.ID = '76ez';
```

#### Setting up a Leaflet icon or a Leaflet popup

You can attach to the markers an icon object and a popup content
```javascript
marker.data.icon = L.icon(...);  // See http://leafletjs.com/reference.html#icon
marker.data.popup = 'Popup content';
```

#### Faster leaflet icons

If you have a lot of markers, you can create the icons and popups on the fly in order to improve their performance.

```javascript
function createIcon(data, category) {
    return L.icon(...);
}

...

marker.data.icon = createIcon;
```

You can also override the PreapareLeafletMarker method. You can apply listeners to the markers here.

```javascript
pruneCluster.PrepareLeafletMarker = function(leafletMarker, data) {
    leafletMarker.setIcon(/*... */); // See http://leafletjs.com/reference.html#icon
    //listeners can be applied to markers in this function
    leafletMarker.on('click', function(){
    //do click event logic here
    });
    // A popup can already be attached to the marker
    // bindPopup can override it, but it's faster to update the content instead
    if (leafletMarker.getPopup()) {
        leafletMarker.setPopupContent(data.name);
    } else {
        leafletMarker.bindPopup(data.name);
    }
};
```

#### Setting up a custom cluster icon
```javascript
pruneCluster.BuildLeafletClusterIcon = function(cluster) {
    var population = cluster.population, // the number of markers inside the cluster
        stats = cluster.stats; // if you have categories on your markers

    // If you want list of markers inside the cluster
    // (you must enable the option using PruneCluster.Cluster.ENABLE_MARKERS_LIST = true)
    var markers = cluster.GetClusterMarkers() 
        
    ...
    
    return icon; // L.Icon object (See http://leafletjs.com/reference.html#icon);
};
```

#### Listening to events on a cluster

To listen to events on the cluster, you will need to override the ```BuildLeafletCluster``` method. A click event is already specified on m, but you can add other events like mouseover, mouseout, etc. Any events that a Leaflet marker supports, the cluster also supports, since it is just a modified marker. A full list of events can be found [here](http://leafletjs.com/reference.html#marker-click).

Below is an example of how to implement mouseover and mousedown for the cluster, but any events can be used in place of those.
```javascript
pruneCluster.BuildLeafletCluster = function(cluster, position) {
      var m = new L.Marker(position, {
        icon: pruneCluster.BuildLeafletClusterIcon(cluster)
      });

      m.on('click', function() {
        // Compute the  cluster bounds (it's slow : O(n))
        var markersArea = pruneCluster.Cluster.FindMarkersInArea(cluster.bounds);
        var b = pruneCluster.Cluster.ComputeBounds(markersArea);

        if (b) {
          var bounds = new L.LatLngBounds(
            new L.LatLng(b.minLat, b.maxLng),
            new L.LatLng(b.maxLat, b.minLng));

          var zoomLevelBefore = pruneCluster._map.getZoom();
          var zoomLevelAfter = pruneCluster._map.getBoundsZoom(bounds, false, new L.Point(20, 20, null));

          // If the zoom level doesn't change
          if (zoomLevelAfter === zoomLevelBefore) {
            // Send an event for the LeafletSpiderfier
            pruneCluster._map.fire('overlappingmarkers', {
              cluster: pruneCluster,
              markers: markersArea,
              center: m.getLatLng(),
              marker: m
            });

            pruneCluster._map.setView(position, zoomLevelAfter);
          }
          else {
            pruneCluster._map.fitBounds(bounds);
          }
        }
      });
      m.on('mouseover', function() {
        //do mouseover stuff here
      });
      m.on('mouseout', function() {
        //do mouseout stuff here
      });

      return m;
    };
};
```

#### Redraw the icons

Marker icon redrawing with a flag:

```javascript
marker.data.forceIconRedraw = true;

...

pruneCluster.ProcessView();
```

Redraw all the icons:
```javascript
pruneCluster.RedrawIcons();
```

### Acknowledgements

This library was developed in context of the BRIDGE project. It is now supported by the community and we thank [the contributors](https://github.com/SINTEF-9012/PruneCluster/graphs/contributors).

Originally a fork of [PruneCluster](https://github.com/SINTEF-9012/PruneCluster), this library provides an alternative to the default leaflet marker clustering using a 'sweep & prune' algorithm.


### Licence

The source code of this library is licensed under the MIT License.
