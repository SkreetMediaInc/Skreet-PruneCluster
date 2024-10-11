import PruneClusterForLeaflet from "./PruneClusterForLeaflet";
import L = require("leaflet");
// Based on https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet and
// https://github.com/Leaflet/Leaflet.markercluster because it works very perfectly


// @ts-ignore
const PruneClusterLeafletSpiderfier = ((<any>L).Layer ? (<any>L).Layer : L.Class).extend({
	_2PI: Math.PI * 2,
	_circleFootSeparation: 25, //related to circumference of circle
	_circleStartAngle: Math.PI / 6,

	_spiralFootSeparation: 28, //related to size of spiral (experiment!)
	_spiralLengthStart: 11,
	_spiralLengthFactor: 5,

	_spiralCountTrigger: 8,

	spiderfyDistanceMultiplier: 1,

	initialize: function (cluster: PruneClusterForLeaflet) {
		this._cluster = cluster;
		this._currentMarkers = [];

		this._lines = L.polyline([], {weight: 1.5, color: '#222'});
	},

	onAdd: function (map: L.Map) {
		this._map = map;

		this._map.on('overlappingmarkers', this.Spiderfy, this);

		this._map.on('click', this.Unspiderfy, this);
		this._map.on('zoomend', this.Unspiderfy, this);
	},

	Spiderfy: function (data: any) {
		// Ignore events from other PruneCluster instances
		if (data.cluster !== this._cluster) {
			return;
		}

		this.Unspiderfy();
		// @ts-ignore
		const markers = data.markers.filter(function (marker) {
			return !marker.filtered;
		});

		this._currentCenter = data.center;

		const centerPoint = this._map.latLngToLayerPoint(data.center);

		let points: L.Point[];
		if (markers.length >= this._spiralCountTrigger) {
			points = this._generatePointsSpiral(markers.length, centerPoint);
		} else {
			if (this._multiLines) { // if multilines, leaflet < 0.8
				centerPoint.y += 10; // center fix
			}
			points = this._generatePointsCircle(markers.length, centerPoint);
		}

		let polylines: L.LatLng[][] = [];


		const leafletMarkers: L.Marker[] = [];
		const projectedPoints: L.LatLng[] = [];

		for (let i = 0, l = points.length; i < l; ++i) {
			const pos = this._map.layerPointToLatLng(points[i]);
			const m = this._cluster.BuildLeafletMarker(markers[i], data.center);
			m.setZIndexOffset(5000);
			m.setOpacity(0);

			// polylines.push([data.center, pos]);

			this._currentMarkers.push(m);
			this._map.addLayer(m);

			leafletMarkers.push(m);
			projectedPoints.push(pos);
		}

		window.setTimeout(() => {
			for (let i = 0, l = points.length; i < l; ++i) {
				leafletMarkers[i].setLatLng(projectedPoints[i])
					.setOpacity(1);
			}

			const startTime = +new Date();

			const interval = 42, duration = 290;
			const anim = window.setInterval(() => {

				let stepRatio;
				polylines = [];

				const now = +new Date();
				const d = now - startTime;
				if (d >= duration) {
					window.clearInterval(anim);
					stepRatio = 1.0;
				} else {
					stepRatio = d / duration;
				}

				const center = data.center;

				for (let i = 0, l = points.length; i < l; ++i) {
					const p = projectedPoints[i],
						diffLat = p.lat - center.lat,
						diffLng = p.lng - center.lng;

					polylines.push([center, new L.LatLng(center.lat + diffLat * stepRatio, center.lng + diffLng * stepRatio)]);
				}

				this._lines.setLatLngs(polylines);

			}, interval);
		}, 1);

		this._lines.setLatLngs(polylines);
		this._map.addLayer(this._lines);

		if (data.marker) {
			this._clusterMarker = data.marker.setOpacity(0.3);
		}
	},

	_generatePointsCircle: function (count: number, centerPt: L.Point): L.Point[] {
		const circumference = this.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count),
			legLength = circumference / this._2PI, //radius from circumference
			angleStep = this._2PI / count,
			res = [];
		let i,
			angle;

		res.length = count;

		for (i = count - 1; i >= 0; i--) {
			angle = this._circleStartAngle + i * angleStep;
			res[i] = new L.Point(
				Math.round(centerPt.x + legLength * Math.cos(angle)),
				Math.round(centerPt.y + legLength * Math.sin(angle)));
		}

		return res;
	},

	_generatePointsSpiral: function (count: number, centerPt: L.Point): L.Point[] {
		let legLength = this.spiderfyDistanceMultiplier * this._spiralLengthStart;
		const separation = this.spiderfyDistanceMultiplier * this._spiralFootSeparation,
			lengthFactor = this.spiderfyDistanceMultiplier * this._spiralLengthFactor;
		let angle = 0;
		const res = [];
		let i;

		res.length = count;

		for (i = count - 1; i >= 0; i--) {
			angle += separation / legLength + i * 0.0005;
			res[i] = new L.Point(
				Math.round(centerPt.x + legLength * Math.cos(angle)),
				Math.round(centerPt.y + legLength * Math.sin(angle)));
			legLength += this._2PI * lengthFactor / angle;
		}
		return res;
	},

	Unspiderfy() {
		for (let i = 0, l = this._currentMarkers.length; i < l; ++i) {
			this._currentMarkers[i].setLatLng(this._currentCenter).setOpacity(0);
		}

		const map = this._map;
		const markers = this._currentMarkers;
		window.setTimeout(() => {
			for (let i = 0, l = markers.length; i < l; ++i) {
				map.removeLayer(markers[i]);
			}

		}, 300);

		this._currentMarkers = [];

		this._map.removeLayer(this._lines);
		if (this._clusterMarker) {
			this._clusterMarker.setOpacity(1);
		}
	},

	onRemove: function (map: L.Map) {
		this.Unspiderfy();
		map.off('overlappingmarkers', this.Spiderfy, this);
		map.off('click', this.Unspiderfy, this);
		map.off('zoomend', this.Unspiderfy, this);
	}
});

export {PruneClusterLeafletSpiderfier};