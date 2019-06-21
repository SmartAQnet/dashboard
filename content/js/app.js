var gostApp = angular.module('gostApp', ['ngRoute', 'vs-repeat']);

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
		return "https://api.smartaq.net"
		//return "https://smartaqnet-dev.dmz.teco.edu"
	}
	return "";
}

function getId(id) {
	return isNaN(id)?"'"+encodeURIComponent(id)+"'":id;
}





/************************************ Parameters ************************************/
//                        set parameters for map and functions
/************************************************************************************/




var augsburg = [10.8986971, 48.3668041];
var karlsruhe = [8.4,49];

var params={
	mapCenter: karlsruhe,
	maxValue: 100,
	krigingModel: 'exponential',//model还可选'gaussian','spherical','exponential'
	krigingSigma2: 0,
	krigingAlpha: 100,
	canvasAlpha: 0.35,//canvas图层透明度
	colors: ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf","#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"]
};


function setview(coordinates){
	let view = new ol.View({
		zoom: 13,
		center: ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857'),
		maxZoom: 20
	})
	olMap.setView(view)
}

var defaultView  = new ol.View({
	zoom: 13,
	center: ol.proj.transform(params.mapCenter, 'EPSG:4326', 'EPSG:3857'),
	maxZoom: 20
})





/************************************** Map *************************************/
//                                create the Map
/********************************************************************************/



var olMap;

function createMap(target) {
	$(".map").empty();

	//create the map to combine layers and view
	olMap = new ol.Map({

		//Set of controls included in maps by default. Unless configured otherwise, this returns a collection containing an instance of controls. Add with extend. 
		controls: ol.control.defaults({ 
			attributionOptions: ({
				collapsible: false
			})
		}).extend([new ol.control.FullScreen()]),

		//Set layers
		layers: [],

		//Set Target, View and Interactions
		target: 'map',
		view: defaultView,
		interactions: ol.interaction.defaults({ altShiftDragRotate: false, pinchRotate: false })
	});


	olMap.addControl(legend);
	calculatelegend(params.colors);

	togglelayers(tileLayer,true);

	setTimeout(delayedUpdateMap, 300);
};




/*
//function that sets the initial zoom and center of a map so that all features are visible. If the resulting area would result in a very high zoom (e.g. only one feature), sets it to 17 instead
function zoomToGeoJSONLayerExtent() {
	var extent = geoJSONLayer.getSource().getExtent();
	olMap.getView().fit(extent, olMap.getSize());
	if (olMap.getView().getZoom() > 17) {
		olMap.getView().setZoom(17)}
}
*/


function delayedUpdateMap() {
	olMap.updateSize();
}






/************************************ Layers ************************************/
//                 create layers with collections and sources
/********************************************************************************/



//pin layer for locations of things
var PinSource = new ol.source.Vector({
	format: new ol.format.GeoJSON(),
	features: PinCollection = new ol.Collection()
});
var PinLayer = new ol.layer.Vector({
	source: PinSource
});


//colored markers for latest observations per datastream with feature of interest
var ColoredMarkerSource = new ol.source.Vector({
	format: new ol.format.GeoJSON(),
	features: ColoredMarkerCollection = new ol.Collection()
});
var ColoredMarkerLayer = new ol.layer.Vector({
	source: ColoredMarkerSource
});

//simulation source and layers
var SimulationSource = new ol.source.Vector({
	format: new ol.format.GeoJSON(),
	features: SimulationCollection = new ol.Collection()
})
var SimulationInvisibleLayer = new ol.layer.Vector({
	source: SimulationInvisibleSource = new ol.source.Vector({
		format: new ol.format.GeoJSON(),
		features: SimulationInvisibleCollection = new ol.Collection()
	})
});


//canvas layer for kriging
var canvasLayer = new ol.layer.Image({
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


//tile layer for the actual map
var tileLayer = new ol.layer.Tile({
	source: new ol.source.XYZ({
	tileSize: [512, 512],
	url: 'https://api.mapbox.com/styles/v1/edenhalperin/cih84uopy000a95m41htugsnm/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWRlbmhhbHBlcmluIiwiYSI6IlFRZG0zMWMifQ.QUNKx4tIMjZfwmrE8SE6Bg'
	})
})




function togglelayers(layer,toggle) {
	if (toggle == true) {olMap.addLayer(layer)}
	if (toggle == false)  {olMap.removeLayer(layer)}
};







/************************************ Controls ***********************************/
//                                 Create controls
/********************************************************************************/


// Define a new legend
var legend = new ol.control.Legend({ 
	title: 'Feinstaub [g/cm^3]',
	margin: 5,
	collapsed: true
});

/*
	// Add a new one
var legend2 = new ol.control.Legend({ 
		title: ' ',
		margin: 5,
		target: legend.element
	});
	olMap.addControl(legend2);
*/


//olMap.addControl(new ol.control.ScaleLine());
//olMap.addControl(legend);
//olMap.removeControl(legend);



function calculatelegend(anchorarray){

	function gradientfunction(one, two){
		var grad = document.createElement('canvas').getContext('2d').createLinearGradient(15, 15, 15, 40);
			grad.addColorStop(0, one);
			grad.addColorStop(1, two);
			return grad;
	};
	

	for (let i=(anchorarray.length-2);i>=0;i--) {
		
		if ( i==(anchorarray.length-2)) {var scale=params.maxValue}
		else if ( i==0 ) {var scale = 0}
		else {var scale = " "}
		
		legend.addRow({
			title: scale.toString(), 
			typeGeom: 'Point',
			style: new ol.style.Style({
				image: new ol.style.RegularShape({
					points: 4,
					radius: 25,
					angle: 3.14/4,
					//stroke: new ol.style.Stroke({ color: 'black', width: 0.5 }),
					fill: new ol.style.Fill({ color: gradientfunction(anchorarray[i+1],anchorarray[i])})
				})
			})
		});
	};
};



customControl = function(opt_options) {
    var element = document.createElement('div');
    element.className = 'custom-control ol-unselectable ol-control';
    ol.control.Control.call(this, {
      element: element
    });
  };
  ol.inherits(customControl, ol.control.Control);


var testcontrol = new customControl({
	innterHTML: "test"
})


function togglecontrols(control,toggle) {
	if (toggle == true) {olMap.addControl(control)}
	if (toggle == false)  {olMap.removeControl(control)}
};

/************************************ Marker ************************************/
//                               create Markers
/********************************************************************************/




var defaultMarkerStyle = new ol.style.Style({
	image: new ol.style.Icon(({
		anchor: [0.5, 1],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		//color: [127,127,0,0.1],
		src: '/dashboard/content/assets/img/map_marker.svg'
	}))
})




var brownanchor = 100
var redanchor = 66
var yellowanchor = 33
var greenanchor = 0

var redrgb;
var bluergb;
var greenrgb;

var colorfunction = function(result,opacity){
	
	if (result > brownanchor) {redrgb = 96, greenrgb = 64, bluergb = 0} //brown area
	if (result > redanchor && result < brownanchor) {redrgb = (192-96)*(1-((result-redanchor)/(brownanchor-redanchor))) + 96 , greenrgb=64*((result-redanchor)/(brownanchor-redanchor)), bluergb=0} //slide red to brown: (192,0,0) - (96,64,0)
	if (result < redanchor && result > yellowanchor) {redrgb = 192, greenrgb=(1-((result-yellowanchor)/(redanchor-yellowanchor)))*192, bluergb=0} // slide yellow to red: (192,192,0) - (192,0,0)
	if (result < yellowanchor && result > greenanchor) {redrgb = ((result-greenanchor)/(yellowanchor-greenanchor))*192, greenrgb = 192, bluergb = 0} //slide green to yellow (0,192,0) - (192,192,0)
	if (result < greenanchor) {redrgb = 0, greenrgb = 192, bluergb = 0} //green area

	return('rgba(' + redrgb.toString() + ',' + greenrgb.toString() + ',' + bluergb.toString()  + ',' + opacity + ')')
};


var stylefunction = function(pmvalue){

	var colormarker = new ol.style.Style({
		image: new ol.style.Circle({
			radius: 10,
			fill: new ol.style.Fill({
				color: colorfunction(pmvalue,0.2)
			}),
			stroke: new ol.style.Stroke({
				color: colorfunction(pmvalue,0.8),
				width: 3
			})
		})
	})
	return(colormarker)
};





//function that can be used to add gps pins to the map
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
function addGeoJSONcolorFeature(geojson, result, resulttime) {
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
		colormarkerfeature.setId(resulttime);
		ColoredMarkerCollection.push(colormarkerfeature);
		//var heatmapfeature = heatmapfeature(geom,result);
		//HeatmapCollection.push(heatmapfeature);
	}
};






/************************************ Kriging ************************************/
//                               calculate Kriging
/*********************************************************************************/

var grid;
var caz = [[10.924750,48.386800],[10.870650,48.386800],[10.870650,48.332600],[10.924750,48.332600]]


function getcurrentextend(){
	var extent = olMap.getView().calculateExtent(olMap.getSize());
	extent=ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326'); //[0][1] is bottom left [2][1] is bottom right [0][3] is top left
	var bottomleft = [extent[0],extent[1]];
	var bottomright =  [extent[2],extent[1]];
	var topleft = [extent[0],extent[3]];
	var topright = [extent[2],extent[3]];
	return([topright, topleft, bottomleft, bottomright]);
};



function krigstuff(locations,values){
	var lats=locations.map(function(x){return x[1]})
	var lngs=locations.map(function(x){return x[0]})
	var variogram=kriging.train(values,lngs,lats,
		params.krigingModel,params.krigingSigma2,params.krigingAlpha);
	var polygons=[getcurrentextend()];
	grid=kriging.grid(polygons,variogram,(polygons[0][0][1]-polygons[0][3][1])/200);
};







/************************************ Simulation ************************************/
//                               create Simulation
/************************************************************************************/



var idcounter = 1;
var randomlocation = [];
var randomvalue = [];
var xspeed = [];
var yspeed = [];
var totalspeed = [];

var scalingfactor = 0.005;

function setupsimulations(number){
	for (let i = 0; i <= number-1; i++){
		randomlocation[i] = [params.mapCenter[0]+scalingfactor*(Math.random()-0.5)*1.6,params.mapCenter[1]+scalingfactor*(Math.random()-0.5)*0.9];
		randomvalue[i] = 50*Math.random();
		totalspeed[i] = (Math.random()+Math.random()+Math.random())*scalingfactor;
	};
	return(number);
}



function simulate(id){

	xspeed[id] = totalspeed[id]*Math.random();
	yspeed[id] = Math.sqrt(totalspeed[id]*totalspeed[id] - xspeed[id]*xspeed[id]);

	randomvalue[id] = randomvalue[id]*(Math.random()+Math.random()+0.1)/2;
	randomlocation[id] = [randomlocation[id][0]+(Math.random()-0.5)*scalingfactor*xspeed[id],randomlocation[id][1]+(Math.random()-0.5)*scalingfactor*yspeed[id]]

	let SimulatedFeature = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.fromLonLat(randomlocation[id])),
		value: randomvalue[id]
	});

	SimulatedFeature.setId(Date.now());
	SimulatedFeature.setStyle(stylefunction(randomvalue[id]))
	SimulationInvisibleSource.addFeature(SimulatedFeature);

	removeoldfeatures(900); //store time in milliseconds
};


function removeoldfeatures(grace){
	let threshold = Date.now() - grace;
	SimulationInvisibleSource.forEachFeature(function(thisfeature){
	if (thisfeature.getId() < threshold ) {
		SimulationInvisibleSource.removeFeature(thisfeature)
	}
})};



/*
function SimulationSourceUpdate(){
	SimulationSource.clear();
	SimulationSource.addFeatures(SimulationInvisibleSource.getFeatures());
	ColoredMarkerLayer.getSource().changed();
	canvasLayer.getSource().changed();
};
*/









/************************************ Chart ************************************/
//                                  Chart stuff
/************************************************************************************/




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
