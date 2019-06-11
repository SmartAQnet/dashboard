gostApp.controller('DatastreamCtrl', function ($scope, $http, $routeParams, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('DATASTREAM(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconDatastream);

    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
          if(fn && (typeof(fn) === 'function')) {
            fn();
          }
        } else {
          this.$apply(fn);
        }
      };

    var datastreams = new Datastreams($http);
    $scope.datastreams = datastreams;
    $scope.Datastreams = Datastreams;
    var onDataChangeUpdater = function(){
        $scope.safeApply();
        //Todo: Change something if new data is available
    }
    datastreams.addDataChangeListener(onDataChangeUpdater);

    $scope.$on("$destroy", function () {
        datastreams.removeAllStreams();
        datastreams.disconnectMQTTClient();
        datastreams.removeDataChangeListener(onDataChangeUpdater);
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
    }/*
        if (content.style.display === "block") {
        content.style.display = "none";
        } else {
        content.style.display = "block";
        }
    });
    }*/


  

    //Initialize Thing ID and Description for Back Button
    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Thing").then(function (response) {
        $scope.thingId = response.data["@iot.id"];
        $scope.thingName = response.data["name"];
    });

    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.unitOfMeasurement = response.data["unitOfMeasurement"];
        $scope.observedArea = response.data["observedArea"];
        $scope.Page.selectedDatastream = response.data;
    });


    $scope.mapVisible = true;
    createMap();

    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Observations?$orderby=resultTime%20desc&$expand=FeatureOfInterest&$top=1").then(function (response) {
        $scope.latestResultValue = response.data.value[0]["result"];
        $scope.latestFoI = response.data.value[0]["FeatureOfInterest"]["feature"]
        addGeoJSONcolorFeature($scope.latestFoI,$scope.latestResultValue);
        
        zoomToGeoJSONLayerExtent();
    });

    /*
    // Example of setting a fixed marker 
    var karlsruhe = {
       "type": "Point",
        "coordinates": [8.4,49]
    };

    //addGeoJSONcolorFeature(karlsruhe,Math.random()*100)
    addGeoJSONFeature(karlsruhe)
    */
    



    $scope.tabPropertiesClicked = function () {

    };

    $scope.tabThingClicked = function () {
        $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Thing").then(function (response) {
            $scope.thingId = response.data["@iot.id"];
            $scope.thingDescription = response.data["description"];
            $scope.thingProperties = response.data["properties"];
        });
    };

    $scope.tabSensorClicked = function () {
        $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Sensor").then(function (response) {
            $scope.sensorName = response.data["name"];
            $scope.sensorId = response.data["@iot.id"];
            $scope.sensorDescription = response.data["description"];
            $scope.sensorEncoding = response.data["encodingType"];
            $scope.sensorMetadata = response.data["metadata"];
        });
    };

    $scope.tabObservationsClicked = function () {
        setTimeout(function(){
            $scope.observationsList = datastreams.addStream($scope.id).dataset;
            datastreams.toChart("#observationChart");
        }, 10);
    };

	$scope.tabObservedPropertyClicked = function () {
		$http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/ObservedProperty").then(function (response) {
			$scope.observedPropertyId = response.data["@iot.id"];
            $scope.observedPropertyName = response.data["name"];
            $scope.observedPropertyDescription = response.data["description"];
            $scope.observedPropertyDefinition = response.data["definition"];
        });
    };

    $scope.showAllThingsSelection = function() {
        $scope.thingsList = [];
        $scope.modalState = "thingSelection";
        var query=getUrl() + "/v1.0/Things";
    
        $http.get(query).then(function (response) {
            $scope.thingsList = response.data.value;
        });
    }

    $scope.showActiveThingsSelection = function() {
        $scope.thingsList = [];
        $scope.modalState = "thingSelection";
        var query=getUrl() + "/v1.0/Things?$filter=not%20Datastreams/phenomenonTime%20lt%20now()%20sub%20duration%27P1d%27";
    
        $http.get(query).then(function (response) {
            $scope.thingsList = response.data.value;
        });
    }

    $scope.showThisThingSelection = function() {
        thingId = $scope.thingId;
        $scope.secondThingId = thingId;
        $scope.modalState = "datastreamSelection";
        $http.get(getUrl() + "/v1.0/Things(" + getId(thingId) + ")/Datastreams?$expand=ObservedProperty").then(function (response) {
            $scope.datastreamsList = response.data.value;
        });
    }

    $scope.showDatastreamsForThing = function(thingId) {
        $scope.secondThingId = thingId;
        $scope.modalState = "datastreamSelection";
        $http.get(getUrl() + "/v1.0/Things(" + getId(thingId) + ")/Datastreams?$expand=ObservedProperty").then(function (response) {
            $scope.datastreamsList = response.data.value;
        });
    }

    $scope.datastreamClicked = function(datastreamId, datastreamName) {
        /*TODO: Prepare datastream for diagram*/
        console.log("Add " + datastreamId + "to diagram");
        $scope.secondObservationsList = datastreams.addStream(datastreamId).dataset;
        $scope.nameSecondary = datastreamName;
        datastreams.toChart("#observationChart");
        $('#thingSelection').trigger('click');
    }

    $scope.removeComparison = function() {
        var secondaryStream = Object.keys(datastreams.streams)[1];
        if(secondaryStream){
            datastreams.removeStream(secondaryStream);
        }
    }
});
