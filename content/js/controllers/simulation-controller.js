gostApp.controller('SimulationCtrl', function ($scope, $http, $routeParams, $timeout, Page) {

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



    $scope.$on("mapClickCoordinates", function(evt, data){

        $scope.simulationDomain.center = data
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
            "scenarios": [
                {"name": "electric", "pollutants": sectorDefault}, 
                {"name": "hybrid", "pollutants": sectorDefault}, 
                {"name": "whatever", "pollutants": sectorDefault}
            ],
        }, 

        "Industrial": {
            "check": true, 
            "scenarios": [
                {"name": "much industrial", "pollutants": sectorDefault}, 
                {"name": "semi industrial", "pollutants": sectorDefault}, 
                {"name": "not industrial so much", "pollutants": sectorDefault}
            ],
        }, 

        "Traffic": {
            "check": true, 
            "scenarios": [
                {"name": "red traffic", "pollutants": sectorDefault}, 
                {"name": "yellow traffic", "pollutants": sectorDefault}, 
                {"name": "green traffic", "pollutants": sectorDefault}, 
                {"name": "purple traffic", "pollutants": sectorDefault}
            ],
        }, 

        "option 4": {
            "check": true, 
            "scenarios": [
                {"name": "parameter 1", "pollutants": sectorDefault}, 
                {"name": "parameter 2", "pollutants": sectorDefault}, 
                {"name": "parameter 3", "pollutants": sectorDefault}
            ],
        }, 

        "option 5": {
            "check": true, 
            "scenarios": [
                {"name": "parameter 1", "pollutants": sectorDefault}, 
                {"name": "parameter 2", "pollutants": sectorDefault}, 
                {"name": "parameter 3", "pollutants": sectorDefault}
            ],
        }, 

    };

});
