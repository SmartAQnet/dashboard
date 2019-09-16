gostApp.controller('CreateNewCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('CREATE NEW DEVICE');
    $scope.Page.setHeaderIcon(iconThing);


    $http.get(getUrl() + '/v1.0/ObservedProperties').then(function (response) {
        $scope.obspropList = response.data.value;
    });

    $scope.newThing = {}
    $scope.addnewThing = function(newentity) {
    $scope.newThing = newentity
    };

    

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