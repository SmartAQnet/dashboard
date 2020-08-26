gostApp.controller('SimulationCtrl', function ($scope, $http, $routeParams, $timeout, Page, $rootScope) {

    $scope.Page.setHeaderIcon(iconThing);

    $scope.mapVisible = true;
    $scope.showMap = true;
    $scope.noMapControls = true;
    $scope.simulationControl = false;
    $scope.showGraph = false

    var polygonPoints;


    $scope.$on('drawnPolygonPoints4', function(event, data) {
        polygonPoints = data
    });



    $scope.startSimulation = function(){
        console.log("Start Simulation. Selected Area GPS (corners):")
        console.log(polygonPoints)
        console.log("center: ")
        let center = [(polygonPoints[0][0] + polygonPoints[1][0])/2, (polygonPoints[1][1] + polygonPoints[2][1])/2]
        console.log(center)
    }

    
    //Collapsibles 
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            } 
        });
    };


    $scope.taboptions1clicked = function(){
        $scope.showSimulationMap=false
        console.log($scope.showSimulationMap)
    }

    $scope.taboptions2clicked = function(){
        $scope.showSimulationMap=false
        console.log($scope.showSimulationMap)
    }

    $scope.taboptions3clicked = function(){
        $timeout(function() {
            $scope.showSimulationMap=true
            console.log($scope.showSimulationMap)
        }, 100);

    }

    $scope.taboptions4clicked = function(){
        $scope.showSimulationMap=false
        console.log($scope.showSimulationMap)
    }



    /** Map stuff
     * 
     * 
     * 
     * 
     */
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

    
    var map;
    createMap();

    function createMap(target) {
        $(".simulationmap").empty();

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
            target: 'simulationmap',
            view: defaultView,
            interactions: ol.interaction.defaults({
                altShiftDragRotate: false,
                pinchRotate: false
            })
        });
    };




    /*****************************************
     * Map stuff end
     */



  var squareFromCenterSize = function(center,size){
    
    let r = (size/2)*1000 //in meters

    let lon1 = center[0]
    let lat1 = center[1]

    let nw = [lon1 - r/(111320 * Math.cos(lat1)),lat1 - r/111320]
    let ne = [lon1 - r/(111320 * Math.cos(lat1)),lat1 + r/111320]
    let se = [lon1 + r/(111320 * Math.cos(lat1)),lat1 + r/111320]
    let sw = [lon1 + r/(111320 * Math.cos(lat1)),lat1 - r/111320]

    return([nw,ne,se,sw])
  };

    $scope.$on("mapClickCoordinates", function(evt, data){

        $scope.simulationDomain.center = data

        $rootScope.$broadcast("drawPolygonRequest",squareFromCenterSize($scope.simulationDomain.center,$scope.simulationDomain.size))
    });


    

    $scope.simulationDomain = {}

    var sectorDefault = {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100}

    $scope.scenarioTemplates = ["template 1", "template 2", "template 3", "template 4", "template 5"]

    $scope.outputSector = function(){
        console.log($scope.sector)
        console.log($scope.activeScenario)
    }

    $scope.sector = {

        "Heating": {
            "check": true, 
            "scenarioNames": ["electric","hybrid","whatever"],
            "pollutants": sectorDefault
        }, 

        "Industrial": {
            "check": true, 
            "scenarioNames": ["much industrial","semi industrial","not industrial so much"],
            "pollutants": sectorDefault
        }, 

        "Traffic": {
            "check": true, 
            "scenarioNames": ["red traffic","yellow traffic","green traffic","purple traffic"],
            "pollutants": sectorDefault
        }, 

        "option 4": {
            "check": true, 
            "scenarioNames": ["parameter 1","parameter 2","parameter 3"],
            "pollutants": sectorDefault
        }, 

        "option 5": {
            "check": true, 
            "scenarioNames": ["parameter 1","parameter 2","parameter 3"],
            "pollutants": sectorDefault
        }, 

    };

});

/*
"Industrial": {
    "check": true, 
    "scenarios": [
        {"name": "much industrial", "pollutants": sectorDefault}, 
        {"name": "semi industrial", "pollutants": sectorDefault}, 
        {"name": "not industrial so much", "pollutants": sectorDefault}
    ],
}, 
*/