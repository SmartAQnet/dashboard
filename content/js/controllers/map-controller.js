gostApp.controller('MapCtrl', function ($scope, $http) {
        
        
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


    //views anpassen funktioniert nicht, obwohl console.log($scope) anzeigt, dass die da sein sollten
    if($scope.id.match(/:home:/)){ 
        $scope.isLayerPinsActive = true
        $scope.isColorMarkersActive = false
    } else if($scope.id.match(/:t:/)){
        $scope.isLayerPinsActive = true
        $scope.isColorMarkersActive = false
        //setview($scope.thinglocation["coordinates"]);
    } else if ($scope.id.match(/:op:/)){ 
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    } else if($scope.id.match(/:ds:/)){
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
        //setview($scope.obsFOI["coordinates"]);
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
        if (($scope.isColorMarkersActive || $scope.isKrigingActive) == false) {
            $scope.isLegendInvisible = true;
        } else if ($scope.isColorMarkersActive || $scope.isKrigingActive) {
            $scope.isLegendInvisible = false;
        }
    };
    enableLegendSidepanel();

    /************************************ Controls ***********************************/
    //                                 Create controls
    /********************************************************************************/


    var external_fullscreen = new ol.control.FullScreen({
        target: document.querySelector(".sidepanel-header"),
        source: 'fullscreen'
    });
    olMap.addControl(external_fullscreen);


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
        })), zIndex: 2
    });

    var selectedMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            color: [255,64,64,1],
            src: '/dashboard/content/assets/img/map_marker.svg'
        })), zIndex: 3
    });

    function interpolateColor(allPoints, value, alpha){
        var colorLimitsAndValidPoints = getLimitsAndValidPoints(allPoints)
        //Find index of the fixed color point below the given value;
        var belowPoint = 0;
        //var validPoints = colorLimitsAndValidPoints.validPoints;
        var validColorFixedPoints = colorLimitsAndValidPoints.validPoints;
        var wholeRange = validColorFixedPoints[validColorFixedPoints.length - 1] - validColorFixedPoints[0];

        while(validColorFixedPoints[belowPoint] && value > validColorFixedPoints[belowPoint]){
            belowPoint++;
        }
        var color;
        if(belowPoint > 0 && belowPoint < validColorFixedPoints.length){
            //easy linear interpolation between points on scale.
            var range = validColorFixedPoints[belowPoint] - validColorFixedPoints[belowPoint-1];
            var rightRatio = (value - validColorFixedPoints[belowPoint-1]) / range;
            return interpolateBetween2Color(allPoints[validColorFixedPoints[belowPoint-1]], allPoints[validColorFixedPoints[belowPoint]], rightRatio, alpha);
        }
        else if(belowPoint == 0){
            //point below first valid point
            if(colorLimitsAndValidPoints.limits.start){
                //point between limit and first valid point
                return interpolateBetween2Color(colorLimitsAndValidPoints.limits.start, allPoints[validColorFixedPoints[0]],
                    Math.max(0, (value - (validColorFixedPoints[0] - wholeRange)) / wholeRange), alpha); // values one whole scale below the start limit have the color of the limit
            }
            return colorLimitsAndValidPoints.limits.start;
        }
        else if(belowPoint == validColorFixedPoints.length){
            if(colorLimitsAndValidPoints.limits.end){
                return interpolateBetween2Color(allPoints[validColorFixedPoints[validColorFixedPoints.length - 1]], colorLimitsAndValidPoints.limits.end,
                    Math.min(1, (value - (validColorFixedPoints[validColorFixedPoints.length - 1] + wholeRange)) / wholeRange), alpha);// values one whole scale above the end limit have the color of the limit
            }
            return colorLimitsAndValidPoints.limits.end;
        }
    }

    function interpolateBetween2Color(left, right, ratio, alpha){
        var rightRatio = ratio;
        var leftRatio = 1-rightRatio;
        var color = {
            left: {
                r: parseInt(left.slice(1,3), 16),
                g: parseInt(left.slice(3,5), 16),
                b: parseInt(left.slice(5,7), 16)
            },
            right: {
                r: parseInt(right.slice(1,3), 16),
                g: parseInt(right.slice(3,5), 16),
                b: parseInt(right.slice(5,7), 16)
            }
        }
        return "rgba(" + ((leftRatio * color.left.r) + (rightRatio * color.right.r)) + "," +
            ((leftRatio * color.left.g) + (rightRatio * color.right.g)) + "," +
            ((leftRatio * color.left.b) + (rightRatio * color.right.b)) + ", " + alpha + ")";
    }


    var stylefunction = function(feature){

        var colormarker = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({
                    color: interpolateColor(feature.colorFixedPoints, feature.result, 0.2)
                }),
                stroke: new ol.style.Stroke({
                    color: interpolateColor(feature.colorFixedPoints, feature.result, 0.8),
                    width: 3
                })
            }), zIndex: 2
        }) 
        return(colormarker)
    };


    var emphasizestylefunction = function(feature){

        var colormarker = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 12,
                fill: new ol.style.Fill({
                    color: interpolateColor(feature.colorFixedPoints, feature.result, 0.4)
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0,0,0,1)',
                    width: 3
                })
            }), zIndex: 3
        })
        return(colormarker)
    };


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
        feature.setStyle(stylefunction(allinfo));
        feature.setId(allinfo.resulttime); //wäre besser die filter direkt über zeit laufen zu lassen und nicht über id?
        feature.setProperties(allinfo);

        ColoredMarkerCollection.push(feature);
    };
    
    var obsproperty = $scope.observedPropertyId || "saqn:op:mcpm10"; //Reads observedPropertyId first, possibly from a parent controller. "saqn:op:mcpm10" is the fallback.
    
    function observedPropertyHasChanged(obsprop){
        obsproperty = obsprop;
        updateFeatures();
        constructLegend();
    }

    //get all things for pins
    function getAllLocations(){
        $http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastream/PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27&$expand=Locations&$top=9999999").then(function (response) {
            $scope.allThings = response.data.value;
            angular.forEach($scope.allThings, function (value, key) {
                $scope.thinglocation = value["Locations"][0]["location"];
                $scope.thinglocationname = value["Locations"][0]["name"];
                $scope.thingid = value["@iot.id"]
                $scope.thingname = value["name"]
                
                featureinfo = {"location": $scope.thinglocation, "locationname": $scope.thinglocationname, "@iot.id": $scope.thingid, "thingname": $scope.thingname, "tooltip": "Located at: " + $scope.thinglocationname};
                addPinFeature(featureinfo);
            });
        });
    }

    //get all observations for colored markers
    function getAllObservations(){
        $http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27" + obsproperty + "%27&$expand=ObservedProperty,Observations($top=1;$orderby=phenomenonTime%20desc;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
            $scope.alldatastreams = response.data.value;
            angular.forEach($scope.alldatastreams, function (value, key) {
                if (value["Observations"].length > 0){
                $scope.obsresult = value["Observations"][0]["result"];
                $scope.obsFOI = value["Observations"][0]["FeatureOfInterest"]["feature"];
                $scope.obsresulttime = Date.parse(value["Observations"][0]["resultTime"]);
                $scope.obsId = value["Observations"][0]["@iot.id"];
                $scope.dsUnit = value["unitOfMeasurement"];
                var obspropertyName = value["ObservedProperty"]["name"];
                var obsPropertyColorFixedPoints = value.ObservedProperty.properties.conventions.fixedPoints;

                featureinfo = {
                    "result": $scope.obsresult,
                    "resulttime": $scope.obsresulttime,
                    "@iot.id": $scope.obsId,
                    "FeatureOfInterest": $scope.obsFOI,
                    "tooltip": obspropertyName + " [" + $scope.dsUnit["symbol"] + "]: " + $scope.obsresult,
                    "colorFixedPoints": obsPropertyColorFixedPoints
                };
                addColorFeature(featureinfo);
                };
            });
        });
    };

    function updateFeatures(){
        ColoredMarkerSource.clear();
        PinSource.clear();
        getAllLocations();
        getAllObservations();
    }
    updateFeatures();

    /* --------------------------------------------------Tooltip Info---------------------------------------------------------------------- */

    // $scope.isTooltipHidden = true;

    var storedfeature;
    var storedstyle; 

    var displayFeatureTooltip = function(feature) {


        var info = document.getElementById('map-feature-tooltip');
        if (feature) {
            position = olMap.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
            /*
            $scope.isTooltipHidden = false;
            $scope.featureTooltipStyle = {left: position[0] + 40 + "px", top: position[1] + "px"};
            $scope.featureTooltip = feature.getProperties()["thingname"];
            */

            info.innerHTML = feature.getProperties()["tooltip"];
            info.style.left = position[0] + 40 + "px";
            info.style.top = position[1] + "px";
            info.style.position = "absolute";
            info.style.display = "inherit";
            info.style.background = "rgba(0,60,136,.2)";
            info.style.borderRadius = "4px";
            info.style.padding = "4px 8px";
            info.style.zIndex = "10";
            
            if (storedfeature != undefined){            // if a feature is stored
                if (storedfeature != feature){          // if an old feature is stored (moving from one to the next without clear map inbetween) --> reset old one, change and store new one
                    storedfeature.setStyle(storedstyle); 
                    storedfeature = feature;
                    storedstyle = feature.getStyle();

                    if (feature.getProperties()['result']) {
                        feature.setStyle(emphasizestylefunction(feature.getProperties()));
                    } else {
                    feature.setStyle(selectedMarkerStyle);
                    };

                }; 
            } else {                                    // if no feature is stored --> store feature and change appearance
                storedfeature = feature;
                storedstyle = feature.getStyle();

                if (feature.getProperties()['result']) {
                    feature.setStyle(emphasizestylefunction(feature.getProperties()));
                } else {
                feature.setStyle(selectedMarkerStyle);
                };
            };
        } else {
            if (storedfeature != undefined) {
                storedfeature.setStyle(storedstyle);     //if a storedfeature exists, reset its style and undefine the variable
                storedfeature = undefined;
                storedstyle = undefined;
            };
            info.style.display = "none";
            //$scope.isTooltipHidden = true;

        }
    };

    olMap.on('pointermove', function(evt) {
        if (evt.dragging) {return};

        var pixel = olMap.getEventPixel(evt.originalEvent);
        var feature = olMap.forEachFeatureAtPixel(evt.pixel, function(feature) {return feature});
        displayFeatureTooltip(feature);
    });



    /* --------------------------------------------------Click Tooltip Detailed Info (Sideboard Bottom)---------------------------------------------------------------------- */


    var displayFeatureInfo = function(feature) {
        var observationId = feature.getProperties()['@iot.id'];
        $http.get(getUrl() + "/v1.0/Observations('" + observationId + "')?$expand=FeatureOfInterest,Datastream($expand=Thing,ObservedProperty,Sensor)").then(function (response) {
            observationInfo = response.data;
        
            var info = document.getElementById('map-detailed-tooltip');
            var crosslinks = document.getElementById('map-crosslinks');
            // feature.setStyle({stroke: 'rgba(255,255,255,1.0)'});


            info.innerHTML =  feature.getProperties()['tooltip'] + "<br />" + 'Phenomenon Time (UTC): ' + observationInfo['phenomenonTime'];
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

    //* -------------------------------------------Construct Legend--------------------------------------------------------------------------------- */



    //get obs properties conventions (e.g. fixed points for color gradients)
    function constructLegend(){
        $http.get(getUrl() + "/v1.0/ObservedProperties('" + obsproperty + "')").then(function (response) {
            var conventions = response.data.properties.conventions;
            $scope.obspropertyName = response.data.name;
            $scope.obspropertyUnit = response.data.properties.conventions.unitOfMeasurement.symbol;
    
    
            var numberOfLabels = Object.keys(conventions.fixedPoints).length;
    
            var limitsAndValids = getLimitsAndValidPoints(conventions.fixedPoints);
            var validPoints = limitsAndValids.validPoints;
            var limitColors = limitsAndValids.limits;
            var limitNumber = 0 + (!!limitColors.start) + (!!limitColors.end); //hacky Javascripty Way to count non-null limits
    
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
    }
    constructLegend();

    /**
     * Takes an properties.conventions.fixedPoints object (e.g. {0: "#ec8f04", 50: "#d45908", 100: "#b02d0c", 2147483647: "#8a0f0f"})
     * and returns an object with valid points (real values can be near them) and limits (used to define points at Infinity)
     * 
     * Returns in this example:
     * {
     *  validPoints:{0: "#ec8f04", 50: "#d45908", 100: "#b02d0c"}
     *  limits:{"start":null, "end":"#8a0f0f"}
     * }
     */
    function getLimitsAndValidPoints(fixedPoints){
        //valid points will be an array containing keys only for non-limit points
        var validPoints = Object.keys(fixedPoints).sort(function(a, b){
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
            limitColors.start = fixedPoints[validPoints.shift()];
        }
        if(validPoints[validPoints.length - 1] == "2147483647"){
            limitColors.end = fixedPoints[validPoints.pop()];
        }
        return {
            validPoints: validPoints,
            limits: limitColors
        }
    }


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
        //SimulatedFeature.setStyle(stylefunction(randomvalue[id])) //Needs information aboaut obsprop to calculate style
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
		} else {
            updateFeatures();
        }
		/*if (realradio.checked){ //cant get it to work properly, need to rework this
			getAllObservations; //function that grabs new features
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
