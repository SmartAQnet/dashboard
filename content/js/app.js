var gostApp = angular.module('gostApp', ['ngRoute']);

gostApp.factory('Page', function () {
    var title = 'SmartAQnet';
    return {
        title: function () { return title; },
        setTitle: function (newTitle) { title = newTitle; }
    };
});

// Set routes
gostApp.config(function ($routeProvider) {
	$routeProvider.
		when("/home", { templateUrl: '/dashboard/content/views/home.html', controller: "HomeCtrl", activetab: 'home' }).
		when('/thing/:id', { templateUrl: '/dashboard/content/views/thing.html', controller: "ThingCtrl", activetab: 'things' }).
		when("/things", { templateUrl: '/dashboard/content/views/things.html', controller: "ThingsCtrl", activetab: 'things' }).
		when('/locations', { templateUrl: '/dashboard/content/views/locations.html', controller: "LocationsCtrl", activetab: 'things' }).
		when('/historicallocations', { templateUrl: '/dashboard/content/views/historicallocations.html', controller: "HistoricalLocationsCtrl", activetab: 'things' }).
		when('/sensors', { templateUrl: '/dashboard/content/views/sensors.html', controller: "SensorsCtrl", activetab: 'sensors' }).
		when('/observedproperties', { templateUrl: '/dashboard/content/views/observedproperties.html', controller: "ObservedPropertiesCtrl", activetab: 'properties' }).
		when('/datastream/:id', { templateUrl: '/dashboard/content/views/datastream.html', controller: "DatastreamCtrl", activetab: 'things' }).
		when('/datastreams', { templateUrl: '/dashboard/content/views/datastreams.html', controller: "DatastreamsCtrl", activetab: 'sensors' }).
		when('/observations', { templateUrl: '/dashboard/content/views/observations.html', controller: "ObservationsCtrl", activetab: 'sensors' }).
		when('/featuresofinterest', { templateUrl: '/dashboard/content/views/featuresofinterest.html', controller: "FeaturesOfInterestCtrl" }).
		when('/mqtt', { templateUrl: '/dashboard/content/views/mqtt.html', controller: "MqttCtrl" }).
		otherwise({redirectTo: '/home' });
});

var iconThing = "fa-cube";
var iconDatastream = "fa-line-chart";
var iconFeatureOfInterest = "fa-map";
var iconHistoricalLocation = "fa-history";
var iconLocation = "fa-map-marker";
var iconObservation = "fa-eye";
var iconSensor = "fa-dashboard";
var iconObservedProperty = "fa-list";

function getSSLEnabled() {
	return location.protocol == 'https:'
}


function getUrl() {
	if (typeof stURL !== 'undefined') {
		return stURL   
	} else if (window.location.protocol.localeCompare("file:"  !== '0')) {
		return "https://smartaqnet.teco.edu"
		//return "https://smartaqnet-dev.dmz.teco.edu"
	}
	return "";
}

function getId(id) {
	return isNaN(id)?"'"+encodeURIComponent(id)+"'":id;
}


var olMap;
var defaultMarkerStyle = new ol.style.Style({
	image: new ol.style.Icon(({
		anchor: [0.5, 1],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		//color: [127,127,0,0.1],
		src: '/dashboard/content/assets/img/map_marker.svg'
	}))
})



var stylefunction = function(pmvalue){

	var brownanchor = 100
	var redanchor = 50
	var yellowanchor = 30
	var greenanchor = 10

	var colorfunction = function(result){


		if (result > brownanchor) {redrgb = 96, greenrgb = 64, bluergb = 0} //brown area
		if (result > redanchor && result < brownanchor) {redrgb = (192-96)*(1-((result-redanchor)/(brownanchor-redanchor))) + 96 , greenrgb=64*((result-redanchor)/(brownanchor-redanchor)), bluergb=0} //slide red to brown: (192,0,0) - (96,64,0)
		if (result < redanchor && result > yellowanchor) {redrgb = 192, greenrgb=(1-((result-yellowanchor)/(redanchor-yellowanchor)))*192, bluergb=0} // slide yellow to red: (192,192,0) - (192,0,0)
		if (result < yellowanchor && result > greenanchor) {redrgb = ((result-greenanchor)/(yellowanchor-greenanchor))*192, greenrgb = 192, bluergb = 0} //slide green to yellow (0,192,0) - (192,192,0)
		if (result < greenanchor) {redrgb = 0, greenrgb = 192, bluergb = 0} //green area

		return(redrgb.toString() + ',' + greenrgb.toString() + ',' + bluergb.toString())
	}


	var colormarker = new ol.style.Style({
		image: new ol.style.Circle({
			radius: 10,
			fill: new ol.style.Fill({
				color: 'rgba(' + colorfunction(pmvalue) + ',0.2)'
			}),
			stroke: new ol.style.Stroke({
				color: 'rgba(' + colorfunction(pmvalue) + ',0.8)',
				width: 3
			})
		})
	})
	return(colormarker)
}


var heatmapfeature = function(lonLat, pmvalue){

	var heatmapmarker = new ol.Feature({
		geometry: lonLat,
		weight: Math.random() //weight is the color intensity?
	});
	return(heatmapmarker)
}




//creates the entire map
function createMap(target) {
	$(".map").empty();



	//create layers with collections and sources

	PinSource = new ol.source.Vector({
		format: new ol.format.GeoJSON(),
		features: PinCollection = new ol.Collection()
	});
	PinLayer = new ol.layer.Vector({
		source: PinSource
	});


	ColoredMarkerSource = new ol.source.Vector({
		format: new ol.format.GeoJSON(),
		features: ColoredMarkerCollection = new ol.Collection()
	});
	ColoredMarkerLayer = new ol.layer.Vector({
		source: ColoredMarkerSource
	});

	
	HeatmapSource = new ol.source.Vector({
		format: new ol.format.GeoJSON(),
		features: HeatmapCollection  = new ol.Collection()
	});

	HeatmapLayer = new ol.layer.Heatmap({
		source: HeatmapSource,
		blur: 20,
		//blur: function(feature){return feature}
		radius: 20,
		shadow: 1000,
		gradient: ['rgba(0,0,100,255)', 'rgba(0,0,100,255)', 'rgba(0,0,100,100)', 'rgba(0,0,100,50)', 'rgba(0,0,100,20)']
	});

	tileLayer = new ol.layer.Tile({
		source: new ol.source.XYZ({
		tileSize: [512, 512],
		url: 'https://api.mapbox.com/styles/v1/edenhalperin/cih84uopy000a95m41htugsnm/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWRlbmhhbHBlcmluIiwiYSI6IlFRZG0zMWMifQ.QUNKx4tIMjZfwmrE8SE6Bg'
		})
	})




	//create Views
	defaultView = new ol.View({
		zoom: 13,
		center: ol.proj.transform([10.8986971, 48.3668041], 'EPSG:4326', 'EPSG:3857'),
		maxZoom: 20
	})


	//create the map to combine layers and view
	olMap = new ol.Map({

		//Set of controls included in maps by default. Unless configured otherwise, this returns a collection containing an instance of controls. Add with extend. 
		controls: ol.control.defaults({ 
			attributionOptions: ({
				collapsible: false
			})
		}).extend([]),

		//Set layers
		layers: [
			tileLayer, 
			PinLayer
			//geoJSONLayer,
			//HeatmapLayer
		],

		//Set Target, View and Interactions
		target: 'map',
		view: defaultView,
		interactions: ol.interaction.defaults({ altShiftDragRotate: false, pinchRotate: false })
	});

	//kriging parameters, see https://codepen.io/jianxunrao/pen/oadBPq
	var params={
		mapCenter:[10.8986971, 48.3668041],
		maxValue:100,
		krigingModel:'exponential',//model还可选'gaussian','spherical','exponential'
		krigingSigma2:0,
		krigingAlpha:100,
		canvasAlpha:0.75,//canvas图层透明度
		colors:["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf","#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"],
	};

	//kriging layers map --------------------------------------------------------------------------------

	WFSVectorSource=new ol.source.Vector();
	WFSVectorLayer=new ol.layer.Vector(
		{
			source: WFSVectorSource,
		});
	olMap.addLayer(WFSVectorLayer);

	//add interaction
	var select = new ol.interaction.Select();
	olMap.addInteraction(select);
	var dragBox = new ol.interaction.DragBox({
		condition: ol.events.condition.platformModifierKeyOnly
	});
	olMap.addInteraction(dragBox);



	//add single point
	var feature = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.fromLonLat([8.4,49])),
		value: 10

	});

	feature.setStyle(new ol.style.Style({
		image: new ol.style.Circle({
			radius: 6,
			fill: new ol.style.Fill({
				color: "#FF000F"
			}),
			stroke: new ol.style.Stroke({
				color: '#00000F',
				width: 3
			})
		})
	}));

	WFSVectorSource.addFeature(feature);




	//add features
	for (let i = 0; i < 10; i++) {
		var feature = new ol.Feature({
			geometry: new ol.geom.Point(
				ol.proj.fromLonLat([params.mapCenter[0]+Math.random()*0.01-.005,params.mapCenter[1]+Math.random()*0.01-.005])), 
				value: Math.round(Math.random()*params.maxValue)
		});
		feature.setStyle(new ol.style.Style({
			image: new ol.style.Circle({
				radius: 6,
				fill: new ol.style.Fill({color: "#00000F"})
			})
		}));
		WFSVectorSource.addFeature(feature);
	}





	setTimeout(delayedUpdateMap, 300);





/*
	//设置框选事件
	let selectedFeatures = select.getFeatures();
	dragBox.on('boxend', ()=>{
		let extent = dragBox.getGeometry().getExtent();
		WFSVectorSource.forEachFeatureIntersectingExtent(extent, (feature)=> {
			selectedFeatures.push(feature);
		});
		drawKriging(extent);
	});
	dragBox.on('boxstart', ()=>{
		selectedFeatures.clear();
	});




		//绘制kriging插值图
	let canvasLayer=null;
	const drawKriging=(extent)=>{
		let values=[],lngs=[],lats=[];
		selectedFeatures.forEach(feature=>{
			values.push(feature.values_.value);
			lngs.push(feature.values_.geometry.flatCoordinates[0]);
			lats.push(feature.values_.geometry.flatCoordinates[1]);
		});
		if (values.length>-1){
			let variogram=kriging.train(values,lngs,lats,
				params.krigingModel,params.krigingSigma2,params.krigingAlpha);

			let polygons=[];
			polygons.push([[extent[0],extent[1]],[extent[0],extent[3]],
				[extent[2],extent[3]],[extent[2],extent[1]]]);
			let grid=kriging.grid(polygons,variogram,(extent[2]-extent[0])/200);

			let dragboxExtent=extent;
			//移除已有图层
			if (canvasLayer !== null){
				map.removeLayer(canvasLayer);
			}
			//创建新图层
			canvasLayer=new ol.layer.Image({
				source: new ol.source.ImageCanvas({
					canvasFunction:(extent, resolution, pixelRatio, size, projection) =>{
						let canvas = document.createElement('canvas');
						canvas.width = size[0];
						canvas.height = size[1];
						canvas.style.display='block';
						//设置canvas透明度
						canvas.getContext('2d').globalAlpha=params.canvasAlpha;                          

						//使用分层设色渲染
						kriging.plot(canvas,grid,
							[extent[0],extent[2]],[extent[1],extent[3]],params.colors);

						return canvas;
					},
					projection: 'EPSG:4326'
				})
			})
			//向map添加图层
			map.addLayer(canvasLayer);
		}else {
			alert("Fehlermeldung auf chinesisch: 有效样点个数不足，无法插值");
		}
	}
	//首次加载，自动渲染一次差值图
	let extent = [params.mapCenter[0]-.005,params.mapCenter[1]-.005,params.mapCenter[0]+.005,params.mapCenter[1]+.005];
		WFSVectorSource.forEachFeatureIntersectingExtent(extent, (feature)=> {
			selectedFeatures.push(feature);
		});
	drawKriging(extent);

*/
}


//function that can be used to add features to the map with gps coordinates
function addGeoJSONFeature(geojson) {
	var defaultGeoJSONProjection = 'EPSG:4326';
	var mapProjection = olMap.getView().getProjection();

	if (JSON.stringify(geojson).includes("FeatureCollection")) {
		PinCollection.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
	}
	else {
		var geom = (new ol.format.GeoJSON()).readGeometry(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });
		var pinfeature = new ol.Feature(geom);
		pinfeature.setStyle(defaultMarkerStyle);
		PinCollection.push(pinfeature);
	}
}

//function that can be used to add features to the map with gps coordinates and a value for value height which is used for color coding
function addGeoJSONcolorFeature(geojson, result) {
	var defaultGeoJSONProjection = 'EPSG:4326';
	var mapProjection = olMap.getView().getProjection();

	if (JSON.stringify(geojson).includes("FeatureCollection")) {
		ColoredMarkerCollection.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
		HeatmapCollection.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
	}
	else {
		var geom = (new ol.format.GeoJSON()).readGeometry(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });
		var colormarkerfeature = new ol.Feature(geom);
		colormarkerfeature.setStyle(stylefunction(result));
		ColoredMarkerCollection.push(colormarkerfeature);
		var heatmapfeature = heatmapfeature(geom,result);
		HeatmapCollection.push(heatmapfeature);
	}
}

//function that can be used to add features to the heatmap
function addHeatmapFeature(geojson, result) {
	var defaultGeoJSONProjection = 'EPSG:4326';
	var mapProjection = olMap.getView().getProjection();

	if (JSON.stringify(geojson).includes("FeatureCollection")) {
		olCollectionGeoJSON.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
	}
	else {
		var geom = (new ol.format.GeoJSON()).readGeometry(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });
		var feature = heatmapfeature(geom,result);
		olCollectionGeoJSON.push(feature);
	}
}



function togglelayers(layerstring,toggle) {
	if (toggle == true) {olMap.addLayer(eval(layerstring))}
	if (toggle == false)  {olMap.removeLayer(eval(layerstring))}
};










//function that sets the initial zoom and center of a map so that all features are visible. If the resulting area would result in a very high zoom (e.g. only one feature), sets it to 17 instead
function zoomToGeoJSONLayerExtent() {
	//var extent = geoJSONLayer.getSource().getExtent();
	//olMap.getView().fit(extent, olMap.getSize());
	if (olMap.getView().getZoom() > 17) {
		olMap.getView().setZoom(17)}
}

function delayedUpdateMap() {
	olMap.updateSize();
}

var myChart;

function createObservationChart(datasets){
	if(myChart != null){
		myChart.destroy();	
	}

	//$("#observationChartWrapper").empty();
	Chart.defaults.global.responsive = true;
	Chart.defaults.global.maintainAspectRatio = false;
	Chart.defaults.global.legend.display = false;
	chartData = {
		labels: labels,
		datasets: [
			{
				fill: true,
				lineTension: 0.1,
				backgroundColor: "rgba(115,135,156,0.15)",
				borderColor: "rgba(115,135,156,1)",
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: "rgba(115,135,156,1)",
				pointBackgroundColor: "#fff",
				pointBorderWidth: 1,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: "rgba(75,192,192,1)",
				pointHoverBorderColor: "rgba(220,220,220,1)",
				pointHoverBorderWidth: 2,
				pointRadius: 2,
				pointHitRadius: 10,
				data: datasets[0],
			}
		]
	}

	var ctx = $("#observationChart");
	ctx.innerHTML = "";
	myChart = new Chart(ctx, {
		type: 'scatter',
		data: chartData,
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero:false
					}
				}],
				xAxes: [{
					type: 'time',
					time: {
						displayFormats: {
							minute: 'kk:mm'
						}
					}
				}]
			}
		}
	});
}

function observationChartAddData(l, d){
	myChart.data.datasets[0].data = d;
	myChart.data.labels = l;
	myChart.update();
}

$('.fs-button').on('click', function(){
	if (!document.fullscreenElement &&    // alternative standard method
		!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.msRequestFullscreen) {
			document.documentElement.msRequestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
});

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}


var getLocation = function(href) {
	var l = document.createElement("a");
	l.href = href;
	return l;
};

function getWebsocketUrl() {    
	if (typeof wsURL !== 'undefined' && wsURL != "") {
		return wsURL   
	} else {
		var scheme = getSSLEnabled() ? "wss://" : "ws://";
		return scheme + getLocation(getUrl()).hostname + "/mqtt"
	}   
}
