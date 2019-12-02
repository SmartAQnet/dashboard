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
    
    $scope.getUnitOfMeasurement = function(obspropid){
        $http.get(getUrl() + "/v1.0/ObservedProperties('" + obspropid + "')/properties/conventions").then(function (response) {
            if(response.data.conventions.unitOfMeasurement) {
                console.log(response.data.conventions.unitOfMeasurement);
                $scope.newDatastream.unitOfMeasurement=response.data.conventions.unitOfMeasurement
            };
        }).catch(function (e){
            console.log("Observerd Property does not have unit of measurement convention")
        });
    };


    //Things


    //Sensors of the Thing
    $scope.getSensorsofThing = function(thingid){
        $http.get(getUrl() + "/v1.0/Things('" + thingid + "')/Datastreams?$expand=sensor&$select=sensor").then(function (response) {
            $scope.thisThingsSensorList = uniqueByID(Array.from(response.data.value.map(th => th.Sensor)));
            $scope.originalSensorList = uniqueByID(Array.from(response.data.value.map(th => th.Sensor)));
        });
    };

    $scope.addSensortoThing = function(sensor){
        if($scope.thisThingsSensorList.map(sens => sens["@iot.id"]).includes(sensor["@iot.id"])){
            alert("This Sensor is already attached to the Thing") //implement this as toast
        } else {
            $scope.thisThingsSensorList.push(sensor);
            $scope.newSensor = undefined;
        }

    }; 

     $scope.removeSensorfromThing = function(sensor){
            $scope.thisThingsSensorList=remove($scope.thisThingsSensorList,sensor)
    };

    //Datastreams of the Thing
    $scope.getDatastreamsofThing = function(thingid){
        $http.get(getUrl() + "/v1.0/Things('" + thingid + "')/Datastreams").then(function (response) {
            $scope.thisThingsDatastreamList = response.data.value;
            $scope.originalDatastreamList = response.data.value;

        });
    };

    $scope.addDatastreamtoThing = function(datastream){
        if($scope.thisThingsDatastreamList.map(ds => ds["@iot.id"]).includes(datastream["@iot.id"])){
            alert("This Datastream is already attached to the Thing") //implement this as toast
        } else {
            $scope.thisThingsDatastreamList.push(datastream);
            $scope.newDatastream = undefined;
        }

    }; 

     $scope.removeDatastreamfromThing = function(datastream){
            $scope.thisThingsDatastreamList=remove($scope.thisThingsDatastreamList,datastream)
    };


    //can try and catch for all components to give feedback on the error if necessary
    $scope.generateDatastreamid = function(){
        try{
        unhashedid="saqn:ds:" + $scope.newThing.properties["operator.domain"] + ":" + $scope.newThing.properties["shortname"] + ":" + $scope.newThing.properties["operator.domain"] + ":"
        + $scope.newDatastream.sensor.properties["manufacturer.domain"] + ":" + $scope.newDatastream.sensor.properties["shortname"] + ":"
        + $scope.newDatastream.properties["hardware.serial_number"] + ":"
        + $scope.newDatastream.observedproperty.properties["shortname"]
        return({"unhashed":unhashedid,"@iot.id": sha1(unhashedid)})
        } catch(e) {
            return({"unhashed": undefined,"@iot.id": undefined}) 
        }
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