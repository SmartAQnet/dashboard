gostApp.controller('CreateNewCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('CREATE NEW DEVICE');
    $scope.Page.setHeaderIcon(iconThing);


    $http.get(getUrl() + '/v1.0/ObservedProperties').then(function (response) {
        $scope.obspropList = response.data.value;
    });

    $http.get(getUrl() + '/v1.0/Things').then(function (response) {
        $scope.thingsList = response.data.value;
    });

    $http.get(getUrl() + '/v1.0/Sensors').then(function (response) {
        $scope.sensorsList = response.data.value;
    });

    //$scope.newThing = {}
    $scope.pushToServer = function(newentity) {
        console.log("not implemented yet")
    };

    // Array.prototype.uniqueByID = function(){

    // }

    $scope.getSensors = function(){
        $http.get(getUrl() + "/v1.0/Things('" + $scope.newThing['@iot.id'] + "')/Datastreams?$expand=sensor&$select=sensor").then(function (response) {
            
            $scope.sensorsList = Array.from(new Set(response.data.value.map(ds => ds.Sensor)));
        });
    };

    
     



    $scope.sensors = [];

    $scope.addNewSensor = function(newentity) { 
        $scope.sensors.push(newentity);
        $scope.newSensor = {};
    };

    $scope.newSensor = {};

    $scope.modifysensor = function(sensor){
        $scope.newSensor = sensor;
    }


    $scope.datastreams = [];

    $scope.addNewDatastream = function(newentity) { 
        newentity['Thing'] = {'@iot.id': $scope.newThing['@iot.id']};
        $scope.datastreams.push(newentity);
        $scope.newDatastream = {};
    };

    $scope.newDatastream = {};

    $scope.modifydatastream = function(datastream){
        $scope.newDatastream = datastream;
    }



    //choose from list, if not there, let create
    $scope.addNewSensor = function(newSensor) {
        var res = $http.post(getUrl() + '/v1.0/Sensors', newSensor);
        res.success(function(data, status, headers, config) {
            alert( "added: " + JSON.stringify({data: data}));
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };

    //only choose from list?
    /*
    $scope.addNewObservedProperty = function(newObservedProperty) {
        var res = $http.post(getUrl() + '/v1.0/ObservedProperties', newObservedProperty);
        res.success(function(data, status, headers, config) {
            alert( "added: " + JSON.stringify({data: data}));
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };
    */
});