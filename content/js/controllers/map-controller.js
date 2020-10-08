gostApp.controller('MapCtrl', function ($scope, $http, $routeParams, $sce, $interval, $timeout, $rootScope) {






    /************************************ Parameters ************************************/
    //                        set parameters for map and functions
    /************************************************************************************/
    
    $scope.filterRecent = "$filter=overlaps(Datastreams/phenomenonTime,(now()%20sub%20duration%27P1d%27))"
    $scope.filterRecentLink = "#/things/?" + $scope.filterRecent
    $http.get(getUrl() + "/v1.0/Things?" + $scope.filterRecent + "&$count=true&$top=0").then(function (response) {
        $scope.active_devices = response.data["@iot.count"];
    });

    
    var augsburg = [10.8986971, 48.3668041];
    var karlsruhe = [8.4, 49];
    // CAZ
    //https://api.smartaq.net/v1.0/Locations?$filter=st_within(location,geography'POLYGON((10.924750 48.386800,10.870650 48.386800,10.870650 48.332600,10.924750 48.332600, 10.924750 48.386800))')



    var params = {
        mapCenter: augsburg,
        maxValue: 100,
        krigingModel: 'exponential', //model还可选'gaussian','spherical','exponential'
        krigingSigma2: 0,
        krigingAlpha: 100,
        canvasAlpha: 0.35, //canvas图层透明度
        colors: ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"]
    };


    function setview(coordinates, mapzoom=13) {
        let view = new ol.View({
            zoom: mapzoom,
            center: ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857'),
            maxZoom: 20
        })
        olMap.setView(view)
    }


    var defaultView = new ol.View({
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
            controls: new ol.Collection([
                new ol.control.FullScreen({
                    className: "ol-fullscreen-custom",
                    source: 'sensor-map',
                    label: '\uf31e',
                    labelActive: '\uf78c'
                }),
                new ol.control.Zoom({
                    className: "ol-zoom-custom ol-custom-button"
                }),
                new ol.control.Attribution({
                    collapsible: false
                })
            ]),

            //Set layers
            layers: [],

            //Set Target, View and Interactions
            target: 'map',
            view: defaultView,
            interactions: ol.interaction.defaults({
                altShiftDragRotate: false,
                pinchRotate: false
            })
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
    function togglelayers(layer, toggle) {
        if (toggle == true) {
            olMap.addLayer(layer)
        }
        if (toggle == false) {
            olMap.removeLayer(layer)
        }
    };


    //pin layer for locations of things
    var PinSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        features: PinCollection = new ol.Collection(),
    });
    var PinLayer = new ol.layer.Vector({
        source: PinSource
    });



    //tile layer for the actual map
    var tileLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            crossOrigin: 'anonymous',
            attributions: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
            tileSize: [512, 512],
            url: 'https://api.mapbox.com/styles/v1/edenhalperin/cih84uopy000a95m41htugsnm/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWRlbmhhbHBlcmluIiwiYSI6IlFRZG0zMWMifQ.QUNKx4tIMjZfwmrE8SE6Bg'
        })
    })
    togglelayers(tileLayer, true);



    //lets other controllers center the map on a location
    $scope.$on("centerOn", function (event, location) {
        setview(location.coordinates);
    });
    
    


    $scope.isLayerPinsActive = true
    

    /*
    if ($scope.location) {
        setview($scope.location);
    }*/


    //Default Layers at page loading: activate/deactivate layers
    togglelayers(PinLayer, $scope.isLayerPinsActive);



    /* ------------------------------------------------------------------------------------------------------------------------ */


    $scope.changedLayerPinsActive = function () {
        togglelayers(PinLayer, $scope.isLayerPinsActive);
    }



    /************************************ Controls ***********************************/
    //                                 Create controls
    /********************************************************************************/


    var external_fullscreen = new ol.control.FullScreen({
        target: document.querySelector(".external-fullscreen"),
        source: 'fullscreen',
        label: '\uf31e',
        labelActive: '\uf78c',
        className: 'btn'
    });
    olMap.addControl(external_fullscreen);


    // added function call to click event on feature to open the panel; togglebutton only closes
    $scope.isInfoSidepanelClosed = true;
    $scope.toggleInfoSidepanel = function () {
        $scope.isInfoSidepanelClosed = !$scope.isInfoSidepanelClosed
    };


    /************************************ Marker ************************************/
    //                               create Markers
    /********************************************************************************/

    var grayMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 0.9,
            //color: [127,127,0,0.1],
            src: window.dashboardSettings.root + 'assets/img/map_marker_gray.svg'
        })), zIndex: 1
    });


    var defaultMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 1.0,
            //color: [127,127,0,0.1],
            src: window.dashboardSettings.root + 'assets/img/map_marker.svg'
        })), zIndex: 2
    });


    var redMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 1.2,
            //color: [127,127,0,0.1],
            src: window.dashboardSettings.root + 'assets/img/map_marker_red.svg'
        })), zIndex: 3
    });

    var selectedMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 1.4,
            //color: [255,64,64,1],
            src: window.dashboardSettings.root + 'assets/img/map_marker_emph.svg'
        })), zIndex: 4
    });



    //function that can be used to add gps pins to the map, optional parameter style
    function addPinFeature(thing,style="default") {
        var defaultGeoJSONProjection = 'EPSG:4326';
        var mapProjection = olMap.getView().getProjection();
        var geom = (new ol.format.GeoJSON()).readGeometry(thing["Locations"][0]["location"], {
            dataProjection: defaultGeoJSONProjection,
            featureProjection: mapProjection
        });

        var feature = new ol.Feature(geom);

        if(style=="red"){
            feature.setStyle(redMarkerStyle);
        } else if(style=="gray"){
            feature.setStyle(grayMarkerStyle);
        } else {
            feature.setStyle(defaultMarkerStyle);
        }
        
        feature.setProperties(thing);
        feature.setProperties({"tooltip": thing["name"]});
        feature.setId(thing["@iot.id"])

        PinCollection.push(feature);
    };

    //changes feature (by featureID == @iot.id) style to a different style
    var changeFeatureStyle = function(featureID,style){
        PinLayer.getSource().forEachFeature(function(f){
            if(f.getId()==featureID){
                if(style=="red"){
                    f.setStyle(redMarkerStyle)
                } else if(style=="gray"){
                    f.setStyle(grayMarkerStyle);
                } else if(style=="default"){
                    f.setStyle(defaultMarkerStyle)
                } else if(style=="emph"){
                    f.setStyle(selectedMarkerStyle)
                }
            }
        })
    };


    //angular event listener if a feature on the map should be changed. expects data as e.g. {"@iot.id": "saqn:t:...", "style": "red"}
    $scope.$on('changeFeatureStyle',function(evt,data){
        //console.log("changing style of " + data["@iot.id"] + " to " + data["style"])
        changeFeatureStyle(data["@iot.id"],data["style"])
    });



    /* --------------------------------------------------Tooltip Info---------------------------------------------------------------------- */

    // $scope.isTooltipHidden = true;

    var storedfeature;
    var storedstyle;
    $scope.isTooltipHidden = true;

    var displayFeatureTooltip = function (feature) {
        //var info = document.getElementById('map-feature-tooltip');
        if (feature && feature.getProperties()["tooltip"]) {
            position = olMap.getPixelFromCoordinate(feature.getGeometry().getCoordinates());

            $scope.isTooltipHidden = false;
            $scope.featureTooltipStyle = {
                left: position[0] + 35 + "px",
                top: position[1] - 12 + "px"
            };
            $scope.featureTooltip = $sce.trustAsHtml(feature.getProperties()["tooltip"]);

            if (storedfeature != undefined) { // if a feature is stored
                if (storedfeature != feature) { // if an old feature is stored (moving from one to the next without clear map inbetween) --> reset old one, change and store new one
                    storedfeature.setStyle(storedstyle);
                    storedfeature = feature;
                    storedstyle = feature.getStyle();

                    if (feature.getProperties()['result']) {
                        feature.setStyle(emphasizestylefunction(feature.getProperties()));
                    } else {
                        feature.setStyle(selectedMarkerStyle);
                    };

                };
            } else { // if no feature is stored --> store feature and change appearance
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
                storedfeature.setStyle(storedstyle); //if a storedfeature exists, reset its style and undefine the variable
                storedfeature = undefined;
                storedstyle = undefined;
            };
            $scope.isTooltipHidden = true;
        }
        $scope.safeApply();
    };

    olMap.on('pointermove', function (evt) {
        if (evt.dragging) {
            return
        };

        var pixel = olMap.getEventPixel(evt.originalEvent);
        var feature = olMap.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature
            }, this,
            function (layer) { //show tooltip only for pins and colored markers
                return layer == PinLayer;
            }
        );
        displayFeatureTooltip(feature);
    });



    /* --------------------------------------------------Click Tooltip Detailed Info (Sideboard Bottom)---------------------------------------------------------------------- */

    var goToThing = function(feature){
        $scope.Page.go("thing/" + feature.getProperties()['@iot.id'])
    }



    //to store reset the style when another feature is clicked
    var displayedInfoFeatureId

    var displayreducedFeatureInfo = function (feature) {
        var thingId = feature.getProperties()['@iot.id'];
        $http.get(getUrl() + "/v1.0/Things('" + thingId + "')?$expand=Locations,Datastreams").then(function (response) {
            ThingInfo = response.data;

            $scope.information = {
                locationname: FixUTF8(ThingInfo['Locations'][0]['name']),
                coordinates: {
                    lat: ThingInfo['Locations'][0]['location']['coordinates']["1"],
                    long: ThingInfo['Locations'][0]['location']['coordinates']["0"]
                },
                thingLink: "#/thing/" + ThingInfo['@iot.id'] + "?$expand=Locations",
                thingLinkName: ThingInfo['name']
            }


            if(displayedInfoFeatureId){
                changeFeatureStyle(displayedInfoFeatureId,"default")
            }
            displayedInfoFeatureId = feature.getProperties()['@iot.id']
            changeFeatureStyle(displayedInfoFeatureId,"emph")
       });
    };

    
    // copied from http://tsauerwein.github.io/ol3/animation-flights/examples/draw-features.html
    var vectorsource = new ol.source.Vector({wrapX: false});

    var drawrectangle = new ol.interaction.Draw({
        source: vectorsource,
        type: /** @type {ol.geom.GeometryType} */ ('LineString'),
        geometryFunction: ol.interaction.Draw.createBox(),
        maxPoints: 2
    });
    
    var vectorlayer = new ol.layer.Vector({
        source: vectorsource,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          }),
          stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
          }),
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: '#ffcc33'
            })
          })
        })
    });

    togglelayers(vectorlayer,true)

    $scope.drawingactive = false

    $scope.selectGeography = function(arg = 'none'){
        $scope.geoSelectionType = arg
        vectorsource.clear();
        olMap.addInteraction(drawrectangle)
        $scope.drawingactive = true
    };

    $scope.selectGeographyCancel = function(){
        $scope.geoSelectionType = undefined
        olMap.removeInteraction(drawrectangle)
        $scope.drawingactive = false
    };


    //on drawend return list of things, store in a main scope parent variable and use in click link to build query and access these things via things page
    olMap.on('click', function (evt) {
        if(!$scope.drawingactive){

            //console.log(filterparamPolygonextent(getextendPolygon(getcurrentextend())))
            var feature = olMap.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature
            });
            if (feature) {
                $scope.isInfoSidepanelClosed = false;
                $scope.toggleInfoSidepanel();

                if(feature.getProperties()['@iot.id']){
                    displayreducedFeatureInfo(feature)
                    //goToThing(feature)
                };
            };
        };
    });

    function filterparamPolygonextent(polyext){
        return ("st_within(Locations/location,geography'POLYGON" + polyext + "')")
    };


    function getextendPolygon(ext){
        let topright = ext[0]
        let topleft = ext[1]
        let bottomleft = ext[2]
        let bottomright = ext[3]
        return ( "((" + topright[0].toString() + " " + topright[1].toString() + 
        "," + topleft[0].toString() + " " + topleft[1].toString() +
        "," + bottomleft[0].toString() + " " + bottomleft[1].toString() +
        "," + bottomright[0].toString() + " " + bottomright[1].toString() + 
        "," + topright[0].toString() + " " + topright[1].toString() + "))"
        );
    };

    //processes the drawn polygon. the polygon coordinates are stored in $scope.polygonpointsRearranged and $scope.polygonpointsRearranged4 and emitted
    $scope.loadingGeoSelection = false

    vectorsource.on('addfeature', function(evt){
        var polygonpoints = []
        evt.feature.getGeometry().getCoordinates()[0].forEach(pair => {
            polygonpoints.push(ol.proj.transform(pair, 'EPSG:3857', 'EPSG:4326'))
        });
        
        
        $scope.polygonpointsRearranged4 = [polygonpoints[2],polygonpoints[3],polygonpoints[0],polygonpoints[1]]
        $scope.polygonpointsRearranged = [polygonpoints[2],polygonpoints[3],polygonpoints[0],polygonpoints[1],polygonpoints[2]]
        

        $scope.$emit('drawnPolygonPoints4', $scope.polygonpointsRearranged4);
        $scope.$emit('drawnPolygonPoints', $scope.polygonpointsRearranged);

        $scope.filterGeography = "$filter=" + filterparamPolygonextent(getextendPolygon($scope.polygonpointsRearranged))

        if($scope.geoSelectionType == 'things'){
            $scope.filterGeographyLink = "#/things/?" + $scope.filterGeography
            $scope.loadingGeoSelection = true
            $http.get(getUrl() + "/v1.0/Things?" + $scope.filterGeography + "&$count=true&$top=0").then(function (response) {
                $scope.within_geo_devices = response.data["@iot.count"];
                $scope.loadingGeoSelection = false
            });
            $scope.geoSelectionType = undefined
        }
        //need timeout because the click event is handled after the add feature and it would immedately trigger click with drawingactive false. angular timeout to apply scope
        $timeout(function(){
            olMap.removeInteraction(drawrectangle)
            $scope.drawingactive = false
        },0)
    });

    



    //click button to draw selection. button to select CAZ
    //alle filter bei der thingsliste miteinander verheiraten --> things controller muss filterparameter aktuell in query lesen und weiterverwenden
    //muss der das? geht ja eh nur auf auswahl bestimmter things also eigentlich egal? oder button "gib mir alle" dann sollte wenn KEIN ds ausgewählt ist
    //der filter übernommen werden. also quasi der defaultfilter ist was im parameter steht, wird überschrieben von ggf auswahl von ds

    /* ------------------------------------------------------------------------------------------------------------------------ */

    //adds all things to the map which have at least one observations, used to initialize the map on the main page
    var initialMap = function(){
        $http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastreams/phenomenonTime%20lt%20now()%20sub%20duration%27P1d%27&$expand=Locations").then(function (response) {
            addThingsToMap(response.data.value);
        });
        console.log("Features are Ready")
        $rootScope.$broadcast("featuresAreReady")
    };

    $scope.$on('addToMap',function(evt,data){
        addThingsToMap(data)
        console.log("Features are Ready")
        $rootScope.$broadcast("featuresAreReady")
    });

    var addThingsToMap = function(things){
        things.forEach(function(thing){
            if(thing["Locations"].length>0){
                addPinFeature(thing)
            }
        }) 
    };


    //removes all pins from the map
    var resetMap = function(){
        PinLayer.getSource().clear()
    };

    //remove thing based on iot id, e.g. removeThingFromMap('saqn:t:8b9b677')
    var removeThingFromMap = function(featureID){
        console.log("now")
        PinLayer.getSource().forEachFeature(function(f){
            if(f.getId()==featureID){
                PinLayer.getSource().removeFeature(f)
            }
        })
    };

    //initialMap()


    /************************************ Simulation stuff ***********************************/
    //             handles map interaction from simulation-config-controller (AUTH simulation)
    /*****************************************************************************************/


    var mapIsSetUp = false //flag that makes sure the map layers are only loaded once to prevent collisions


    var squareSource
    var squareLayer

    $scope.$on('mapScope',function(evt,data){
        if(data=='simulation' & !mapIsSetUp){
            $scope.noFeatures = true //deactivate features, feature click handlers, etc

            //layer for polygon
            squareSource = new ol.source.Vector({
                wrapX: false,
            });
            squareLayer = new ol.layer.Vector({
                source: squareSource
            });

            togglelayers(PinLayer, false);
            togglelayers(squareLayer, true);
            mapIsSetUp = true //flag so this function gets triggered only once
        }
    })


    // sends center of area to simulation-controller. Important functionaliy is that it tells the simulation controller that a click to the map happened so
    // that the simulation controller is triggered to send the size of the area (from a dropdown menu in the view) back to the map controller (see below)
    olMap.on('click', function (evt) {
        let gpscoords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326')
        $rootScope.$broadcast("mapClickCoordinates",gpscoords)
    });


    $scope.$on("setZoom", function(evt, data){
        console.log("request to change zoom obtained")
        if(olMap.getView().getZoom() > data){
            olMap.getView().setZoom(data)
        }
    });

    //listens to broadcast from simulation-controller and receives size of the area (and center)
    $scope.$on("drawPolygonRequest", function(evt, data){
        //console.log(data) //print center and size

        var center = ol.proj.transform(data[0], 'EPSG:4326', 'EPSG:3857')
        var size = data[1]*1000 //kilometers


        var corners = []

        corners[0] = [center[0] - size/2, center[1] - size/2] 
        corners[1] = [center[0] - size/2, center[1] + size/2] 
        corners[2] = [center[0] + size/2, center[1] + size/2] 
        corners[3] = [center[0] + size/2, center[1] - size/2] 
        
        squareSource.clear()

        var square = new ol.geom.Polygon([
            corners
        ]);
        var squareFeature = new ol.Feature({
            geometry: square
        });

        squareFeature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'blue',
              width: 1
            }),
            fill: new ol.style.Fill({
              color: 'rgba(0, 128, 255, 0.5)'
            })
          })
        );

        squareSource.addFeature(squareFeature);

    });

    console.log("Map is Ready")
    $rootScope.$broadcast("mapIsReady")




    /***************************** Simulation Visualisation stuff ******************************/
    //             handles map interaction from simulation-map-controller (AUTH simulation)
    /*****************************************************************************************/




    /************************************ Kriging ************************************/
    //                               calculate Kriging
    /*********************************************************************************/

    $scope.$on("startSimulation",function(evt,data){
        togglelayers(ColoredMarkerLayer, true);
        togglelayers(canvasLayer, true);
        console.log("Simulation Started")
    })


    //creating colors 

    //example for testing https://api.smartaq.net/v1.0/ObservedProperties('saqn:op:hur')
    var examplecolors = {
        "0": "#ffd500",
        "10": "#f6f609",
        "20": "#c2ee11",
        "30": "#8ee916",
        "40": "#56e718",
        "50": "#19e619",
        "60": "#18e75d",
        "70": "#16e9aa",
        "80": "#11d8ee",
        "90": "#0978f6",
        "100": "#0000ff"
        };


    function getLimitsAndValidPoints(fixedPoints) {
        //valid points will be an array containing keys only for non-limit points
        var validPoints = Object.keys(fixedPoints).sort(function (a, b) {
            return parseInt(a) - parseInt(b);
        });
        var limitColors = {
            start: null,
            end: null
        }
        //
        var limitNumber = 0; //0 if all points are valid, 1 if either top or bottom is max int limit, 2 if both are
        //Remove limit points from validPoints and add them to limits
        if (validPoints[0] == "-2147483647") {
            limitColors.start = fixedPoints[validPoints.shift()];
        }
        if (validPoints[validPoints.length - 1] == "2147483647") {
            limitColors.end = fixedPoints[validPoints.pop()];
        }
        return {
            validPoints: validPoints,
            limits: limitColors
        }
    }

    function interpolateColor(allPoints, value, alpha) {
        value = Number.parseFloat(value);
        var colorLimitsAndValidPoints = getLimitsAndValidPoints(allPoints)
        //Find index of the fixed color point below the given value;
        var belowPoint = 0;
        //var validPoints = colorLimitsAndValidPoints.validPoints;
        var validColorFixedPoints = colorLimitsAndValidPoints.validPoints.map(function(num){
            return Number.parseFloat(num);
        });
        var wholeRange = validColorFixedPoints[validColorFixedPoints.length - 1] - validColorFixedPoints[0];

        while (typeof validColorFixedPoints[belowPoint] !== "undefined" && value > validColorFixedPoints[belowPoint]) {
            belowPoint++;
        }
        var color;
        if (belowPoint > 0 && belowPoint < validColorFixedPoints.length) {
            //easy linear interpolation between points on scale.
            var range = validColorFixedPoints[belowPoint] - validColorFixedPoints[belowPoint - 1];
            var rightRatio = (value - validColorFixedPoints[belowPoint - 1]) / range;
            return interpolateBetween2Color(allPoints[validColorFixedPoints[belowPoint - 1]], allPoints[validColorFixedPoints[belowPoint]], rightRatio, alpha);
        } else if (belowPoint == 0) {
            //point below first valid point
            if (colorLimitsAndValidPoints.limits.start) {
                //point between limit and first valid point
                return interpolateBetween2Color(colorLimitsAndValidPoints.limits.start, allPoints[validColorFixedPoints[0]],
                    Math.max(0, (value - (validColorFixedPoints[0] - wholeRange)) / wholeRange), alpha); // values one whole scale below the start limit have the color of the limit
            }
            return allPoints[validColorFixedPoints[belowPoint]];
        } else if (belowPoint == validColorFixedPoints.length) {
            if (colorLimitsAndValidPoints.limits.end) {
                return interpolateBetween2Color(allPoints[validColorFixedPoints[validColorFixedPoints.length - 1]], colorLimitsAndValidPoints.limits.end,
                    Math.min(1, (value - (validColorFixedPoints[validColorFixedPoints.length - 1] - wholeRange)) / wholeRange), alpha); // values one whole scale above the end limit have the color of the limit
            }
            return allPoints[validColorFixedPoints[belowPoint - 1]];
        }
    }

    function interpolateBetween2Color(left, right, ratio, alpha) {
        var rightRatio = ratio;
        var leftRatio = 1 - rightRatio;
        var color = {
            left: {
                r: parseInt(left.slice(1, 3), 16),
                g: parseInt(left.slice(3, 5), 16),
                b: parseInt(left.slice(5, 7), 16)
            },
            right: {
                r: parseInt(right.slice(1, 3), 16),
                g: parseInt(right.slice(3, 5), 16),
                b: parseInt(right.slice(5, 7), 16)
            }
        }
        return "rgba(" + ((leftRatio * color.left.r) + (rightRatio * color.right.r)) + "," +
            ((leftRatio * color.left.g) + (rightRatio * color.right.g)) + "," +
            ((leftRatio * color.left.b) + (rightRatio * color.right.b)) + ", " + alpha + ")";
    }

    //var test = null;
    var stylefunction = function (feature) {
        //if(test) return test;
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
            }),
            zIndex: 2
        });
        //test = colormarker;
        return (colormarker)
    };

    //creating colored markers
    var emphasizestylefunction = function (feature) {

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
            }),
            zIndex: 3
        })
        return (colormarker)
    };

    //simulation source and layers
    var SimulationSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        features: SimulationCollection = new ol.Collection()
    })

    var ColoredMarkerLayer = new ol.layer.Vector({
        source: SimulationSource,
        renderMode: 'image'
    });



    var SimulationInvisibleLayer = new ol.layer.Vector({
        source: SimulationInvisibleSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            features: SimulationInvisibleCollection = new ol.Collection()
        })
    });


    //canvas layer for kriging
    var canvasLayer = new ol.layer.Image({
        source: new ol.source.ImageCanvas({
            canvasFunction: function (extent, resolution, pixelRatio, size, projection) {
                let canvas = document.createElement('canvas');
                canvas.width = size[0];
                canvas.height = size[1];
                canvas.style.display = 'block';
                //设置canvas透明度
                canvas.getContext('2d').globalAlpha = params.canvasAlpha;

                //使用分层设色渲染
                kriging.plot(canvas, grid,
                    [extent[0], extent[2]], [extent[1], extent[3]], params.colors);

                return canvas;
            },
            projection: 'EPSG:4326'
        })
    })


    var grid;
    var caz = [
        [10.924750, 48.386800],
        [10.870650, 48.386800],
        [10.870650, 48.332600],
        [10.924750, 48.332600]
    ]


    function getcurrentextend() {
        var extent = olMap.getView().calculateExtent(olMap.getSize());
        extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326'); //[0][1] is bottom left [2][1] is bottom right [0][3] is top left
        var bottomleft = [extent[0], extent[1]];
        var bottomright = [extent[2], extent[1]];
        var topleft = [extent[0], extent[3]];
        var topright = [extent[2], extent[3]];
        return ([topright, topleft, bottomleft, bottomright]);
    };

    function getextendPolygon(ext){
        let topright = ext[0]
        let topleft = ext[1]
        let bottomleft = ext[2]
        let bottomright = ext[3]
        return ( "((" + topright[0].toString() + " " + topright[1].toString() + 
        "," + topleft[0].toString() + " " + topleft[1].toString() +
        "," + bottomleft[0].toString() + " " + bottomleft[1].toString() +
        "," + bottomright[0].toString() + " " + bottomright[1].toString() + 
        "," + topright[0].toString() + " " + topright[1].toString() + "))"
        )
    }

    function filterparamPolygonextent(polyext){
        return ("st_within(Locations/location,geography'POLYGON" + polyext + "')")
    }

    //viewport query: 
    // filterparamPolygonextent(getextendPolygon(getcurrentextend()))


    function krigstuff(locations, values) {
        var lats = locations.map(function (x) {
            return x[1]
        })
        var lngs = locations.map(function (x) {
            return x[0]
        })
        var variogram = kriging.train(values, lngs, lats,
            params.krigingModel, params.krigingSigma2, params.krigingAlpha);
        var polygons = [getcurrentextend()];
        grid = kriging.grid(polygons, variogram, (polygons[0][0][1] - polygons[0][3][1]) / 200);
    };







    /******************************** fake Simulation ***********************************/
    //                               create Simulation
    /************************************************************************************/



    var idcounter = 1;
    var randomlocation = [];
    var randomvalue = [];
    var xspeed = [];
    var yspeed = [];
    var totalspeed = [];

    var scalingfactor = 0.005;

    function setupsimulations(number) {
        for (let i = 0; i <= number - 1; i++) {
            randomlocation[i] = [params.mapCenter[0] + scalingfactor * (Math.random() - 0.5) * 1.6, params.mapCenter[1] + scalingfactor * (Math.random() - 0.5) * 0.9];
            randomvalue[i] = 200 * Math.random();
            totalspeed[i] = (Math.random() + Math.random() + Math.random()) * scalingfactor;
        };
        return (number);
    }



    function simulate(id) {

        xspeed[id] = totalspeed[id] * Math.random();
        yspeed[id] = Math.sqrt(totalspeed[id] * totalspeed[id] - xspeed[id] * xspeed[id]);

        randomvalue[id] = randomvalue[id] * (Math.random() + Math.random() + 0.1) / 2;
        randomlocation[id] = [randomlocation[id][0] + (Math.random() - 0.5) * scalingfactor * xspeed[id], randomlocation[id][1] + (Math.random() - 0.5) * scalingfactor * yspeed[id]]

        let SimulatedFeature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat(randomlocation[id])),
            value: randomvalue[id]
        });

        SimulatedFeature.setId(Date.now());
        //SimulatedFeature.setStyle(stylefunction(randomvalue[id])) //Needs information aboaut obsprop to calculate style
        SimulationInvisibleSource.addFeature(SimulatedFeature);

        removeoldfeatures(900); //store time in milliseconds
    };


    function removeoldfeatures(grace) {
        let threshold = Date.now() - grace;
        SimulationInvisibleSource.forEachFeature(function (thisfeature) {
            if (thisfeature.getId() < threshold) {
                //SimulationInvisibleSource.removeFeature(thisfeature)
            }
        })
    };



    /*
    function SimulationSourceUpdate(){
        SimulationSource.clear();
        SimulationSource.addFeatures(SimulationInvisibleSource.getFeatures());
        ColoredMarkerLayer.getSource().changed();
        canvasLayer.getSource().changed();
    };
    */




    var refreshrate = 10000; //initial refresh rate
    $scope.source = "simulationsource";
    $scope.sourceChanged = function () {
        if ($scope.source == "realsource") {
            clearTimeout(runningsimulation);
            PinLayer.setSource(PinSource);
            ColoredMarkerLayer.setSource(ColoredMarkerSource);
            refreshrate = 10000
        } else if ($scope.source == "simulationsource") {
            PinLayer.setSource(null);
            ColoredMarkerLayer.setSource(SimulationSource);
            refreshrate = 1000
        } else {
            PinLayer.setSource(null);
            ColoredMarkerLayer.setSource(null);
            console.log("no source set");
        }
    }

    $scope.UpdateMap = function () {
        if ($scope.source == "simulationsource") {
            krigstuff(randomlocation, randomvalue);
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
    var backroundsimulation = function () {
        for (let i = 0; i <= amountofsimulations - 1; i++) {
            simulate(i, totalspeed[i]);
        };
        runningsimulation = window.setTimeout(backroundsimulation, refreshrate);
        console.log("background running")
    };


    var amountofsimulations = setupsimulations(50);
    window.setTimeout(backroundsimulation, 0);


    $scope.isAutoRefreshActive = false;
    var autorefreshtimer;
    $scope.changedAutoRefreshActive = function () {
        if ($scope.isAutoRefreshActive) {
            autorefreshtimer = window.setInterval(function () {
                $scope.UpdateMap()
            }.bind(this), refreshrate)
        } else {
            window.clearInterval(autorefreshtimer)
        }
    }

});