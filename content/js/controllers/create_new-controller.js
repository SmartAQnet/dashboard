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

    $scope.pushToServer = function(newentity) {
        console.log("not implemented yet")
    };

    
    function remove(arrOriginal, elementToRemove){
        return arrOriginal.filter(function(el){return el !== elementToRemove});
    };

    var uniqueByID = function(arr){
        
        let ids = [];
        let res = [];

        arr.forEach(element => {
            if(!(ids.includes(element['@iot.id']))){
                ids.push(element['@iot.id']);
                res.push(element);
            }
        });
        return res
    };
    



    //Things


    $scope.getSensorsofThing = function(thingid){
        $http.get(getUrl() + "/v1.0/Things('" + thingid + "')/Datastreams?$expand=sensor&$select=sensor").then(function (response) {
            $scope.thisThingsSensorsList = uniqueByID(Array.from(response.data.value.map(th => th.Sensor)));
            $scope.originalSensorList = uniqueByID(Array.from(response.data.value.map(th => th.Sensor)));
        });
    };

    $scope.addSensortoThing = function(sensor){
        $scope.thisThingsSensorsList.push(sensor);
        $scope.newSensor = undefined;
    }; 

     $scope.removeSensorfromThing = function(sensor){
            $scope.thisThingsSensorsList=remove($scope.thisThingsSensorsList,sensor)
    };








    //...



    

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
        //newentity['Thing'] = {'@iot.id': $scope.newThing['@iot.id']};
        $scope.datastreams.push(newentity);
        $scope.newDatastream = {};
    };

    $scope.newDatastream = {};

    $scope.modifyDatastream = function(datastream){
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