gostApp.controller('MapCtrl', function ($scope, $http) {
        
        
    /************************************ Parameters ************************************/
    //                        set parameters for map and functions
    /************************************************************************************/


    var augsburg = [10.8986971, 48.3668041];
    var karlsruhe = [8.4,49];

    var params={
        mapCenter: augsburg,
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
    window.olMap = olMap;
    createMap();

    function createMap(target) {
        $(".map").empty();

        //create the map to combine layers and view
        olMap = new ol.Map({

            //Set of controls included in maps by default. Unless configured otherwise, this returns a collection containing an instance of controls. Add with extend. 
            controls: ol.control.defaults({ 
                attributionOptions: ({
                    collapsible: false
                })
            }).extend([new ol.control.FullScreen({source: 'fullscreen'})]),

            //Set layers
            layers: [],

            //Set Target, View and Interactions
            target: 'map',
            view: defaultView,
            interactions: ol.interaction.defaults({ altShiftDragRotate: false, pinchRotate: false })
        });
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





    /************************************ Layers ************************************/
    //                 create layers with collections and sources
    /********************************************************************************/

    //function that toggles layers on and off
    function togglelayers(layer,toggle) {
        if (toggle == true) {olMap.addLayer(layer)}
        if (toggle == false)  {olMap.removeLayer(layer)}
    };


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
    togglelayers(tileLayer,true);

    $scope.isKrigingActive = false

    if($scope.id.match(/:home:/)){ 
        $scope.isLayerPinsActive = true
        $scope.isColorMarkersActive = false
    } else if($scope.id.match(/:t:/)){
        $scope.isLayerPinsActive = true
        $scope.isColorMarkersActive = false
    } else if ($scope.id.match(/:op:/)){ 
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    } else if($scope.id.match(/:ds:/)){
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    } else if($scope.id.match(/:s:/)){
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    };
    
    //Default Layers at page loading

    togglelayers(PinLayer,$scope.isLayerPinsActive);
    togglelayers(ColoredMarkerLayer,$scope.isColorMarkersActive);
    togglelayers(canvasLayer,$scope.isKrigingActive);



/* ------------------------------------------------------------------------------------------------------------------------ */


    $scope.changedLayerPinsActive = function(){
        togglelayers(PinLayer,$scope.isLayerPinsActive);
    }
    
    $scope.changedColorMarkersActive = function(){
        togglelayers(ColoredMarkerLayer,$scope.isColorMarkersActive);
        enableLegendSidepanel();
    }

    $scope.changedKrigingActive = function(){
        togglelayers(canvasLayer,$scope.isKrigingActive);
        enableLegendSidepanel();
    }

    function enableLegendSidepanel() {
        var element = document.getElementById("LegendSidepanel");
        if (($scope.isColorMarkersActive || $scope.isKrigingActive) == false) {element.classList.add("invisible")
            } else if ($scope.isColorMarkersActive || $scope.isKrigingActive) {element.classList.remove("invisible")
        }
    };

    /************************************ Controls ***********************************/
    //                                 Create controls
    /********************************************************************************/






    function obspropertydict(obsprop){
        if (obsprop == "mcpm10"){
            return("PM 10")
        }
        else if (obsprop == "mcpm2p5"){
            return("PM 2.5")
        }
        else if (obsprop == "hur"){
            return("Relative Humidity")
        }
        else if (obsprop == "plev"){
            return("Air Pressure")
        }
        else if (obsprop == "ta"){
            return("Air Temperature")
        }
        else{return(obsprop)};
    };


    var external_fullscreen = new ol.control.FullScreen({
        target: document.querySelector(".sidepanel-header"),
        source: 'fullscreen'
    });
    olMap.addControl(external_fullscreen);

    // function togglecontrols(control,toggle) {
    //     if (toggle == true) {olMap.addControl(control)}
    //     if (toggle == false)  {olMap.removeControl(control)}
    // };

    $scope.isControlSidePanelOpen = false;
    $scope.toggleControlSidepanel = function(){
        $scope.isControlSidePanelOpen = !$scope.isControlSidePanelOpen;
    };

    $scope.isLegendSidePanelOpen = false;
    $scope.toggleLegendSidepanel = function(){
        $scope.isLegendSidePanelOpen = !$scope.isLegendSidePanelOpen;
    };
    
    // added function call to click event on feature to open the panel; togglebutton only closes
    $scope.isInfoSidePanelClosed = true;
    $scope.toggleInfoSidepanel = function(){
        if ($scope.isInfoSidePanelClosed == false){$scope.isInfoSidePanelClosed = true};
    };

    // //toggle switch for testing purpose
    // $scope.isInfoSidePanelClosed = false;
    // $scope.toggleInfoSidepanel = function(){
    //     $scope.isInfoSidePanelClosed = !$scope.isInfoSidePanelClosed;
    // };

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




    // //function that can be used to add gps pins to the map
    // function addGeoJSONFeature(geojson) {
    //     var defaultGeoJSONProjection = 'EPSG:4326';
    //     var mapProjection = olMap.getView().getProjection();

    //     if (JSON.stringify(geojson).includes("FeatureCollection")) {
    //         PinCollection.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
    //     }
    //     else {
    //         var geom = (new ol.format.GeoJSON()).readGeometry(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });
    //         var pinfeature = new ol.Feature(geom);
    //         pinfeature.setStyle(defaultMarkerStyle);
    //         PinCollection.push(pinfeature);
    //     }
    // }

    // //function that can be used to add features to the map with gps coordinates and a value for value height which is used for color coding
    // function addGeoJSONcolorFeature(geojson, result, resulttime) {
    //     var defaultGeoJSONProjection = 'EPSG:4326';
    //     var mapProjection = olMap.getView().getProjection();

    //     if (JSON.stringify(geojson).includes("FeatureCollection")) {
    //         ColoredMarkerCollection.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
    //         //HeatmapCollection.push((new ol.format.GeoJSON()).readFeatures(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection }));
    //     }
    //     else {
    //         var geom = (new ol.format.GeoJSON()).readGeometry(geojson, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });
    //         var colormarkerfeature = new ol.Feature(geom);
    //         colormarkerfeature.setStyle(stylefunction(result));
    //         colormarkerfeature.setId(resulttime);
    //         ColoredMarkerCollection.push(colormarkerfeature);
    //         //var heatmapfeature = heatmapfeature(geom,result);
    //         //HeatmapCollection.push(heatmapfeature);
    //     }
    // };



    //function that can be used to add gps pins to the map
    function addPinFeature(allinfo) {
        var defaultGeoJSONProjection = 'EPSG:4326';
        var mapProjection = olMap.getView().getProjection();
        var geom = (new ol.format.GeoJSON()).readGeometry(allinfo.location, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });

        var feature = new ol.Feature(geom);
        feature.setStyle(defaultMarkerStyle);
        feature.setProperties(allinfo);

        PinCollection.push(feature);
    }

    //allinfo: result, resulttime, @iot.id, FeatureOfInterest
    //function that can be used to add features to the map with gps coordinates and a value for value height which is used for color coding
    function addColorFeature(allinfo) {
        var defaultGeoJSONProjection = 'EPSG:4326';
        var mapProjection = olMap.getView().getProjection();
        var geom = (new ol.format.GeoJSON()).readGeometry(allinfo.FeatureOfInterest, { dataProjection: defaultGeoJSONProjection, featureProjection: mapProjection });
        
        var feature = new ol.Feature(geom);
        feature.setStyle(stylefunction(allinfo.result));
        feature.setId(allinfo.resulttime); //wäre besser die filter direkt über zeit laufen zu lassen und nicht über id?
        feature.setProperties(allinfo);

        ColoredMarkerCollection.push(feature);
    };
    
    

    //get all things for pins
    $scope.getAllLocations=function(){
        $http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastream/PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27&$expand=Locations&$top=9999999").then(function (response) {
            $scope.allThings = response.data.value;
            angular.forEach($scope.allThings, function (value, key) {
                $scope.thinglocation = value["Locations"][0]["location"];
                $scope.thinglocationname = value["Locations"][0]["name"];
                $scope.thingid = value["@iot.id"]
                $scope.thingname = value["name"]
                
                featureinfo = {"location": $scope.thinglocation, "locationname": $scope.thinglocationname, "@iot.id": $scope.thingid, "thingname": $scope.thingname};
                addPinFeature(featureinfo);
            });
        });
    };


    //get all observations for colored markers
    $scope.getAllObservations=function(){
		$http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27saqn:op:" + obsproperty + "%27&$expand=Observations($top=1;$orderby=phenomenonTime%20desc;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
            $scope.alldatastreams = response.data.value;
			angular.forEach($scope.alldatastreams, function (value, key) {
				if (value["Observations"].length > 0){
				$scope.obsresult = value["Observations"][0]["result"];
				$scope.obsFOI = value["Observations"][0]["FeatureOfInterest"]["feature"];
                $scope.obsresulttime = Date.parse(value["Observations"][0]["resultTime"]);
                $scope.obsId = value["Observations"][0]["@iot.id"];
                // let datastreamId = value["@iot.id"];
                // let thingId = value["Thing@iot.navigationLink"].match(/'([^']+)'/)[1];
                // let sensorId = value["Sensor@iot.navigationLink"].match(/'([^']+)'/)[1];
                // let observedpropertyId = "saqn:op:" + obsproperty;

                featureinfo = {"result": $scope.obsresult, "resulttime": $scope.obsresulttime, "@iot.id": $scope.obsId, "FeatureOfInterest": $scope.obsFOI};
				addColorFeature(featureinfo);
				};
			});
		});
	};

	window.setTimeout($scope.getAllLocations,0)
    window.setTimeout($scope.getAllObservations,0)




/* --------------------------------------------------Tooltip Info---------------------------------------------------------------------- */
var displayFeatureTooltip = function(feature) {

    var info = document.getElementById('map-feature-tooltip');
    if (feature) {
        if (feature.getProperties()['result']) { console.log(feature.getProperties())}
        else {console.log(feature.getProperties())}

    } else {
        info.innerHTML = '&nbsp;';
    }
};

olMap.on('pointermove', function(evt) {
    if (evt.dragging) {return};

    var pixel = olMap.getEventPixel(evt.originalEvent);
    var feature = olMap.forEachFeatureAtPixel(evt.pixel, function(feature) {return feature});
    if (feature) {displayFeatureTooltip(feature)};
});


//trying bootstrap tooltips, not working yet
/*
$('.ol-zoom-in, .ol-zoom-out').tooltip({placement: 'right'});

$('.ol-full-screen').tooltip({placement: 'left'});


var alltodo = document.querySelectorAll('title');
Array.from(alltodo).forEach(function(element){element.setAttribute("data-toggle", "tooltip")});
$(document).ready(function(){$('[data-toggle="tooltip"]').tooltip()});
*/


/* --------------------------------------------------Click Tooltip Detailed Info (Sideboard Bottom)---------------------------------------------------------------------- */


var displayFeatureInfo = function(feature) {
    var observationId = feature.getProperties()['@iot.id'];
    $http.get(getUrl() + "/v1.0/Observations('" + observationId + "')?$expand=FeatureOfInterest,Datastream($expand=Thing,ObservedProperty,Sensor)").then(function (response) {
        observationInfo = response.data;
    
        var info = document.getElementById('map-detailed-tooltip');
        var crosslinks = document.getElementById('map-crosslinks');
        // feature.setStyle({stroke: 'rgba(255,255,255,1.0)'});


        info.innerHTML =  'Result: ' + observationInfo['result'] + "<br />" + 'Phenomenon Time (UTC): ' + observationInfo['phenomenonTime'];
        crosslinks.innerHTML =  'Thing: <a href="#/thing/' + observationInfo['Datastream']['Thing']['@iot.id'] + '?$expand=Locations" target="_blank">' + observationInfo['Datastream']['Thing']['name'] + '</a><br /> ' + 
        'Datastream: <a href="#/datastream/' + observationInfo['Datastream']['@iot.id'] + '" target="_blank">' + observationInfo['Datastream']['name'] + '</a><br /> ' + 
        'Observed Property: <a href="#/observedproperty/' + observationInfo['Datastream']['ObservedProperty']['@iot.id'] + '" target="_blank">' + observationInfo['Datastream']['ObservedProperty']['name'] + '</a><br /> ' + 
        'Sensor: <a href="#/sensor/' + observationInfo['Datastream']['Sensor']['@iot.id'] + '" target="_blank">' + observationInfo['Datastream']['Sensor']['name'] + '</a>';
    });
};

var displayreducedFeatureInfo = function(feature) {
    var thingId = feature.getProperties()['@iot.id'];
    $http.get(getUrl() + "/v1.0/Things('" + thingId + "')?$expand=Locations,Datastreams").then(function (response) {
        ThingInfo = response.data;
    
        var info = document.getElementById('map-detailed-tooltip');
        var crosslinks = document.getElementById('map-crosslinks');
        // feature.setStyle({color: 'rgba(255,64,64,1.0)'});


        info.innerHTML = 'Location Name: ' + ThingInfo['Locations'][0]['name'] + "<br />" + "<p>" + 'GPS Coordinates: ' + "<br />" + '&emsp; - Latitude: ' + ThingInfo['Locations'][0]['location']['coordinates']["1"] + "<br />" + '&emsp; - Longitude: ' + ThingInfo['Locations'][0]['location']['coordinates']["0"] + "</p>";
        crosslinks.innerHTML = 'Thing: <a href="#/thing/' + ThingInfo['@iot.id'] + '?$expand=Locations" target="_blank">' + ThingInfo['name'] + '</a>';
    });
};


olMap.on('click', function(evt) {
    var feature = olMap.forEachFeatureAtPixel(evt.pixel, function(feature) {return feature});
    if (feature) {
        $scope.isInfoSidePanelClosed = false;
        $scope.toggleInfoSidepanel;
        if (feature.getProperties()['result']) {displayFeatureInfo(feature)}
        else {displayreducedFeatureInfo(feature)};
    };
});




/* ------------------------------------------------------------------------------------------------------------------------ */


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
            randomvalue[i] = 200*Math.random();
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

    var kriginglocations = [];
	var krigingvalues = [];
	
	obsproperty = $scope.selectedObservedProperty || "mcpm10"; //Reads selectedObservedProperty first, possibly from a parent controller. "mcpm10" is the fallback.
    obsvaluelist = [];
    

    //get obs properties conventions (e.g. fixed points for color gradients)
    $http.get(getUrl() + "/v1.0/ObservedProperties('saqn:op:" + obsproperty + "')").then(function (response) {
        var conventions = response.data.properties.conventions;
        $scope.obspropertyName = response.data.name;
        $scope.obspropertyUnit = response.data.properties.conventions.unitOfMeasurement.symbol;
        var numberOfLabels = Object.keys(conventions.fixedPoints).length;

        //valid points will be an array containing keys only for non-limit points
        var validPoints = Object.keys(conventions.fixedPoints).sort(function(a, b){
            return parseInt(a) - parseInt(b);
        });
        var limitColors = {
            start: null,
            end: null
        }
        //
        var limitNumber = 0; //0 if all points are valid, 1 if either top or bottom is max int limit, 2 if both are
        //Remove limit points from validPoints and add them to limits
        if(validPoints[0] == "-2147483647"){
            limitColors.start = conventions.fixedPoints[validPoints.shift()];
            limitNumber++;
        }
        if(validPoints[validPoints.length - 1] == "2147483647"){
            limitColors.end = conventions.fixedPoints[validPoints.pop()];
            limitNumber++;
        }

        //get absolute range between highest and lowest valid point
        var range = validPoints[validPoints.length - 1] -validPoints[0];
        var overshoot = 8; //Size between bottom to first valid point/ last valid point to top of the scale in percent of whole scale;
        $scope.scaleOvershoot = overshoot;
        var relativePoints = validPoints.map(function(point){ //Map all points to their relative location on the scale
            return {
                relativeLocation: ((point-validPoints[0]) / range) * (100 - (overshoot * limitNumber)), //relative position of fixed point on scale
                color: conventions.fixedPoints[point], //original color
                value: point
            };
        });
        $scope.relativePoints = relativePoints;

        var relativePointStrings = relativePoints.map(function(point){ // build strings ["#ff00ff 0%", ...]
            return point.color + " " + point.relativeLocation + "%";
        })
        //Build one gradient for all fixed points
        var scaleStyle = {"background-image": ("\
            linear-gradient(\
            to top, "+
            (limitColors.start ? limitColors.start + "," : "")+ //Add start only if necessary
            relativePointStrings.join(",")+
            (limitColors.end ? ", "+limitColors.end + " 100%" : "")+ //Add start only if necessary
            ")").trim()};
        $scope.scaleStyle = scaleStyle;
        $scope.limitColors = limitColors;

        //Build equidistant labels for scale
        var labels = [];

        for(var i = 0; i < numberOfLabels; i++){
            labels[i] = Math.round(parseInt(validPoints[0]) + range * i / (numberOfLabels - 1));
        }

        $scope.scaleLabels = labels;
        $scope.scaleLabelsLimits = {
            start: "<" + labels[0],
            end: ">" + labels[labels.length - 1],
        };
    });

    console.log("scope: " + $scope)
	//get datastreams, recent observation value for color, resulttime for id and feature of interest for location
	// $scope.getAllObservations=function(){
	// 	$http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27saqn:op:" + obsproperty + "%27&$expand=Observations($top=1;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
    //         $scope.alldatastreams = response.data.value;
	// 		angular.forEach($scope.alldatastreams, function (value, key) {
	// 			if (value["Observations"].length > 0){
	// 			$scope.obsresult = value["Observations"][0]["result"];
	// 			$scope.obsFOI = value["Observations"][0]["FeatureOfInterest"]["feature"];
	// 			$scope.obsresulttime = Date.parse(value["Observations"][0]["resultTime"]);
	// 			obsvaluelist.push($scope.obsresult);
	// 			//krigingvalues.push($scope.obsresult);
	// 			//kriginglocations.push([$scope.obsFOI["coordinates"][0],$scope.obsFOI["coordinates"][1]]);
	// 			addGeoJSONcolorFeature($scope.obsFOI,$scope.obsresult,$scope.obsresulttime);
	// 			}
			
	// 		});
	// 	});
	// };

	// window.setTimeout($scope.getAllObservations,0)






	var refreshrate = 10000; //initial refresh rate
    $scope.source = "realsource";
    $scope.sourceChanged = function(){
        if ($scope.source == "realsource") {
			clearTimeout(runningsimulation);
			PinLayer.setSource(PinSource);
			ColoredMarkerLayer.setSource(ColoredMarkerSource);
            refreshrate = 10000
        } else if ($scope.source == "simulationsource"){
			PinLayer.setSource(null);
			ColoredMarkerLayer.setSource(SimulationSource);
            refreshrate = 1000
        } else {
            PinLayer.setSource(null);
            ColoredMarkerLayer.setSource(null);
            console.log("no source set");
        }
    }

	$scope.UpdateMap =  function(){
		if ($scope.source == "simulationsource"){
			krigstuff(randomlocation,randomvalue);
			SimulationSource.clear();
			SimulationSource.addFeatures(SimulationInvisibleSource.getFeatures());
		};
		/*if (realradio.checked){ //cant get it to work properly, need to rework this
			$scope.getAllObservations; //function that grabs new features
			//need function here that removes old features
		};*/
		ColoredMarkerLayer.getSource().changed();
		canvasLayer.getSource().changed();
		 
	};

	var runningsimulation;

	//run simulation in background on invisible layer
	var backroundsimulation = function(){
		for (let i=0; i <= amountofsimulations-1; i++) {
			simulate(i,totalspeed[i]);
		};
		runningsimulation = window.setTimeout(backroundsimulation, refreshrate);
	};

	
	var amountofsimulations = setupsimulations(50);
	window.setTimeout(backroundsimulation, 0);
	
    
	$scope.isAutoRefreshActive = false;
	var autorefreshtimer;
	$scope.changedAutoRefreshActive = function(){
        if ($scope.isAutoRefreshActive){
                autorefreshtimer = window.setInterval(function(){$scope.UpdateMap()}.bind(this), refreshrate)
            }
        else
        {
            window.clearInterval(autorefreshtimer)
        }
    }
});
