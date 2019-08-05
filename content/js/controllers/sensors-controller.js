gostApp.controller('SensorsCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('SENSORS');
    $scope.Page.setHeaderIcon(iconSensor);

    if(! "$orderby" in $routeParams) $routeParams["$orderby"]="name asc";


    //Implement Server Query Language in Static urls
    var query=getUrl() + "/v1.0/Sensors"+ Object.keys($routeParams).reduce(
	    (a, i) => a + i + "=" + $routeParams[i] + "&","?").slice(0,-1) 

    $http.get(query).then(function (response) {
        $scope.sensorsList = response.data.value;
    });
    
    //Without Query Language
    /*
    $http.get(getUrl() + "/v1.0/Sensors").then(function (response) {
        $scope.sensorsList = response.data.value;
    });
    */

    $scope.sensorClicked = function (sensorID) {
        angular.forEach($scope.sensors, function (value, key) {
            if (value["@iot.id"] == sensorID) {
                $scope.Page.selectedSensor = value;
            }
        });

        $scope.Page.go("sensor/" + sensorID);
    };
/*
    $scope.addNewSensor = function(newSensor) {
        var res = $http.post(getUrl() + '/v1.0/Sensors', newSensor);
        res.success(function(data, status, headers, config) {
            alert( "added: " + JSON.stringify({data: data}));
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };

    $scope.deleteSensorClicked = function (sensor) {
        var res = $http.delete(getUrl() + '/v1.0/Sensors(' + getId(sensor["@iot.id"]) + ')');
        res.success(function(data, status, headers, config) {
            var index = $scope.sensorsList.indexOf(sensor);
            $scope.sensorsList.splice(index, 1);
        });
        res.error(function(data, status, headers, config) {
            alert( "failure: " + JSON.stringify({data: data}));
        });
    };
    */
});
