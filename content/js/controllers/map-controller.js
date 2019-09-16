gostApp.controller('MapCtrl', function ($scope, $http, $sce) {


    /************************************ Parameters ************************************/
    //                        set parameters for map and functions
    /************************************************************************************/


    var augsburg = [10.8986971, 48.3668041];
    var karlsruhe = [8.4, 49];

    var params = {
        mapCenter: augsburg,
        maxValue: 100,
        krigingModel: 'exponential', //model还可选'gaussian','spherical','exponential'
        krigingSigma2: 0,
        krigingAlpha: 100,
        canvasAlpha: 0.35, //canvas图层透明度
        colors: ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"]
    };


    function setview(coordinates) {
        let view = new ol.View({
            zoom: 13,
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


    //colored markers for latest observations per datastream with feature of interest
    var ColoredMarkerSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        features: []
    });
    var ColoredMarkerLayer = new ol.layer.Vector({
        source: ColoredMarkerSource,
        renderMode: 'image'
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

    $scope.isKrigingActive = false


    //views anpassen funktioniert nicht, obwohl console.log($scope) anzeigt, dass die da sein sollten
    if ($scope.id.match(/:home:/)) {
        $scope.isLayerPinsActive = true
        $scope.isColorMarkersActive = false
    } else if ($scope.id.match(/:t:/)) {
        $scope.isLayerPinsActive = true
        $scope.isColorMarkersActive = false
    } else if ($scope.id.match(/:op:/)) {
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    } else if ($scope.id.match(/:ds:/)) {
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    } else if ($scope.id.match(/:s:/)) {
        $scope.isLayerPinsActive = false
        $scope.isColorMarkersActive = true
    };

    $scope.$on("centerOn", function (event, location) {
        setview(location.coordinates);
    });

    if ($scope.location) {
        setview($scope.location);
    }

    //Default Layers at page loading

    togglelayers(PinLayer, $scope.isLayerPinsActive);
    togglelayers(ColoredMarkerLayer, $scope.isColorMarkersActive);
    togglelayers(canvasLayer, $scope.isKrigingActive);



    /* ------------------------------------------------------------------------------------------------------------------------ */


    $scope.changedLayerPinsActive = function () {
        togglelayers(PinLayer, $scope.isLayerPinsActive);
    }

    $scope.changedColorMarkersActive = function () {
        togglelayers(ColoredMarkerLayer, $scope.isColorMarkersActive);
        enableLegendSidepanel();
    }

    $scope.changedKrigingActive = function () {
        togglelayers(canvasLayer, $scope.isKrigingActive);
        enableLegendSidepanel();
    }

    function enableLegendSidepanel() {
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
        target: document.querySelector(".external-fullscreen"),
        source: 'fullscreen',
        label: '\uf31e',
        labelActive: '\uf78c',
        className: 'btn'
    });
    olMap.addControl(external_fullscreen);


    $scope.isControlSidePanelOpen = false;
    $scope.toggleControlSidepanel = function () {
        $scope.isControlSidePanelOpen = !$scope.isControlSidePanelOpen;
        if ($scope.isControlSidePanelOpen) { //if panel is opened register event to close it
            setTimeout(function () { //await next tick to prevent event trigger for now
                $(document).bind('click', function (evt) {
                    if (!jQuery.contains($("#ControlSidepanel")[0], evt.target)) { //if event target is not in control sidepanel => close it
                        $(document).unbind(evt);
                        $scope.isControlSidePanelOpen = false;
                        $scope.safeApply();
                    }
                })
            }, 0);
        }
    };

    $scope.isLegendSidePanelOpen = true;
    $scope.toggleLegendSidepanel = function () {
        $scope.isLegendSidePanelOpen = !$scope.isLegendSidePanelOpen;
    };

    // added function call to click event on feature to open the panel; togglebutton only closes
    $scope.isInfoSidePanelClosed = true;
    $scope.toggleInfoSidepanel = function () {
        if ($scope.isInfoSidePanelClosed == false) {
            $scope.isInfoSidePanelClosed = true
        };
    };


    /************************************ Marker ************************************/
    //                               create Markers
    /********************************************************************************/




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

    var selectedMarkerStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 1.2,
            //color: [255,64,64,1],
            src: window.dashboardSettings.root + 'assets/img/map_marker_emph.svg'
        })), zIndex: 3
    });

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


    /*
    //Try a stylefunction with a white svg cricle that has radially declining opacity, at the moment for testing uses random colors between red and green (linear color scale)
    // question about if and if so how they should scale remains
    var stylefunction = function(feature){
        var colormarker = new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                scale: 1.0,
                color: "rgb(" + String(Math.floor(Math.random() * (255 - 0 + 1)) + 0) + "," + String(Math.floor(Math.random() * (255 - 0 + 1)) + 0) + ",0)",
                src: '/dashboard/content/assets/img/circle_layer_marker.svg'
            })), zIndex: 3
        });
        return(colormarker)
    };
    */


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
    window.testMap = olMap;

    //function that can be used to add gps pins to the map
    function addPinFeature(allinfo) {
        var defaultGeoJSONProjection = 'EPSG:4326';
        var mapProjection = olMap.getView().getProjection();
        var geom = (new ol.format.GeoJSON()).readGeometry(allinfo.location, {
            dataProjection: defaultGeoJSONProjection,
            featureProjection: mapProjection
        });

        var feature = new ol.Feature(geom);
        feature.setStyle(defaultMarkerStyle);
        feature.setProperties(allinfo);

        PinCollection.push(feature);
    }

    //allinfo: result, resulttime, @iot.id, FeatureOfInterest
    //function that can be used to add features to the map with gps coordinates and a value for value height which is used for color coding
    function addColorFeature(allinfo, collection) {
        var feature = infoToFeature(allinfo, stylefunction(allinfo), allinfo.FeatureOfInterest);
        collection.push(feature);
    };

    /**
     * Creates an OpenLayers feature attached with the given properties in the allinfo object, style and location
     *
     * @param {*} allinfo information attached to the feature
     * @param {*} style style f the feature
     * @param {*} location GeoJSON location
     * @returns OL feature
     */
    function infoToFeature(allinfo, style, location) {
        var defaultGeoJSONProjection = 'EPSG:4326';
        var mapProjection = olMap.getView().getProjection();
        var geom = (new ol.format.GeoJSON()).readGeometry(location, {
            dataProjection: defaultGeoJSONProjection,
            featureProjection: mapProjection
        });
        var feature = new ol.Feature(geom);
        feature.setStyle(style);
        //feature.setId(allinfo.resulttime); //wäre besser die filter direkt über zeit laufen zu lassen und nicht über id?
        feature.setProperties(allinfo);
        return feature;
    }

    var obsproperty = $scope.observedPropertyId || "saqn:op:mcpm10"; //Reads observedPropertyId first, possibly from a parent controller. "saqn:op:mcpm10" is the fallback.

    function observedPropertyHasChanged(obsprop) {
        obsproperty = obsprop;
        updateFeatures();
        constructLegend();
    }

    //get all things for pins
    function getAllLocations() {
        $http.get(getUrl() + "/v1.0/Things?$filter=not%20Datastream/PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27&$expand=Locations&$top=9999999").then(function (response) {
            var allThings = response.data.value;
            Object.keys(allThings).forEach(function (key) {

            });
        });
    }

    //get all observations for colored markers
    function getAllObservations() {
        $http.get(getUrl() + "/v1.0/Datastreams?$filter=not%20PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27%20and%20ObservedProperty/@iot.id%20eq%20%27" + obsproperty + "%27&$expand=ObservedProperty,Observations($top=1;$orderby=phenomenonTime%20desc;$expand=FeatureOfInterest)&$top=999999").then(function (response) {
            var alldatastreams = response.data.value;
            Object.keys(alldatastreams).forEach(function (key) {
                var value = alldatastreams[key];
                if (value["Observations"].length > 0) {
                    var featureinfo = transformObservationIntoFeatureInfo(value.Observations[0], value.ObservedProperty, value.unitOfMeasurement);
                    addColorFeature(featureinfo, ColoredMarkerCollection);
                };
            });
        });
    };

    function transformObservationIntoFeatureInfo(observation, observedProperty, unitOfMeasurement) {
        var obsresult = observation["result"];
        var obsFOI = observation["FeatureOfInterest"]["feature"];
        var obsresulttime = Date.parse(observation["phenomenonTime"].split("/").pop());
        var obsId = observation["@iot.id"];
        var dsUnit = unitOfMeasurement;
        var obspropertyName = observedProperty["name"];
        var obsPropertyColorFixedPoints = observedProperty.properties.conventions.fixedPoints;

        var featureinfo = {
            "result": obsresult,
            "resulttime": obsresulttime,
            "@iot.id": obsId,
            "FeatureOfInterest": obsFOI,
            "obspropertyName": obspropertyName,
            "dsUnit": dsUnit,
            "obsresult": obsresult,
            "tooltip": obspropertyName + " [" + dsUnit["symbol"] + "]: " + obsresult + "<br>" +
                "~ " + moment.duration(moment().diff(moment(obsresulttime))).humanize() + " ago",
            "colorFixedPoints": obsPropertyColorFixedPoints
        };
        return featureinfo;
    }

    /**
     * Get an object that contains all information to display a thing feature
     *
     * @param {*} thing as returned by API
     * @param {*} location GeoJSON location as returned by API
     * @returns {location, locationname, @iot.id, thingname, tooltip}
     */
    function transformThingIntoFeatureInfo(thing, location) {
        var thinglocation = location["location"];
        var thinglocationname = location["name"];
        var thingid = thing["@iot.id"]
        var thingname = thing["name"]

        featureinfo = {
            "location": thinglocation,
            "locationname": thinglocationname,
            "@iot.id": thingid,
            "thingname": thingname,
            "tooltip": "Located at: " + thinglocationname
        };
        return featureinfo;
    }

    $scope.showOnlyLatest = true;

    function updateFeatures() {
        ColoredMarkerSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            features: ColoredMarkerCollection = []
        });
        var PinSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            features: PinCollection = new ol.Collection()
        });
        ColoredMarkerLayer.setSource(ColoredMarkerSource);
        PinLayer.setSource(PinSource);
        //ColoredMarkerSource.clear();
        //PinSource.clear();
        //ColoredMarkerSource.clear();
        //PinSource.clear();

        //getAllLocations();
        //getAllObservations();

        loadFeaturesFromServer($scope.showOnlyLatest).then(function () {
            selectPinsAndMarkersBasedOnTimeInterval($scope.showOnlyLatest);
        });
    }
    updateFeatures();

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
                return layer == PinLayer || layer == ColoredMarkerLayer;
            }
        );
        displayFeatureTooltip(feature);
    });



    /* --------------------------------------------------Click Tooltip Detailed Info (Sideboard Bottom)---------------------------------------------------------------------- */


    var displayFeatureInfo = function (feature) {
        var observationId = feature.getProperties()['@iot.id'];
        $http.get(getUrl() + "/v1.0/Observations('" + observationId + "')?$expand=FeatureOfInterest,Datastream($expand=Thing,ObservedProperty,Sensor)").then(function (response) {
            observationInfo = response.data;

            var info = document.getElementById('map-detailed-tooltip');
            var crosslinks = document.getElementById('map-crosslinks');
            // feature.setStyle({stroke: 'rgba(255,255,255,1.0)'});
            var featureInfo = feature.getProperties();
            $scope.information = {
                observation: featureInfo.obspropertyName + " [" + featureInfo.dsUnit["symbol"] + "]: " + featureInfo.obsresult,
                phenomenonTime: observationInfo['phenomenonTime'],
                thingLink: "#/thing/" + observationInfo['Datastream']['Thing']['@iot.id'] + "?$expand=Locations",
                thingLinkName: observationInfo['Datastream']['Thing']['name'],
                datastreamLink: "#/datastream/" + observationInfo['Datastream']['@iot.id'],
                datastreamLinkName: observationInfo['Datastream']['name'],
                observedPropertyLink: "#/observedproperty/" + observationInfo['Datastream']['ObservedProperty']['@iot.id'],
                observedPropertyLinkName: observationInfo['Datastream']['ObservedProperty']['name'],
                datastreamLinkName: observationInfo['Datastream']['name'],
                sensorLink: "#/sensor/" + observationInfo['Datastream']['Sensor']['@iot.id'],
                sensorLinkName: observationInfo['Datastream']['Sensor']['name']
            }
            /*+ "<br />" + 'Phenomenon Time (UTC): ' + observationInfo['phenomenonTime'];
                      crosslinks.innerHTML = 'Thing: <a href="#/thing/' + observationInfo['Datastream']['Thing']['@iot.id'] + '?$expand=Locations" target="_blank">' + observationInfo['Datastream']['Thing']['name'] + '</a><br /> ' +
                          'Datastream: <a href="#/datastream/' + observationInfo['Datastream']['@iot.id'] + '" target="_blank">' + observationInfo['Datastream']['name'] + '</a><br /> ' +
                          'Observed Property: <a href="#/observedproperty/' + observationInfo['Datastream']['ObservedProperty']['@iot.id'] + '" target="_blank">' + observationInfo['Datastream']['ObservedProperty']['name'] + '</a><br /> ' +
                          'Sensor: <a href="#/sensor/' + observationInfo['Datastream']['Sensor']['@iot.id'] + '" target="_blank">' + observationInfo['Datastream']['Sensor']['name'] + '</a>';*/
        });
    };

    var displayreducedFeatureInfo = function (feature) {
        var thingId = feature.getProperties()['@iot.id'];
        $http.get(getUrl() + "/v1.0/Things('" + thingId + "')?$expand=Locations,Datastreams").then(function (response) {
            ThingInfo = response.data;

            $scope.information = {
                locationname: ThingInfo['Locations'][0]['name'],
                coordinates: {
                    lat: ThingInfo['Locations'][0]['location']['coordinates']["1"],
                    long: ThingInfo['Locations'][0]['location']['coordinates']["0"]
                },
                thingLink: "#/thing/" + ThingInfo['@iot.id'] + "?$expand=Locations",
                thingLinkName: ThingInfo['name']
            }

            //var info = document.getElementById('map-detailed-tooltip');
            //var crosslinks = document.getElementById('map-crosslinks');
            // feature.setStyle({color: 'rgba(255,64,64,1.0)'});


            //info.innerHTML = 'Location Name: ' + ThingInfo['Locations'][0]['name'] + "<br />" + "<p>" + 'GPS Coordinates: ' + "<br />" + '&emsp; - Latitude: ' + ThingInfo['Locations'][0]['location']['coordinates']["1"] + "<br />" + '&emsp; - Longitude: ' + ThingInfo['Locations'][0]['location']['coordinates']["0"] + "</p>";
            //crosslinks.innerHTML = 'Thing: <a href="#/thing/' + ThingInfo['@iot.id'] + '?$expand=Locations" target="_blank">' + ThingInfo['name'] + '</a>';
        });
    };


    olMap.on('click', function (evt) {
        var feature = olMap.forEachFeatureAtPixel(evt.pixel, function (feature) {
            return feature
        });
        if (feature) {
            $scope.isInfoSidePanelClosed = false;
            $scope.toggleInfoSidepanel;
            if (feature.getProperties()['result']) {
                displayFeatureInfo(feature)
            } else {
                displayreducedFeatureInfo(feature)
            };
        };
    });




    /* ------------------------------------------------------------------------------------------------------------------------ */

    //* -------------------------------------------Construct Legend--------------------------------------------------------------------------------- */



    //get obs properties conventions (e.g. fixed points for color gradients)
    function constructLegend() {
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
            var range = validPoints[validPoints.length - 1] - validPoints[0];
            var overshoot = 8; //Size between bottom to first valid point/ last valid point to top of the scale in percent of whole scale;
            $scope.scaleOvershoot = overshoot;
            var relativePoints = validPoints.map(function (point) { //Map all points to their relative location on the scale
                return {
                    relativeLocation: ((point - validPoints[0]) / range) * (100 - (overshoot * limitNumber)), //relative position of fixed point on scale
                    color: conventions.fixedPoints[point], //original color
                    value: point
                };
            });
            $scope.relativePoints = relativePoints;

            var relativePointStrings = relativePoints.map(function (point) { // build strings ["#ff00ff 0%", ...]
                return point.color + " " + point.relativeLocation + "%";
            })
            //Build one gradient for all fixed points
            var scaleStyle = {
                "background-image": ("\
                linear-gradient(\
                to top, " +
                    (limitColors.start ? limitColors.start + "," : "") + //Add start only if necessary
                    relativePointStrings.join(",") +
                    (limitColors.end ? ", " + limitColors.end + " 100%" : "") + //Add start only if necessary
                    ")").trim()
            };
            $scope.scaleStyle = scaleStyle;
            $scope.limitColors = limitColors;

            //Build equidistant labels for scale
            var labels = [];

            for (var i = 0; i < numberOfLabels; i++) {
                labels[i] = Math.round(parseInt(validPoints[0]) + range * i / (numberOfLabels - 1));
            }

            $scope.scaleLabels = labels;
            $scope.scaleLabelsLimits = {
                start: "≤" + labels[0],
                end: "≥" + labels[labels.length - 1],
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


    /* ------------------------------------------------------------------------------------------------------------------------ */





    /************************************ Kriging ************************************/
    //                               calculate Kriging
    /*********************************************************************************/

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
    $scope.source = "realsource";
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

    /************************************ Timeline ************************************/
    //                  create Timeline / Historic Data Selection
    /************************************************************************************/

    $scope.$watch('isLoadingData', function () {
        if (!$scope.isLoadingData) {
            setTimeout(function () {
                var nowMoment = moment();
                /*
                    reinitialize Daterangepicker. Allows picking the same date range again.
                    Usually the callback is not called if a user selects the same interval twice.
                */
                $('#historicDataButton').daterangepicker({
                    //parentEl: $("#collapseHistoricSelection .card"),
                    timePicker: true,
                    timePicker24Hour: true,
                    parentEl: "#calendarHost", //default parent (body) is not visible in fullscreen mode
                    drops: "up",
                    ranges: {
                        'Latest': [nowMoment, nowMoment],
                        'Last Hour': [moment().subtract(1, 'hours'), moment()],
                        'Last 3 Hours': [moment().subtract(3, 'hours'), moment()],
                        'Last 6 Hours': [moment().subtract(6, 'hours'), moment()],
                        'Last 12 Hours': [moment().subtract(12, 'hours'), moment()],
                        'Last 24 Hours': [moment().subtract(24, 'hours'), moment()],
                        'Last 3 Days': [moment().subtract(3, 'days'), moment()]
                    },
                    autoUpdateInput: false,
                    maxSpan: moment.duration(3, 'days'),
                    locale: {
                        format: 'YYYY-MM-DD HH:mm:ss'
                    }
                }, otherDateSelected);
                $('#historicDataButton').on('show.daterangepicker', function (ev, picker) {
                    $scope.isMapOverlayVisible = false;
                    $scope.safeApply();
                });
                $('#historicDataButton').on('hide.daterangepicker', function (ev, picker) {
                    $('#historicDataButton').data('daterangepicker').setStartDate(moment());
                    $('#historicDataButton').data('daterangepicker').setEndDate(moment());
                });
            }, 0);
        }
    }, true);

    $scope.$watchGroup(['showOnlyLatest', 'isInfoSidePanelClosed', 'isLoadingData'], function () {
        /*
            All events that could lead to a change of size in a child container
            (e.g. selecting a new feature might expand the detailed info panel)
            require the map to update its size to prevent a stretched map.
        */
        setTimeout(function () {
            olMap.updateSize();
        }, 20);
    });

    function otherDateSelected(start, end) {
        $scope.startDateMoment = start;
        $scope.endDateMoment = end;
        $scope.startDate = start.format('YYYY-MM-DD HH:mm:ss');
        $scope.endDate = end.format('YYYY-MM-DD HH:mm:ss');
        //Remove the rectangle that visualized the previous area of loaded data
        ViewfinderSource.clear();
        if (moment.duration(start.diff(end)).asMilliseconds() == 0) {
            //An empty interval signals that only latest data points should be loaded
            loadFeaturesFromServer(true).then(function () {
                selectPinsAndMarkersBasedOnTimeInterval($scope.showOnlyLatest);
            });
            return;
        }
        $scope.slider.options.minRange = oneMinuteToRelative();
        $scope.$broadcast('rzSliderForceRender');
        //activates the overlay which enables users to select an area on the map
        $scope.isMapOverlayVisible = true;
        $scope.isLegendSidePanelOpen = false;
        $scope.safeApply();
        try {
            $("#map")[0].scrollIntoView();
        } catch (e) {}
    }

    $scope.cancelHistoricDataSelection = function () {
        $scope.isMapOverlayVisible = false;
    }

    //layer for polygon indicating area to load
    var ViewfinderSource = new ol.source.Vector({
        wrapX: false,
    });
    var ViewfinderLayer = new ol.layer.Vector({
        source: ViewfinderSource
    });
    togglelayers(ViewfinderLayer, true);

    // Points to the observation to create a feature for in the next round. See makeColorFeatures()
    var rawObservationPointer = 0;
    // Array of {datastream, thing, observation}
    var rawObservations = [];
    //Interval that creates new observation features. See startMakingColorFeatures()
    var rawObservationInterval = null;

    //Array of {time, thing, datastream, originalObservation, foi, feature}
    var allObservations = [];
    // Array of {time, thing, location, feature}
    var allLocations = [];
    var observationIntervalTree = new NodeIntervalTree.IntervalTree();
    var locationIntervalTree = new NodeIntervalTree.IntervalTree();
    /*
        Adds a ractangle to the map that signals area to load data from and loads data from server
    */
    $scope.confirmHistoricDataSelection = function () {
        var viewseekerBoundaries = $("#mapOverlayUI")[0].getBoundingClientRect();
        var mapBoundaries = $("#map")[0].getBoundingClientRect();
        var viewseekerCoordinates = {
            lt: olMap.getCoordinateFromPixel([viewseekerBoundaries.x - mapBoundaries.x, viewseekerBoundaries.y - mapBoundaries.y]),
            rt: olMap.getCoordinateFromPixel([viewseekerBoundaries.x - mapBoundaries.x + viewseekerBoundaries.width, viewseekerBoundaries.y - mapBoundaries.y]),
            lb: olMap.getCoordinateFromPixel([viewseekerBoundaries.x - mapBoundaries.x, viewseekerBoundaries.y - mapBoundaries.y + viewseekerBoundaries.height]),
            rb: olMap.getCoordinateFromPixel([viewseekerBoundaries.x - mapBoundaries.x + viewseekerBoundaries.width, viewseekerBoundaries.y - mapBoundaries.y + viewseekerBoundaries.height])
        };
        $scope.isMapOverlayVisible = false;
        var polygon = new ol.geom.Polygon([
            [viewseekerCoordinates.lt, viewseekerCoordinates.rt, viewseekerCoordinates.rb, viewseekerCoordinates.lb]
        ]);
        var feature = new ol.Feature({
            geometry: polygon
        });
        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#2d497f',
                width: 3
            })
        }));
        ViewfinderSource.addFeature(feature);
        //Polygon in the projection used by the server
        var serverPolygon = new ol.geom.Polygon([
            [viewseekerCoordinates.lt, viewseekerCoordinates.rt, viewseekerCoordinates.rb, viewseekerCoordinates.lb]
        ]).transform('EPSG:3857', 'EPSG:4326').getCoordinates()[0];
        //feature.setGeometry(serverPolygon);
        serverPolygon.push(serverPolygon[0]); //close polygon by repeating first point
        var polygonString = serverPolygon.map(function (coordinates) {
            return coordinates.join(" ");
        }).join(",");
        loadFeaturesFromServer(false, polygonString);
    }

    /**
     *  Starts a Http Get Request that loads things and observations of datastreams which fit the selected ObservedProperty
     *  The function loads either a time interval specified by $scope.startDateMoment/$scope.endDateMoment
     *  or only the latest data point in each datastream.
     *  If a polgon is passed to the function, the query is further constrained to the area of the polygon.
     *  
     *
     * @param {*} loadLatestOnly if set, only latest observation of datastreams not longer inactive than one day are loaded
     * @param {*} polygonString string of form "ALong ALat,BLong BLat,CLong CLat,DLong DLat,ALong ALat". Constraints query
     * @returns the angular HTTP Promise
     */
    function loadFeaturesFromServer(loadLatestOnly, polygonString) {
        $scope.isLoadingData = true;
        $scope.loadedPercent = 0;
        if (!loadLatestOnly) {
            $scope.isAutoRefreshActive = false;
            $scope.changedAutoRefreshActive();

        }
        var timeIntervalObservationsFilter = loadLatestOnly ?
            //no observation time constraint
            "" : 
            //only observations not before $scope.startDateMoment and not after $scope.endDateMoment
            "$filter=not (phenomenonTime lt " + $scope.startDateMoment.toISOString() + " or phenomenonTime gt " + $scope.endDateMoment.toISOString() + ");";
        var timeIntervalDatastreamFilter = loadLatestOnly ?
            //only datastreams not older than one day
            "and not%20Datastream/PhenomenonTime%20lt%20now()%20sub%20duration%27P1D%27" :
            //only datastreams not before $scope.startDateMoment and not after $scope.endDateMoment
            "and not (phenomenonTime lt " + $scope.startDateMoment.toISOString() + " or phenomenonTime gt " + $scope.endDateMoment.toISOString() + ")";
        var observationsOptions = loadLatestOnly ?
            //only latest observation
            "$top=1;$orderby=phenomenonTime%20desc;" :
            //all observations (sorting not necessary, done implicitly when building interval tree)
            "$top=999999;";
        var filterLocation = polygonString ? " and st_within(HistoricalLocations/Location/location,%20geography%27POLYGON((" + polygonString + "))%27)" : "";

        return $http.get(getUrl() + "/v1.0/Things?$expand=" + "HistoricalLocations/Locations," + "Datastreams" +
            "($filter=ObservedProperty/@iot.id eq '" + obsproperty + "' " + timeIntervalDatastreamFilter + ";" +
            "$expand=ObservedProperty,Observations(" + timeIntervalObservationsFilter + observationsOptions + "$expand=FeatureOfInterest))" +
            "&$filter=Datastreams/ObservedProperty/@iot.id eq '" + obsproperty + "'" + filterLocation).then(function (response) {
                //all returned things with at least one datastream
            var thingsPreviouslyInThisRegion = response.data.value.filter(function (thing) {
                return thing.Datastreams.length > 0;
            });
            //Clear arrays
            allObservations.length = 0;
            allLocations.length = 0;
            rawObservations.length = 0;
            observationIntervalTree = new NodeIntervalTree.IntervalTree();

            locationIntervalTree = new NodeIntervalTree.IntervalTree();
            thingsPreviouslyInThisRegion.forEach(function (thing) {
                //Create a feature for every HistoricalLocation of the thing and add it to the location interval tree
                for (var i = 0; i < thing["HistoricalLocations"].length; i++) {
                    var historicalLocation = thing["HistoricalLocations"][i];
                    if (historicalLocation["Locations"].length < 1) return;
                    var featureInfo = transformThingIntoFeatureInfo(thing, historicalLocation.Locations[0]);
                    allLocations.push({
                        time: moment(historicalLocation.time),
                        thing: thing,
                        location: historicalLocation.Locations[0].location,
                        feature: infoToFeature(featureInfo, defaultMarkerStyle, historicalLocation.Locations[0].location)
                    });
                    //Add entry to interval tree. Contains indices to elements in allLocations.
                    locationIntervalTree.insert({
                        low: moment(historicalLocation.time).valueOf(),
                        high: (i < thing["HistoricalLocations"].length - 1) ? moment(thing["HistoricalLocations"][i + 1].time).valueOf() : moment().valueOf(), //interval ends at next location or now
                        id: allLocations.length - 1 //index of elements in allLocations
                    });
                }
                /*
                    Builds the rawObservations array.
                    Observation features are not created now but asynchronly to prevent hangs
                */
                thing.Datastreams.forEach(function (datastream) {
                    return datastream.Observations.forEach(function (observation) {
                        return rawObservations.push({
                            datastream: datastream,
                            observation: observation,
                            thing: thing
                        });
                    });
                });
                //Start feature generation for observations
                startMakingColorFeatures();
                $scope.showOnlyLatest = loadLatestOnly;
                $scope.selectDuration(moment.duration(10, "minutes"));
            });
        });
    }

    /**
     * Create a feature for an observation and add it to the observation interval tree
     */
    function makeColorFeatures() {
        for (var currentRawObservationPointer = rawObservationPointer; currentRawObservationPointer < rawObservationPointer + 100 && currentRawObservationPointer < rawObservations.length; currentRawObservationPointer++) {
            var observation = rawObservations[currentRawObservationPointer].observation;
            var datastream = rawObservations[currentRawObservationPointer].datastream;
            var thing = rawObservations[currentRawObservationPointer].thing;
            observation.phenomenonTime.split("/").forEach(function (time) {
                var momentTime = moment(time);
                var featureInfo = transformObservationIntoFeatureInfo(
                    observation, datastream.ObservedProperty, datastream.unitOfMeasurement);
                var observationInfo = {
                    time: momentTime,
                    thing: thing,
                    datastream: datastream,
                    originalObservation: observation,
                    foi: featureInfo.FeatureOfInterest,
                    feature: infoToFeature(featureInfo, stylefunction(featureInfo), featureInfo.FeatureOfInterest)
                };
                allObservations.push(observationInfo);
                observationIntervalTree.insert({
                    low: momentTime.valueOf(),
                    high: momentTime.valueOf() + 1,
                    id: allObservations.length - 1
                });
            });
        }
        $scope.loadedPercent = Math.round((currentRawObservationPointer / (rawObservations.length || 1)) * 100);
        if (rawObservationPointer >= rawObservations.length) {
            stopMakingColorFeatures();
            selectPinsAndMarkersBasedOnTimeInterval($scope.showOnlyLatest);
            $scope.isLoadingData = false;
        }
        rawObservationPointer = currentRawObservationPointer;
        $scope.safeApply();
    }

    /**
     * Starts the process of creating observation features
     */
    function startMakingColorFeatures() {
        rawObservationPointer = 0;
        stopMakingColorFeatures();
        rawObservationInterval = setInterval(makeColorFeatures, 0);
    }

    /**
     * Stops the process of creating observation features
     */
    function stopMakingColorFeatures() {
        rawObservationPointer = 0;
        clearInterval(rawObservationInterval);
        rawObservationInterval = null;
    }

    //Points to the feature to be added in the next round. See startAddingMarkers/markerAddingInterval
    var currentMarkerPointer = 0;
    //Array of ol features for display
    var currentObservationList = [];
    var markerAddingInterval = null;

    /**
     * Adds observation features to the map
     */
    function startAddingMarkers() {
        stopAddingMarkers();
        var colorFeatures = ColoredMarkerSource.getFeatures();
        //Add 2000 at a time, then wait 17ms
        markerAddingInterval = setInterval(function () {
            if (currentMarkerPointer >= currentObservationList.length && currentMarkerPointer >= colorFeatures.length) {
                stopAddingMarkers();
                return;
            }
            //While there are features in the map from last interval, reuse old features
            for (var colorFeaturesPointer = currentMarkerPointer; colorFeaturesPointer < colorFeatures.length &&
                colorFeaturesPointer < currentObservationList.length &&
                colorFeaturesPointer < currentMarkerPointer + 2000; colorFeaturesPointer++) {
                colorFeatures[colorFeaturesPointer].setGeometry(currentObservationList[colorFeaturesPointer].getGeometry());
                colorFeatures[colorFeaturesPointer].setStyle(currentObservationList[colorFeaturesPointer].getStyle());
                colorFeatures[colorFeaturesPointer].setProperties(currentObservationList[colorFeaturesPointer].getProperties());
            }
            //If there were more features in the old map, delete unused old features
            if (colorFeaturesPointer < colorFeatures.length) {
                for (; colorFeaturesPointer < colorFeatures.length && colorFeaturesPointer < currentMarkerPointer + 2000; colorFeaturesPointer++) {
                    ColoredMarkerSource.removeFeature(colorFeatures[colorFeaturesPointer]);
                }
            }
            //If there were less features in the old map, create new ones
            else {
                for (; colorFeaturesPointer < currentObservationList.length && colorFeaturesPointer < currentMarkerPointer + 2000; colorFeaturesPointer++) {
                    var newFeature = new ol.Feature();
                    newFeature.setGeometry(currentObservationList[colorFeaturesPointer].getGeometry());
                    newFeature.setStyle(currentObservationList[colorFeaturesPointer].getStyle());
                    newFeature.setProperties(currentObservationList[colorFeaturesPointer].getProperties());
                    ColoredMarkerSource.addFeature(newFeature);
                }
            }
            currentMarkerPointer += 2000;
        }, 17);
    }

    /**
     * Stopps the current process of adding markers
     */
    function stopAddingMarkers() {
        if (markerAddingInterval != null) {
            clearInterval(markerAddingInterval);
            markerAddingInterval = null;
        }
    }

    
        /**
         * Shuffles an array in-place: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
         *
         * @param {*} array to be shuffled (is mutated)
         * @returns shuffled array
         */
        function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    /**
     * Displays observations and locations on map.
     * If not latestOnly, feature's time must be within $scope.selectedRangeStart and $scope.selectedRangeEnd
     *
     * @param {*} latestOnly only display latest features
     */
    function selectPinsAndMarkersBasedOnTimeInterval(latestOnly) {
        var observations = [];
        var thingLocations = [];
        if (latestOnly || !$scope.selectedRangeStart || !$scope.selectedRangeEnd) {
            observations = allObservations;
            thingLocations = allLocations;
        } else {
            observations = subCollectionFromTimeInterval($scope.selectedRangeStart, $scope.selectedRangeEnd, allObservations, observationIntervalTree);
            thingLocations = subCollectionFromTimeInterval($scope.selectedRangeStart, $scope.selectedRangeEnd, allLocations, locationIntervalTree);
            thingLocations = distinctThingLocations(thingLocations);
            if (!$scope.isColorMarkersActive) {
                $scope.isColorMarkersActive = true;
                togglelayers(ColoredMarkerLayer, $scope.isColorMarkersActive);
                enableLegendSidepanel();
            }
        }

        //Dictionary( ThingId -> Dictionary (Location -> feature)), is used to get only latest feature if features of one thing overlap
        var thingLocationDict = {};
        for (var i = 0; i < observations.length; i++) {
            var observation = observations[i];
            var locationMap = thingLocationDict[observation.thing["@iot.id"]];
            if (!locationMap) {
                locationMap = {};
                thingLocationDict[observation.thing["@iot.id"]] = locationMap;
            }
            var location = observation.foi.coordinates[0] + "-" + observation.foi.coordinates[1];
            if (!locationMap[location]) {
                locationMap[location] = observation;
            } else if (locationMap[location].time.isBefore(observation.time)) {
                locationMap[location] = observation;
            }
        }
        observations.length = 0;
        var things = Object.keys(thingLocationDict);
        for (var i = 0; i < things.length; i++) {
            var thingLocationDictEntry = thingLocationDict[things[i]];
            var locations = Object.keys(thingLocationDictEntry);
            for (var j = 0; j < locations.length; j++) {
                var location = thingLocationDictEntry[locations[j]];
                observations.push(location);
            }
        }

        currentObservationList = observations.map(function (observation) {
            return observation.feature;
        });
        shuffle(currentObservationList);
        currentMarkerPointer = 0;
        startAddingMarkers();

        //var CloredMarkerCollection = new ol.Collection(colorFeatures);
        /*ColoredMarkerSource = new ol.source.Vector({
            features: []
        });
        ColoredMarkerLayer.setSource(ColoredMarkerSource);*/
        //ColoredMarkerSource.clear();
        //ColoredMarkerSource.addFeatures(colorFeatures);


        var pinFeatures = thingLocations.map(function (thing) {
            return thing.feature;
        });
        var PinCollection = new ol.Collection(pinFeatures);
        var PinSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            features: PinCollection
        });
        PinLayer.setSource(PinSource);

        //addColorFeature()
    }

    /**
     * Searches in interval tree for features.
     * the tree nodes contain ids of elements in array.
     * 
     * @param {*} startTime
     * @param {*} endTime
     * @param {*} array
     * @param {*} tree
     * @returns
     */
    function subCollectionFromTimeInterval(startTime, endTime, array, tree) {
        var matches = tree.search(startTime.valueOf(), endTime.valueOf());
        return matches.map(function (match) {
            return array[match.id];
        })
    }

    /**
     * Get array of thing Locations if locations do not overlap
     *
     * @param {*} thingLocations
     * @returns
     */
    function distinctThingLocations(thingLocations) {
        var ids = [];
        var distinctThingLocations = [];
        thingLocations.sort(function (a, b) {
            return a.time.isBefore(b.time) ? -1 : 1;
        });
        for (var i = thingLocations.length - 1; i >= 0; i--) {
            var currentId = thingLocations[i].thing["@iot.id"];
            if (ids.indexOf(currentId) === -1) {
                ids.push(currentId);
                distinctThingLocations.push(thingLocations[i]);
            }
        }
        return distinctThingLocations;
    }

    function interpolateDate(position) {
        if (!$scope.startDateMoment || !$scope.endDateMoment) return;
        var duration = moment.duration(moment.duration($scope.endDateMoment.diff($scope.startDateMoment)).asMilliseconds() * position);
        var interpolatedDate = moment($scope.startDateMoment).add(duration);
        return interpolatedDate;
    }

    function oneMinuteToRelative() {
        if (!$scope.startDateMoment || !$scope.endDateMoment) return;
        var durationTotalMilliseconds = moment.duration($scope.endDateMoment.diff($scope.startDateMoment)).asMilliseconds();
        return moment.duration(1, 'minutes').asMilliseconds() / durationTotalMilliseconds;
    }

    function humanizedDuration(positionStart, positionEnd) {
        if (!$scope.startDateMoment || !$scope.endDateMoment) return;
        var duration = moment.duration(moment.duration($scope.endDateMoment.diff($scope.startDateMoment)).asMilliseconds() * (positionEnd - positionStart));
        return "~ " + duration.humanize();
    }

    $scope.selectDuration = function (duration) {
        if (!$scope.startDateMoment || !$scope.endDateMoment) return;
        var durationTotalMilliseconds = moment.duration($scope.endDateMoment.diff($scope.startDateMoment)).asMilliseconds() || 1;
        var ratioSelectedRange = duration.asMilliseconds() / durationTotalMilliseconds || 1;
        var midpoint = $scope.slider.minValue + ($scope.slider.maxValue - $scope.slider.minValue) / 2 || 0;
        var newMin = midpoint - ratioSelectedRange / 2;
        var newMax = midpoint + ratioSelectedRange / 2;
        if (newMin < 0) {
            newMin = 0;
            newMax = ratioSelectedRange;
        } else if (newMax > 1) {
            newMax = 1;
            newMin = 1 - ratioSelectedRange;
        }
        $scope.slider.minValue = newMin;
        $scope.slider.maxValue = newMax;
        $scope.$broadcast('rzSliderForceRender');
    }

    var callback = null;

    function applySliderChanges() {
        var localCallback = function () {
            callback = null;
            $scope.timeRange = humanizedDuration($scope.slider.minValue, $scope.slider.maxValue);
            $scope.selectedRangeStart = interpolateDate($scope.slider.minValue);
            $scope.selectedRangeEnd = interpolateDate($scope.slider.maxValue);
            if (!$scope.showOnlyLatest) {
                selectPinsAndMarkersBasedOnTimeInterval();
            }
        };
        if (!callback) {
            callback = localCallback;
            requestAnimationFrame(callback);
        } else {
            callback = localCallback;
        }
    }

    $scope.$watch('slider.minValue', function () {
        applySliderChanges();
    }, true);
    $scope.$watch('slider.maxValue', function () {
        applySliderChanges();
    }, true);
    $scope.selectableDurations = {
        "1 minute": moment.duration(1, 'minutes'),
        "10 minutes": moment.duration(10, 'minutes'),
        "30 minutes": moment.duration(30, 'minutes'),
        "1 hour": moment.duration(1, 'hours')
    };

    $scope.slider = {
        minValue: 0.2,
        maxValue: 0.7,
        options: {
            floor: 0,
            ceil: 1,
            step: 0.000001,
            precision: 10,
            draggableRange: true,
            pushRange: true,
            translate: function (value, sliderId, label) {
                var interpolatedDate = interpolateDate(value);
                if (!interpolatedDate) return;
                return interpolatedDate.format('YYYY-MM-DD HH:mm:ss');
            },
            noSwitching: true
        }
    };

    setTimeout(function () {
        return $scope.$broadcast('rzSliderForceRender');;
    }, 1000);

    /************************************ Obsproperty Selection ******************************/
    //                  creates the dropdown menu to select a observed property
    /*****************************************************************************************/

    $http.get(getUrl() + "/v1.0/ObservedProperties").then(function (response) {
        $scope.obspropertyList = response.data.value.filter(function (obsprop) {
            return !!obsprop.properties && !!obsprop.properties.conventions && !!obsprop.properties.conventions.fixedPoints;
        });
    });

    $scope.selectedObsproperty = function (property) {
        observedPropertyHasChanged(property["@iot.id"]);
    }

});