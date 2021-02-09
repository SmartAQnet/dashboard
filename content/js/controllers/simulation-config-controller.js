gostApp.controller('SimulationConfigCtrl', function ($scope, $http, $routeParams, $timeout, Page, $rootScope) {

    $scope.Page.setHeaderIcon(iconThing);

    $scope.showMap = true;
    $scope.showMapControls = false;

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

            $scope.simulationJSON = file.name
            $scope.$apply($scope.simulationJSON)

            var fileReader = new FileReader();

            fileReader.onload = function (e) {
                $scope.fullscenario = JSON.parse(e.target.result);
                $scope.chosenTemplate = $scope.fullscenario["sectors"]
                $scope.simulationDomain = $scope.fullscenario["geometry"]
                $scope.scenarioname = $scope.simulationJSON
            }; 

            fileReader.readAsText(this.files[0]);

        });

    });

    //initiation
    $scope.scenarioname = "Default"
    //this is so awkward...
    $scope.reversengineerkey = function(obj,val){
        Object.keys(obj).forEach(function(key){
            if(obj[key]===val){
                $scope.scenarioname = key
                console.log($scope.scenarioname)
            }
        })
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

    //tab logic
    $scope.showTabs = {"1": true, "2": false, "3": false, "4": false}
    $scope.currentTab = 1

    $scope.goToTab = function(nr){
        Object.keys($scope.showTabs).forEach(key => $scope.showTabs[key] = false)
        $scope.showTabs[nr.toString()] = true
        $scope.currentTab = nr
        $rootScope.$broadcast('mapScope','simulation')
    };



    $scope.adjustZoom = function(km){
        //set zoom via broadcast to map controller to -0.1 * km + 13
        let z = -0.1 * km + 13
        $rootScope.$broadcast("setZoom",z)
        console.log("requesting Zoom adjustment")
    }

    $scope.$on("mapClickCoordinates", function(evt, data){

        $scope.simulationDomain.center = data

        $rootScope.$broadcast("drawPolygonRequest",[$scope.simulationDomain.center,$scope.simulationDomain.size])
    });


    $scope.simulationDomain = {}

    $scope.scenarioNamesDict = {
        'Heating': ['baseline', 'electric', 'hybrid'],
        'Industrial': ['baseline', '75% industrial', '50% industry', '25% industry'],
        'Traffic': ['baseline', 'electric', 'hybrid', 'no HDVs', 'no buses'],
        'Traffic Evaporation': ['baseline', 'no diurnal', 'no traffic'],
        'Agriculture': ['baseline', 'no off agr', 'no processes'],
        'Railroads': ['baseline', 'no passenger', 'no cargo'],
        'Shipping': ['baseline', 'no port', 'no fishing', ''],
        'Solvents': ['baseline','no ResPaint','no ResSolv','no DryClean','no Industrial'],
        'Gas Stations': ['baseline','no storage','no transportation','no distribution'],
        'Aviation': ['baseline', 'no cargo', 'no passenger'],
        'Processes in large industrial units': ['baseline','no combustion','no production'],
        'Waste': ['baseline', 'no disposal', 'no trensportation'],
        'Paints': ['baseline','no car paints','no industrial paints','no domestic paints']
    }

    /**
     * Enter Templates here
     */


    $scope.scenarioTemplates = {
        
        "Default": {

            'Heating': {
                'check': 'true',
                'pollutants': {
                    'NO2': 100,
                    'CO': 100,
                    'SO2': 100,
                    'VOC': 100,
                    'PM10': 100,
                    'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
            
            'Industrial': {
                'check': 'true',
                'pollutants': {
                    'NO2': 100,
                    'CO': 100,
                    'SO2': 100,
                    'VOC': 100,
                    'PM10': 100,
                    'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                
                'Traffic': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                        },
                    'activeScenario': 'baseline'
                },
                
                'Traffic Evaporation': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                        },
                    'activeScenario': 'baseline'
                },
                
                'Agriculture': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Railroads': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Shipping': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Solvents': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Gas Stations': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Aviation': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Processes in large industrial units': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Waste': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
                },
                    
                'Paints': {
                    'check': 'true',
                    'pollutants': {
                        'NO2': 100,
                        'CO': 100,
                        'SO2': 100,
                        'VOC': 100,
                        'PM10': 100,
                        'PM2.5': 100
                    },
                    'activeScenario': 'baseline'
            }
    
        },
        
        "template 2": {},
        
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
        if($scope.exportName){
            el.setAttribute("download", $scope.exportName + ".json");    
        } else {
            el.setAttribute("download", "data.json"); 
        }
        
    };


});


