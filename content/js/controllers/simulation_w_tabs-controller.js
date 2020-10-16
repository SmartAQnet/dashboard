gostApp.controller('SimulationCtrl', function ($scope, $http, $routeParams, $timeout, Page, $rootScope) {

    $scope.Page.setHeaderIcon(iconThing);

    $scope.showMap = true;
    $scope.showMapControls = false;
    $scope.showSimulationControls = false;
    $scope.showSimulationGraph = false


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


    $scope.simulationJSON = "no file selected"

    //Read JSON File
    $(document).ready(function () {
        $('[type=file]').change(function () {
            if (!("files" in this)) {
                alert("File reading not supported in this browser");
            }
            var file = this.files && this.files[0];
            if (!file) {
                return;
            }

            if($scope.fullscenario["correct_filetype"]){

                $scope.simulationJSON = file.name
                $scope.$apply($scope.simulationJSON)

                var fileReader = new FileReader();

                fileReader.onload = function (e) {
                    $scope.fullscenario = JSON.parse(e.target.result);
                    $scope.chosenTemplate = $scope.fullscenario["sectors"]
                    $scope.simulationDomain = $scope.fullscenario["geometry"]
                    
                }; 

                fileReader.readAsText(this.files[0]);
            } else {
                alert("Filetype incorrect")
            }

        });

    });



    
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
    }

    $scope.taboptions2clicked = function(){
        $scope.showSimulationMap=false
    }

    $scope.taboptions3clicked = function(){
        $timeout(function() {
            $scope.showSimulationMap=true
        }, 100);

        $timeout(function() {
            $rootScope.$broadcast('mapScope','simulation')
        }, 200);

    }

    $scope.taboptions4clicked = function(){
        $scope.showSimulationMap=false
    }




    $scope.$on("mapClickCoordinates", function(evt, data){

        $scope.simulationDomain.center = data

        $rootScope.$broadcast("drawPolygonRequest",[$scope.simulationDomain.center,$scope.simulationDomain.size])
    });


    $scope.simulationDomain = {}

    $scope.scenarioNamesDict = {
        "Heating": ["electric","hybrid","whatever"],
        "Industrial": ["much industrial","semi industrial","not industrial so much"],
        "Traffic": ["red traffic","yellow traffic","green traffic","purple traffic"],
        "Option 4": ["parameter 1","parameter 2","parameter 3"],
        "Option 5": ["parameter a","parameter b","parameter c"]
    }

    /**
     * Enter Templates here
     */


    $scope.scenarioTemplates = {
        
        "Default": {

            "Heating": {
                "check": true, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "electric"
            }, 
    
            "Industrial": {
                "check": true, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "much industrial"
            }, 
    
            "Traffic": {
                "check": true, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "red traffic"
            }, 
    
            "Option 4": {
                "check": true, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "parameter 1"
            }, 
    
            "Option 5": {
                "check": true, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "parameter a"
            }
    
        },
        
        "template 2": {

            "Heating": {
                "check": true, 
                "pollutants": {"NO2": 56, "CO": 73, "SO2": 77, "VOC": 67, "PM10": 32, "PM2.5": 12},
                "activeScenario": "electric"
            }, 
    
            "Industrial": {
                "check": true, 
                "pollutants": {"NO2": 74, "CO": 76, "SO2": 7, "VOC": 10, "PM10": 15, "PM2.5": 66},
                "activeScenario": "semi industrial"
            }, 
    
            "Traffic": {
                "check": false, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "purple traffic"
            }, 
    
            "Option 4": {
                "check": false, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "parameter 1"
            }, 
    
            "Option 5": {
                "check": false, 
                "pollutants": {"NO2": 100, "CO": 100, "SO2": 100, "VOC": 100, "PM10": 100, "PM2.5": 100},
                "activeScenario": "parameter a"
            }
    
        },
        
        "template 3": {}, 
        
        "template 4": {}, 
        
        "template 5": {}
    
    };

    // ---------------------------------------------------- end templates -------------------------------------




    $scope.generateSector = function(template){
        
        $scope.sectors = template

        Object.keys(template).forEach(function(key){

            $scope.sectors[key]["scenarioNames"] = $scope.scenarioNamesDict[key]
            $scope.sectors[key]["locked"] = false
            $scope.sectors[key]["lockedValue"] = 100

        })

        console.log($scope.sectors)
    }



    //function that is called when editing a specific sector in the scenario
    $scope.outputSector = function(){
        console.log($scope.sector)
    }

    //function that applies changes in the collective pollutant input field to all respective pollutant fields
    $scope.adjustLockedPollutants = function(sec){
        Object.keys(sec["pollutants"]).forEach(key => sec["pollutants"][key] = sec["lockedValue"])
    };


    //download button
    $scope.exportJson = function() {
        $scope.fullscenario = {}
        $scope.fullscenario["correct_filetype"] = true
        $scope.fullscenario["sectors"] = $scope.sectors
        $scope.fullscenario["geometry"] = $scope.simulationDomain

        var data = "application/json;charset=utf-8," + encodeURIComponent(JSON.stringify($scope.fullscenario));
        
        el=document.getElementById("downloadbutton")
        el.setAttribute("href", "data:" + data);
        el.setAttribute("download", "data.json");    
    };


});


