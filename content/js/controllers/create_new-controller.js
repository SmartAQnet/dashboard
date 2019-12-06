gostApp.controller('CreateNewCtrl', function ($scope, $http, $routeParams) {
    $scope.Page.setTitle('CREATE NEW DEVICE');
    $scope.Page.setHeaderIcon(iconThing);

    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();   
      });

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
        $http.get(getUrl() + "/v1.0/ObservedProperties('" + obspropid + "')").then(function (response) {
            try{
                $scope.newDatastream.unitOfMeasurement=response.data.properties.conventions.unitOfMeasurement
            } catch(e){
            console.log("Observerd Property does not have unit of measurement convention")
            };
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


    //can try and catch for all components individually to give feedback on the error if necessary
    var generateDatastreamid = function(){

        try{
            var thingdomain = $scope.newThing.properties["operator.domain"]
        } catch(e) {
            var thingdomain = ''
        }

        try{
            var thingshortname = $scope.newThing.properties["shortname"]
        } catch(e) {
            var thingshortname = ''
        }
        
        try{
            var thingid = $scope.newThing.properties["hardware.id"]
        } catch(e) {
            var thingid = ''
        }
                    
        try{
            var sensordomain = $scope.newDatastream.sensor.properties["manufacturer.domain"]
        } catch(e) {
            var sensordomain = ''
        }
                    
        try{
            var sensorshortname = $scope.newDatastream.sensor.properties["shortname"]
        } catch(e) {
            var sensorshortname = ''
        }
                    
        try{
            var serialnumber = $scope.newDatastream.properties["hardware.serial_number"]
        } catch(e) {
            var serialnumber = ''
        }
                    
        try{
            var obspropshortname = $scope.newDatastream.observedproperty.properties["shortname"]
        } catch(e) {
            var obspropshortname = ''
        }
                    
    var unhashedid = "saqn:ds:" + thingdomain + ":" + thingshortname + ":" + thingid + ":" + sensordomain + ":" + sensorshortname + ":" + serialnumber + ":" + obspropshortname
    
    return("---hashed id here---")
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