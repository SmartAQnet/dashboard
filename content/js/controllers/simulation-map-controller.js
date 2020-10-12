gostApp.controller('SimulationMapCtrl', function ($scope, $http, $routeParams, Page, $rootScope, $timeout) {

    $scope.showMap = true
    $scope.showMapControls = false

    $scope.showSimulationControls = true;
    $scope.showSimulationGraph = false; //initial. show on click

    $scope.$on("mapClickCoordinates", function(evt, data){
        console.log("User clicked on map at: ")
        console.log(data)
        $scope.showSimulationGraph = true
        var gpsdata = data

        // get information and construct the graph
        $http.get("https://api.smartaq.net/v1.0/Datastreams('saqn%3Ads%3A54d339b')/Observations").then(function(response){

            var res = response.data.value.slice(0,100);

            var resValues = res.map(el => el["result"]);
            var resLabels = res.map(el => el["resultTime"]);

            var ctx = document.getElementById('simulationGraph').getContext('2d');
            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: resLabels,
                    datasets:[{
                        label: "PM 2.5", 
                        steppedLine: "after", 
                        data: resValues, 
                        borderColor: "rgba(115,135,156,1)",
                        fill: false, 
                    }]
                }, 
                options: {
                    responsive: true,
                    aspectRatio: 2,
                    title: {
                        display: true,
                        text: "Forecast at " + gpsdata,
                    },
                    scales: {
                        xAxes: [{
                            type: 'time', 
                            time: {
                                unit: 'minute'
                            }
                        }]
                    }
                }
            });
        });
    
    });



    //Map Starts here

    
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

    //default layers at map start
    $timeout(function(){
        togglelayers(tileLayer, true);
        togglelayers(ColoredMarkerLayer, true);
        //togglelayers(canvasLayer, true);
    },0)





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




    /***************************** Simulation Visualisation stuff ******************************/
    //             handles map interaction from simulation-map-controller (AUTH simulation)
    /*****************************************************************************************/




    /************************************ Kriging ************************************/
    //                               calculate Kriging
    /*********************************************************************************/


    //simulation source and layers
    var SimulationSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        features: SimulationCollection = new ol.Collection()
    })

    var ColoredMarkerLayer = new ol.layer.Vector({
        source: SimulationSource,
        renderMode: 'image'
    });
    
    
    /*
    var SimulationInvisibleLayer = new ol.layer.Vector({
        source: SimulationInvisibleSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            features: SimulationInvisibleCollection = new ol.Collection()
        })
    });
    */

    //from https://codepen.io/jianxunrao/pen/oadBPq
    //添加选择和框选控件，按住Ctrl/⌘键，使用鼠标框选采样点
    let select = new ol.interaction.Select();
    olMap.addInteraction(select);
    let dragBox = new ol.interaction.DragBox({
        condition: ol.events.condition.platformModifierKeyOnly
    });
    olMap.addInteraction(dragBox);


    //创建10个位置随机、属性值随机的特征点
    for (let i = 0; i < 10; i++) {
        let feature = new ol.Feature({
            geometry: new ol.geom.Point([params.mapCenter[0]+Math.random()*0.01-.005,params.mapCenter[1]+Math.random()*0.01-.005]), value: Math.round(Math.random()*params.maxValue)
        });
        feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({color: "#00F"})
            })
        }));
        SimulationSource.addFeature(feature);
    }

    //设置框选事件
    let selectedFeatures = select.getFeatures();
    dragBox.on('boxend', ()=>{
        let extent = dragBox.getGeometry().getExtent();
        SimulationSource.forEachFeatureIntersectingExtent(extent, (feature)=> {
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
        if (values.length>3){
            let variogram=kriging.train(values,lngs,lats,
                params.krigingModel,params.krigingSigma2,params.krigingAlpha);

            let polygons=[];
            polygons.push([[extent[0],extent[1]],[extent[0],extent[3]],
                [extent[2],extent[3]],[extent[2],extent[1]]]);
            let grid=kriging.grid(polygons,variogram,(extent[2]-extent[0])/200);

            let dragboxExtent=extent;
            //移除已有图层
            if (canvasLayer !== null){
                olMap.removeLayer(canvasLayer);
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
            canvasLayer.setZIndex(1000);
            //向map添加图层
            olMap.addLayer(canvasLayer);
        }else {
            alert("有效样点个数不足，无法插值");
        }
    }
    //首次加载，自动渲染一次差值图
    let extent = [params.mapCenter[0]-.005,params.mapCenter[1]-.005,params.mapCenter[0]+.005,params.mapCenter[1]+.005];
        SimulationSource.forEachFeatureIntersectingExtent(extent, (feature)=> {
            selectedFeatures.push(feature);
        });
    drawKriging(extent);




    /*

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





    */

    /******************************** fake Simulation ***********************************/
    //                               create Simulation
    /************************************************************************************/

    /*

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


    */
    /*
    function SimulationSourceUpdate(){
        SimulationSource.clear();
        SimulationSource.addFeatures(SimulationInvisibleSource.getFeatures());
        ColoredMarkerLayer.getSource().changed();
        canvasLayer.getSource().changed();
    };
    */
    /*
    


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
        }*/
        /*if (realradio.checked){ //cant get it to work properly, need to rework this
        	getAllObservations; //function that grabs new features
        	//need function here that removes old features
        };*/ /*
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


    */



});
